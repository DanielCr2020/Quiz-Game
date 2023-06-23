const bcrypt=require('bcryptjs')
const saltRounds=11
const mongoCollections = require('../config/mongoCollections');
const users = mongoCollections.users
const decks = mongoCollections.decks
const validation=require('../validation')
const {ObjectId} = require('mongodb');

const createUser = async(username,password) => {        //when a user registers
    username=validation.checkUsername(username)
    const userCollection=await users();
    if(await userCollection.findOne({username:username})) {
        throw "That user already exists"
    }
    password=validation.checkPassword(password,false)
    const hashed_pw=await bcrypt.hash(password,saltRounds)
    let newUser= {
        username: username,
        password: hashed_pw,
        decks: [],
        folders: []
    }
    const insertUser=await userCollection.insertOne(newUser);
    if(!insertUser.acknowledged || !insertUser.insertedId)
        throw new Error("Could not add user")
    return {insertedUser: true, userId: insertUser.insertedId}
}

const checkUser = async(username,password) => {         //when a user logs in
    username=validation.checkUsername(username)
    password=validation.checkPassword(password,true)
    const userCollection=await users();
    const user=await userCollection.findOne({username:username})
    if(!user) throw "Either the username or password is invalid"
    let user_hashed_password=user.password
    let comparison=await bcrypt.compare(password,user_hashed_password)
    if(comparison) return {authenticatedUser: true, userId:user._id}
    throw "Either the username or password is invalid"
}

const getUsersDecks = async(userId) => {
    userId=(validation.checkId(userId));
    const decksCollection=await decks();
    const userDecks=await decksCollection.find({creatorId:new ObjectId(userId)}).toArray();
    if(!userDecks) throw "Could not get user's decks"
    return userDecks
}

const getUsersFolders = async(userId) => {
    userId=validation.checkId(userId); userId=new ObjectId(userId);
    const userCollection=await users();
    const user=await userCollection.findOne({_id: userId})
    if(!user) throw new Error(`Cannot get user`)
    return user.folders
}

const getAllUsers = async()=>{
    const userCollection=await users()
    let userList=await userCollection.find({}).toArray()
    if(!userList) throw new Error("Could not get all users")
    return userList
}

const checkOwnership = async(thingToCheck,userId,itemId) => {
    if(userId) userId=validation.checkId(userId);
    if(itemId) itemId=validation.checkId(itemId);
    if(thingToCheck=='deck'){

    }
    else if(thingToCheck=='folder'){

    }
}

const getUsernameFromId = async(userId) => {
    userId=validation.checkId(userId);
    const userCollection=await users();
    const user=await userCollection.findOne({_id:new ObjectId(userId)});
    if(!user) throw `Unable to find username for user with id of ${userId}`
    return user.username;
}

const getUserIdFromName = async(username) => {
    username=validation.checkUsername(username).toLowerCase();
    const userCollection=await users();
    const user=await userCollection.findOne({username:username});
    if(!user) throw `Unable to find user id for user with name of ${username}`
    return user._id;
}

module.exports = {
    createUser,
    checkUser,
    getUsersDecks,
    getUsersFolders,
    getAllUsers,
    checkOwnership,
    getUsernameFromId,
    getUserIdFromName
}