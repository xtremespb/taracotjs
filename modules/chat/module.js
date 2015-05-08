module.exports = function(app) {

    var router = app.get('express').Router(),
        path = require('path'),
        async = require('async'),
        renderer = app.get('renderer'),
        moment = require('moment'),
        config = app.get('config'),
        socketsender = require('../../core/socketsender')(app),
        redis_client = app.get('redis_client'),
        ObjectId = require('mongodb').ObjectID,
        i18nm = new(require('i18n-2'))({
            locales: config.locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: config.locales.dev_mode
        });

    router.get('/', function(req, res) {
        if (!req.session.auth || req.session.auth.status < 1) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/chat';
            res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        i18nm.setLocale(req.session.current_locale);
        var data = {
                title: i18nm.__('module_name'),
                page_title: i18nm.__('module_name'),
                keywords: '',
                description: '',
                extra_css: '<link rel="stylesheet" href="/modules/chat/css/main.css" type="text/css">'
            },
            render = renderer.render_file(path.join(__dirname, 'views'), 'chat', {
                lang: i18nm,
                data: data,
                current_locale: req.session.current_locale
            }, req);
        data.content = render;
        app.get('renderer').render(res, undefined, data, req);
    });

    return router;
};
