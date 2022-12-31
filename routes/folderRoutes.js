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

module.exports=router