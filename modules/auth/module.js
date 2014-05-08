var express = require('express');
var router = express.Router();
var renderer = require('../../core/renderer');
var config = require('../../config');
var path = require('path');

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
	var render = renderer.render_file(path.join(__dirname, 'views'), 'login', { lang: i18nm, username: username });
	res.send(render);
});

router.post('/process', function(req, res) {
	res.setHeader('Content-Type', 'application/json');
	var username = req.body.username;
	var password = req.body.password;
	req.session.username = 	req.body.username;
	res.send(JSON.stringify({ result: 1 }));
});

module.exports = router; 