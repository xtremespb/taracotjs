module.exports = function(app) {
    var router = app.get('express').Router(),
    	gaikan = require('gaikan'),
    	renderer = app.get('renderer'),
        path = app.get('path');
    var i18nm = new(require('i18n-2'))({
        locales: app.get('config').locales,
        directory: app.get('path').join(__dirname, 'lang'),
        extension: '.js'
    });
    router.get(/blog\/post/, function(req, res, next) {
        i18nm.setLocale(req.i18n.getLocale());
        var data = {
            title: i18nm.__('blog_post'),
            page_title: i18nm.__('blog_post'),
            keywords: '',
            description: '',
            extra_css: "\n\t" + '<link rel="stylesheet" href="/modules/blog/css/main.css" type="text/css">'
        };
        var render = renderer.render_file(path.join(__dirname, 'views'), 'post', {
            lang: i18nm,
            data: data
        }, req);
        data.content = render;
        return app.get('renderer').render(res, undefined, data, req);
    });
    return router;
};
