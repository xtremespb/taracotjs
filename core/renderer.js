var config = require('../config');
var gaikan = require('gaikan');
var fs = require('fs');
var async = require('async');

module.exports = function(app) {

	var renderer = {
		render: function(res, layout, data, req) {
			var _layout = layout || config.layouts.default;
			data.auth = {
				username: '',
				email: '',
				status: 0,
				realname: ''
			};
			data.blocks = {};
			var fa = [];
			if (req && req.session && req.session.auth) data.auth = req.session.auth;
			Object.keys(app.get('blocks')).forEach(function (key) {
    			var fn = app.get('blocks')[key];
    			var fp = function(callback) {
	    			fn(req, res, function(_data) {
	    				data.blocks[key] = _data;
	    				callback();
	    			});
    			};
    			fa.push(fp);
			});
			async.waterfall(fa, function() {
				res.render(_layout, data);
			});
		},
		render_file: function(dir, filename, data, req) {
			var render = gaikan.compileFromFile(dir + '/' + filename + '.html');
			data.auth = {
				username: '',
				email: '',
				status: 0,
				realname: ''
			};
			if (req && req.session && req.session.auth) data.auth = req.session.auth;
			var html_data = render(gaikan, data, undefined);
			return html_data;
		}
	};

	return renderer;

};
