const mongoCollections = require('../config/mongoCollections');
const users=mongoCollections.users
const userFunctions=require('./users')
const validation=require('../validation')
const {ObjectId} = require('mongodb')

function fn(str){       //adds leading 0 to 1 digit time numbers
    if(str.toString().length===1) str='0'+str.toString();
    return str
}

const createDeck = async (creator,deckName,subject,isPublic,cardsArray,dateCreated,user) => {
    creator=validation.checkUsername(creator)
    deckName=validation.checkDeckName(deckName)
    subject=validation.checkSubject(subject)
    if(user) user=validation.checkUsername(user)
    const userCollection = await users();
    const deckCreator=await userCollection.findOne({username: user ? user.toLowerCase() : creator.toLowerCase()})
    for(deck of deckCreator.decks){
        if(deck.name.toLowerCase()===deckName.toLowerCase())    //checks if you already have that deck
            throw `You already have a deck called ${deckName}`
    }
    if(Array.isArray(cardsArray)) cards=cardsArray
    else cards=[]
    if(typeof dateCreated=='undefined'){
        dateCreated=`${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()} ${fn(d.getHours())}:${fn(d.getMinutes())}:${fn(d.getSeconds())}`
    }
    let d=new Date()
    let newDeck = {
        _id: ObjectId().toString(),
        name:deckName,
        subject:subject,
        dateCreated:dateCreated,
        creator:creator,
        public:isPublic,
        cards:cards
    }
    let insertDeck=undefined
    if(user){       //adds deck to a specific user
        user=validation.checkUsername(user)
        insertDeck=await userCollection.updateOne(
            {username:user},
            {$push: {"decks":newDeck}}
        )
    }
    else {      //adds deck to creator
        insertDeck=await userCollection.updateOne(
            {username:creator},
            {$push: {"decks": newDeck}}     //push newDeck to decks
        )
    }
    if(insertDeck.modifiedCount===0) throw "Could not successfully create deck"
    return newDeck
}

const getUsersDecks = async(username) => {
    username=validation.checkUsername(username)
    const userCollection=await users();
    const user=await userCollection.findOne({username:username})
    if(!user) throw "Could not get user"
    return user.decks
}

const deleteDeck = async(creator,deckId) => {
    deckId=validation.checkId(deckId)
    creator=validation.checkUsername(creator)
    const userCollection=await users()
    const updatedUser = await userCollection.updateOne(
        {username:creator},
        {$pull: {"decks": {"_id": deckId}}}         //in "decks [array]", find the single deck with the "_id" that matches deckId, and pull that  
    )
    if(updatedUser.modifiedCount===0) throw "Could not delete deck"
    const updatedFolders=await userCollection.updateMany(       //remove the deck id from any folders
        {username:creator},
        {$pull: {"folders.$[].decks":deckId}}
    )
    if(updatedFolders.modifiedCount===0 && updatedFolders.matchedCount===0) throw "Could not remove deck from folders"
    return updatedUser
}

const getDeckById = async(username,deckId) => {
    deckId=validation.checkId(deckId)
    username=validation.checkUsername(username)
    const userCollection=await users()
    const deckFound=await userCollection.findOne(
        {username:username,                     //finds user 
         decks:{$elemMatch: {_id:deckId}}},     //then finds the deck that elemMatches the deckId
        {projection: {"decks.$":1}}             //empty projection on the first one(?????)
    )
    if(!deckFound) throw ("Unable to find that deck")
    return deckFound.decks[0]
}

const getDeckByOnlyId=async(deckId) => {            //uses aggregation to get a deck given only the id of a deck
    deckId=validation.checkId(deckId)
    const userCollection=await users()
    const deckFoundCursor=await userCollection.aggregate([{"$unwind":"$decks"},{"$match":{"decks._id":deckId}},{"$replaceRoot":{"newRoot":"$decks"}}])
    let deckFound=(await deckFoundCursor.toArray())[0]
    if(!deckFound) throw "Unable to find that deck"
    return deckFound
}

const getDeckByName = async(username,deckName) => {
    username=validation.checkUsername(username)
    deckName=validation.checkDeckName(deckName)
    const userCollection=await users()
    const deckFound=await userCollection.findOne(
        {username:username,decks:{$elemMatch: {name:deckName}}},
        {projection: {"decks.$":1}}
    )
    if(!deckFound) throw ("Unable to find that deck")
    return deckFound.decks[0]
}

const editDeck = async(username,deckId,newName,newSubject,newPublicity) => {
    deckId=validation.checkId(deckId)
    username=validation.checkUsername(username)
    if(newName) newName=validation.checkDeckName(newName)
    if(newSubject) newSubject=validation.checkSubject(newSubject)       //only check the name and subject if they are provided
    const userCollection=await users()
    const deckCreator=await userCollection.findOne({username:username.toLowerCase()})
    const oldDeck=await getDeckById(username,deckId)        //used for comparison at the end, if anything was actually modified
    for(deck of deckCreator.decks){         //checks if you already have that deck
        if(deck.name.toLowerCase()===newName.toLowerCase() && deck._id.toString()!==deckId.toString())  //if name is same but id is different    
            throw `You already have a deck called ${newName}`
    }
    const editedDeck=await userCollection.updateOne(            //updating deck
        {username:username,"decks._id":deckId.toString()},
        {$set: {"decks.$.name":newName, "decks.$.subject":newSubject, "decks.$.public":newPublicity}}   //updates specific fields
    )               //if nothing is submitted, then nothing is modified.
    if(editedDeck.modifiedCount===0 && !(oldDeck.name.toLowerCase()===newName.toLowerCase() && oldDeck.subject.toLowerCase()===newSubject.toLowerCase() && oldDeck.public===newPublicity)) 
        throw "Could not successfully update deck"
    return await getDeckById(username,deckId);
}

