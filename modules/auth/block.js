var auth_cache = {}, unauth_cache = {};
module.exports = function(app) {
	var i18nm = new(require('i18n-2'))({
		locales: app.get('config').locales,
		directory: app.get('path').join(__dirname, 'lang'),
		extension: '.js'
	});
	var block = {
		data: function(req, res, callback) {
			var lng = req.i18n.getLocale();
			var data = '';
			if (!req.session.auth) {
				if (auth_cache.lng) return callback(auth_cache.lng);
				data = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'block_unauth', {
					lang: i18nm
				}, req);
				auth_cache.lng = data;
			} else {
				if (unauth_cache.lng) return callback(unauth_cache.lng);
				data = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'block_auth', {
					lang: i18nm
				}, req);
				unauth_cache.lng = data;
			}
			callback(data);
		}
	};
	return block;
};