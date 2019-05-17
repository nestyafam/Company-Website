var nodemailer = require ('nodemailer');
var smtpTransport= require ('nodemailer-smtp-transport');
var async = require ('async');

var crypto = require ('crypto');
var user = require ('../models/user');
var Company = require ('../models/company');
var secret = require ('../secret/secret');




module.exports = (app, passport) =>{


    app.get ('/', (req, res, next) => {
        if (req.session.cookie.originalmaxAge !==null){
            res.redirect('/home')
        }else {
            Company.find({}, (err,result)=>{
             res.render ('index', {title: 'index || website1', data:result});
            })
        }
    });    

    app.get ('/signup', (req,res) => {
        var errors = req.flash('error');
        res.render ('users/signup',{title: 'signup || website1', messages: errors, hasErrors: errors.length >0});
    
      
    });



    app.post ('/signup',validate, passport.authenticate('local.signup',{
        successRedirect :'/',
        failureRedirect: '/signup',
        failureflash : true
    }));
    

    app.get ('/login', (req,res) => {
        var errors = req.flash('error')
        console.log(errors)
        res.render ('users/login', {title: 'login || website1', messages: errors, hasErrors: errors.length >0});
    
      
    });
       
    app.post ('/login',validateLogin,passport.authenticate('local.login',{
       // successRedirect :'/home',
        failureRedirect: '/login',
        failureflash : true
    }), (req,res) =>{
        if(req.body.rememberme){
            req.session.cookie.maxAge = 30*24*60*60*1000
        }
        else{req.session.cookie.expires = null;

    }
    res.redirect('/home');
});

    app.get ('/home',isLoggedIn, (req,res) =>{
        res.render ( 'home', {title: 'Home|| website1', user : req.user });
    });

    app.get('/forgot', (req,res)=>{
        var errors = req.flash ('error');
        var info = req.flash ('info')
        res.render('users/forgot', {title:'request for password reset' ,messages: errors,  hasErrors: errors.length >0, info: info ,noErrors: info.length >0})
    });

    app.get('/auth/facebook',passport.authenticate ('facebook',{scope: 'email'}));

    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect : '/home',
        failureRedirect : '/login',
        failureFlash:true,
    }));

    app.post ('/forgot',(req, res, next)=>{
        async.waterfall ([
            function (callback){
                crypto.randomBytes(20, (err, buf) => {
                    var rand = buf.toString('hex');
                    callback(err,rand)

                });
            },
            function (rand, callback){
                user.findOne({'Email': req.body.email}, (err, user) =>{
                    if (!user){
                        req.flash('error', 'No account with that email exist');
                        return res.redirect ('/forgot');
                    }

                    user.passwordResetToken = rand;
                    user.passwordResetExpires = Date.now () + 60*60*1000;

                    user.save((err) =>{
                        callback(err, rand, user)
                    });
                })
            },
            function (rand,user, callback ){
              var smtpTransport = nodemailer.createTransport({
                  service :'Gmail',
                  host: "nestyafam@gmail.com",
                  port:1234,
                  secure: false,
                  auth : {
                      user :secret.auth.user,
                      pass :secret.auth.pass,
                  }


                });
                var mailOptions = {
                    to : user.email,
                    from : 'website1 '+'<'+secret.auth.user+'>',
                    subject : 'website1 Password Reset Token',
                    text : ' You have requested for password Request Token \n\n '+
                    'please click on the link to complete process:\n\n'+
                    'http://localhost:/reset'+rand + '\n\n'
                }

                smtpTransport.sendMail(mailOptions ,(err, response) => {
                    req.flash('info',' A password reset Token has been sent to' +user.email);
                    return callback(err, user)
                });


            }


        ], (err)=>{
            if (err){
                return next (err)
            }

            res.redirect('./forgot');

        });

    });

    app.get('/reset/:token', (req,res) =>{
       user.findOne ({passwordResetToken: req.params.token, passwordResetExpires: {$gt: Date.now()}},
        (err, user) =>{
            if (!user){
                req.flash('error','Password reset token has expired or is invalid ');
            return res.redirect('/reset/'+ req.params.token);
        } 
        var errors = req.flash('error');
        var success = req.flash('success')
        res.render('user/reset',{title: 'reset your password', messages: errors, hasErrors: errors.length >0, success :success, noErrors: success.length > 0  });
          });
    });
     
    app.post('/reset/:token' ,(req, res) =>{
        async.waterfall([
            function (callback){
                user.findOne ({passwordResetToken: req.params.token, passwordResetExpires: {$gt: Date.now()}},
                 (err, user) =>{
                    if (!user){
                     req.flash('error','Password reset token has expired or is invalid ');
                    return res.redirect('/reset/'+ req.params.token);
                } 
            req.checkBody('password','Password is required').notEmpty();
            req.checkBody('password', 'password must not be less than 5').isLength({min:5})
            // req.checkBody("password", "password must contain at least one number.") .matches("1,2,3,4,5,6,7,8,9,0,@!#$%^&");
        
       var errors = req.validationErros();
            if (req.body.password == req.body.cpassword){
                if (errors){
                    var messages = [];
                    errors.forEach((error) => {
                        messages.push(error.msg);

                    });

                    var errors = req.Flash('error');
                    res.redirect('/reset/' + req.params.token);

                }else {
                    user.password = user.encryptPassword(req.body.password);
                    user.passwordResetTtoken = undefined;
                    user.passwordResetExpires = undefined;

                    user.save ((err) => {
                        req.flash('success','your password has been successfully updated');
                        callback(err, user)
                    });

                }

           }else {
                req.flash('error', 'Password and comfirm password are not the same ');
                res.redirect('/reset/'+ req.params.token);
       

            };
    
               //  res.render('user/reset',{title: 'reset your password', messages: errors, hasErrors: errors.length >0});
       });
    },

            function(user, callback){
                var smtpTransport = nodemailer.createTransport({
                    service :'Gmail',
                    host: "nestyafam@gmail.com",
                    port:1234,
                    secure: false,
                    auth : {
                        user :secret.auth.user,
                        pass :secret.auth.pass,
                    }
  
  
                  });
                  var mailOptions = {
                      to : user.email,
                      from : 'website1 '+'<'+secret.auth.user+'>',
                      subject : 'Your password has been updated',
                      text : 'This is a confirmation that you updated the password for' + user.email
                  }
                  smtpTransport.sendMail(mailOptions ,(err, response) => {
                 callback(err, user);
                  
                    var error = req.flash('error');
                    var success = req.flash('success');

                    res.render('user/reset',{title: 'reset your password', messages: error, hasErrors: error.length >0, success :success, noErrors: success.length > 0 });
                 
                });


                      
            }
        ])
    })
     
    app.get('/logout', (req,res) =>{
     req.logout  ();
     req.session.destroy((err)=>{
     res.redirect('/')
        });
    });

};

