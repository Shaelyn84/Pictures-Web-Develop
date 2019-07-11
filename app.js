require('dotenv').config();

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Campground = require('./models/campground');
var Comment = require('./models/comment'); var User = require('./models/user');
var seedDB = require('./seeds');
var Comment = require('./models/comment');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var User = require('./models/user');
var methodOverride = require('method-override');
var flash = require('connect-flash');

// require routes
var commentRoutes = require('./routes/comment');
var campgroundRoutes = require('./routes/campground');
var indexRoutes = require('./routes/index');
var reviewRoutes= require("./routes/reviews");



mongoose.connect('mongodb://0.0.0.0/yelp_camp_v12', {useNewUrlParser:true});

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));   // add the '/' before public , not after dirname
//seedDB();   // seed the database
app.use(methodOverride('_method'));
app.use(flash());

app.locals.moment = require('moment');

// PASSPORT CONFIGUTATION
app.use(require('express-session')({
	secret: 'My neck hurts',
	resave: false,
	saveUnitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// it will pass itself to every method
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash('error');
	res.locals.success = req.flash('success');
	next();
});


app.use(indexRoutes);
app.use('/campground', campgroundRoutes);
app.use('/campground/:id/comments', commentRoutes);
app.use("/campground/:id/reviews", reviewRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT,function(){
    console.log(`Our app is running on port ${ PORT }`);
});


//  app.listen(process.env.PORT, process.env.IP, function(){
//   console.log('Movie Sever has started!');
//   });

// var port = process.env.PORT || 3000;
// var ip = process.env.IP || "127.0.0.1"; 

// app.listen(port,() =>{
// 	console.log('Sercer listening on port 3000');
// });

