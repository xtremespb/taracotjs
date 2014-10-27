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
			data.blocks_sync = {};
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
			Object.keys(app.get('blocks_sync')).forEach(function (key) {
				var fn = app.get('blocks_sync')[key];
				if (fn) data.blocks_sync[key] = fn;
			});
			var global_description = app.get('settings').site_description || '',
				global_keywords = app.get('settings').site_keywords || '';
			if (data.keywords && global_keywords) {
				data.keywords += ', ' + global_keywords;
			} else {
				data.keywords = global_keywords;
			}
			if (data.description && global_description) {
				data.description += '. ' + global_description;
			} else {
				data.description = global_description;
			}
			if (app.get('settings') && app.get('settings').site_title) data.site_title = app.get('settings').site_title;
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
