module.exports = function(app) {
	var cp = {
		render: function(req, res, data, i18nm, current, auth) {
			var i18ncp = new(require('i18n-2'))({
				locales: app.get('config').locales,
				directory: app.get('path').join(__dirname, '..', 'cp', 'lang'),
				extension: '.js',
    			devMode: false
			});
			var modules = [];
			app.get('config').modules.forEach(function(module) {
				if (module.cp_prefix.length > 0) {
					var _am = require('../' + module.name + '/admin')(app);
					var _m = {};
					_m.prefix = module.cp_prefix;
					_m.name = _am.get_module_name(req);
					_m.id = module.cp_id;
					if (!module.hidden) modules.push(_m);
				}
			});
			var render = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'admin', {
				lang: i18nm,
				cp_lang: i18ncp,
				data: data,
				username: auth.realname || auth.username,
				modules: JSON.stringify(modules),
				active_module: current
			}, req);
			res.send(render);
		}
	};
	return cp;
};
