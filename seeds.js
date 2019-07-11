var mongoose = require('mongoose');
var Campground = require('./models/campground');
var Comment = require('./models/comment');

var data = [
	{title: 'cheese' ,
	 image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQbZFxc2DTyk66Nm7U-CJtEhw76Qxb6oHJxB2XAa4WXYuzSTsiLA',
	description: 'This’ll be gouda: the Westin Hotel is bringing back its cheesy take on classic high tea'},
	{title: 'mac and cheese' ,
	 image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPTMSntDlyu9BaCbyundpKcrQqTHFCjbUS74mQ57zKtHF8MkpD',
	description: 'This creamy macaroni and cheese is way out of boxed mac and cheese’s league. And if you’re looking for an easy mac and cheese recipe to satisfy your comfort food craving, it doesn’t get any easier/cheesier than this: 25 minutes, simple pantry ingredients, and just one pot.'},
	{title: 'cheese stick' ,
	 image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7sCvG9E1BnKIkwDul_3nO3x5SIIhYMz2WxttYyFpKrl3zU0bP',
	description: 'Making homemade cheese sticks could not be easier! It is important to purchase cheese strings and not just mozzarella as the cheese strings will not melt as quickly as regular cheese will. The cornstarch mixture is a bit messy and can feel like a lot but this really keeps the cheese inside.'},
];

function seedDB(){
	Campground.remove({}, function(err){
	if(err){
		console.log(err);
	}
	console.log('remove campground');
		// add new campgrounds
		data.forEach(function(seed){
		Campground.create(seed, function(err, campground){
		if(err){
			console.log(err);
		}else{
			console.log('add a campground');
			// add a new comment
			Comment.create(
				{
				text: 'This is one of my favorite food, although it is not healthy',
				author: 'Penny'
				}, function(err, comment){
					if(err){
						console.log(err);
					}
					else{
						campground.comments.push(comment);
					    campground.save();
						console.log('create a new comment');
					}
				}
			);
		
		}	
	    });
	    });
	});
}
module.exports = seedDB;
				 
				 
				 
				 
		
				 
				 
				 