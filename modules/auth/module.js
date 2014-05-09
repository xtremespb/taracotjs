var express = require('express');
var router = express.Router();
var renderer = require('../../core/renderer');
var config = require('../../config');
var path = require('path');
var crypto = require('crypto');

var i18nm = new (require('i18n-2'))({    
    locales: config.locales,
    directory: path.join(__dirname, 'lang'),
    extension: '.js'
});

router.get('/', function(req, res) {
	i18nm.setLocale(req.i18n.getLocale());
	var username = '';
	if (typeof req.session != 'undefined' && typeof req.session.username != 'undefined') {
		username = req.session.username;
	}
	if (username.length > 0) {
		res.redirect(303, "/?rnd=" + Math.random().toString().replace('.', ''));
		return;
	}
	var render = renderer.render_file(path.join(__dirname, 'views'), 'login', { lang: i18nm, username: username });
	res.send(render);
});

router.get('/logout', function(req, res) {
	delete req.session.username;
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
    if (!password.match(/^[A-Za-z0-9_\-]{5,20}$/)) {
        res.send(JSON.stringify({ result: 0, field: "auth_password", error: i18nm.__("invalid_password_syntax") }));
		return;
    }
    username = username.toLowerCase();
    var md5 = crypto.createHash('md5');
	var password_hex = md5.update(config.salt + '.' + password).digest('hex');
	// Debug only
	if (username != config.admin_username) {
		res.send(JSON.stringify({ result: 0, field: "auth_username", error: i18nm.__("invalid_username_syntax") }));
		return;
	}
	if (password_hex != config.admin_password) {
		res.send(JSON.stringify({ result: 0, field: "auth_password", error: i18nm.__("invalid_password") }));
		return;
	}
	// End: Debug only
	if (typeof req.session != 'undefined' && req.session.username != 'undefined') {
		req.session.username = username;	
	}
	res.send(JSON.stringify({ result: 1 }));
});

module.exports = router; 