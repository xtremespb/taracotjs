module.exports = function(app) {
	var i18nm = new(require('i18n-2'))({
		locales: app.get('config').locales,
		directory: app.get('path').join(__dirname, 'lang'),
		extension: '.js'
	});
	var block = {
		data: function(req, res, callback) {
			var data = '';
			if (!req.session.auth) {
				data = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'block_unauth', {
					lang: i18nm
				}, req);
			} else {
				data = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'block_auth', {
					lang: i18nm
				}, req);
			}
			callback(data);
		}
	};
	return block;
};