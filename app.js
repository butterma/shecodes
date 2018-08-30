var createError = require('http-errors');
var express = require('express');
const path = require('path')
,cors=require('cors');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var favicon =require('serve-favicon');
var mongoose=require('mongoose');
const debug = require('debug')('shecodes:app');

var mongoose=require('mongoose');
var passport=require('passport');
var flash=require('connect-flash');
var bodyParser=require('body-parser');
var session=require('express-session');

//var siofu=require('socketio-file-upload');

var configDB=require('./config/database.js');
require('./config/passport')(passport);

mongoose.connect(configDB.url, {useNewUrlParser: true});


module.exports = async (server) => {
  let app = express();
  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  app.use(cors());
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  
<<<<<<< HEAD
  //app.use(siofu);
  let secret='iloveshecodesorganization';
  app.use(cookieParser(secret));
=======
>>>>>>> c49c56052d1dc4c69eedce14c230b5ab98b6c95a
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));
 
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  
  var usersRouter = require('./routes/users')(passport);
  var indexRouter = require('./routes/index');
  var chatRouter = require('./routes/chat');
  
  app.use('/', indexRouter);
  app.use('/users', usersRouter);
  app.use('/chat', chatRouter);
  
  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    next(createError(404));
  });
  
  // Add basic middleware to express
  app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.gif')));
  app.use(logger('dev')); // Log every http message (even favicon request)

  
  let secret='iloveshecodesorganization';
  // example for inline express middleware logging - adding session middleware
  app.objSession = session(secret);
  app.use((req, res, next) => {
      app.objSession(req, res, function () {
          debug(req);
          debug("Session middleware: " + !!req.session + " ID=" + req.sessionID);
          next();
      });
  });


  // Parsing middleware: cookies, json and url-encoded body
  app.cookieParser = cookieParser(secret);
  app.use(app.cookieParser);
  app.use(express.json());
  app.use(express.urlencoded({extended: false})); 
  app.use(session({
    secret:secret,
    resave:true,
    saveUninitialized:true,
    cookie: {maxAge:900000, httpOnly:true,sameSite:true }
  }));

  // Static content middleware
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/chat', express.static(path.join(__dirname, 'chat', 'dist', 'chat')));

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
      let err = new Error(`Not Found: ${req.url}`);
      err.status = 404;
      //debug(err);
      next(err);
  });

  // error handler
  app.use(function (err, req, res) {
      // set locals, only providing error in development
      debug(req.app.get);
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      //debug(err);
      res.render('error');
  });

  return app;
};
