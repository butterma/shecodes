const mongo = require('mongoose');
const debug = require('debug')("shecodes:chat");

var schema = new mongo.Schema({
        created: Date,
        content: String,
        username: String,
        room: String,
        file: Buffer,
        likes: Array,
        dislikes:Array
    });

    schema.statics.CREATE=async function (chat) {
        debug(chat);
        return this.create(chat);
     };
    
     schema.statics.UPDATE=async function (chat) {
         return this.update(chat);
     };
   

debug("Chat model created");
module.exports=mongo.model('Chat',schema);

