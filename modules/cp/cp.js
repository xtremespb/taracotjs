module.exports = function(app) {
	var cp = {
		render: function(req, res, data, i18nm, current, auth) {
			var i18ncp = new(require('i18n-2'))({
				locales: app.get('config').locales.avail,
				directory: app.get('path').join(__dirname, '..', 'cp', 'lang'),
				extension: '.js',
    			devMode: app.get('config').locales.dev_mode
			});
			i18ncp.setLocale(req.session.current_locale);
			var modules = [];
			app.get('modules').forEach(function(module) {
				if (app.get(module + '_routing').cp_prefix && app.get(module + '_routing').cp_prefix.length) {
					var _am = require('../' + module + '/admin')(app);
					var _m = {};
					_m.prefix = app.get(module + '_routing').cp_prefix;
					_m.name = _am.get_module_name(req);
					_m.id = app.get(module + '_routing').cp_id;
					if (!app.get(module + '_routing').hidden) modules.push(_m);
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
