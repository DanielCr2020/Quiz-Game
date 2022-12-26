const express=require('express')
const router=express.Router()
const path=require('path')
const users=require('../data/users')
const decks=require('../data/decks')
const validation=require('../validation')
const xss=require('xss')
//      /yourpage/decks
router
    .route('/')         //getting a user's decks
    .get(async(req,res) => {
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
        console.log(newDeck)
        name=newDeck.name
        subject=newDeck.subject
        console.log(name,subject)
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
    .get(async(req,res) => {                //      /:id    get     showing a user's decks
        if(!req.body) res.sendStatus(400)
        let username=undefined; let id=undefined; let deck=undefined;
        try{
            username=validation.checkUsername(req.session.user.username)
            id=validation.checkId(req.params.id)
            deck=await decks.getDeckById(id)
        }
        catch(e){
            console.log(e)
            //if(!yourDecks) res.status(500).send("Internal Server Error (GET /yourpage/decks/:id)")
            return
        }
        res.render(path.resolve('views/decks-pages/singleDeck.handlebars'),{
            title:username,
            userName:username,
            dateCreated:deck.dateCreated
        })
    })
    
    .delete(async(req,res) => {
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