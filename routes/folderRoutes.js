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
        let folders=undefined; let username=undefined;
        try{
            username=validation.checkUsername(req.session.user.username)
            folders=await users.getUsersFolders(username)
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
        let folderName=undefined; let username=undefined;
        let newFolder=undefined; let yourFolders=undefined; let newFolderId=undefined;
        try{
            folderName=validation.checkFolderName(req.body.name)
            username=validation.checkUsername(req.session.user.username)
            yourFolders=await users.getUsersFolders(username)
            newFolder=await folders.createFolder(username,folderName)
            newFolderId=validation.checkId(newFolder._id.toString())
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
            title:newFolder.name,
            name:newFolder.name,
            id:newFolderId,
            folder:yourFolders,
            userName:username,
            success:true
        })
    })

router
    .route('/:id')      //      single folder route
    .get(async(req,res) => {    //      /yourpage/folders/:id   get route.  Getting a single folder
        if(!req.body) {res.status(400); return}
        let username=undefined; let decksInFolder=undefined; let folderId=undefined;
        let folder=undefined;
        try{
            username=validation.checkUsername(req.session.user.username)
            folderId=validation.checkId(req.params.id)
            folder=await folders.getFolderById(username,folderId)
            decksInFolder=folder.decks
        }
        catch(e){
            console.log(e)
            return
        }
        //for each deck id in the folder, get its respective deck
        decksInFolder=decksInFolder.map((deck) => {return decks.getDeckById(username,deck._id)})
        res.render(path.resolve('views/folders-pages/singleFolder.handlebars'),{
            title:folder.name,
            deck:decksInFolder,
            folderName:folder.name
        })
    })
    .patch(async(req,res) => {          //change folder name
        if(!req.body) {res.sendStatus(400); return;}
        let folderId=undefined; let username=undefined; let newFolderName=undefined;
        try{
            username=validation.checkUsername(req.session.user.username)
            folderId=validation.checkId(req.params.id)
            folder=await folders.getFolderById(username,folderId)
            newFolderName=validation.checkFolderName(req.body.newFolderName)
            await folders.editFolder(username,folderId,newFolderName)
        }
        catch(e){
            console.log(e)
            res.json({
                title:"Could not rename folder",
                id:folderId,
                errorMessage:e.toString(),
                success:false
            })
            return
        }
        res.json({
            title:newFolderName,
            id:folderId,
            folderName:newFolderName,
            success:true
        })
    })
    .delete(async(req,res) => {         //      /yourpage/folders/:id    delete route. Delete a single folder.
        let id=undefined;
        try{id=validation.checkId(req.params.id)}
        catch(e){
            console.log(e)
            res.json({
                success:false,
                error:e
            })
            return
        }
        try{
            let username=validation.checkUsername(req.session.user.username)
            await folders.deleteFolder(username,id)
        }
        catch(e){
            console.log(e)
            return
        }
        res.json({
            success:true
        })
    })

module.exports=router