const mongoCollections = require('../config/mongoCollections');
const users=mongoCollections.users
const decks=mongoCollections.decks;
const userFunctions=require('./users')
const validation=require('../validation')
const {ObjectId} = require('mongodb')

const createDeck = async (creatorId,deckName,subject,isPublic) => {
    creatorId=validation.checkId(creatorId); creatorId=new ObjectId(creatorId);
    deckName=validation.checkDeckName(deckName)
    subject=validation.checkSubject(subject)
    const usersCollection = await users();
    const decksCollection = await decks();
    const userDecks = await userFunctions.getUsersDecks(creatorId);
    for(let deck of userDecks){
        if(deck.name.toLowerCase()===deckName.toLowerCase())  {    //checks if you/user already has that deck
            throw "You already have a deck called "+deckName
        }
    }
    let newDeck = {
        name:deckName,
        subject:subject,
        dateCreated:new Date(),
        creatorId:creatorId,
        public:isPublic,
        cards:[]
    }
    let insertDeck=await decksCollection.insertOne(newDeck)
    if(!insertDeck.insertedId) throw "Could not successfully insert deck into decks collection"
    let addToUser=await usersCollection.updateOne({_id:creatorId},
        {$push:{decks:new ObjectId(insertDeck.insertedId)}}
    )
    if(!addToUser.modifiedCount) throw "Could not add this deck to the user"
    return newDeck
}

const savePublicDeck = async(deckId,creatorId) => {
    deckId=validation.checkId(deckId); deckId=new ObjectId(deckId)
    creatorId=validation.checkId(creatorId); creatorId=new ObjectId(creatorId)
    const deckCollection=await decks();
    const userCollection=await users();
    const userDecks = await userFunctions.getUsersDecks(creatorId);
    let deck=await deckCollection.findOne({_id:deckId});
    for(let deck1 of userDecks){
        if(deck.name.toLowerCase()===deck1.name.toLowerCase())  {    //checks if you/user already has that deck
            throw "You already have a deck called "+deck1.name
        }
    }
    deck._id=new ObjectId();
    deck.creatorId=creatorId;
    deck.public=false;
    deck.sentBy=undefined;      //  "Resets" the sending chain.
    let insertDeck=await deckCollection.insertOne(deck)
    if(!insertDeck.insertedId) throw "Could not successfully insert deck into decks collection"
    let addToUser=await userCollection.updateOne({_id:creatorId},
        {$push:{decks:new ObjectId(insertDeck.insertedId)}}
    )
    if(!addToUser.modifiedCount) throw "Could not add this deck to the user"
    return deck
}

const sendDeckToUser = async(deckId,senderId,recipientId) => {
    deckId=validation.checkId(deckId); deckId=new ObjectId(deckId);
    senderId=validation.checkId(senderId); senderId=new ObjectId(senderId);
    recipientId=validation.checkId(recipientId); recipientId=new ObjectId(recipientId);
    const recipientName = await userFunctions.getUsernameFromId(recipientId);
    const deckCollection=await decks();
    const userCollection=await users();
    let decc=await deckCollection.findOne({_id:deckId});
    const recipientDecks = await userFunctions.getUsersDecks(recipientId);
    for(let deck of recipientDecks){
        if(deck.name.toLowerCase()===decc.name.toLowerCase()) {    //checks if you/user already has that deck
            throw `${recipientName} already has a deck called ${decc.name}`
        }
    }
    decc.sentBy=senderId;
    decc._id=new ObjectId()     //changing the object id but keeping everything else the same. Re-inserting it.
    decc.creatorId=recipientId;
    decc.public=false;
    let insertDeck = await deckCollection.insertOne(decc)
    if(!insertDeck.insertedId) throw "Could not successfully insert deck into decks collection"
    let addToUser = await userCollection.updateOne({_id:recipientId},
        {$push:{decks:new ObjectId(insertDeck.insertedId)}}  
    )
    if(!addToUser.modifiedCount) throw "Could not add this deck to the user"
    return decc
}

