module.exports = function(app) {

    var router = app.get('express').Router(),
        path = require('path'),
        async = require('async'),
        renderer = app.get('renderer'),
        config = app.get('config'),
        i18nm = new(require('i18n-2'))({
            locales: config.locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: config.locales.dev_mode
        });

    router.get('/', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var data = {
            title: i18nm.__('module_name'),
            page_title: i18nm.__('module_name'),
            keywords: '',
            description: '',
            extra_css: '<link rel="stylesheet" href="/modules/portfolio/css/main.css" type="text/css">'
        };
        var render = renderer.render_file(path.join(__dirname, 'views'), 'portfolio', {
            lang: i18nm
        }, req);
        data.content = render;

        app.get('renderer').render(res, undefined, data, req);
    });

    return router;
};