const express=require('express')
const router=express.Router()
const path=require('path')
const users=require('../data/users')
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
    .post(async (req,res) => {          //  logging in
        let check=false
        let username=false; let password=false;
        try{
            username=validation.checkUsername(req.body.usernameInput)
            password=validation.checkPassword(req.body.passwordInput)
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
module.exports = router;