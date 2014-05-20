module.exports = function(mongoose) {

	var user_schema = new mongoose.Schema({
	  username: {
	    type: String,
	    unique: true,
	    required: true,
	    lowercase: true, 
	    trim: true
	  },
	  realname: {
	    type: String,
	    required: false,
	    trim: true
	  },
	  email: {
	    type: String,
	    unique: true,
	    required: true,
	    lowercase: true, 
	    trim: true
	  },
	  password: {
	    type: String,
	    required: true
	  },
	  status: {
	    type: Number, 
	    min: 0, 
	    max: 2
	  },
	  regdate: { 
	  	type: Date, 
	  	default: Date.now 
	  }
	});
	
	return user_schema;

}