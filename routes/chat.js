var express = require('express');
var async=require('async');
const debug = require('debug')('shecodes:chat-route');
const Chat = require('../model/chat');
var router = express.Router();

    router.get('/', async (req, res) => {
        debug('INFO: msgs' + JSON.stringify(req.query));
        if (!req.session /*|| !req.session.user*/) {
            res.json("not logged on");
            res.json([]);
            return;
        }
        debug('INFO: msgs authorized');
        try {
            //Find
            msgs = await Chat.find({'room': req.query.room}).exec();
            debug('Got from chat DB');
            if (msgs instanceof Array) {
                res.json(msgs);
                return;
            }
        } catch (err) {
                debug('Error getting from chat DB: ' + JSON.stringify(err));
        }
        res.json([]);
    });

    router.get('/rooms/:room',async (req,res) =>{
        debug("in get by room");
        if (!req.session /*|| !req.session.user*/) {
            res.json("not logged on");
            res.json([]);
            return;
        }
        debug('INFO: msgs authorized');
        try {
            //Find
            debug("looking for room: " + req.params.room);
            msgs = await Chat.find({room:req.params.room}).exec();
            debug('Got from chat DB: ' + JSON.stringify(msgs));
            if (msgs instanceof Array) {
                res.json(msgs);
                return;
            }
        } catch (err) {
                debug('Error getting from chat DB: ' + JSON.stringify(err));
        }
        res.json([]);
    });

    router.post('/uploads' ,function (req,res) {
        debug("in post file up loader");
        res.json("file uploaded succesfully")
    });

    router.post('/like/:id', async(req,res)=>{
        debug("in post like/id its id: " + req.params.id);
        Chat.findById(req.params.id,(err,msg)=>{
            
            if(!msg)
            debug('couldnt find message to add like');
            else{
            
            msg.likes.push(JSON.parse(req.body.username).user);
            debug('pushed a like to' + JSON.stringify(msg));
        
            msg.save().then(msg=>{
                res.json('Update chat done');
            }).catch(err=>{
                res.status(400).send('Update chat failed');
            });
            }
        });
    });

    router.post('/dislike/:id', async(req,res)=>{
        Chat.findById(req.params.id,(err,msg)=>{  
            if(!msg)
            debug('couldnt find message to add dislike');
            else{
            msg.dislikes.push(JSON.parse(req.body.username).user); 
            debug('pushed a dislike');   
            msg.save().then(msg=>{
                res.json('Update chat done');
            }).catch(err=>{
                res.status(400).send('Update chat failed');
            });
            }
        });
    });


    module.exports = router;
