const {ObjectId}=require('mongodb')
const mongoCollections = require('../config/mongoCollections');
const users=mongoCollections.users
const validation=require('../validation')

const createFolder = async(userId,folderName) => {        //same idea as createDeck, but we only need to deal with adding folders to one person
    userId=validation.checkId(userId); userId=new ObjectId(userId)
    folderName=validation.checkFolderName(folderName)

    const userCollection=await users();
    const folderCreator=await userCollection.findOne({_id:userId})
    for(folder of folderCreator.folders)
        if(folder.name.toLowerCase()===folderName.toLowerCase()) 
            throw "You already have a folder named "+folderName
    let newFolder={
        _id:ObjectId(),
        name:folderName,
        dateCreated: new Date(),
        creatorId:userId,
        decks:[]            //contains deck id's
    }
    const insertFolder=await userCollection.updateOne(
        {_id:userId},
        {$push: {"folders":newFolder}}
    )
    if(insertFolder.modifiedCount<=0) throw "Could not successfully add folder"
    return newFolder
}

const deleteFolder=async(userId,folderId) => {        //deletes folder from array of subdocuments in user.
    userId=validation.checkId(userId);      userId=new ObjectId(userId)
    folderId=validation.checkId(folderId); folderId=new ObjectId(folderId)
    const userCollection=await users();
    const updatedUser=await userCollection.updateOne(
        {_id:userId},
        {$pull: {"folders": {"_id":folderId}}}
    )
    if(updatedUser.modifiedCount<=0) throw "Could not delete folder"
    return updatedUser
}

const editFolder=async(userId,folderId,newFolderName) => {        //renaming a folder
    userId=validation.checkId(userId);      userId=new ObjectId(userId)
    folderId=validation.checkId(folderId); folderId=new ObjectId(folderId)
    newFolderName=validation.checkFolderName(newFolderName);
    const userCollection=await users();
    const folderCreator=await userCollection.findOne({_id:userId})
    for(folder of folderCreator.folders)            //makes sure the new name is not the existing name of a folder
        if(folder.name.toLowerCase()===newFolderName.toLowerCase()) 
            throw "You already have a folder named "+newFolderName
    
    const editedFolder=userCollection.updateOne(
        {_id:userId,"folders._id":folderId},
        {$set: {"folders.$.name":newFolderName}}            //changes just the folder's name
    )
    if(editedFolder.modifiedCount<=0) throw "Unable to edit folder"
    return await getFolderById(userId,folderId)
}

const getFolderById=async(userId,folderId) => {
    userId=validation.checkId(userId);      userId=new ObjectId(userId)
    folderId=validation.checkId(folderId); folderId=new ObjectId(folderId)
    const userCollection=await users()
    const folderFromId=await userCollection.findOne(
        {_id:userId,
         folders:{$elemMatch:{_id:folderId}}},
        {projection:{"folders.$":1}}
    )
    const folderFound=folderFromId.folders[0]
    if(!folderFound) throw "Unable to find that folder"
    return folderFound
}

const addDeckToFolder=async(userId,folderId,deckId) => {      //add deck (deckId) to user's (userId) folder (folderId)
    userId=validation.checkId(userId);      userId=new ObjectId(userId)
    folderId=validation.checkId(folderId); folderId=new ObjectId(folderId)
    deckId=validation.checkId(deckId)
    const userCollection=await users()
    let folder=await getFolderById(userId,folderId)
    for(let i of folder.decks){
        if(i.toString()==deckId.toString()) throw "That deck is already in that folder"
    }
    const updatedFolder=await userCollection.updateOne(
        {_id:userId,"folders._id":folderId},
        {$push: {"folders.$.decks":deckId}}
    )
    if(updatedFolder.modifiedCount<=0) throw "Unable to add deck to folder"
    return await getFolderById(userId,folderId)
}

const removeDeckFromFolder=async(userId,folderId,deckId) => {     //remove deck (deckId) from user's (userId) folder (folderId)
    userId=validation.checkId(userId);      userId=new ObjectId(userId)
    folderId=validation.checkId(folderId); folderId=new ObjectId(folderId)
    deckId=validation.checkId(deckId);      deckId=new ObjectId(deckId)
    const userCollection=await users()      
    let folder=await getFolderById(userId,folderId)
    let contains=false;
    for(let i of folder.decks){
        if(i.toString()==deckId.toString()){
            contains=true
            break
        }
    }
    if(!contains) throw "That deck is not in that folder"
    const updatedFolder=await userCollection.updateOne(
        {_id:userId,"folders._id":folderId},
        {$pull: {"folders.$.decks":deckId}}
    )
    if(updatedFolder.modifiedCount<=0) throw "Unable to remove deck from folder"
    return await getFolderById(userId,folderId)
}

module.exports = {
    createFolder,
    deleteFolder,
    editFolder,
    getFolderById,
    addDeckToFolder,
    removeDeckFromFolder
}