var express = require('express');
var router = express.Router();
var cp = require('../cp/cp');
var config = require('../../config');
var path = require('path');
var auth = require('../../core/auth');

var i18nm = new (require('i18n-2'))({    
    locales: config.locales,
    directory: path.join(__dirname, 'lang'),
    extension: '.js'
});

router.get_module_name = function(req) {
	i18nm.setLocale(req.i18n.getLocale());	
	return i18nm.__("module_name");
};

router.get('/', function(req, res) {
	// Check authorization
	if (!auth.check(req)) {
		res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
		return;
	}
	i18nm.setLocale(req.i18n.getLocale());	
	var body = i18nm.__("module_name");
	cp.render(req, res, { body: body }, i18nm, 'test' );
});

module.exports = router; 