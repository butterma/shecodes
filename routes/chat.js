var express = require('express');
var async=require('async');
const debug = require('debug')('shecodes:chat-route');
const Chat = require('../model/chat');

module.exports = function(){
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
router.get('/:room',function (req,res){
    debug('in get by room');
    if (!req.session /*|| !req.session.user*/) {
        res.json("not logged on");
        res.json([]);
        return;
    }
    debug('INFO: msgs authorized');
    try {
        //Find
        debug("looking for room: "+req.params.room);
        msgs = /*await*/ Chat.find({room:req.params.room}).exec();
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
    debug("in post like/id");
    Chat.findById(req.params.id,(err,msg)=>{
        debug('find message to add like');
        if(!msg)
        return next(new Error('Could not load Document'));
        else{
          
          msg.likes.push(req.params.username);
          debug('pushed a like');
    
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
        debug('find message to add dislike');
        if(!msg)
        return next(new Error('Could not load Document'));
        else{
          msg.dislikes.push(req.params.username); 
          debug('pushed a dislike');   
          msg.save().then(msg=>{
            res.json('Update chat done');
          }).catch(err=>{
            res.status(400).send('Update chat failed');
          });
        }
      });
    });

    return router;
}
