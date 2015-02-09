var gaikan = require('gaikan');
module.exports = function(app) {
    var locales = app.get('config').locales.avail,
        path = require('path'),
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales.dev_mode
        }),
        fs = require('fs'),
        search_block_top = fs.existsSync(path.join(__dirname, 'views') + '/custom_search_block_top.html') ? gaikan.compileFromFile(path.join(__dirname, 'views') + '/custom_search_block_top.html') : gaikan.compileFromFile(path.join(__dirname, 'views') + '/search_block_top.html'),
        search_block_li = fs.existsSync(path.join(__dirname, 'views') + '/custom_search_block_li.html') ? gaikan.compileFromFile(path.join(__dirname, 'views') + '/custom_search_block_li.html') : gaikan.compileFromFile(path.join(__dirname, 'views') + '/search_block_li.html');

    var block = {
        data: function(req, res, callback) {
            i18nm.setLocale(req.session.current_locale);
            var lng = req.session.current_locale,
                data = {
                    top: search_block_top(gaikan, {
                        lang: i18nm,
                        search_query: req.query.query || ''
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
