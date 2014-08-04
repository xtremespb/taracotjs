var config = require('../config');
var gaikan = require('gaikan');
var fs = require('fs');

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
			if (req && req.session && req.session.auth) data.auth = req.session.auth;
			data.blocks = app.get('blocks').data;
			res.render(_layout, data);
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
