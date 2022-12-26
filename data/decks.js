const mongoCollections = require('../config/mongoCollections');
const users=mongoCollections.users
const userFunctions=require('./users')
const validation=require('../validation')
const {ObjectId} = require('mongodb')

const createDeck = async (creator,deckName,subject,isPublic,cardsArray,dateCreated) => {
    creator=validation.checkUsername(creator)
    deckName=validation.checkDeckName(deckName)
    subject=validation.checkSubject(subject)

    const userCollection = await users();
    const deckCreator=await userCollection.findOne({username:creator.toLowerCase()})
    const deckList=deckCreator.decks
    if( (deckList.filter((deck) => {return deck.name.toLowerCase()===deckName.toLowerCase()})).length>0 )    //checks if you already have that deck
        throw `You already have a deck called ${deckName}`
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
        dateCreated: `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`,
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

const getDeckById = async(deckId) => {
    deckId=validation.checkId(deckId)
    const userCollection=await users()
    const deckFound=await userCollection.findOne(
        {"_id": deckId}
    )
    console.dir(deckFound,{depth:null})
    if(!deckFound) throw new Error("Unable to find that deck")
    return deckFound
}

module.exports = {
    createDeck,
    getUsersDecks,
    deleteDeck,
    getDeckById
}