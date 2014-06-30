module.exports = function(app) {
	var router = app.get('express').Router();
	var renderer = app.get('renderer');
	var config = app.get('config');
	var path = app.get('path');
	var crypto = require('crypto');
	var i18nm = new(require('i18n-2'))({
		locales: config.locales,
		directory: path.join(__dirname, 'lang'),
		extension: '.js'
	});
	router.get('/captcha', function(req, res) {
		var c = parseInt(Math.random() * 9000 + 1000);
		req.session.captcha = c;
		var cpth = app.get('captcha').generate(c);
		if (cpth.png) {
			res.set('Content-Type', 'image/png');
			cpth.png.stream(function streamOut(err, stdout, stderr) {
				if (err) return next(err);
				stdout.pipe(res);
			});
		} else {
			next();
		}
	});
	router.post('/captcha', function(req, res) {
		var c = parseInt(Math.random() * 9000 + 1000);
		req.session.captcha = c;
		var cpth = app.get('captcha').generate(c);
		if (cpth.b64) {
			res.send(JSON.stringify({
				img: cpth.b64
			}));
		} else {
			next();
		}
	});
	router.get('/', function(req, res) {
		i18nm.setLocale(req.i18n.getLocale());
		if (typeof req.session != 'undefined' && typeof req.session.auth != 'undefined' && req.session.auth !== false) {
			res.redirect(303, "/?rnd=" + Math.random().toString().replace('.', ''));
			return;
		}
		var c = parseInt(Math.random() * 9000 + 1000);
		var _cap = 'b64';
		if (app.get('config').captcha == 'captcha_gm') {
			_cap = 'png';
		}
		var render = renderer.render_file(path.join(__dirname, 'views'), 'login', {
			lang: i18nm,
			captcha: _cap,
			redirect: req.session.auth_redirect
		});
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
		var captcha = req.body.captcha;
		if (!captcha.match(/^[0-9]{4}$/)) {
			res.send(JSON.stringify({
				result: 0,
				field: "auth_captcha",
				error: i18nm.__("invalid_captcha")
			}));
			return;
		}
		if (captcha != req.session.captcha) {
			req.session.captcha = 0;
			res.send(JSON.stringify({
				result: 0,
				field: "auth_captcha",
				error: i18nm.__("invalid_captcha")
			}));
			return;
		}
		req.session.captcha = 0;
		if (typeof username == 'undefined' || typeof password == 'undefined') {
			res.send(JSON.stringify({
				result: 0,
				error: i18nm.__("username_password_missing")
			}));
			return;
		}
		if (!username.match(/^[A-Za-z0-9_\-]{3,20}$/)) {
			res.send(JSON.stringify({
				result: 0,
				field: "auth_username",
				error: i18nm.__("invalid_username_syntax")
			}));
			return;
		}
		if (!password.match(/^.{5,20}$/)) {
			res.send(JSON.stringify({
				result: 0,
				field: "auth_password",
				error: i18nm.__("invalid_password_syntax")
			}));
			return;
		}
		username = username.toLowerCase();
		var md5 = crypto.createHash('md5');
		var password_hex = md5.update(config.salt + '.' + password).digest('hex');
		var data = app.get('mongodb').collection('users').find({
			username: username,
			password: password_hex
		}, {
			limit: 1
		}).toArray(function(err, items) {
			if (typeof items != 'undefined' && !err) {
				if (items.length > 0) {
					req.session.auth = items[0];
					delete req.session.auth.password;
					res.send(JSON.stringify({
						result: 1
					}));
					return;
				}
			}
			res.send(JSON.stringify({
				result: 0,
				error: i18nm.__("auth_failed")
			}));
		});
	});
	return router;
};
