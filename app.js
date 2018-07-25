var createError = require('http-errors');
var express = require('express')
,cors=require('cors')
,app=express();
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var favicon =require('serve-favicon');
var mongoose=require('mongoose');
app.use(cors());
//var app = express();

var mongoose=require('mongoose');
var passport=require('passport');
var flash=require('connect-flash');
var bodyParser=require('body-parser');
var session=require('express-session');

var configDB=require('./config/database.js');
require('./config/passport')(passport);

mongoose.connect(configDB.url);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));

app.use(session({
  secret:'iloveshecodesorganization',
  resave:true,
  saveUninitialized:true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

var usersRouter = require('./routes/users')(passport);
var indexRouter = require('./routes/index');

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
