const {ObjectId}=require('mongodb')
const mongoCollections = require('../config/mongoCollections');
const users=mongoCollections.users
const validation=require('../validation')

function fn(str){       //adds leading 0 to 1 digit time numbers
    if(str.toString().length===1) str='0'+str.toString();
    return str
}

const createFolder = async(username,folderName) => {
    username=validation.checkUsername(username)
    folderName=validation.checkFolderName(folderName)

    const userCollection=await users();
    const folderCreator=await userCollection.findOne({username:username})
    for(folder of folderCreator.folders)
        if(folder.name.toLowerCase()===folderName.toLowerCase()) 
            throw "You already have a folder named "+folderName
    let d=new Date()
    let newFolder={
        _id:ObjectId().toString(),
        name:folderName,
        dateCreated: `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()} ${fn(d.getHours())}:${fn(d.getMinutes())}:${fn(d.getSeconds())}`,
        decks:[]
    }
    const insertFolder=await userCollection.updateOne(
        {username:username},
        {$push: {"folders":newFolder}}
    )
    if(insertFolder.modifiedCount===0) throw "Could not successfully add folder"
    return newFolder
}

const deleteFolder=async(username,folderId) => {
    username=validation.checkUsername(username)
    folderId=validation.checkId(folderId)
    const userCollection=await users();
    const updatedUser=await userCollection.updateOne(
        {username:username},
        {$pull: {"folders": {"_id":folderId}}}
    )
    if(updatedUser.modifiedCount===0) throw "Could not delete folder"
    return updatedUser
}

const editFolder=async(username,folderId,newFolderName) => {
    username=validation.checkUsername(username)
    folderId=validation.checkId(folderId)
    newFolderName=validation.checkFolderName(newFolderName);
    const userCollection=await users();
    const folderCreator=await userCollection.findOne({username:username})
    for(folder of folderCreator.folders)
        if(folder.name.toLowerCase()===newFolderName.toLowerCase()) 
            throw "You already have a folder named "+newFolderName
    
    const editedFolder=userCollection.updateOne(
        {username:username,"folders._id":folderId},
        {$set: {"folders.$.name":newFolderName}}
    )
    if(editedFolder.modifiedCount===0) throw "Unable to edit folder"
    return await getFolderById(username,folderId)
}

const getFolderById=async(username,folderId) => {
    username=validation.checkUsername(username)
    folderId=validation.checkId(folderId)
    const userCollection=await users()
    const folderFromId=await userCollection.findOne(
        {username:username,
         folders:{$elemMatch:{_id:folderId}}},
        {projection:{"folders.$":1}}
    ).folders[0]
    if(!folderFromId) throw "Unable to find that folder"
    return folderFromId
}

const addDeckToFolder=async(username,folderId,deckId) => {
    username=validation.checkUsername(username)
    folderId=validation.checkId(folderId)
    deckId=validation.checkId(deckId)
    const userCollection=await users()
    const updatedFolder=await userCollection.updateOne(
        {username:username,"folders._id":folderId},
        {$push: {"folders.$.decks":deckId}}
    )
    if(updatedFolder.modifiedCount===0) throw "Unable to add deck to folder"
    return await getFolderById(username,folderId)
}

const removeDeckFromFolder=async(username,folderId,deckId) => {
    username=validation.checkUsername(username)
    folderId=validation.checkId(folderId)
    deckId=validation.checkId(deckId)
    const userCollection=await users()
    const updatedFolder=await userCollection.updateOne(
        {username:username,"folders._id":folderId},
        {$pull: {"folders.$.decks":deckId}}
    )
    if(updatedFolder.modifiedCount===0) throw "Unable to remove deck from folder"
    return await getFolderById(username,folderId)
}

module.exports = {
    createFolder,
    deleteFolder,
    editFolder,
    getFolderById,
    addDeckToFolder,
    removeDeckFromFolder
}