const deleteDeck = async(userId,deckId) => {
    deckId=validation.checkId(deckId); deckId=new ObjectId(deckId)
    userId=validation.checkId(userId); userId=new ObjectId(userId);
    const userCollection=await users()
    const deckCollection=await decks()
    const updatedUser=await userCollection.updateOne(
        {_id:userId},
        {$pull: {"decks": deckId}}         //in "decks (array)", find the single deck with the "_id" that matches deckId, and pull that out
    )
    if(updatedUser.modifiedCount===0) throw "Could not delete deck"
    const updatedFolders=await userCollection.updateMany(       //remove the deck id from any folders
        {_id:userId},
        {$pull: {"folders.$[].decks":deckId}}   //$[] is a positional operator to access all folder subdocuments under "folders", not just one
    )
    const deletedDeck=await deckCollection.deleteOne({_id:deckId})
    if(deletedDeck.deletedCount<=0) throw "Could not delete deck from decks collection"
    if(updatedFolders.modifiedCount===0 && updatedFolders.matchedCount===0) throw "Could not remove deck from folders"
    return {success:true}
}

const getDeckById = async(deckId) => {
    deckId=validation.checkId(deckId)
    const deckCollection=await decks()
    const deckFound=await deckCollection.findOne({_id:new ObjectId(deckId)})
    if(!deckFound) throw `Unable to find deck with id of ${deckId}`
    return deckFound
}

const getDeckByOnlyId=async(deckId) => {            //uses aggregation to get a deck given only the id of a deck
    deckId=validation.checkId(deckId)
    const userCollection=await users()
    const deckFoundCursor=await userCollection.aggregate([      //returns aggregation cursor to scroll through the decks
        {"$unwind":"$decks"},                                   //turns document with decks array into many documents with one item from the array
        {"$match":{"decks._id":deckId}},                        //from those, find the deck with that id
        {"$replaceRoot":{"newRoot":"$decks"}}                   //replace the users main document with the deck we found
    ])                                                          //we need to convert to an array to actually do stuff with it
    let deckFound=(await deckFoundCursor.toArray())[0]          //converts the cursor to an array and gets the first element 
    if(!deckFound) throw "Unable to find that deck (only id)"
    return deckFound
}

const getDeckByName = async(userId,deckName) => {         //userId is needed so that it only gets that user's deck named deckName
    deckName=validation.checkDeckName(deckName)
    userId=validation.checkId(userId); userId=new ObjectId(userId);
    const deckCollection=await decks()
    const deckFound=await deckCollection.findOne(
        {name:deckName,creatorId:userId},
    )
    if(!deckFound) throw ("Unable to find that deck (name)")
    return deckFound
}

const editDeck = async(userId,deckId,newName,newSubject,newPublicity) => {
    deckId=validation.checkId(deckId); deckId=new ObjectId(deckId)
    userId=validation.checkId(userId); userId=new ObjectId(userId);
    if(newName)    newName=validation.checkDeckName(newName)
    if(newSubject) newSubject=validation.checkSubject(newSubject)       //only check the name and subject if they are provided
    const deckCollection=await decks();
    const oldDeck=await getDeckById(deckId)        //used for comparison at the end, if anything was actually modified
    const userDecks=await userFunctions.getUsersDecks(userId);
    for(deck of userDecks){         //checks if you already have that deck
        if(deck.name.toLowerCase()===newName.toLowerCase() && deck._id.toString()!==deckId.toString())  //prevents error on trying to rename a deck to itself
            throw `You already have a deck called ${newName}`
    }
    const editedDeck=await deckCollection.updateOne(            //updating deck
        {_id:deckId},
        {$set: {"name":newName, "subject":newSubject, "public":newPublicity}}   //updates specific fields
        )               //if nothing is submitted, then nothing is modified.
    if(editedDeck.modifiedCount===0 && !(oldDeck.name.toLowerCase()===newName.toLowerCase() && oldDeck.subject.toLowerCase()===newSubject.toLowerCase() && oldDeck.public===newPublicity)) 
        throw "Could not successfully update deck"
    return await getDeckById(deckId);
}

const getCard=async(deckId,cardNumber) => {
    deckId=validation.checkId(deckId)
    const userDeck=await getDeckById(deckId)
    return userDeck.cards[cardNumber]           //user.decks._id.cards[cardNumber]
}

