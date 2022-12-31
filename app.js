const express=require('express')
const app=express()
const static=express.static(__dirname+'/public')
const session=require('express-session')
const configRoutes=require('./routes')
const connection=require('./config/mongoConnection')
const exphbs=require('express-handlebars')
const decks=require('./data/decks')
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
    let doesOwn=undefined; let id=undefined; let username=undefined;
    try{
        id=validation.checkId(req.params.id)
        username=validation.checkUsername(req.session.user.username)
        doesOwn=await decks.getDeckById(username,id)   //if getDeckById for a username throws, the user does not have that deck
    }
    catch(e){
        console.log("You don't own that deck")
        return res.redirect('/yourpage/decks')
    }
    res.ignore=true
    next()
})
app.use('/yourpage/decks/:id', async (req,res,next) => {     //if the id in the url does not belong to the user's decks (the deck was made by another user, or the deck is invalid)
    if (!req.session.user) {
        return res.redirect('/')
    }
    if(!res.ignore) {   //used for when we are at a card route. If we are, we have already verified ownership. We need to therefore ignore to avoid issues.
        let id=req.params.id
        let username=req.session.user.username
        try{
            id=validation.checkId(id)
            username=validation.checkUsername(username)
        }
        catch(e){
            console.log(e)
        }
        try{
            doesOwn=await decks.getDeckById(username,id)    //if getDeckById for a username throws, the user does not have that deck
        }
        catch(e){
            console.log("You do not own that deck")
            return res.redirect('/yourpage/decks')
        }
        next()
    }
    else{
        next()
    }
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