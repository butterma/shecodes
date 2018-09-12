var express = require('express');
var nodemailer=require('nodemailer');
var async=require('async');
var crypto=require('crypto');
var User=require('../model/user');
var debug=require('debug')('shecodes:users');

//***********for uploading an image*************/
var multer  = require('multer');
var storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function (re, file, cb) {
    cb(null,'user' + Date.now() +'.' + file.mimetype.slice(6))}})
var upload = multer({ storage: storage });
//**********************************************/

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
router.get('/logout',function(req,res){
  if(req.session){
  req.session.destroy();
  }
  debug("in logout");
  res.json("logout success");
});

router.get('/', async(req, res)=> {
  debug("in get");
 users=await User.REQUEST();
 debug(users);
 res.json(users);
});

router.get('/:id',async(req,res)=>{
  debug("in get id");
  let user= await User.REQUEST(req.params.id);//,(err,user)=>{
  debug(user);  
  if(user)
      res.json(user);
    else
     debug(err);
  });

router.get('/byname/:username',async(req,res)=>{
  debug("in get name"+req.params.username);
  let user=await User.REQUEST_BY_NAME(req.params.username);
  debug(user);
  if(user)
  res.json(user);
  else
  debug(err);
});

router.post('/signup',upload.single('image'),async(req, res) =>{
  debug("in post signup, user: ");
  let user=new User(req.body);
  console.log("try");
  if (!user.image)
    user.image = req.file.path.slice(6);
  console.log(user);
  console.log("image: " + user.image);
  
  user.save()
    .then(user=>{
      res.status(200).json({'user':'Signup successfully'});
    })
    .catch(err=>{
      debug(err);
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
      res.status(200).json({'status':'Login successfully','user':user.username,'role':user.role});
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
         console.log("reset");
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

router.get('/delete/:id',function(req,res){
  User.findByIdAndRemove({_id:req.params.id},(err,user)=>{
    if(err)
      res.json(err);
      else
      res.json('Removed Successfully');
  });
});

router.post('/update/:id',async(req,res)=>{

  debug(req.session);
  User.findById(req.params.id,(err,user)=>{
    if(!user)
    return next(new Error('Could not load Document'));
    else{
      debug(user);
      user.role=req.body.role;
      user.branch=req.body.branch;
      user.course=req.body.course;
      user.approved=req.body.approved;

      user.save().then(user=>{
        res.json('Update done');
      }).catch(err=>{
        res.status(400).send('Update failed');
      });
    }
  });
});

router.post('/addForum/:username',async(req,res)=>{
  debug('in add forum '+req.params.username);
  let user=await User.REQUEST_BY_NAME(req.params.username);
  if(!user)
    return next(new Error('Could not find user: '+req.params.username));
  else{
    user.forums.push(req.body.forum);
    debug(user);
    user.save().then(user=>{
      res.json('update done');
    }).catch(err=>{
      res.status(400).send(err);
    });
  }
});
//module.exports=router;

// facebook -------------------------------

        // send to facebook to do the authentication
        router.get('/auth/facebook', passport.authenticate('facebook', { scope : ['public_profile', 'email'] }));

        // handle the callback after facebook has authenticated the user
        router.get('/auth/facebook/callback',
            passport.authenticate('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));


    // google ---------------------------------
/*    router.get('/auth/google', 
    passport.authenticate('google', {scope: ['profile', 'email']})
);

app.get('/auth/google/callback', 
    passport.authenticate('google', {
        successRedirect: '/profile',
        failureRedirect: '/fail'
    })
);*/
        // send to google to do the authentication
        router.get('/auth/google', passport.authenticate('google', 
          { scope :['profile','email']})
        );

        // the callback after google has authenticated the user
       
        router.get('/auth/google/callback', function(req,res,next){
          passport.authenticate('google',function(err,user,info) {
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
                 debug(req);
                  res.status(200).json({'user':user.username});
            });
          })(req,res,next);
        });
return router;
}
//module.exports = router,passport;
