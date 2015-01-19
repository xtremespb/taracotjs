module.exports = function(app) {
    var router = app.get('express').Router(),
        ObjectId = require('mongodb').ObjectID,
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales,
            directory: app.get('path').join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales_dev_mode
        }),
        util = require('util');
    router.get_module_name = function(req) {
        i18nm.setLocale(req.session.current_locale);
        return i18nm.__("module_name_cp");
    };
    router.get('/', function(req, res) {});
    return router;
};
