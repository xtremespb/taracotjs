module.exports = function(app) {
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
		// var collection = app.get('mongodb').collection('users');
		// var data = app.get('mongodb').collection('users').find().toArray(function(err, items) {			
		// 	if (typeof items != 'undefined') {
		// 		var body = JSON.stringify(items);
		// 		app.get('cp').render(req, res, { body: body }, i18nm, 'users' );
		// 	}
		// });	
	});
	return router;
}