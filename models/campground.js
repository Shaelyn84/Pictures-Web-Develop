var mongoose = require('mongoose');


//schema set up
var campgroundSchema = new mongoose.Schema({
	title: String,
	price: String,
	image: String,
	imageId: String,
	description: String,
	location: String,
	lat: Number,
	lng: Number,
	createdAt: {type: Date, default:Date.now},
	author:{
	    id:{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		},
		username: String
	},
	comments: [
		{type: mongoose.Schema.Types.ObjectId,
		ref: 'Comment'// name of the model
		}
	],
	likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
	reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    rating: {
        type: Number,
        default: 0
    }

});

var Campground = mongoose.model('Campground', campgroundSchema);

module.exports = Campground;