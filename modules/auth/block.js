var auth_cache = {}, unauth_cache = {};
module.exports = function(app) {
	var i18nm = new(require('i18n-2'))({
		locales: app.get('config').locales,
		directory: app.get('path').join(__dirname, 'lang'),
		extension: '.js',
    	devMode: false
	});
	var block = {
		data: function(req, res, callback) {
			var lng = req.i18n.getLocale();
			var data = '';
			if (req.session.auth) {
				if (req.session && req.session.auth && auth_cache.lng && auth_cache.lng.user === req.session.auth.username) return callback(auth_cache.lng.user);
				data = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'block_auth', {
					lang: i18nm
				}, req);
				if (!auth_cache.lng) auth_cache.lng = {};
				auth_cache.lng.user = data;
			} else {
				if (unauth_cache.lng) return callback(unauth_cache.lng);
				data = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'block_unauth', {
					lang: i18nm
				}, req);
				unauth_cache.lng = data;
			}
			callback(data);
		}
	};
	return block;
};