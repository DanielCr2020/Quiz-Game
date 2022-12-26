const xss=require('xss')
const {ObjectId} = require('mongodb')

const maxLen=40
const maxFront=50
const maxBack=200

function checkUsername(username){
    if(!username) throw new Error("Username must be defined")
    if(typeof username!=='string') throw new Error("Username must be a string")
    username=username.trim().toLowerCase(); username=xss(username);
    if(username.length<4) throw new Error("Username must be at leats 4 characters long")
    return username
}

function checkPassword(password,notCreating){       //2nd parameter differentiates between registering and logging in
    if(!password) throw new Error("Password must be defined")
    if(typeof password!=='string') throw new Error("Password must be a string")
    password=password.trim(); password=xss(password);
    if(!notCreating) {
        //password criteria
        if(password.length<6) throw "Password must be at least 6 characters long"
        if(password.toLowerCase()===password) throw "Password must include at least one uppercase character"
        if(!(/[0-9]/).test(password)) throw ("Password must include at least one number")
        if(!(/[^a-z0-9]/i).test(password)) throw "Password must include at least one special character"
    }
    return password
}

function checkId(id){
    if(!id) throw new Error("id is not defined")
    if(typeof id!=='string') throw new Error('id is not a string')
    if(id.trim().length===0) throw new Error("id cannot be an empty string or just spaces")
    id=id.trim(); id=xss(id);
    if(!ObjectId.isValid(id)) throw new Error("Invalid object id")
    return id
}

function checkDeckName(deckName){
    if(!deckName) throw new Error("Deck name is not defined")
    if(typeof deckName!=='string') throw new Error("Deck name is not a string")
    if(deckName.trim().length<2) throw new Error("Deck name must be at least 2 characters")
    deckName=xss(deckName.trim());
    if(deckName.length>maxLen) throw "Deck name cannot be longer than "+maxLen
    return deckName
}

function checkSubject(subject){
    if(!subject) throw new Error("Subject is not defined")
    if(typeof subject!=='string') throw new Error("Subject is not a string")
    if(subject.trim().length<2) throw new Error("Subject must be at least 2 characters")
    subject=xss(subject.trim());
    if(subject.length>maxLen) throw "Subject cannot be longer than "+maxLen
    return subject
}

module.exports = {
    checkUsername,
    checkPassword,
    checkId,
    checkDeckName,
    checkSubject
}