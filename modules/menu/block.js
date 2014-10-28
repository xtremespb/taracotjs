var _timestamp_settings_query = {};
var menu_cache = {};
module.exports = function(app) {
	var block = {
		data: function(req, res, callback) {
			var lng = req.session.current_locale;
			if (_timestamp_settings_query[lng] && (Date.now() - _timestamp_settings_query[lng] <= 60000) && menu_cache.lng) {
				return callback(menu_cache.lng);
			}
			app.get('mongodb').collection('menu').find({
				lang: lng
			}, {
				limit: 1
			}).toArray(function(err, items) {
				if (err) {
					return callback();
				}
				var data = {};
				if (typeof items != 'undefined' && items && items.length) {
					if (items[0].menu_raw) data.menu_raw = items[0].menu_raw;
					if (items[0].menu_uikit) data.menu_uikit = items[0].menu_uikit;
					if (items[0].menu_uikit_offcanvas) data.menu_uikit_offcanvas = items[0].menu_uikit_offcanvas;
				} else {
					data.menu_raw = '';
					data.menu_uikit = '';
					data.menu_uikit_offcanvas = '';
				}
				menu_cache.lng = data;
				_timestamp_settings_query[lng] = Date.now();
				callback(menu_cache.lng);
			});
		}
	};
	return block;
};
