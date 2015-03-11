module.exports = function(app) {
    var router = app.get('express').Router(),
    	path = require('path'),
    	renderer = app.get('renderer'),
        ObjectId = require('mongodb').ObjectID,
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales.dev_mode
        });


    router.get('/', function(req, res) {
		if (!req.session.auth || req.session.auth.status < 2) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/customer';
            res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
    	i18nm.setLocale(req.session.current_locale);
        var data = {
            title: i18nm.__('module_name'),
            page_title: i18nm.__('module_name'),
            keywords: '',
            description: '',
            extra_css: '<link rel="stylesheet" href="/modules/billing_frontend/css/main.css" type="text/css">'
        };
        var render = renderer.render_file(path.join(__dirname, 'views'), 'billing_frontend', {
            lang: i18nm,
            data: data
        }, req);
        data.content = render;
        app.get('renderer').render(res, undefined, data, req);
    });

    return router;
};
