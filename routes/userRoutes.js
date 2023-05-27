const express=require('express')
const router=express.Router()
const path=require('path')
const users=require('../data/users')
const decks=require('../data/decks')
const validation=require('../validation')

router
    .route('/')
    .get(async (req,res) => {           //homepage route
        let isLoggedIn=false; let username=undefined;
        if(req.session.user) {
            isLoggedIn=true
            username=validation.checkUsername(req.session.user.username)
        }
        res.render(path.resolve("views/startPage.handlebars"),{title:"Quiz Game",loggedIn:isLoggedIn,username:username})
    })

router
    .route('/register')
    .get(async (req,res) => {           //register page
        res.render(path.resolve('views/register.handlebars'),{title: "Register"})
    })
    .post(async (req,res) => {
        let createdUser=false
        try{
            let username=validation.checkUsername(req.body.usernameInput)
            let password=validation.checkPassword(req.body.passwordInput,false)
            createdUser=await users.createUser(username,password)
        }
        catch(e){       //if the user puts in bad data
            res.render(path.resolve('views/register.handlebars'),{errorMessage:e,title:"Registration error"})
            res.status(400)
            console.log(e)
            return
        }
        if(!createdUser){
            res.status(500).send("Internal server error (POST /register)")
            return
        }
        res.redirect('/')
    })

router
    .route('/login')
    .get(async (req,res) => {               //get login page
        res.render(path.resolve('views/login.handlebars'),{title: "Login"})
    })
    .post(async (req,res) => {          //  post /login     logging in
        let check=false
        let username=false; let password=false;
        try{
            username=validation.checkUsername(req.body.usernameInput,false)
            password=validation.checkPassword(req.body.passwordInput,true)
            check=await users.checkUser(username,password)
        }
        catch(e){     //if the user puts in bad data
            res.render(path.resolve('views/login.handlebars'),{errorMessage:e,title:"Login error"})
            res.status(400)
            console.log(e)
            return
        }
        if(!check.authenticatedUser){
            res.status(500).send("Internal Server Error (POST /login)")
            return
        }
        if(check.authenticatedUser){
            req.session.user={username:username, userId:check.userId}
            res.redirect('/yourpage')
        }
    })

router
    .route('/yourpage')
    .get(async (req,res) => {              //user's homepage
        let u=validation.checkUsername(req.session.user.username)
        res.render(path.resolve('views/private.handlebars'),{
            username:u,
            title:u+"'s page"
        })
    })

router
    .route('/logout')
    .get(async (req,res) => {               //logging out
        if(!req.session.user) res.redirect('/')
        req.session.destroy()
        res.redirect('/')
    })
        //public deck routes
router
    .route('/publicdecks')
    .get(async(req,res) => {        //getting public decks (not logged in)
        let publicDecks=undefined
        try{
            publicDecks=await decks.getPublicDecks()
        }
        catch(e){
            console.log(e)
            res.status(500).send("Internal server error (GET /publicdecks)")
            return
        }
        res.render(path.resolve('views/decks-pages/publicDecks.handlebars'),{
            title:"Public decks",
            publicDeck:publicDecks,
            loggedIn:req.session.user ? true : false
        })
    })
    .patch(async(req,res) => {           // searching public decks
        let publicDecks=undefined;
        try{
            publicDecks=await decks.getPublicDecks()
        }
        catch(e){
            console.log(e)
            res.status(500).send("Internal server error (POST /publicdecks)")
            return
        }
        if(req.body.searchPublicDecks){
            if(req.body.searchByName!==' '){
                publicDecks=publicDecks.filter((deck)=> {
                    return deck.name.toLowerCase().includes(req.body.searchByName.toLowerCase())
                })
            }
            if(req.body.searchBySubject!==' '){
                publicDecks=publicDecks.filter((deck) => {
                    return deck.subject.toLowerCase().includes(req.body.searchBySubject.toLowerCase())
                })
            }
            if(req.body.searchByCreator!==' '){
                publicDecks=publicDecks.filter((deck) => {
                    return deck.creator.includes(req.body.searchByCreator.toLowerCase())
                })
            }
        }
        res.json({
            decksFound:publicDecks,
            loggedIn:req.session.user ? true : false,
            success:true
        })
    })
router
    .route('/publicdecks/:id')
    .get(async(req,res) => {        //single public deck (not logged in)
        let publicDecks=undefined; let publicDeck=undefined; let deckId=undefined;
        try{
            deckId=validation.checkId(req.params.id)
            publicDecks=await decks.getPublicDecks()
            publicDeck=publicDecks.filter((deck) => {return deck._id.toString()===deckId.toString()})[0]
        }
        catch(e){
            console.log(e)
            res.status(500).send("Internal server error (GET /publicdecks/:id)")
            return
        }
        res.render(path.resolve('views/decks-pages/singlePublicDeck.handlebars'),{
            title:publicDeck.name+" (public)",
            publicDeck:publicDeck,
            loggedIn:req.session.user ? true : false
        })
    })
    .post(async(req,res) => {           //saving a public deck          (only possible when you are logged in)
        let publicDeck=undefined; let id=undefined; let username=undefined;
        try{
            id=validation.checkId(req.params.id)
            username=validation.checkUsername(req.session.user.username)
            publicDeck=await decks.getDeckByOnlyId(id)
            await decks.createDeck(publicDeck.creator,publicDeck.name,publicDeck.subject,false,publicDeck.cards,publicDeck.dateCreated,username,true)
            //if(username) username=validation.checkUsername(username)
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
            publicDeckName:publicDeck.name,
            success:true
        })
    })
module.exports = router;