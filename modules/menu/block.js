var _timestamp_settings_query;

module.exports = function(app) {
	var block = {
		data: function(req, res, callback) {
			if (_timestamp_settings_query && Date.now() - _timestamp_settings_query <= 60000) return;
			var lng = req.i18n.getLocale();
			app.get('mongodb').collection('menu').find({
				lang: lng
			}, {
				limit: 1
			}).toArray(function(err, items) {
				if (err) {
					return;
				}
				if (typeof items != 'undefined' && items && items.length) {
					if (items[0].menu_raw) app.get('blocks').data.menu_raw = items[0].menu_raw;
					if (items[0].menu_uikit) app.get('blocks').data.menu_uikit = items[0].menu_uikit;
				} else {
					app.get('blocks').data.menu_raw = '';
					app.get('blocks').data.menu_uikit = '';
				}
				_timestamp_settings_query = Date.now();
				callback();
			});
		}
	};
	return block;
};
