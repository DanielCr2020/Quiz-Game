const mongoCollections = require('../config/mongoCollections');
const users=mongoCollections.users
const userFunctions=require('./users')
const validation=require('../validation')
const {ObjectId} = require('mongodb')

function fn(str){       //adds leading 0 to 1 digit time numbers
    if(str.toString().length===1) str='0'+str.toString();
    return str
}

const createDeck = async (creator,deckName,subject,isPublic,cardsArray,dateCreated) => {
    creator=validation.checkUsername(creator)
    deckName=validation.checkDeckName(deckName)
    subject=validation.checkSubject(subject)

    const userCollection = await users();
    const deckCreator=await userCollection.findOne({username:creator.toLowerCase()})
    for(deck of deckCreator.decks){
        if(deck.name.toLowerCase()===deckName.toLowerCase())    //checks if you already have that deck
            throw `You already have a deck called ${deckName}`
    }
    if(Array.isArray(cardsArray)) cards=cardsArray
    else cards=[]
    if(typeof dateCreated!='undefined'){
        newDeck.dateCreated=dateCreated
    }
    let d=new Date()
    let newDeck = {
        _id: ObjectId().toString(),
        name:deckName,
        subject:subject,
        dateCreated: `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()} ${fn(d.getHours())}:${fn(d.getMinutes())}:${fn(d.getSeconds())}`,
        creator:creator,
        public:isPublic,
        cards:cards
    }
    const insertDeck=await userCollection.updateOne(
        {username: creator},
        {$push: {"decks": newDeck}}
    )
    if(insertDeck.modifiedCount===0) throw "Could not successfully create deck"
    return newDeck
}

const getUsersDecks = async(username) => {
    username=validation.checkUsername(username)
    const userCollection=await users();
    const user=userCollection.findOne({username:username})
    if(!user) throw "Could not get user"
    return user.decks
}

const deleteDeck = async(creator,deckId) => {
    deckId=validation.checkId(deckId)
    creator=validation.checkUsername(creator)
    const userCollection=await users()
    const userFromDeck = await userCollection.updateOne(
        {username:creator},
        {$pull: {"decks": {"_id": deckId}}}         //      in "decks [array]", find the single deck with the "_id" that matches deckId, and pull that  
    )
    return userFromDeck
}

const getDeckById = async(username,deckId) => {
    deckId=validation.checkId(deckId)
    username=validation.checkUsername(username)
    const userCollection=await users()
    const deckFoundUser=await userCollection.findOne(
        {username:username,                     //finds user 
         decks:{$elemMatch: {_id:deckId}}},     //then finds the deck that elemMatches the deckId
        {projection: {"decks.$":1}}             //empty projection on the first one(?????)
    )
    const deckFound=deckFoundUser.decks[0]
    if(!deckFound) throw new Error("Unable to find that deck")
    return deckFound
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
    )
    if(editedDeck.modifiedCount===0 && !(oldDeck.name.toLowerCase()===newName.toLowerCase() && oldDeck.subject.toLowerCase()===newSubject.toLowerCase() && oldDeck.public===newPublicity)) 
        throw "Could not successfully update deck"
    return await getDeckById(username,deckId);
}

const createCard = async(username,deckId,cardFront,cardBack) => {
    username=validation.checkUsername(username),
    deckId=validation.checkId(deckId)
    cardFront=validation.checkCard(cardFront,"front")
    cardBack=validation.checkCard(cardBack,"back")
    const userCollection=await users();
    const userDeck=await getDeckById(username,deckId)
    for(card of userDeck.cards){
        if(card.front.toLowerCase()===cardFront.toLowerCase())
            throw `You already have a card named ${cardFront}`
    }
    let newCard={
        number:userDeck.cards.length,
        front:cardFront,
        back:cardBack
    }
    const insertCard=await userCollection.updateOne(
        {username:username,"decks._id":deckId},
        {$push: {"decks.$.cards":newCard}}
    )
    if(insertCard.modifiedCount===0) throw "Could not successfully create card"
    return newCard
}

module.exports = {
    createDeck,
    getUsersDecks,
    deleteDeck,
    getDeckById,
    editDeck,
    createCard
}