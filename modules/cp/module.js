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
			res.redirect(303, "/auth/cp?rnd=" + Math.random().toString().replace('.', ''));
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
			totalmem: parseInt(os.totalmem() / 1024 / 1024) + ' ' + i18nm.__('MB'),
			freemem: parseInt(os.freemem() / 1024 / 1024) + ' ' + i18nm.__('MB'),
			loadavg: loadavg
		};
		var start = parseInt((Date.now() - 2592000000) / 1000);
		app.get('mongodb').collection('statistics').find({
			day: { $gte: start }
		}, {
			limit: 30
		}).sort({
			day: 1
		}).toArray(function(err, items) {
			var days = [];
			var months = [];
			var visitors = [];
			var hits = [];
			if (!err && items && items.length) {
				var _cm;
				for (var i=0; i<items.length; i++) {
					var dt = new Date(items[i].day * 1000);
					var month = dt.getMonth() + 1;
					var year = dt.getFullYear();
					if (_cm != month) {
						_cm = month;
						months.push({
							month: i18nm.__('month_' + month),
							year: year
						});
					}
					days.push(dt.getDate());
					visitors.push(items[i].visitors);
					hits.push(items[i].hits);
				}
			}
			var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'dashboard', {
				lang: i18nm,
				os: os_data,
				days: JSON.stringify(days),
				months: JSON.stringify(months),
				visitors: JSON.stringify(visitors),
				hits: JSON.stringify(hits),
				config: app.get('config')
			}, req);
			app.get('cp').render(req, res, {
				body: body
			}, i18nm, 'dashboard', req.session.auth);
		});
	});
	return router;
};
