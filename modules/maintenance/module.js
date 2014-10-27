module.exports = function(app) {
    var router = app.get('express').Router(),
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales,
            directory: app.get('path').join(__dirname, 'lang'),
            extension: '.js',
            devMode: true
        }),
        renderer = app.get('renderer');
    router.get('/', function(req, res) {
        i18nm.setLocale(req.i18n.getLocale());
        if (app.get('settings') && app.get('settings').site_mode && app.get('settings').site_mode != 'maintenance') return res.redirect(303, "/?rnd=" + Math.random().toString().replace('.', ''));
        var render = renderer.render_file(app.get('path').join(__dirname, 'views'), 'maint', {
            lang: i18nm,
            title: i18nm.__('module_name'),
            site_title: app.get('settings').site_title || 'TaracotJS',
            keywords: '',
            description: ''
        }, req);
        res.send(render);
    });
    return router;
};
