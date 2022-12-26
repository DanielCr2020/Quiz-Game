const userRoutes=require('./userRoutes')
const deckRoutes=require('./deckRoutes')

const constructorMethod = (app) => {
    app.use('/yourpage/decks',deckRoutes)
    app.use('/',userRoutes)
    app.use('*',(req,res) => {
        res.status(404).json({error: "Not Found!"})
    })
}

module.exports=constructorMethod;