const session = require('express-session');
const mongo = require('mongoose');
const connectMongo = require('connect-mongo');
const debug = require('debug')('shecodes:session');

// Session backend DB connectivity configuration
const mongoDomain = "mongodb://127.0.0.1";
const comp = process.env.COMPUTERNAME;
const sessConnStr = mongoDomain + "/lab9-sess-" + comp;
const sessionConnect = mongo.createConnection();
const MongoStore = connectMongo(session);

debug("Initializing session");

// Provide session creation middleware as the module output
module.exports = secret => {
    return session({
        name: 'lab9.sid',
        secret: secret,
        resave: false, // must be defined - otherwise there will be 'deprecated' warning
        saveUninitialized: true, // must be defined - otherwise there will be 'deprecated' warning
        rolling: true,
        store: new MongoStore({mongooseConnection: sessionConnect}),
        cookie: {maxAge: 900000, httpOnly: true, sameSite: true}
    });
};

// Closure to connect session backend to the DB in background
(async () => { // Closure to allow await functionality for Promise based async functions
    try { // connect session backend to Mongo DB
        debug("Pending connection to Session DB:");
        await sessionConnect.openUri(sessConnStr);
        debug("Connected to Session DB:" + sessConnStr);
        try {
            await sessionConnect.dropDatabase();
            debug("Session DB dropped");
        } catch (err) {
            debug("Failed to drop Session DB: " + err);
        }
    } catch (err) {
        debug("Error connecting to Session DB:" + err);
        process.exit(0);
    }
})();
