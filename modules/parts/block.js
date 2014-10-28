var _timestamp_settings_query = {};
var parts_cache = {};
module.exports = function(app) {
	var block = {
		data: function(req, res, callback) {
			var lng = req.session.current_locale;
			if (_timestamp_settings_query[lng] && (Date.now() - _timestamp_settings_query[lng] <= 60000) && Object.keys(parts_cache).length) {
				return callback(parts_cache);
			}
			app.get('mongodb').collection('parts').find({
				plang: lng
			}, {} ).toArray(function(err, items) {
				if (err) {
					return;
				}
				if (typeof items != 'undefined' && items && items.length) {
					parts_cache = {};
					for (var i=0; i<items.length; i++) {
						parts_cache[items[i].pname] = items[i].pvalue;
					}
				}
				_timestamp_settings_query[lng] = Date.now();
				callback(parts_cache);
			});
		}
	};
	return block;
};
