var renderer = require('../../core/renderer');
var path = require('path');
var config = require('../../config');

var i18ncp = new (require('i18n-2'))({    
    locales: config.locales,
    directory: path.join(__dirname, '..', 'cp', 'lang'),
    extension: '.js'
});

var cp = {	
	render : function(req, res, data, i18nm, current) {
		var modules = [];
		config.modules.forEach(function(module) {
	 		if (module.cp_prefix.length > 0) {
		 		var _am = require('../' + module.name + '/admin');
		 		var _m = {};
		 		_m.prefix = module.cp_prefix;
		 		_m.name = _am.get_module_name(req);
		 		_m.id = module.cp_id;
		    	modules.push(_m);
	    	}
		});
		var render = renderer.render_file(path.join(__dirname, 'views'), 'admin', { lang: i18nm, cp_lang: i18ncp, data: data, username: req.session.username, config: config, modules: JSON.stringify(modules), active_module: current });
		res.send(render);
	}
};

module.exports = cp;