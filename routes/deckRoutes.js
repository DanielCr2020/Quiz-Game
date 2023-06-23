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
    .get(async(req,res) => {        //        /yourpage/decks get route.    getting a user's decks
        if(!req.body) {res.sendStatus(400); return}
        let userId,yourDecks,username;
        try{
            userId=validation.checkId(req.session.user.userId)
            username=validation.checkUsername(req.session.user.username)
            yourDecks=await users.getUsersDecks(userId)
        }
        catch(e){
            console.log(e)
            if(!yourDecks) res.status(500).send(`Internal Server Error (GET /yourpage/decks)\nError:${e.toString()}`)
            return
        }       //get request gets everything on the page. We only need to render.
        res.render(path.resolve('views/decks-pages/decks.handlebars'),{title:`${username}'s decks`,deck:yourDecks,userName:username})
    })
    .post(async(req,res) => {      //   AJAX    /yourpage/decks post route (when you make a new deck)
        if(!req.body) {res.sendStatus(400); return;}
        let name,subject,userId,newDeck,newDeckId;
        try{
            userId=validation.checkId(req.session.user.userId);
            name=validation.checkDeckName(req.body.name);
            subject=validation.checkSubject(req.body.subject);
        }
        catch(e){       //bad request data
            console.log(e)
            res.json({
                title:"Invalid input",
                success:false,
                error:e.toString()
            }).status(400)
            return 
        }
        try{
            newDeck=await decks.createDeck(userId,name,subject,false)
            newDeckId=newDeck._id
        }
        catch(e){
            console.log(e)
            res.json({
                title:"Cannot create deck",
                success:false,
                error:e.toString()
            }).status(e.includes('already') ? 400 : 500)        //send the correct status code based on error message
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
        let userId;
        try{
            userId=validation.checkId(req.session.user.userId)
        }   
        catch(e){
            console.log(e)
            res.json(e).status(400);
            return
        }
        if(req.body.sortBy){
            let userDecks;
            try{
                userDecks=await users.getUsersDecks(userId)
            }
            catch(e){
                console.log(e)
                res.json({success:false,error:e}).status(500)
                return
            }
                                                //gets id, name, subject, and date created from decks. All sortable things
            let extractedDeckInfo=userDecks.map((deck)=>{return {id:deck._id,name:deck.name,subject:deck.subject,date:deck.dateCreated}})
            extractedDeckInfo=extractedDeckInfo.filter((deck)=>{ 
                return req.body.decksOnPage.includes(deck.name)||req.body.decksOnPage.includes(deck.subject)}
            )
            let sortedDecks;
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
                foundDecks=await users.getUsersDecks(userId)
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
    .get(async(req,res) => {                //      /yourpage/decks/:id    get     showing a user's decks (singleDeck)
        if(!req.body) {res.sendStatus(400); return}
        let userId,deckId,deck,username,sender;
        try{
            userId=validation.checkId(req.session.user.userId)
            deckId=validation.checkId(req.params.id)
            username=await users.getUsernameFromId(userId);
            deck=await decks.getDeckById(deckId)
            if(deck.sentBy){
                sender = await users.getUsernameFromId(deck.sentBy);
            }
        }
        catch(e){
            console.log(e)
            if(!deck) res.status(500).send("Internal Server Error (GET /yourpage/decks/:id)")
            return
        }
        res.render(path.resolve('views/decks-pages/singleDeck.handlebars'),{
            title:deck.name,
            id:deckId,
            creator:username,
            deckName:deck.name,
            deckSubject:deck.subject,
            dateCreated:deck.dateCreated,
            public:deck.public,
            card:deck.cards,
            sender:sender,
            sentBy: sender ? true : false
        })
    })
    .post(async(req,res) => {           //   AJAX   /:id        post route  (making a new card)   or sending deck to another user
        if(!req.body) {res.sendStatus(400); return;}
        let front, back, userId, newCard, deckId;
        userId=validation.checkId(req.session.user.userId)
        deckId=validation.checkId(req.params.id)
        if(!req.body.sendDeck) {            // creating a new card
            try{            //validation
                front=validation.checkCard(req.body.front,"front")
                back=validation.checkCard(req.body.back,"back")
                newCard=await decks.createCard(deckId,front,back)
            }
            catch(e){
                console.log(e)
                res.status(400).json({
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
            try{
                let username=validation.checkUsername(req.body.user);
                let recipientId=await users.getUserIdFromName(username)
                deckId=validation.checkId(req.params.id)
                currentDeck=await decks.getDeckById(deckId)            //inserting the same deck with all the same info
                await decks.sendDeckToUser(deckId,userId,recipientId)
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
        let deckId,userId,deckToEdit; let newDeckName=req.body.name; let newDeckSubject=req.body.subject;
        try{
            deckId=validation.checkId(req.params.id)
            userId=validation.checkId(req.session.user.userId)
            deckToEdit=await decks.getDeckById(deckId)
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
            await decks.editDeck(userId,deckId,newDeckName,newDeckSubject,req.body.public)
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
        let id,userId;
        try{
            id=validation.checkId(req.params.id)
            userId=validation.checkId(req.session.user.userId)
            await decks.deleteDeck(userId,id)
        }
        catch(e){
            console.log(e)
            res.json({
                success:false,
                error:e
            }).status(500)
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
        let deckId,cardNumber;
        try{
            deckId=validation.checkId(req.params.id);
            deck=await decks.getDeckById(deckId)
            cardNumber=validation.checkCardNumber(deck,req.params.cardNumber)
            card=await decks.getCard(deckId,cardNumber)
        }
        catch(e){
            console.log(e)
            res.status(500).send("Internal Server Error (GET /yourpage/decks/:id/:cardNumber)")
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
        let deckId=undefined; let front=req.body.front; let back=req.body.back;
        let deck=undefined; let isCardSame=0;   //0: neither same. 1: front same. 2: back same. 3: front+back same
        let cardNumber=req.params.cardNumber;
        try{
            deckId=validation.checkId(req.params.id)
            deck=await decks.getDeckById(deckId)
            if(front){
                front=validation.checkCard(front,'front')
                if(front.toLowerCase()==deck.cards[cardNumber].front.toLowerCase()) {
                    isCardSame=1        //so it won't throw an error if you don't rename the front
                }
            } 
            else {
                front=deck.cards[cardNumber].front;
                isCardSame=1;
            } 
            if(back){
                back=validation.checkCard(back,'back')
                if(back.toLowerCase()==deck.cards[cardNumber].back.toLowerCase()) {
                    isCardSame+=2        //so it won't throw an error if you don't rename the front
                }
            } 
            else{
                back=deck.cards[cardNumber].back
                isCardSame+=2
            } 
            await decks.editCard(deckId,Number.parseInt(cardNumber),front,back,isCardSame)
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
        let deckId,cardNumber;
        try{
            deckId=validation.checkId(req.params.id)
            let deck=await decks.getDeckById(deckId);
            cardNumber=validation.checkCardNumber(deck,req.params.cardNumber);
            await decks.deleteCard(deckId,cardNumber)
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