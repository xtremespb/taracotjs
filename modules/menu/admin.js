module.exports = function (app) {
	var router = app.get('express').Router();
	var i18nm = new(require('i18n-2'))({
		locales: app.get('config').locales,
		directory: app.get('path').join(__dirname, 'lang'),
		extension: '.js'
	});
	router.get_module_name = function (req) {
		i18nm.setLocale(req.i18n.getLocale());
		return i18nm.__("module_name");
	};
	router.get('/', function (req, res) {
		i18nm.setLocale(req.i18n.getLocale());
		if (!req.session.auth || req.session.auth.status < 2) {
			req.session.auth_redirect = '/cp/menu';
			res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
			return;
		}
		app.get('mongodb').collection('pages').find({ plang: req.i18n.getLocale() }, { limit: 100 }).sort({ ptitle: 1 }).toArray(function (err, items) {
			var pages = [];
			if (typeof items != 'undefined' && !err) {
				for (var i=0; i<items.length; i++) {
					var item = {};
					if (items[i]['ptitle']) item['ptitle'] = items[i]['ptitle'];
					if (items[i]['pfolder']) item['purl'] = items[i]['pfolder'];
					if (items[i]['pfilename']) item['purl'] += items[i]['pfilename'];
					pages.push(item);					
				}
			}
			var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'menu_control', {
				lang: i18nm,
				locales: JSON.stringify(app.get('config').locales),
				pages: JSON.stringify(pages)
			});
			app.get('cp').render(req, res, {
				body: body,
				css: '<link rel="stylesheet" href="/modules/menu/css/main.css">' + "\n\t\t"
			}, i18nm, 'menu', req.session.auth);
		});		
	});
	return router;
}