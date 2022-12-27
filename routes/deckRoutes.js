const express=require('express')
const router=express.Router()
const path=require('path')
const users=require('../data/users')
const decks=require('../data/decks')
const validation=require('../validation')
const xss=require('xss')
//      /yourpage/decks
router
    .route('/')         
    .get(async(req,res) => {        //getting a user's decks
        if(!req.body) res.sendStatus(400)
        let username=undefined; let yourDecks=undefined;
        try{
            username=validation.checkUsername(req.session.user.username)
            yourDecks=await users.getUsersDecks(username)
        }
        catch(e){
            console.log(e)
            if(!yourDecks) res.status(500).send("Internal Server Error (GET /yourpage/decks)")
            return
        }
        res.render(path.resolve('views/decks-pages/decks.handlebars'),{title:username,deck:yourDecks,userName:username})
    })
    .post(async(req,res) => {      //      /decks post route (when you make a new deck)
        if(!req.body) {res.sendStatus(400); return;}
        let name=undefined; let subject=undefined; let username=undefined;
        try{        //initial validation
            name=validation.checkDeckName(req.body.name);
            subject=validation.checkSubject(req.body.subject);
            username=validation.checkUsername(req.session.user.username);
        }
        catch(e){
            console.log(e)
            res.json({
                title:"Cannot create deck",
                success:false,
                error:e.toString()
            })
            res.status(400)
            return
        }
        let newDeck=undefined; let yourDecks=undefined; let newDeckId=undefined;     //creating deck
        try{
            yourDecks=await users.getUsersDecks(username)
            newDeck=await decks.createDeck(username,name,subject,false)
            newDeckId=validation.checkId(newDeck._id.toString())
        }
        catch(e){
            console.log(e)
            res.json({
                title:"Cannot create deck",
                deck:yourDecks,
                success:false,
                error:e.toString()
            })
            res.status(400)
            return
        }
        //was able to create deck
        name=newDeck.name
        subject=newDeck.subject
        res.json({
            title:username,
            subject:subject,
            newName:name,
            deck:yourDecks,
            id:newDeckId,
            userName:username,
            success:true
        })
        
    })

router
    .route('/:id')
    .get(async(req,res) => {                //      /:id    get     showing a user's decks (singleDeck)
        if(!req.body) res.sendStatus(400)
        let username=undefined; let id=undefined; let deck=undefined;
        try{
            username=validation.checkUsername(req.session.user.username)
            id=validation.checkId(req.params.id)
            deck=await decks.getDeckById(username,id)
        }
        catch(e){
            console.log(e)
            if(!deck) res.status(500).send("Internal Server Error (GET /yourpage/decks/:id)")
            return
        }
        res.render(path.resolve('views/decks-pages/singleDeck.handlebars'),{
            title:deck.name,
            userName:username,
            deckName:deck.name,
            deckSubject:deck.subject,
            dateCreated:deck.dateCreated,
            public:deck.public
        })
    })
    .patch(async(req,res) => {          //      /:id    patch       updating a deck
        let deckId=undefined;let newDeckName=req.body.name; let newDeckSubject=req.body.subject; let username=undefined;
        let deckToEdit=undefined;
        try{
            deckId=validation.checkId(req.params.id)
            username=validation.checkUsername(req.session.user.username)
            deckToEdit=await decks.getDeckById(username,deckId)
            if(newDeckName) {
                newDeckName=validation.checkDeckName(newDeckName);
            }
            else{
                newDeckName=validation.checkDeckName(deckToEdit.name)
            }
            if(newDeckSubject) {
                newDeckSubject=validation.checkSubject(newDeckSubject);
            }
            else{
                newDeckSubject=validation.checkSubject(deckToEdit.subject)
            }
            await decks.editDeck(username,deckId,newDeckName,newDeckSubject,req.body.public)
        }
        catch(e){
            console.log(e)
            res.json({
                title:"Cannot edit deck",
                error:e.toString(),
                success:false
            })
            return
        }
        res.json({
            title:newDeckName,
            id:deckId,
            deckName:newDeckName,
            deckSubject:newDeckSubject,
            public:req.body.public,
            success:true
        })
    })
    .delete(async(req,res) => {             //      /decks/:id  delete route. Deleting a deck
        let id=undefined;
        try{id=validation.checkId(req.params.id)}
        catch(e){
            console.log(e)
            res.json({
                success:false,
                error:e
            })
            return
        }
        try{
            let username=validation.checkUsername(req.session.user.username)
            await decks.deleteDeck(username,id)
        }
        catch(e){
            console.log(e)
            return
        }
        res.json({
            success:true
        })
    })

module.exports=router