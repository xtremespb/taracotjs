var express = require('express');
var router = express.Router();
var config = require('../../config');
var path = require('path');

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

module.exports = router; 