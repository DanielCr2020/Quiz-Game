const express=require('express');
const router=express.Router();
const path=require('path')
const users=require('../data/users')
const decks=require('../data/decks')
const validation=require('../validation')
/*
    structure for routes:
    /yourpage/study -> drop down for deck and quiz type
    /yourpage/study/matching
    /yourpage/study/quiz

    /yourpage/study/results
*/
router
    .route('/')                                 //      /yourpage/study     Main studying page
    .get(async(req,res) => {                //      /   get route      
        if(!req.body) res.sendStatus(400);
        let username=undefined; let userDecks=undefined;
        try{
            username=validation.checkUsername(req.session.user.username)
            userDecks=await decks.getUsersDecks(username);
        }
        catch(e){
            if(!userDecks) res.status(500).send("Internal server error (GET /yourpage/study)")
            console.log(e)
            return
        }
        res.render(path.resolve('views/study-pages/studyPage.handlebars'),{title:"Study page",userName:username,deck:userDecks})
    })

    .post(async(req,res) => {       //      /   post route      Submitting form to pick quiz
        //console.log(req.body)
        res.redirect(`/yourpage/study/${req.body.pickQuiz}/${req.body.pickDeck}`)
    })

router
    .route('/matching/:id')
    .get(async(req,res) => {
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