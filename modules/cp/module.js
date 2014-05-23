module.exports = function(app) {
	var router = app.get('express').Router();
	var i18nm = new (require('i18n-2'))({    
	    locales: app.get('config').locales,
	    directory: app.get('path').join(__dirname, 'lang'),
	    extension: '.js'
	});	
	router.get('/', function(req, res) {
		if (!app.get('auth') || app.get('auth').status < 2) {
			req.session.auth_redirect = '/cp';
			res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));			
			return;
		}
		i18nm.setLocale(req.i18n.getLocale());
		var body = i18nm.__("taracot_dashboard");
		app.get('cp').render(req, res, { body: body }, i18nm, 'dashboard', app.get('auth') );
	});
	return router;
}