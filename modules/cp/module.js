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
	if (typeof req.session == 'undefined' || typeof req.session.username == 'undefined') {
		res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
		return;
	}	
	var render = renderer.render_file(path.join(__dirname, 'views'), 'admin', { lang: i18nm, username: req.session.username });
	res.send(render);
});

module.exports = router; 