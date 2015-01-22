var gaikan = require('gaikan');
module.exports = function(app) {
    var locales = app.get('config').locales.avail,
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales.avail,
            directory: app.get('path').join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales.dev_mode
        }),
        search_block_top = gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/search_block_top.html'),
        search_block_li = gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/search_block_li.html');
    var block = {
        data: function(req, res, callback) {
            var lng = req.session.current_locale;
            var data = {
                top: search_block_top(gaikan, {
                    lang: i18nm
                }, undefined),
                li: search_block_li(gaikan, {
                    lang: i18nm
                }, undefined)
            };
            callback(data);
        }
    };
    return block;
};
