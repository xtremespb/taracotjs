var auth_cache = {}, unauth_cache = {};
module.exports = function(app) {
	var i18nm = new(require('i18n-2'))({
		locales: app.get('config').locales.avail,
		directory: app.get('path').join(__dirname, 'lang'),
		extension: '.js',
    	devMode: app.get('config').locales.dev_mode
	});
	var block = {
		data: function(req, res, callback) {
			var lng = req.session.current_locale;
			i18nm.setLocale(lng);
			var data_top = '',
				data_li = '',
				data = {};
			if (req.session.auth) {
				if (req.session.auth.username && auth_cache[lng] && auth_cache[lng][req.session.auth.username]) return callback(auth_cache[lng][req.session.auth.username]);
				data_top = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'block_auth', {
					lang: i18nm
				}, req);
				data_li = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'block_auth_li', {
					lang: i18nm
				}, req);
				if (!auth_cache[lng]) auth_cache[lng] = {};
				data.top = data_top;
				data.li = data_li;
				auth_cache[lng][req.session.auth.username] = data;
			} else {
				if (unauth_cache[lng]) return callback(unauth_cache[lng]);
				data_top = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'block_unauth', {
					lang: i18nm
				}, req);
				data_li = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'block_unauth_li', {
					lang: i18nm
				}, req);
				data.top = data_top;
				data.li = data_li;
				unauth_cache[lng] = data;
			}
			callback(data);
		}
	};
	return block;
};