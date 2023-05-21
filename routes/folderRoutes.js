const express=require('express')
const router=express.Router()
const path=require('path')
const users=require('../data/users')
const decks=require('../data/decks')
const folders=require('../data/folders')
const validation=require('../validation')

router
    .route('/')
    .get(async(req,res) => {            //      /yourpage/folders   get route.  Getting all folders
        if(!req.body) {res.status(400); return}
        let folders,userId,username;
        try{
            userId=validation.checkId(req.session.user.userId)
            username=validation.checkUsername(req.session.user.username)
            folders=await users.getUsersFolders(userId)
        }
        catch(e){
            console.log(e)
            return
        }
        res.render(path.resolve('views/folders-pages/folders.handlebars'),{
            title:"folders",
            folder:folders,
            userName:username
        })
    })
    .post(async(req,res) => {       //      /yourpage/folders       post route.     Creating a folder
        if(!req.body) {res.status(400); return}
        let folderName,userId,newFolder,newFolderId
        try{
            folderName=validation.checkFolderName(req.body.name)
            userId=validation.checkId(req.session.user.userId)
            newFolder=await folders.createFolder(userId,folderName)
            newFolderId=newFolder._id       //checks id after folder was made
        }
        catch(e){
            console.log(e)
            res.json({
                title:"Cannot create folder",
                success:false,
                error:e.toString()
            })
            return;
        }
        res.json({
            name:newFolder.name,
            id:newFolderId,
            success:true
        })
    })

router
    .route('/:id')      //      single folder route
    .get(async(req,res) => {    //      /yourpage/folders/:id   get route.  Getting a single folder
        if(!req.body) {res.status(400); return}
        let userId,decksInFolder=[],folderId,folder,userDecks
        try{            //getting decks in that folder
            userId=validation.checkId(req.session.user.userId)
            folderId=validation.checkId(req.params.id)
            folder=await folders.getFolderById(userId,folderId)
            userDecks=await users.getUsersDecks(userId)
            decksInFolder=folder.decks
        }
        catch(e){
            console.log(e)
            return res.json(e).status(500)
        }
        //for each deck id in the folder, get its respective deck
        decksInFolder=await Promise.all(decksInFolder.map(async deckId => {
            let decc;
            try{
                decc=await decks.getDeckById(deckId)
            }
            catch(e){
                console.log(e)
                res.send(e).status(500);
            }
            return decc})
        )

        res.render(path.resolve('views/folders-pages/singleFolder.handlebars'),{
            title:folder.name,
            deck:userDecks,
            deckInFolder:decksInFolder,
            folderName:folder.name,
            dateCreated:folder.dateCreated
        })
    })
    .post(async(req,res) => {           //  /yourpage/folders/:id   post route.     Adding a deck to a folder
        if(!req.body) {res.status(400); return}
        let userId,folderId,deckToAddName,deckToAdd
        try{
            userId=validation.checkId(req.session.user.userId)
            folderId=validation.checkId(req.params.id)
            deckToAddName=validation.checkDeckName(req.body.deckToAddName)
            deckToAdd=await decks.getDeckByName(userId,deckToAddName)
            await folders.addDeckToFolder(userId,folderId,deckToAdd._id)
        }
        catch(e){
            console.log(e)
            res.json({
                title:"Cannot add deck",
                error:e.toString(),
                success:false
            })
            return
        }
        res.json({
            id:deckToAdd._id,
            deckName:deckToAddName,
            subject:deckToAdd.subject,
            success:true
        })
    })
    .patch(async(req,res) => {          //  /yourpage/folders/:id  patch route.  change folder name
        if(!req.body) {res.sendStatus(400); return;}
        let folderId,userId,newFolderName;
        try{
            userId=validation.checkId(req.session.user.userId)
            folderId=validation.checkId(req.params.id)
            folder=await folders.getFolderById(userId,folderId)
            newFolderName=validation.checkFolderName(req.body.newFolderName)
            await folders.editFolder(userId,folderId,newFolderName)
        }
        catch(e){
            console.log(e)
            res.json({
                errorMessage:e.toString(),
                success:false
            })
            return
        }
        res.json({
            folderName:newFolderName,
            success:true
        })
    })
    .delete(async(req,res) => {         //      /yourpage/folders/:id    delete route. Delete a single folder. Or remove deck from folder
        let folderId=req.params.id; let userId=req.session.user.userId; let deckToRemove=undefined;
        try{
            folderId=validation.checkId(folderId)
            userId=validation.checkId(userId)
        }
        catch(e){
            console.log(e)
            res.json({
                success:false,
                error:e.toString()
            })
            return
        }
        if(req.body.removeDeck){            // if we are removing a deck from a folder
            let deckToRemoveName=undefined;
            try{
                deckToRemoveName=validation.checkDeckName(req.body.deckToRemoveName)
                deckToRemove=await decks.getDeckByName(userId,deckToRemoveName)
                await folders.removeDeckFromFolder(userId,folderId,deckToRemove._id)
            }
            catch(e){
                console.log(e)
                res.json({success:false,error:e.toString()})
                return
            }
            let deckList=req.body.deckList;     //deck list html
            deckList=deckList.split('<li>')     //splits it to an array based on li
            let dName=deckToRemove.name;
            let dSubject=deckToRemove.subject;          //filter out the deck to remove.    Update html on page
            deckList=deckList.filter((deck) => {return !(deck.includes(`">${dName}</a>`) && deck.includes(` - [Subject]: ${dSubject}`))}).join('<li>')
            res.json({
                newDeckList:deckList,
                success:true
            })
        }
        else{           //      if we are deleting a folder
            try{
                await folders.deleteFolder(userId,folderId)
            }
            catch(e){
                console.log(e)
                res.json({success:false,error:e.toString()})
                return
            }
            res.json({success:true})
        }
    })

module.exports=router