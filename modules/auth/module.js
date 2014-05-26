module.exports = function(app){
	var router = app.get('express').Router();
	var renderer = app.get('renderer');
	var config = app.get('config');
	var path = app.get('path');
	var crypto = require('crypto');
	var i18nm = new (require('i18n-2'))({    
	    locales: config.locales,
	    directory: path.join(__dirname, 'lang'),
	    extension: '.js'
	});
	router.get('/', function(req, res) {
		i18nm.setLocale(req.i18n.getLocale());
		var id = '';
		if (typeof req.session != 'undefined' && typeof req.session.auth != 'undefined' && req.session.auth != false) {
			id = req.session.user_id;
		}
		if (id.length > 0) {
			res.redirect(303, "/?rnd=" + Math.random().toString().replace('.', ''));
			return;
		}
		var render = renderer.render_file(path.join(__dirname, 'views'), 'login', { lang: i18nm, redirect: req.session.auth_redirect });
		res.send(render);
	});
	router.get('/logout', function(req, res) {
		delete req.session.auth;
		res.redirect(303, "/?rnd=" + Math.random().toString().replace('.', ''));	
	});
	router.post('/process', function(req, res) {
		res.setHeader('Content-Type', 'application/json');
		i18nm.setLocale(req.i18n.getLocale());
		var username = req.body.username;
		var password = req.body.password;
		if (typeof username == 'undefined' || typeof password == 'undefined') {
			res.send(JSON.stringify({ result: 0, error: i18nm.__("username_password_missing") }));
			return;
		}
		if (!username.match(/^[A-Za-z0-9_\-]{3,20}$/)) {
	        res.send(JSON.stringify({ result: 0, field: "auth_username", error: i18nm.__("invalid_username_syntax") }));
			return;
	    }
	    if (!password.match(/^.{5,20}$/)) {
	        res.send(JSON.stringify({ result: 0, field: "auth_password", error: i18nm.__("invalid_password_syntax") }));
			return;
	    }
	    username = username.toLowerCase();
	    var md5 = crypto.createHash('md5');
		var password_hex = md5.update(config.salt + '.' + password).digest('hex');
		var data = app.get('mongodb').collection('users').find( { username: username, password: password_hex  }, { limit : 1 }).toArray(function(err, items) {			
			if (typeof items != 'undefined' && !err) {
				if (items.length > 0) {
					req.session.auth = items[0];
					delete req.session.auth.password;
					res.send(JSON.stringify({ result: 1 }));
					return;
				}
			}
			res.send(JSON.stringify({ result: 0, error: i18nm.__("auth_failed") }));
		});		
	});
	return router;
}