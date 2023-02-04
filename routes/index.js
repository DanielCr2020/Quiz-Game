const userRoutes=require('./userRoutes')
const deckRoutes=require('./deckRoutes')
const folderRoutes=require('./folderRoutes')
const studyRoutes=require('./studyRoutes')

const constructorMethod = (app) => {
    app.use('/yourpage/decks',deckRoutes)
    app.use('/yourpage/folders',folderRoutes)
    app.use('/yourpage/study',studyRoutes)
    app.use('/',userRoutes)
    app.use('*',(req,res) => {
        res.status(404).json({error: "Not Found!"})
    })
}

module.exports=constructorMethod;