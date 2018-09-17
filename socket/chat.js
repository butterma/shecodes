const debug = require('debug')("shecodes:socket");
var Chat = require('../model/chat');
var siofu = require('socketio-file-upload');
//var redis = require('socket.io-redis');

module.exports = (app, io) => {
    const chat = io.of("/chat");
//app.use(siofu.router);
    // "Globals"
    const defaultRoom = 'Web';
    const rooms = ["Web", "Android", "Python", "Data analysis", "Career"];

    chat.on('error', error => { debug('Chat error ' + error); });
  
    chat.on('connection', socket => {
        
        //var uploader = new siofu();
        //uploader.dir = "/uploads";
        //uploader.listen(socket);

        socket.on('disconnect', () => { debug("socket disconnect: " + socket.id); });

        //socket.set('transports', ['websocket']);
        let req = socket.handshake;
        let currentRoom = undefined;
        debug("socket connection: " + socket.id + " - " + JSON.stringify(req.headers.cookie));

        if (!req.headers.cookie) {
            debug("Unauthorized connection!");
            socket.disconnect(true);
            return;
        }

        function isLogin() {
            if (req.headers.cookie) debug("Checking user: " + req.headers.cookie);
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
        socket.on('join', (data) => {
            
    chat.clients((error, clients) => {
        if (error) throw error;
        debug(clients);
      });
            if (!isLogin()) {
                debug("socket login: " + req.headers.cookie + " - " + JSON.stringify(data));
                //Emit the rooms array
                debug("socket login response - sending: " + JSON.stringify(rooms));
               // fn({ rooms: rooms });
                //New user joins the room
                currentRoom = data.room;
                socket.join(currentRoom);
                //Tell all those in the room that a new user joined
                debug('emit in ' + currentRoom + ", joined: " + JSON.stringify(data));
                socket.to(currentRoom).emit('joined', data);
            } else {
               // fn({ rooms: [] });
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
                    let msg = await Chat.CREATE({
                        username: data.user,
                        content: data.message,
                        room: currentRoom,
                        created: new Date(),
                        file: data.file,
                        fileName: data.fileName
                    });
                    debug('emit in ' + currentRoom + ", message: " + JSON.stringify(msg));
                    socket.to(currentRoom).emit('message', msg)
                    
                    // to one room
                    // socket.to('others').emit('an event', { some: 'data' });

                    // to multiple rooms
                    // socket.to('room1').to('room2').emit('hello');

                    // a private message to another socket
                    // socket.to(/* another socket id */).emit('hey');

                    // WARNING: `socket.to(socket.id).emit()` will NOT work, as it will send to everyone in the room
                    // named `socket.id` but the sender. Please use the classic `socket.emit()` instead.

                    
                } catch (err) {
                    debug("Failed saving chat message: ", err);
                }
            }
        });

        socket.on('updateLikes', async data => {
            Chat.update(data);
        })

        socket.on('typing', (data) => {
            socket.broadcast.in(data.room).emit('typing', { data: data, isTyping: true });
        });
    });

    chat.clients((error, clients) => {
        if (error) throw error;
        debug(clients);
      });

    //By implementing the Redis Adapter:
    //io.adapter(redis({ host: 'localhost', port: 6379 }));
    // you can then emit messages from any other process to any channel
    /*var io = require('socket.io-emitter')({ host: '127.0.0.1', port: 6379 });
    setInterval(function(){
          io.emit('time', new Date);
        }, 5000);*/
};
