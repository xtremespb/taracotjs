var _timestamp_settings_query = {};
module.exports = function(app) {
	var block = {
		data: function(req, res, callback) {
			var block_data = {};
			callback(block_data);
		}
	};
	return block;
};
