var gm = require('gm');

var captcha = {
	generate: function(cn) {
		var res = {};
		var pic = gm(100, 50, '#f5f5f5').setFormat('png');
		pic.font('../fonts/serrific_grunge.ttf');
		var offset = 10;
		for (var n = 0; n < 10; n++) {
			var color = '#' + Math.floor(Math.random() * 6777215 + 1000000).toString(16);
			pic.stroke(color);
			pic.drawLine(Math.random() * 80 + 10, Math.random() * 40 + 5, Math.random() * 80 + 10, Math.random() * 40 + 5);
		}
		cn = cn.toString().split("");
		for (var i = 0; i < 4; i++) {
			var clr = '#' + Math.floor(Math.random() * 3777215).toString(16);
			pic.stroke(clr);
			var nm = cn[i];
			pic.fontSize(15 + parseInt(Math.random() * 10));
			pic.drawText(offset, 25, nm);
			offset += 16 + parseInt(Math.random() * 10);
			var factor = 1;
			if (Math.random() < 0.5) {
				factor = -1;
			}
			pic.rotate('#f5f5f5', parseInt(Math.random() * 6 * factor));
		}
		pic.crop(100, 50, 0, 0);
		res.b64 = undefined;
		res.png = pic;
		return res;
	}
};

module.exports = captcha;
