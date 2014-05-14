module.exports = function(app) {
	// Set items per page for this module
	var items_per_page = 1;
	// 
	var router = app.get('express').Router();
	var i18nm = new (require('i18n-2'))({    
	    locales: app.get('config').locales,
	    directory: app.get('path').join(__dirname, 'lang'),
	    extension: '.js'
	});
	router.get_module_name = function(req) {
		i18nm.setLocale(req.i18n.getLocale());	
		return i18nm.__("module_name");
	};	
	router.get('/', function(req, res) {
		i18nm.setLocale(req.i18n.getLocale());		
		// Check authorization
		if (!app.get('auth').check(req)) {
			res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
			return;
		}		
		var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'user_control', { lang: i18nm });
		app.get('cp').render(req, res, { body: body }, i18nm, 'users' );			
	});
	router.post('/data/list', function(req, res) {
		var rep = { ipp: items_per_page };
		var skip = req.body.skip;		
		if (typeof skip != 'undefined') {		
			if (!skip.match(/^[0-9]{1,10}$/)) {
				rep.status = 0;
				rep.error = i18nm.__("invalid_query");
				res.send(JSON.stringify(rep));
				return;
			}
		}						
		i18nm.setLocale(req.i18n.getLocale());
		// Check authorization
		if (!app.get('auth').check(req)) {
			rep.status = 0;
			rep.error = i18nm.__("unauth");
			res.send(JSON.stringify(rep));
			return;
		}
		// Get users from MongoDB
		rep.users = [];
		var collection = app.get('mongodb').collection('users');
		var data = app.get('mongodb').collection('users').find().count(function (err, items_count) {			
			if (!err && items_count > 0) {
				rep.total = items_count;
				var data = app.get('mongodb').collection('users').find({}, { skip: skip, limit : items_per_page }).toArray(function(err, items) {			
					if (typeof items != 'undefined' && !err) {
						// Generate array
						for (var i=0; i < items.length; i++) {
							var arr = [];
							arr.push(items[i]._id);
							arr.push(items[i].username);
							arr.push(items[i].realname);
							arr.push(items[i].email);
							arr.push(items[i].status);
							rep.users.push(arr);
						}
					}
					// Return results
					rep.status = 1;
					res.send(JSON.stringify(rep));
				}); // data
			} else { // Error or count = 0
				rep.status = 1;
				rep.total = '0';
				res.send(JSON.stringify(rep));
			}
		});	// count
	});
	return router;
}