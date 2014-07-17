module.exports = function(app) {
	var router = app.get('express').Router();
	var renderer = app.get('renderer');
	var config = app.get('config');
	var path = app.get('path');
	var mailer = app.get('mailer');
	var crypto = require('crypto');
	var i18nm = new(require('i18n-2'))({
		locales: config.locales,
		directory: path.join(__dirname, 'lang'),
		extension: '.js'
	});
	var ObjectId = require('mongodb').ObjectID;
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
			captcha_req: true,
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
			$or: [{
				username: username
			}, {
				email: email
			}]
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
			var md5 = crypto.createHash('md5');
			var act_code = md5.update(config.salt + '.' + Date.now()).digest('hex');
			app.get('mongodb').collection('users').insert({
				username: username,
				password: password_hex,
				email: email,
				act_code: act_code,
				status: 0
			}, function(err, items) {
				if (err) {
					res.send(JSON.stringify({
						result: 0,
						error: i18nm.__("reg_failed")
					}));
					return;
				}
				var user_id = items[0]._id.toHexString();
				var register_url = req.protocol + '://' + req.get('host') + '/auth/activate?user=' + user_id + '&code=' + act_code;
				mailer.send(email, i18nm.__('mail_register_on') + ' ' + app.get('settings').site_title, path.join(__dirname, 'views'), 'mail_register_html', 'mail_register_txt', {
					lang: i18nm,
					site_title: app.get('settings').site_title,
					register_url: register_url
				});
				// Success
				req.session.captcha_req = false;
				res.send(JSON.stringify({
					result: 1
				}));
			});
		});
	});
	router.get('/activate', function(req, res) {
		i18nm.setLocale(req.i18n.getLocale());
		var user = req.query.user;
		var code = req.query.code;
		var act_res;
		if (typeof user == 'undefined' || typeof code == 'undefined') {
			act_res = i18nm.__("userid_or_code_missing");
		}
		if (!user.match(/^[a-f0-9]{24}$/)) {
			act_res = i18nm.__("invalid_userid_syntax");
		}
		if (!code.match(/^[a-f0-9]{32}$/)) {
			act_res = i18nm.__("invalid_code_syntax");
		}
		var data = {
			title: i18nm.__('activate'),
			page_title: i18nm.__('activate'),
			keywords: '',
			description: '',
			extra_css: ''
		};
		if (act_res) {
			data.content = renderer.render_file(path.join(__dirname, 'views'), 'activate', {
				lang: i18nm,
				data: data,
				act_res: act_res,
				act_status: false,
				redirect: req.session.auth_redirect
			});
			app.get('renderer').render(res, undefined, data);
			return;
		}
		app.get('mongodb').collection('users').find({
			_id: new ObjectId(user),
			act_code: code,
			status: 0
		}, {
			limit: 1
		}).toArray(function(err, items) {
			if (err || typeof items == 'undefined' || items.length === 0) {
				data.content = renderer.render_file(path.join(__dirname, 'views'), 'activate', {
					lang: i18nm,
					data: data,
					act_res: i18nm.__("unable_to_activate"),
					act_status: false,
					redirect: req.session.auth_redirect
				});
				return app.get('renderer').render(res, undefined, data);
			}
			app.get('mongodb').collection('users').update({
				_id: new ObjectId(user)
			}, {
				$set: {
					act_code: null,
					status: 1
				}
			}, function(err) {
				var act_status = true;
				var act_msg = i18nm.__("activation_success");
				if (err) {
					act_res = i18nm.__("unable_to_activate");
					act_status = false;
				} else {
					req.session.auth = items[0];
				}
				data.content = renderer.render_file(path.join(__dirname, 'views'), 'activate', {
					lang: i18nm,
					data: data,
					act_res: act_msg,
					act_status: act_status,
					redirect: req.session.auth_redirect
				});
				return app.get('renderer').render(res, undefined, data);
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
