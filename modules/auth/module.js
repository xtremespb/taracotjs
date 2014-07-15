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
		var captcha_req = false;
		if (req.session.captcha_req) captcha_req = true;
		var data = {
			title: i18nm.__('auth'),
			page_title: i18nm.__('auth'),
			keywords: '',
			description: '',
			extra_css: "\n\t" + '<link rel="stylesheet" href="/modules/auth/css/user_auth.css" type="text/css">'
		};
		var render = renderer.render_file(path.join(__dirname, 'views'), 'login_user', {
			lang: i18nm,
			captcha: _cap,
			captcha_req: captcha_req,
			data: data,
			redirect: req.session.auth_redirect
		});
		data.content = render;
		app.get('renderer').render(res, undefined, data);
	});
	router.get('/cp', function(req, res) {
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
		var captcha_req = false;
		if (req.session.captcha_req) captcha_req = true;
		var render = renderer.render_file(path.join(__dirname, 'views'), 'login_cp', {
			lang: i18nm,
			captcha: _cap,
			captcha_req: captcha_req,
			redirect: req.session.auth_redirect
		});
		res.send(render);
	});
	router.get('/register', function(req, res) {
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
		var captcha_req = false;
		if (req.session.captcha_req) captcha_req = true;
		var data = {
			title: i18nm.__('register'),
			page_title: i18nm.__('register'),
			keywords: '',
			description: '',
			extra_css: "\n\t" + '<link rel="stylesheet" href="/modules/auth/css/register.css" type="text/css">'
		};
		var render = renderer.render_file(path.join(__dirname, 'views'), 'register', {
			lang: i18nm,
			captcha: _cap,
			captcha_req: captcha_req,
			data: data,
			redirect: req.session.auth_redirect
		});
		data.content = render;
		app.get('renderer').render(res, undefined, data);
	});
	router.post('/register/process', function(req, res) {
		res.setHeader('Content-Type', 'application/json');
		i18nm.setLocale(req.i18n.getLocale());
		var username = req.body.username;
		var password = req.body.password;
		var email = req.body.email;
		var captcha = req.body.captcha;
		if (req.session.captcha_req) {
			if (!captcha.match(/^[0-9]{4}$/)) {
				res.send(JSON.stringify({
					result: 0,
					field: "reg_captcha",
					error: i18nm.__("invalid_captcha")
				}));
				return;
			}
			if (captcha != req.session.captcha) {
				req.session.captcha = 0;
				res.send(JSON.stringify({
					result: 0,
					field: "reg_captcha",
					error: i18nm.__("invalid_captcha")
				}));
				return;
			}
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
				field: "reg_username",
				error: i18nm.__("invalid_username_syntax")
			}));
			return;
		}
		if (!password.match(/^.{5,20}$/)) {
			res.send(JSON.stringify({
				result: 0,
				field: "reg_password",
				error: i18nm.__("invalid_password_syntax")
			}));
			return;
		}
		if (!email.match(/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/)) {
			res.send(JSON.stringify({
				result: 0,
				field: "reg_email",
				error: i18nm.__("invalid_email_syntax")
			}));
			return;
		}
		username = username.toLowerCase();
		email = email.toLowerCase();
		var md5 = crypto.createHash('md5');
		var password_hex = md5.update(config.salt + '.' + password).digest('hex');
		var data = app.get('mongodb').collection('users').find({
			$or: [ { username: username }, { email: email } ]
		}, {
			limit: 1
		}).toArray(function(err, items) {
			if (err) {
				res.send(JSON.stringify({
					result: 0,
					error: i18nm.__("reg_failed")
				}));
				return;
			}
			if (typeof items != 'undefined') {
				if (items.length > 0) {
					res.send(JSON.stringify({
						result: 0,
						field: "reg_username",
						error: i18nm.__("username_or_email_already_registered")
					}));
					return;
				}
			}
			app.get('mongodb').collection('users').insert({
				username: username,
				password: password_hex,
				email: email,
				status: 0
			}, function() {
				if (err) {
					res.send(JSON.stringify({
						result: 0,
						error: i18nm.__("reg_failed")
					}));
					return;
				}
				// Success
				req.session.captcha_req = false;
				res.send(JSON.stringify({
					result: 1
				}));
			});
		});
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
		if (req.session.captcha_req) {
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
					req.session.captcha_req = false;
					req.session.auth = items[0];
					delete req.session.auth.password;
					res.send(JSON.stringify({
						result: 1
					}));
					return;
				}
			}
			req.session.captcha_req = true;
			res.send(JSON.stringify({
				result: 0,
				field: "auth_password",
				error: i18nm.__("auth_failed")
			}));
		});
	});
	return router;
};