const createCard = async(deckId,cardFront,cardBack) => {
    deckId=validation.checkId(deckId); deckId=new ObjectId(deckId)
    cardFront=validation.checkCard(cardFront,"front")
    cardBack=validation.checkCard(cardBack,"back")
    const deckCollection=await decks();
    const userDeck=await getDeckById(deckId)
    for(card of userDeck.cards){                    //if they already have that card
        if(card.front.toLowerCase()===cardFront.toLowerCase())
            throw `You already have a card named ${cardFront}`
    }
    let newCard={
        number:userDeck.cards.length,
        front:cardFront,
        back:cardBack
    }
    const insertCard=await deckCollection.updateOne(
        {_id:deckId},
        {$push: {"cards":newCard}}
    )
    if(insertCard.modifiedCount===0) throw "Could not successfully create card"
    return newCard
}

const editCard = async(deckId,cardNumber,cardFront,cardBack,isCardSame) => {
    deckId=validation.checkId(deckId)
    if(cardFront) cardFront=validation.checkCard(cardFront,"front")     //only validate front and back if they are given
    if(cardBack) cardBack=validation.checkCard(cardBack,"back")
    const deckCollection=await decks();
    const deck=await getDeckById(deckId)
    if(isCardSame==1 || isCardSame==3) {  //If no new front is specified, the old one is used. In that case, we ignore checking for that name's appearance, since it's already there (from not being changed)
        for(card of deck.cards){                //if they already have that card
            if(card.front===cardFront && !isCardSame)
                throw `You already have a card named ${cardFront}`
        }
    }
    const editedCard=await deckCollection.updateOne(
        {_id:new ObjectId(deckId)},
        {$set:{"cards.$[card].front":cardFront,"cards.$[card].back":cardBack}},
        {arrayFilters:[{"card.number":cardNumber}]}
    )
    if(editedCard.modifiedCount===0 && isCardSame!=3)    
        throw "Could not successfully update card"
    return editedCard
}

const deleteCard = async(deckId,cardNumber) => {           
    deckId=validation.checkId(deckId); deckId=new ObjectId(deckId);
    const deckCollection=await decks();
    const updatedDeck=await deckCollection.updateOne(           //pulls card (there is now a "hole" in the numbers)
        {_id:deckId},
        {$pull:{"cards":{"number":cardNumber}}}
    )
    if(updatedDeck.modifiedCount===0) throw "Could not delete card"
    const updatedCardNumbers=await deckCollection.updateOne(           //fixes the hole. Updates every card number after the one that was removed.
        {_id:deckId},           //filters by deck id
        {"$inc":{"cards.$[card].number":-1}},     //In the cards array, find card by card number
        {arrayFilters:[{"card.number":{$gt:cardNumber}}]} //only update card numbers after the card that was deleted
    )
    const deckCheck=await getDeckById(deckId)
                                                        //if we delete the last one, then no numbers are changed
    if(updatedCardNumbers.modifiedCount===0 && deckCheck.cards && cardNumber!==deckCheck.cards.length) 
        throw "Could not update card numbers"
    return updatedCardNumbers
}

const getPublicDecks=async() => {
    const deckCollection=await decks()
    const userCollection=await users()
    const publicDecks=await deckCollection.find({public:true}).toArray()
    for(let i in publicDecks) {     //adds creator to deck object
        publicDecks[i].creator=(await userCollection.findOne({_id:new ObjectId(publicDecks[i].creatorId)})).username
    }
    return publicDecks
}

function sortDecks(decksList,sortBy,om){        //om is order multiplier. 1 sort by ascending. -1 sorts by descending
    if(sortBy==='name'||sortBy==='name_desc')
        return decksList.sort((a,b) => {
            return a.name.toLowerCase()<b.name.toLowerCase() ? -1*om : a.name.toLowerCase()===b.name.toLowerCase() ? 0 : 1*om}
        )
    if(sortBy==='date'||sortBy==='date_desc')
        return decksList.sort((a,b) => {
            return a.date<b.date ? -1*om : a.date===b.date ? 0 : 1*om}
        )
    if(sortBy==='subject'||sortBy==='subject_desc')
        return decksList.sort((a,b) => {
            return a.subject.toLowerCase()<b.subject.toLowerCase() ? -1*om : a.subject.toLowerCase()===b.subject.toLowerCase() ? 0 : 1*om}
        )
}

module.exports = {
    createDeck,
    savePublicDeck,
    sendDeckToUser,
    deleteDeck,
    getDeckById,
    getDeckByOnlyId,
    getDeckByName,
    editDeck,
    getCard,
    createCard,
    editCard,
    deleteCard,
    getPublicDecks,
    sortDecks
}