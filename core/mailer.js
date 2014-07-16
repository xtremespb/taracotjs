var config = require('../config');
var nodemailer = require('nodemailer');
var sendmailTransport = require('nodemailer-sendmail-transport');

module.exports = function(app) {
	var transporter;
	var renderer = require('../core/renderer')(app);
	if (config.mailer.transport == 'smtp') transporter = nodemailer.createTransport(config.mailer.smtp);
	if (config.mailer.transport == 'sendmail') transporter = nodemailer.createTransport(sendmailTransport(config.mailer.sendmail));

	var mailer = {
		send: function(to, subject, dir, html, txt, data, callback) {
			var data_html = renderer.render_file(dir, html, data);
			var data_txt = renderer.render_file(dir, txt, data);
			var mailOptions = {
				from: config.mailer.sender,
				to: to,
				subject: subject,
				text: data_txt,
				html: data_html
			};
			if (transporter) {
				transporter.sendMail(mailOptions, function(error, info) {
					if (callback) {
						if (error) {
							callback(error);
						} else {
							callback();
						}
					}
				});
			} else {
				callback('No transporter defined');
			}
		}
	};

	return mailer;

};
