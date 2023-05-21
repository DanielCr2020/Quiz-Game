const xss=require('xss')
const {ObjectId} = require('mongodb')

const maxLen=40
const maxFront=50
const maxBack=200

function checkUsername(username,notCreating){
    if(!username) throw "You must supply a username"
    if(typeof username!=='string') throw new Error("Username must be a string")
    username=username.trim().toLowerCase(); username=xss(username);
    if(notCreating) { //done this way so that users can still log in if username requirements change
        if(username.length<4) throw new Error("Username must be at least 4 characters long")
    }
    return username
}

function checkPassword(password,notCreating){       //2nd parameter differentiates between registering and logging in
    if(!password) throw "You must supply a password"
    if(typeof password!=='string') throw new Error("Password must be a string")
    password=password.trim(); password=xss(password);
    if(!notCreating) {          //done this way so that users can still log in if password requirements change
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
    if(id.toString().trim().length<=0) throw new Error("id cannot be an empty string or just spaces")
    if(!ObjectId.isValid(id)) throw new Error("Invalid object id")
    return id
}

function checkDeckName(deckName){
    if(!deckName) throw new Error("Deck name is not defined")
    if(typeof deckName!=='string') throw new Error("Deck name is not a string")
    if(deckName.trim().length<2) throw ("Deck name must be at least 2 characters")
    deckName=xss(deckName.trim());
    if(deckName.length>maxLen) throw "Deck name cannot be longer than "+maxLen
    return deckName
}

function checkSubject(subject){
    if(!subject) throw new Error("Subject is not defined")
    if(typeof subject!=='string') throw new Error("Subject is not a string")
    if(subject.trim().length<2) throw ("Subject must be at least 2 characters")
    subject=xss(subject.trim());
    if(subject.length>maxLen) throw "Subject cannot be longer than "+maxLen
    return subject
}

function checkCard(contents,forb){      //it's forbin time
    if(!contents) throw new Error(`Card ${forb} is not defined`)
    if(typeof contents!=='string') throw new Error(`Card ${forb} is not a string`)
    if(contents.trim().length<2) throw `Card ${forb} must be at least 2 characters`
    contents=xss(contents.trim());
    if(forb=='front')
        if(contents.length>maxFront) throw "Card front cannot be longer than " + maxFront
    else if(forb=='back')
        if(contents.length>maxBack) throw "Card back cannot be longer than " + maxBack
    return contents
}

function checkCardNumber(deck,cardNumber){
    if(!deck) throw "You must supply a deck"
    if((/[^0-9]/).test(cardNumber)) throw "Card number must be a number"
    cardNumber=Number.parseInt(cardNumber);
    let cards=deck.cards;
    if(cardNumber<0 || cardNumber>=cards.length) throw "Card number is in invalid range"
    return cardNumber;
}

function checkFolderName(folderName){
    if(!folderName) throw new Error("Folder name is not defined")
    if(typeof folderName!=='string') throw new Error("Folder name is not a string")
    folderName=xss(folderName.trim())
    if(folderName.length<2) throw "Folder name must be at least 2 characters"
    if(folderName.length>maxLen) throw "Folder name cannot be longer than "+maxLen
    return folderName
}

module.exports = {
    checkUsername,
    checkPassword,
    checkId,
    checkDeckName,
    checkSubject,
    checkCard,
    checkFolderName,
    checkCardNumber
}