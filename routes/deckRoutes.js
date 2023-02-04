const express=require('express')
const router=express.Router()
const path=require('path')
const users=require('../data/users')
const decks=require('../data/decks')
const validation=require('../validation')
//Pretty much every request except GET are done with AJAX
//      /yourpage/decks
router
    .route('/')         
    .get(async(req,res) => {        //      /decks get route.    getting a user's decks
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
        }       //get request gets everything on the page. We only need to render.
        res.render(path.resolve('views/decks-pages/decks.handlebars'),{title:username,deck:yourDecks,userName:username})
    })
    .post(async(req,res) => {      //   AJAX    /decks post route (when you make a new deck)
        if(!req.body) {res.sendStatus(400); return;}
        let name=undefined; let subject=undefined; let username=undefined;
        let newDeck=undefined; let newDeckId=undefined;     //creating deck
        try{
            username=validation.checkUsername(req.session.user.username);
        }
        catch(e){
            console.log(e)
            return
        }
        try{
            name=validation.checkDeckName(req.body.name);
            subject=validation.checkSubject(req.body.subject);
            newDeck=await decks.createDeck(username,name,subject,false)
            newDeckId=validation.checkId(newDeck._id.toString())        //checks the new deck id
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
        //was able to create deck
        res.json({
            subject:newDeck.subject,
            newName:newDeck.name,
            id:newDeckId,
            success:true
        })
    })
    .patch(async(req,res) => {      //  AJAX        /decks patch route. When you sort or search your decks
        let username=undefined;
        try{
            username=validation.checkUsername(req.session.user.username)
        }   
        catch(e){
            console.log(e)
            return
        }
        if(req.body.sortBy){
            let userDecks=undefined;
            try{
                userDecks=await users.getUsersDecks(username)
            }
            catch(e){
                console.log(e)
                res.json({success:false,error:e})
                return
            }
                                                //gets id, name, subject, and date created from decks. All sortable things
            let extractedDeckInfo=userDecks.map((deck)=>{return {id:deck._id,name:deck.name,subject:deck.subject,date:deck.dateCreated}})
            extractedDeckInfo=extractedDeckInfo.filter((deck)=>{ 
                return req.body.decksOnPage.includes(deck.name)||req.body.decksOnPage.includes(deck.subject)}
            )
            let sortedDecks=undefined;
            if(req.body.sortBy.includes("_desc")) {
                sortedDecks=decks.sortDecks(extractedDeckInfo,req.body.sortBy,-1)       //last parameter is for ascending or descending
            }
            else {
                sortedDecks=decks.sortDecks(extractedDeckInfo,req.body.sortBy,1)
            }
            res.json({
                sortedDecks:sortedDecks,
                success:true
            })
        }
        else if(req.body.searchBy){
            let foundDecks=undefined;
            try{
                foundDecks=await decks.getUsersDecks(username)
                if(req.body.searchBy!==' ')
                foundDecks=foundDecks.filter((deck) => {
                    return deck.name.toLowerCase().includes(req.body.searchBy.toLowerCase())||deck.subject.toLowerCase().includes(req.body.searchBy.toLowerCase())
                })
            }
            catch(e){
                console.log(e)
                res.json({success:false,error:e})
                return
            }
            foundDecks=foundDecks.map((deck)=>{return {id:deck._id,name:deck.name,subject:deck.subject}})
            res.json({
                foundDecks:foundDecks,
                success:true
            })
        }
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
            id:id,
            creator:deck.creator,
            deckName:deck.name,
            deckSubject:deck.subject,
            dateCreated:deck.dateCreated,
            public:deck.public,
            card:deck.cards
        })
    })
    .post(async(req,res) => {           //   AJAX   /:id        post route  (making a new card)   or sending deck to another user
        if(!req.body) {res.sendStatus(400); return;}
        if(!req.body.sendDeck) {            // creating a new card
            let front=undefined; let back=undefined; let username=undefined; let newCard=undefined; let deckId=undefined;
            try{            //validation
                front=validation.checkCard(req.body.front,"front")
                back=validation.checkCard(req.body.back,"back")
                username=validation.checkUsername(req.session.user.username)
                deckId=validation.checkId(req.params.id)
                newCard=await decks.createCard(username,deckId,front,back)
            }
            catch(e){
                console.log(e)
                res.json({
                    title:"Cannot create card",
                    success:false,
                    error:e
                })
                return
            }
            res.json({
                id:deckId,
                number:newCard.number,      //cards each have a number, which is used for indexing and the url.
                front:front,
                back:back,
                success:true
            })
        }
        else {          //sending a deck to another user
            let receiver=undefined; let deckId=undefined; let username=undefined; let currentDeck=undefined;
            try{
                receiver=validation.checkUsername(req.body.user)
                deckId=validation.checkId(req.params.id)
                username=validation.checkUsername(req.session.user.username)
                currentDeck=await decks.getDeckById(username,deckId)            //inserting the same deck with all the same info
                await decks.createDeck(username,currentDeck.name,currentDeck.subject,false,currentDeck.cards,currentDeck.dateCreated,receiver,false)
            }
            catch(e){
                console.log(e)
                res.json({
                    error:e.toString(),
                    success:false
                })
                return
            }
            res.json({
                success:true
            })
        }
    })
    .patch(async(req,res) => {          //   AJAX   /:id    patch       updating a deck
        let deckId=undefined;let newDeckName=req.body.name; let newDeckSubject=req.body.subject; let username=undefined;
        let deckToEdit=undefined;
        try{
            deckId=validation.checkId(req.params.id)
            username=validation.checkUsername(req.session.user.username)
            deckToEdit=await decks.getDeckById(username,deckId)
            if(newDeckName) {           //this style allows for only part of the form to be filled out and have it still work.
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
            deckName:newDeckName,
            deckSubject:newDeckSubject,
            success:true
        })
    })
    .delete(async(req,res) => {             //   AJAX   /decks/:id  delete route. Deleting a deck
        let id=undefined; let username=undefined; 
        try{
            id=validation.checkId(req.params.id)
            username=validation.checkUsername(req.session.user.username)
            await decks.deleteDeck(username,id)
        }
        catch(e){
            console.log(e)
            res.json({
                success:false,
                error:e
            })
            return
        }
        res.json({
            success:true
        })
    })

