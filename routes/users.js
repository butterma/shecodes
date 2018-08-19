var express = require('express');
var nodemailer=require('nodemailer');
var async=require('async');
var crypto=require('crypto');
var User=require('../model/user');
var debug=require('debug')('shecodes:users');
var transporter=nodemailer.createTransport({
  service:'gmail',
  secure:'false',
  auth:{
    user: 'shecodes18@gmail.com',
    pass:'shecodes2018'
  },
  tls: {
    rejectUnauthorized:false
  }
});
module.exports = function(passport){
var router = express.Router();
/* GET users listing. */

router.get('/', function(req, res, next) {
  res.send('respond with a resource');
 /*User.REQUEST((err,users)=>{
   if(err)
      debug(err);
  else
  res.json(users);
 });*/
});

router.get('/:id',function(req,res){
  /*User.REQUEST(req.params.id,(err,user)=>{
    if(err)
      debug(err);
    else
      res.json(user);
  });*/
});

router.post('/signup',function(req,res){
  let user=new User(req.body);
  user.save()
    .then(user=>{
      res.status(200).json({'user':'Signup successfully'});
    })
    .catch(err=>{
      res.status(400).send('Failed to create new record');
    });
});

/*login*/
router.post('/login',function(req,res,next){
  passport.authenticate('local-login',function(err,user,info){
  //debug(res.req.user.approved);
  if(err){
    debug("error");
    return next(err);
  }
  if(!user){
    debug("user not find");
    return res.status(400).json({message:'authentication failed-user name or password is incorrect '});
  }
  req.login(user,loginErr=>{
    if(loginErr){
      return next(loginErr);
    }
   // if(res.req.user.approved){
      debug("approved");
      res.status(200).json({'user':'Login successfully'});
   // }else{
   //   debug("user not approved");
   //   res.status(404).send("User not approvrd yet");
   // }
  });
})(req,res,next);  
});

router.post('/sendMail',function(req,res){
  console.log("mail "+req.body.email);
  async.waterfall([
     function(done) {
       crypto.randomBytes(20, function(err, buf) {
         var token = buf.toString('hex');
         done(err, token);
       });
     },
     function(token, done) {
         console.log("find user: "+req.body.email);
         User.findOne({ 'username': req.body.email }, function(err, user) {
           if (!user) {
               console.log("cant find user");
             req.flash('error', 'No account with that email address exists.');
             return res.redirect('/forgot');
           }
           console.log("set token "+token);
           user.resetPasswordToken = token;
           user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
           console.log (`${JSON.stringify(user)}`)
           user.save(function(err) {
             done(err, token, user);
           });
         });
       },
     function(token, user, done) {
     var mailOptions = {
     from: 'shecodes18@gmail.com',
     to: req.body.email,
     subject: 'Reset your password',
     html:'<h3>Reset password</h3></br><h5>Please click link below to reset your password</h5></br><a href="http://localhost:4200/reset/' + token + '\n\n">Reset</a>'
   };
   transporter.sendMail(mailOptions, function(error, info){
     if (error) {
         console.log("there is an error");
       console.log(error);
     } else {
       console.log('Email sent: ' + info.response);
     }
   });
}
  ],
  function(err){
  });
  res.send("");
 });

router.get('/reset/:token',function(req,res){
 console.log("get reset");
 User.findOne({ 'resetPasswordToken': req.params.token, 'resetPasswordExpires': { $gt: Date.now() } }, function(err, user) {
     if (!user) {
         console.log("can't find user "+req.params.token+" user:"+req.user);
       req.flash('error', 'Password reset token is invalid or has expired.');
       return res.redirect('/forgot');
     }
     res.render('reset', {user: req.user });
   });
});
router.post('/reset/:token',function(req,res){
 async.waterfall([
     function(done) {
       User.findOne({'resetPasswordToken': req.body.token,'resetPasswordExpires': { $gt: Date.now() } }, function(err, user) {
         if (!user) {
             console.log("can't find user");
           req.flash('error', 'Password reset token is invalid or has expired.');
           return res.redirect('back');
         }
 
         user.password = req.body.password;
         user.resetPasswordToken = undefined;
         user.resetPasswordExpires = undefined;
 
         user.save(function(err) {
           req.logIn(user, function(err) {
             done(err, user);
           });
         });
       });
     }
 // res.render('reset');
  ], function(err) {
     res.redirect('/');
   });
});
//module.exports=router;
return router;
};
//module.exports = router,passport;
