var config = require('../config');
var gaikan = require('gaikan');
var fs = require('fs');

var renderer = {
	render : function(res, layout, data) {
		var _layout = layout || config.default_layout;
		res.render(_layout, data);
	},
	render_file : function(dir, filename, data) {
		var render = gaikan.compileFromFile(dir + '/' + filename + '.html');
		var html_data = render(gaikan, data, undefined);		
		return html_data;		
	}
};

module.exports = renderer;