router
    .route('/:id/:cardNumber')
    .get(async(req,res) => {     //  /yourpage/decks/:id/:cardNumber     get route.  Seeing a card
        if(!req.body) {res.sendStatus(400); return;}
        let username=undefined; let cards=undefined; let deckId=req.params.id;
        try{
            username=validation.checkUsername(req.session.user.username)
            deckId=validation.checkId(deckId);
            card=await decks.getCard(username,deckId,req.params.cardNumber)
            deck=await decks.getDeckById(username,deckId)
            cards=deck.cards
        }
        catch(e){
            console.log(e)
            if(!cards) res.status(500).send("Internal Server Error (GET /yourpage/decks/:id/:cardNumber)")
            return
        }
        res.render(path.resolve('views/cards-pages/card.handlebars'),{
            title:card.front,
            cardFront:card.front,
            cardBack:card.back,
            cardNumber:card.number,
            id:deckId,
            deckName:deck.name
        })
    })
    .patch(async(req,res) => {      //   AJAX   /yourpage/decks/:id/:cardNumber     patch route. Updating a card
        if(!req.body) {res.sendStatus(400); return;}
        let deckId=undefined; let front=req.body.front; let back=req.body.back; let username=undefined;
        let deck=undefined; let isFrontSame=false;
        try{
            deckId=validation.checkId(req.params.id)
            username=validation.checkUsername(req.session.user.username)
            deck=await decks.getDeckById(username,deckId)
            if(front) front=validation.checkCard(req.body.front,'front')
            else {
                front=deck.cards[req.params.cardNumber].front;
                isFrontSame=true        //so it won't throw an error if you don't rename the front
            }
            if(back) back=validation.checkCard(req.body.back,'back')
            else back=deck.cards[req.params.cardNumber].back
            await decks.editCard(username,deckId,Number.parseInt(req.params.cardNumber),front,back,isFrontSame)
        }
        catch(e){
            console.log(e)
            res.json({
                cardFront:front,
                cardBack:back,
                errorMessage:e.toString(),
                success:false
            })
            return
        }
        res.json({
            cardFront:front,
            cardBack:back,
            success:true
        })
    })
    .delete(async(req,res) => {     //   AJAX   /yourpage/decks/:id/:cardNumber     delete route. Deleting a card
        if(!req.body) {res.sendStatus(400); return;}
        let deckId=undefined; let username=undefined;
        try{
            deckId=validation.checkId(req.params.id)
            username=validation.checkUsername(req.session.user.username)
            await decks.deleteCard(username,deckId,Number.parseInt(req.params.cardNumber))
        }
        catch(e){
            console.log(e)
            res.json({
                errorMessage:e,
                success:false
            })
            return
        }
        res.json({
            success:true
        })
    })
module.exports=router