module.exports = function(app) {
	var router = app.get('express').Router();
	var config = app.get('config');
	var path = app.get('path');
	var i18nm = new (require('i18n-2'))({    
	    locales: config.locales,
	    directory: path.join(__dirname, 'lang'),
	    extension: '.js'
	});
	router.get('/', function(req, res) {
		i18nm.setLocale(req.i18n.getLocale());	
		var render = renderer.render_file(path.join(__dirname, 'views'), 'dummy', { lang: i18nm });
		res.send(render);
	});
	return router;
}