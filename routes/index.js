var express = require('express');
var router = express.Router({mergeParams: true});
var passport = require('passport');
var User = require('../models/user');
var middleware = require('../middleware'); 
var Campground = require('../models/campground');
var async = require('async');
var nodemailer = require('nodemailer');
var crypto = require('crypto');

router.get('/', function(req, res){
	res.render('landing');
});
//===================
//AUthen Routes
//===================

// show register
router.get('/register', function(req, res){
	res.render('register', {page: 'register'});
});
// handle register logic
router.post('/register', function(req, res){
	var newuser = new User(
		{username: req.body.username,
		 firstName: req.body.firstName,
		 lastName: req.body.lastName,
		 avatar: req.body.avatar,
		 email: req.body.email,
		 isAdmin: false
		 });
	if (req.body.admincode === 'birthday78'){
		newuser.isAdmin = true;
		}
	User.register(newuser, req.body.password, function(err, user){
		if(err){
           console.log(err);
           return res.render("register", {error: err.message});
        }
		passport.authenticate('local')(req, res, function(){
			req.flash('success', 'Welcome to the YelpCamp '+user.username);
			// user refers to the user in the User.register function
			res.redirect('/campground');
		});
	});
});

//===================
//Login Route
//====================

//show login form
router.get('/login', function(req, res){
	res.render('login', {page: 'login'});
});

// handling login logic
// app.post('/login, middleware, callback)
router.post('/login', passport.authenticate('local',{
	successRedirect: '/campground',
	failureRedirect: '/login'
}),function(req, res){
	
});


// Logout
router.get('/logout', function(req, res){
	req.logout();
	req.flash('success', 'You have logged out');
	res.redirect('/campground');
});

//USER PROFILE
router.get('/users/:id', function(req, res){
	User.findById(req.params.id, function(err, founduser){
		if(err || !founduser){
			req.flash('error', 'User not found');
			return res.redirect('back');
		}
		Campground.find().where('author.id').equals(founduser._id).exec(function(err, campgrounds){
			if(err || !founduser){
			req.flash('error', 'User not found');
			return res.redirect('back');
		}
				res.render('users/show', {user: founduser, campgrounds: campgrounds});
																				});
	});
});

// Forget Password
router.get('/forgot', function(req, res){
	res.render('forgot');
});

router.post('/forgot', function(req, res,next){
	async.waterfall([
		function(done){
			crypto.randomBytes(20, function(err, buf){
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		
		function(token, done){
			User.findOne({email: req.body.email}, function(err, user){
				if(!user){
					req.flash('error', 'No account with that email address exists');
					return res.redirect('/forgot');
				}
				
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
				
				user.save(function(err){
					done(err, token, user);
				});
			});
		},
		function(token, user, done){
			var smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth: {
					user: 'superwong0216@gmail.com',
					pass : 'daydayupWZW0216'
				}
			});
			var mailOptions = {
				to: user.email,
				from: 'superwong0216@gmail.com',
				subject: 'Node.js Password Reser',
				text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
			};
		
		smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
	],function(err) {
    if (err) {
		return next(err);
	}
    res.redirect('/forgot');
    });
   });

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});


router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          });
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'superwong0216@gmail.com',
          pass: 'daydayupWZW0216'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'superwong0216@mail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campground');
  });
});










module.exports = router;