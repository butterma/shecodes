const debug = require('debug')("shecodes:socket");
//const io = socket.listen(server);
const Chat = require('../model/chat');

module.exports = (app, io) => {
    const chat = io.of("/chat");//should be of instead of require

    // "Globals"
    const defaultRoom = 'general';
    const rooms = ["general", "angular", "socket.io", "express", "node", "mongo"];

    chat.on('error', error => { debug('Chat error ' + error); });

    chat.use((socket, next) => {
        //console.log(socket);
        let req = socket.handshake;
        let res = { end: () => { } };
        app.cookieParser(req, res, () => {
            app.objSession(req, res, function () {
                debug("Chat middleware: " + JSON.stringify(socket.id) + " ID=" + req.sessionID + " user=" + req.session.user);
                next();
            });
        });
    });

    debug("here 3");
    chat.on('connection', socket => {
        //socket.set('transports', ['websocket']);
        let req = socket.handshake;
        let currentRoom = undefined;
        debug("socket connection: " + socket.id + " - " + JSON.stringify(req.session));

        if (!req.session || !req.session.user) {
            debug("Unauthorized connection!");
            socket.disconnect(true);
            return;
        }

        socket.on('disconnect', () => { debug("socket disconnect: " + socket.id); });

        function isLogin() {
            if (req.session) debug("Checking user: " + req.session.user);
            return currentRoom !== undefined;
        }

        socket.on('logout', data => {
            debug("socket logout: " + req.session.user);
            if (isLogin()) {
                socket.leave(currentRoom);
                debug('emit in ' + currentRoom + ", left: " + JSON.stringify(data));
                socket.to(currentRoom).emit('left', data);
                currentRoom = undefined;
            }
        });

        //Listens for new user
        socket.on('login', (data, fn) => {
            if (!isLogin()) {
                debug("socket login: " + req.session.user + " - " + JSON.stringify(data));
                //Emit the rooms array
                debug("socket login response - sending: " + JSON.stringify(rooms));
                fn({ rooms: rooms });
                //New user joins the default room
                currentRoom = data.room = defaultRoom;
                socket.join(currentRoom);
                //Tell all those in the room that a new user joined
                debug('emit in ' + currentRoom + ", joined: " + JSON.stringify(data));
                socket.to(currentRoom).emit('joined', data);
            } else {
                fn({ rooms: [] });
            }
        });

        //Listens for switch room
        socket.on('switch', data => {
            if (isLogin()) {
                debug("socket switch: from " + currentRoom + " to " + data.newRoom);
                if (currentRoom !== data.newRoom) {
                    debug('emit in ' + currentRoom + ", left: " + JSON.stringify(data));
                    socket.to(currentRoom).emit('left', data);
                    socket.leave(currentRoom);
                    currentRoom = data.newRoom;
                    socket.join(data.newRoom);
                    debug('emit in ' + currentRoom + ", joined: " + JSON.stringify(data));
                    socket.to(currentRoom).emit('joined', data);
                }
            }
        });

        //Listens for a new chat message
        socket.on('message', async data => {
            if (isLogin()) {
                //Create message and Save it to database
                debug("socket message: saving");
                try {
                    let msg = await Chat.create({
                        username: data.username,
                        content: data.content,
                        room: currentRoom,
                        created: new Date()
                    });
                    debug('emit in ' + currentRoom + ", message: " + JSON.stringify(msg));
                    socket.to(currentRoom).emit('message', msg)
                } catch (err) {
                    debug("Failed saving chat message: ", err);
                }
            }
        });
    });
};


//from another place (:|)
//https://medium.com/@parthkamaria/building-a-chat-app-with-mean-stack-and-socket-io-c73b012b9fc9

/*
io.sockets.on('connection', (socket) => {
    socket.on('join', (data) => {
        socket.join(data.room);
        chatRooms.find({}).toArray((err, rooms) => {
            if (err) {
                console.log(err);
                return false;
            }
            count = 0;
            rooms.forEach((room) => {
                if (room.name == data.room) {
                    count++;
                }
            });
            if (count == 0) {
                chatRooms.insert({ name: data.room, messages: [] });
            }
        });
    });
    socket.on('message', (data) => {
        io.in(data.room).emit('new message', { user: data.user, message: data.message });
        chatRooms.update({ name: data.room }, { $push: { messages: { user: data.user, message: data.message } } }, (err, res) => {
            if (err) {
                console.log(err);
                return false;
            }
            console.log("Document updated");
        });
    });
    socket.on('typing', (data) => {
        socket.broadcast.in(data.room).emit('typing', { data: data, isTyping: true });
    });
});*/