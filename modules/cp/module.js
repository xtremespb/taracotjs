module.exports = function(app) {
	var router = app.get('express').Router();
	var os = require('os');
	var i18nm = new(require('i18n-2'))({
		locales: app.get('config').locales,
		directory: app.get('path').join(__dirname, 'lang'),
		extension: '.js'
	});
	router.get('/', function(req, res) {
		if (typeof req.session.auth == 'undefined' || req.session.auth === false || req.session.auth.status < 2) {
			req.session.auth_redirect = '/cp';
			res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
			return;
		}
		i18nm.setLocale(req.i18n.getLocale());
		var loadavg = os.loadavg();
		if (loadavg[0] === 0 && loadavg[1] === 0 && loadavg[2] === 0) {
			loadavg = i18nm.__("not_available");
		} else {
			loadavg = loadavg[0] + ", " + loadavg[1] + ", " + loadavg[2];
		}
		var os_data = {
			hostname: os.hostname(),
			os_type: os.type(),
			os_platform: os.platform(),
			cpu_arch: os.arch(),
			os_release: os.release(),
			totalmem: os.totalmem(),
			freemem: os.freemem(),
			loadavg: loadavg
		};
		var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'dashboard', {
			lang: i18nm,
			os: os_data,
			config: app.get('config')
		});
		app.get('cp').render(req, res, {
			body: body
		}, i18nm, 'dashboard', req.session.auth);
	});
	return router;
};
