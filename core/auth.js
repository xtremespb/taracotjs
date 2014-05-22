var ObjectId = require('mongodb').ObjectID;

module.exports = function(app){

	var auth = {
		check : function(req, callback) {
			if (typeof req.session == 'undefined' || typeof req.session.user_id == 'undefined') {
				callback(false);
				return;
			}
			if (!req.session.user_id.match(/^[a-f0-9]{24}$/)) {
				callback(false);
				return;
			}
			var collection = app.get('mongodb').collection('users');
			app.get('mongodb').collection('users').find( { _id : new ObjectId(req.session.user_id) }, { limit : 1 }).toArray(function(err, items) {
				if (typeof items != 'undefined' && !err) {					
					if (items.length > 0) {
						callback(items[0]);
						return;
					}
				}
				callback(false);
				return;
			});
		}
	};

	return auth;

};