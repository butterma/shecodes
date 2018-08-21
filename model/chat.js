const mongo = require("mongoose");
const debug = require('debug')("shecodes:chat");
const Schema = mongo.Schema;

module.exports = db => {
    debug('Initializing chat model');
    const chatSchema = new Schema({
        created: Date,
        content: String,
        username: String,
        room: String
    });

    db.model('Chat', chatSchema, 'chat');
};
