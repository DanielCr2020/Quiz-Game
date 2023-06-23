const express=require('express')
const app=express()
const static=express.static(__dirname+'/public')
const session=require('express-session')
const configRoutes=require('./routes')
const connection=require('./config/mongoConnection')
const exphbs=require('express-handlebars')
const decks=require('./data/decks')
const folders=require('./data/folders')
const validation=require('./validation')

app.use('/public',static)
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.engine('handlebars', exphbs.engine({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(            //authentication middleware
    session({
        name:'AuthCookie',
        secret: "Oh the middleware, everybody wants to be my checkId",
        resave: false,
        saveUninitialized: true,
        cookie: {maxAge: 1800000}
    })
)

app.use('/yourpage', (req, res, next) => {     //redirect to home if not authenticated
    if (!req.session.user) {
        return res.redirect('/')
    } else {
      next();
    }
  });
app.use('/yourpage/decks/:id/:cardNumber', async(req,res,next) => {         //cards middleware
    if (!req.session.user) {
        return res.redirect('/')
    } 
    let deckId,userId,deck;
    try{
        deckId=validation.checkId(req.params.id)
        userId=validation.checkId(req.session.user.userId)
        deck=await decks.getDeckById(deckId);
    }
    catch(e){
        console.log(e)
        return res.redirect('/yourpage/decks')
    }
    if(deck.creatorId.toString()!==userId.toString()){
        console.log("You don't own that deck")
        return res.redirect('/yourpage/decks')
    }
    res.ignore=true
    next()
})
//checks if the user owns that deck
app.use('/yourpage/decks/:id', async (req,res,next) => {     //if the id in the url does not belong to the user's decks (the deck was made by another user, or the deck is invalid)
    if (!req.session.user) {
        return res.redirect('/')
    }
    if(!res.ignore) {   //used for when we are at a card route. If we are, we have already verified ownership. We need to therefore ignore to avoid issues.
        let deckId=req.params.id
        let userId=req.session.user.userId
        let deck;
        try{        //validating input
            deckId=validation.checkId(deckId)
            userId=validation.checkId(userId)
            deck=await decks.getDeckById(deckId);
        }
        catch(e){
            console.log(e)
            return res.redirect('/yourpage/decks')
        }
        if(deck.creatorId.toString()!==userId.toString()){
            console.log("You don't own that deck")
            return res.redirect('/yourpage/decks')
        }
        next()
    }
    else{
        next()
    }
})
//checks if the user owns that folder
app.use('/yourpage/folders/:id', async(req,res,next) => {
    if (!req.session.user) {
        return res.redirect('/')
    }
    let folderId=req.params.id
    let userId=req.session.user.userId
    try{            //validating input
        folderId=validation.checkId(folderId)
        userId=validation.checkId(userId)
    }
    catch(e){
        console.log(e)
    }
    try{            //checking ownership    
        doesOwn=await folders.getFolderById(userId,folderId)    //if getFolderById for a userId throws, the user does not own that folder
    }
    catch(e){
        console.log(e)
        console.log("You do not own that folder")
        return res.redirect('/yourpage/folders')
    }
    next()
})
//checks if the user owns that deck in the quiz section
app.use('/yourpage/study/*/:id', async(req,res,next) => {
    if(!req.session.user){
        return res.redirect('/')
    }
    let deckId=req.params.id
    let userId=req.session.user.userId
    let deck;
    try{            //validating input
        deckId=validation.checkId(deckId)
        userId=validation.checkId(userId)
        deck=await decks.getDeckById(deckId)    //if getDeckById for a username throws, the user does not own that deck
    }
    catch(e){
        console.log(e)
    }
    if(deck.creatorId.toString()!==userId.toString()){
        console.log("You don't own that deck")
        return res.redirect('/yourpage/study')
    }
    next()
})

app.use('/login', (req, res, next) => {
    if (req.session.user) {
        return res.redirect('/yourpage');
    } else {
        next();
    }
});
app.use('/register', (req, res, next) => {
    if (req.session.user) {
        return res.redirect('/yourpage');
    } else {
        next();
    }
});

app.use( async (req,res,next) => {          //logging middleware, runs on every route
    //log method it is, URL, and if the user is authenticated
    let start=(new Date().toUTCString()+" "+req.method+" "+req.originalUrl)
    if(req.session.user){
        console.log(start+" (Authenticated User)")
    }
    else {
        console.log(start+" (Non authenticated user)")
    }
    next()
})

configRoutes(app);
const main=async() => {
    const db = await connection.dbConnection();
}

app.listen(3000, () => {
    console.log("Your routes are running on http://localhost:3000");
})
main()