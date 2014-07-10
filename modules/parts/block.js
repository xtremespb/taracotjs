var _timestamp_settings_query = {};
module.exports = function(app) {
	var block = {
		data: function(req, res, callback) {
			var lng = req.i18n.getLocale();
			if (_timestamp_settings_query[lng] && (Date.now() - _timestamp_settings_query[lng] <= 60000)) {
				return;
			}
			app.get('blocks').data.parts = {};
			app.get('mongodb').collection('parts').find({
				plang: lng
			}, {} ).toArray(function(err, items) {
				if (err) {
					return;
				}
				if (typeof items != 'undefined' && items && items.length) {
					for (var i=0; i<items.length; i++) {
						app.get('blocks').data.parts[items[i].pname] = items[i].pvalue;
					}
				}
				_timestamp_settings_query[lng] = Date.now();
				callback();
			});
		}
	};
	return block;
};
