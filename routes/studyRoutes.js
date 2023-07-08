const express=require('express');
const router=express.Router();
const path=require('path')
const users=require('../data/users')
const decks=require('../data/decks')
const validation=require('../validation')
/*
    structure for routes:
    /yourpage/study -> drop down for deck and quiz type
    /yourpage/study/flashcards
    /yourpage/study/matching
    /yourpage/study/quiz

    /yourpage/study/results
*/
router
    .route('/')                                 //      /yourpage/study     Main studying page
    .get(async(req,res) => {                //      /   get route      
        if(!req.body) res.sendStatus(400);
        let userId,userDecks,username;
        try{
            userId=validation.checkId(req.session.user.userId)
            username=validation.checkUsername(req.session.user.username)
            userDecks=await users.getUsersDecks(userId);
        }
        catch(e){
            if(!userDecks) res.status(500).send("Internal server error (GET /yourpage/study)")
            console.log(e)
            return
        }
        res.render(path.resolve('views/study-pages/studyPage.handlebars'),{title:"Study page",userName:username,deck:userDecks})
    })

    .post(async(req,res) => {       //      /yourpage/study   post route      Submitting form to pick quiz
        res.redirect(`/yourpage/study/${req.body.pickQuiz}/${req.body.pickDeck}`)
    })

router
    .route('/flashcards/:id')
    .get(async(req,res) => {        //      /yourpage/study/flashcards/:id
        let deckId,deck;
        try{
            deckId=validation.checkId(req.params.id)
        }
        catch(e){
            console.log(e)
            res.json({error:"Invalid deck id"}).status(400)
            return
        }
        try{
            deck=await decks.getDeckById(deckId);
        }
        catch(e){
            console.log(e);
            res.send(e).status(500);
        }
        res.render(path.resolve('views/study-pages/flashcardsIntro.handlebars'),{deck:deck,cardCount:deck.cards.length})
    })
    .post(async(req,res) => {
        let deckId;
        try{
            deckId=validation.checkId(req.params.id)
        }
        catch(e){
            console.log(e)
            res.json({error:"Invalid deck id (post)"}).status(400)
            return
        }
        res.redirect(`/yourpage/study/flashcards/${deckId}/0`)
    })

router
    .route('/flashcards/:id/:num')
    .get(async(req,res) => {                //      /yourpage/study/flashcards/:id/:num
        let deckId,deck;
        try{
            deckId=validation.checkId(req.params.id)
        }
        catch(e){
            console.log(e)
            res.json({error:"Invalid deck id"}).status(400)
            return
        }
        try{
            deck=await decks.getDeckById(deckId);
        }
        catch(e){
            console.log(e);
            res.send(e).status(500);
        }
        res.render(path.resolve('views/study-pages/flashcards.handlebars'),{deck:deck})
    })

router
    .route('/matching/:id')
    .get(async(req,res) => {                //      /yourpage/study/matching/:id
        if(!req.body) {res.sendStatus(400); return;}
        let id=undefined; let username=undefined; let deck=undefined;
        try{
            id=validation.checkId(req.params.id)
            username=validation.checkUsername(req.session.user.username)
            deck=await decks.getDeckById(username,id)
        }
        catch(e){
            console.log(e)
            return
        }
        res.render(path.resolve('views/study-pages/matchingGame.handlebars'),{title:"Matching game",deck:deck})
    })

    


module.exports=router;