var captchapng = require('captchapng');

var captcha = {
	generate: function(n) {
		var res = {};
		var captchaImg = function() {
			var p = new captchapng(80, 30, n); // width, height, numeric captcha
			p.color(250, 250, 250, 255); // First color: background (red, green, hare, alpha)
			p.color(parseInt(Math.random() * 100), parseInt(Math.random() * 100), parseInt(Math.random() * 100), 255); // Second color: paint (red, green, blue, alpha)
			return new Buffer(p.getBase64(), 'base64');
		};
		res.b64 = new Buffer(captchaImg()).toString('base64');
		res.png = undefined;
		return res;
	}
};

module.exports = captcha;
