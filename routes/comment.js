var express = require('express');
var router = express.Router({mergeParams: true});
var Campground = require('../models/campground');
var Comment = require('../models/comment');
var middleware = require('../middleware'); 

//============================================================
// COMMENT ROUTES
//============================================================

// commment new
router.get('/new', middleware.isLoggedIn, function(req, res){
	// find campground by ID
	Campground.findById(req.params.id, function(err, camp){
		if(err){
			console.log(err);
		}else{
			res.render('comments/new', {campground: camp});
		}
	});
});

// comment create
router.post('/', middleware.isLoggedIn, function(req, res){
	// lookup campground using ID
	Campground.findById(req.params.id, function(err, campground){
		if (err){
			console.log(err);
			res.redirect('/campground');
		}
		else{
			// Create new comment
			Comment.create(req.body.comment, function(err, comment){
				if(err){
					console.log(err);
					req.flash('error','Something Went Wrong');
			        res.redirect('/campground');
				   }
		       else{
				   // add the new comment to the comment body
				   console.log('=========');
				   console.log(comment.author.username);
				   comment.author.id = req.user._id;
				   comment.author.username = req.user.username;
				   // save the comment
				   comment.save();
				   campground.comments.push(comment);  // campground here is refered to the parameter of the Comment.create function 
				campground.save();
				   console.log(comment);
				   req.flash('success', 'Successfully Add a Comment');
				res.redirect('/campground/' + campground._id);				   
			   }
			});
		}
	});
});
// be aware when you are doing comments/new, don't forget to add /comments at the end of the action. Because the post you provided in app.js is /campground/:id/comments

//EDIT
router.get('/:comment_id/edit', middleware.checkCommentOwnship ,function(req, res){    // there is no . is comment_id(It's not comment._id)
	Campground.findById(req.params.id, function(err, foundcampground){
		if(err || !foundcampground){
			req.flash('error', 'Campground not found');
			return res.redirect('back');
		}
		Comment.findById(req.params.comment_id, function(err, foundcomment){
		if(err){
			res.redirect('back');
		}
		else{
			res.render('comments/edit', {campground_id: req.params.id, comment: foundcomment});
		}
	});
});	
	});
	
	
	
	


//UPDATE
router.put('/:comment_id', middleware.checkCommentOwnship,function(req, res){
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatecomment){
		if(err){
			res.redirect('back');
		}
		else{
		res.redirect('/campground/' + req.params.id);
			}
	});
	// res.send('You can put now');
});


// Destory
router.delete('/:comment_id',middleware.checkCommentOwnship ,function(req, res){
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err){
			res.redirect('back');
		}
		else{
			req.flash('success', 'Comments deleted');
			res.redirect('/campground/'+ req.params.id);   // it could also be shoen as res.redirect('back)
		}
	});
});



module.exports = router;