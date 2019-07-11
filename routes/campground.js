var express = require('express');
var router = express.Router({mergeParams: true});
var Campground = require('../models/campground');
var middleware = require('../middleware'); // you don't need to weite as /middleware/index.js, because index.js is a special file, it will be acquired automatically
var Review = require("../models/review");
var Comment = require('../models/comment');

var NodeGeocoder = require('node-geocoder');
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dm39gnnhd', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});




//INDEX -show all campgrounds
router.get('/',  function(req, res){
	var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
	var noMatch = null;
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		// res.render('campground', {campground: campground});
    // Get all campgrounds from DB
	Campground.find({title: regex}, function(err, allCampground){
			
		if(err){
			console.log('There is err in allcampground');
		}
		else{
			if(allCampground.length < 1){
				noMatch = "No campgrounds match that query, please try again.";
			}
			res.render('campgrounds/index', {campground: allCampground, page:'campground', noMatch: noMatch});
		}
	});	
	   }else{
		Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec( function(err, allCampground){
		 Campground.count().exec(function (err, count) {
			 if(err){
			console.log('There is err in allcampground');
		}
			 else{
			res.render('campgrounds/index', {campground: allCampground, 
											 page:'campground', noMatch: noMatch,
											 current: pageNumber,
                                            pages: Math.ceil(count / perPage)});
			 }
			
			 });	
	});
		}
});



//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
  // get data from form and add to campgrounds array
  var title = req.body.campground.title;
  var image = req.body.campground.image;
  var imageId = req.body.campground.imageId;
  var desc = req.body.campground.description;
  var price = req.body.campground.price;
  var author = req.body.campground.author;
  // var comments = req.body.campground.comments;
  // var likes = req.body.campground.likes;
  // var rating = req.body.campground.rating;
  // var reviews = req.body.campground.reviews;
	
author =  {
      id: req.user._id,
      username: req.user.username
  };
   geocoder.geocode(req.body.location, function (err, data) {

	cloudinary.uploader.upload(req.file.path, function(result) {
      // add cloudinary url for the image to the campground object under image property
      image = result.secure_url;
	  imageId = result.public_id ;
 
      if (err || !data.length) {
        req.flash('error', 'Invalid address');
        return res.redirect('back');
      }
      
      var lat = data[0].latitude;
      var lng = data[0].longitude;
      var location = data[0].formattedAddress;
      var newCampground = {title:title, price: price, image: image, imageId: imageId,description: desc, author:author, location: location, lat: lat, lng: lng };
      
      // Create a new campground and save to DB
      Campground.create(newCampground, function(err, newlyCreated){
        if(err){
          console.log(err);
        } else {
          //redirect back to campgrounds page
          console.log(newlyCreated);
          res.redirect("/campground");
        }
      });
    });
	   
  });
});

// NEW- show form to create a new comment
router.get('/new', middleware.isLoggedIn, function(req, res){
	res.render('campgrounds/new');
});

// SHOW -show more info about a campground
router.get('/:id', middleware.isLoggedIn, function(req, res){
	Campground.findById(req.params.id).populate('comments likes').populate({
		path: "reviews",
        options: {sort: {createdAt: -1}}
	})
		.exec(function(err, allcampground){
		if(err || !allcampground){
			req.flash('error', 'Campground not found');
			res.redirect('back');
		}
		else{
			console.log(allcampground);
			res.render('campgrounds/show', {campground: allcampground});
		}
	});
});

//Edit Campground
router.get('/:id/edit', middleware.checkCampgroundOwnship,function(req, res){
	// Check if the user is loggedin 
	    // dose the user won the campground
	    // otherwise direct to other place
	// if the user is not loggedin , redirect to other place	
	Campground.findById(req.params.id, function(err, foundcamp){
		res.render('campgrounds/edit', {campground: foundcamp});
	});
	});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnship,  upload.single('image'), async function(req, res){
	// delete req.body.campground.rating;
	 Campground.findById(req.params.id, async function (err, campground) {
    if (err) {
      req.flash("error", err.message);
      res.redirect("back");
    } else {
           geocoder.geocode(req.body.location, async function (err, data) {
              if (err) {
                req.flash('error', 'Error');
                console.log(err);
                 }
             campground.lat = data[0].latitude;
             campground.lng = data[0].longitude;
             campground.location = data[0].formattedAddress;
 
            if (req.file) {
                 try {
                 await cloudinary.v2.uploader.destroy(campground.imageId);
                 var result = await cloudinary.v2.uploader.upload(req.file.path);
                 campground.imageId = result.public_id;
                 campground.image = result.secure_url;
                 } 
				catch (err) {
                 req.flash("error", err.message);
                  return res.redirect("back");
          }
        }
           campground.title= req.body.title;
           campground.description = req.body.description;
           campground.save();
           req.flash("success", "Successfully Updated!");
           res.redirect("/campground/" + campground._id);
         });
							}
  

});
	});
	
	
	

//Delete
// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnship, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            res.redirect("/campground");
        } else {
            // deletes all comments associated with the campground
            Comment.remove({"_id": {$in: campground.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/campground");
                }
                // deletes all reviews associated with the campground
                Review.remove({"_id": {$in: campground.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/campground");
                    }
                    //  delete the campground
                    campground.remove();
                    req.flash("success", "Campground deleted successfully!");
                    res.redirect("/campground");
                });
            });
        }
    });
});


// Campground Like Route
router.post("/:id/like", middleware.isLoggedIn, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        if (err) {
            console.log(err);
            return res.redirect("/campground");
        }

        // check if req.user._id exists in foundCampground.likes
        var foundUserLike = foundCampground.likes.some(function (like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            foundCampground.likes.pull(req.user._id);
        } else {
            // adding the new user like
            foundCampground.likes.push(req.user);
        }

        foundCampground.save(function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/campground");
            }
            return res.redirect("/campground/" + foundCampground._id);
        });
    });
});






function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}


module.exports = router;
