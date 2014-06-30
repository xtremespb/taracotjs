var config = require('../config');
var gaikan = require('gaikan');
var fs = require('fs');

module.exports = function(app){

	var renderer = {
		render : function(res, layout, data) {
			var _layout = layout || config.layouts.default;
			if (!data) {
				data = {};
			}
			data.blocks = app.get('blocks').data;
			res.render(_layout, data);
		},
		render_file : function(dir, filename, data) {
			var render = gaikan.compileFromFile(dir + '/' + filename + '.html');
			var html_data = render(gaikan, data, undefined);
			return html_data;
		}
	};

	return renderer;

};