function validate( req,res,next){
    req.checkBody('fullname','Fullname is required') .notEmpty();
    req.checkBody('fullname', 'Fullname must not be less than 5') .isLength({min:5});
    req.checkBody('email','email is rquired').notEmpty();
    req.checkBody('email', 'email must be valid').isEmail();
    req.checkBody('password','Password is required').notEmpty();
    req.checkBody('password', 'password must not be less than 5').isLength({min:5})
   // req.checkBody("password", "password must contain at least one number.") .matches("1,2,3,4,5,6,7,8,9,0,@!#$%^&");


    var errors = req.validationErrors();
    if(errors){
        var messages = [];
        errors.forEach ((error) =>{
            messages.push(error.msg);
        });

        req.flash('error',messages);
        res.redirect('/signup');
    
    }


    else{
        return next();
    };
};

function validateLogin(req, res, next){
    req.checkBody('email','email is rquired').notEmpty();
    req.checkBody('email', 'email must be valid').isEmail();
    req.checkBody('password','Password is required').notEmpty();
    req.check("password", "password must contain at least one number.") .matches("1,2,3,4,5,6,7,8,0,@!#$%^&");


    var Loginerrors = req.validationErrors();
    if(Loginerrors){
        var messages = [];
        Loginerrors.forEach ((error) =>{
            messages.push(error.msg);
        });

        req.flash('error',messages);
        res.redirect('/login');
    
    }

    else{
        return next();
    };
};

function isLoggedIn(req,res,next){
    if (req.Authenticated()){
        next()
    }else{
        res.redirect('/')
    }
}