const getCard=async(username,deckId,cardNumber) => {
    username=validation.checkUsername(username),
    deckId=validation.checkId(deckId)
    const userDeck=await getDeckById(username,deckId)
    return userDeck.cards[cardNumber]           //user.decks._id.cards
}

const createCard = async(username,deckId,cardFront,cardBack) => {
    username=validation.checkUsername(username),
    deckId=validation.checkId(deckId)
    cardFront=validation.checkCard(cardFront,"front")
    cardBack=validation.checkCard(cardBack,"back")
    const userCollection=await users();
    const userDeck=await getDeckById(username,deckId)
    for(card of userDeck.cards){                //if they already have that card
        if(card.front.toLowerCase()===cardFront.toLowerCase())
            throw `You already have a card named ${cardFront}`
    }
    let newCard={
        number:userDeck.cards.length,
        front:cardFront,
        back:cardBack
    }
    const insertCard=await userCollection.updateOne(        //pushes to a sub-sub-document
        {username:username,"decks._id":deckId},
        {$push: {"decks.$.cards":newCard}}      //push newCard to decks._id.cards
    )
    if(insertCard.modifiedCount===0) throw "Could not successfully create card"
    return newCard
}

const editCard = async(username,deckId,cardNumber,cardFront,cardBack,isFrontSame) => {
    username=validation.checkUsername(username)
    deckId=validation.checkId(deckId)
    if(cardFront) cardFront=validation.checkCard(cardFront,"front")
    if(cardBack) cardBack=validation.checkCard(cardBack,"back")
    const userCollection=await users();
    const userDeck=await getDeckById(username,deckId)
    if(!isFrontSame)            //If no new front is specified, the old one is used. In that case, we ignore checking for that name's appearance, since it's already there (from not being changed)
    for(card of userDeck.cards){                //if they already have that card
        if(card.front.toLowerCase()===cardFront.toLowerCase())
            throw `You already have a card named ${cardFront}`
    }
    const editedCard=await userCollection.updateOne(                       
        {"decks._id":deckId,"decks.cards.number":cardNumber},              //filter to specific card
        {$set:{"decks.$[deck].cards.$[card].front":cardFront,              //update front
               "decks.$[deck].cards.$[card].back" :cardBack}},             //update back
        {"arrayFilters":[{"deck._id":deckId},{"card.number":cardNumber}]}  //specify what each $[thing] means. the "." after are fields in those elements
    )
    if(editedCard.modifiedCount===0)    
        throw "Could not successfully update card"
    return editedCard
}

const deleteCard = async(username,deckId,cardNumber) => {           
    username=validation.checkUsername(username)
    deckId=validation.checkId(deckId)
    const userCollection=await users();
    const updatedDeck=await userCollection.updateOne(           //pulls card (there is now a "hole" in the numbers)
        {username:username,"decks._id":deckId,"decks.cards.number":cardNumber},     //filters down to specific card
        {$pull: {"decks.$.cards": {"number": cardNumber}}}      //reaches deep into document and pulls out card
    )
    if(updatedDeck.modifiedCount===0) throw "Could not delete card"
    const updatedCardNumbers=await userCollection.updateMany(           //fixes the hole. Updates every card number after the one that was removed.
        {"decks._id":deckId},           //filters by deck id
        {"$inc":{"decks.$[].cards.$[card].number":-1}},     //In the decks array, find the deck by Id, then find card by card number, but
        {"arrayFilters":[{"card.number":{"$gt":cardNumber}}]}       //only use specific elements in array that fit $gt: cardNumber
    )
    const deckCheck=await getDeckById(username,deckId)
                                                        //if we delete the last one, then no numbers are changed
    if(updatedCardNumbers.modifiedCount===0 && deckCheck.cards && cardNumber!==deckCheck.cards.length) 
        throw "Could not update card numbers"
    return updatedCardNumbers
}

const getPublicDecks=async() => {
    const userCollection=await users()
    const publicDecksCursor=await userCollection.aggregate([        //aggregates public decks
        {"$unwind":"$decks"},
        {"$match":{"decks.public":true}},
        {"$replaceRoot":{"newRoot":"$decks"}}
    ])
    const publicDecks=await publicDecksCursor.toArray()
    return publicDecks
}

module.exports = {
    createDeck,
    getUsersDecks,
    deleteDeck,
    getDeckById,
    getDeckByOnlyId,
    getDeckByName,
    editDeck,
    getCard,
    createCard,
    editCard,
    deleteCard,
    getPublicDecks
}