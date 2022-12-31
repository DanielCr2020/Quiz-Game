const bcrypt=require('bcryptjs')
const saltRounds=11
const mongoCollections = require('../config/mongoCollections');
const users = mongoCollections.users
const validation=require('../validation')
const {ObjectId} = require('mongodb');
const xss=require('xss')

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
    if(comparison) return {authenticatedUser: true}
    throw "Either the username or password is invalid"
}

const getUsersDecks = async(username) => {
    username=validation.checkUsername(username)
    const userCollection=await users();
    const userDeckList=await userCollection.findOne({username:username.toLowerCase()})
    if(!userDeckList) throw new Error(`Cannot get ${username}'s decks`)
    return userDeckList.decks
}

const getUsersFolders = async(username) => {
    username=validation.checkUsername(username)
    const userCollection=await users();
    const userFolderList=await userCollection.findOne({username:username.toLowerCase()})
    if(!userFolderList) throw new Error(`Cannot get ${username}'s folders`)
    return userFolderList.folders
}

const getAllUsers = async()=>{
    const userCollection=await users()
    let userList=await userCollection.find({}).toArray()
    if(!userList) throw new Error("Could not get all users")
    for(u of userList){
        u._id=u._id.toString()
    }
    return userList
}

module.exports = {
    createUser,
    checkUser,
    getUsersDecks,
    getUsersFolders,
    getAllUsers
}