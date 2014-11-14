var gaikan = require('gaikan'),
    cache = {};
module.exports = function(app) {
    var locales = app.get('config').locales;
    var i18nm = new(require('i18n-2'))({
        locales: app.get('config').locales,
        directory: app.get('path').join(__dirname, 'lang'),
        extension: '.js',
        devMode: app.get('config').locales_dev_mode
    });
    var block = {
        data: function(req, res, callback) {
            var lng = req.session.current_locale;
            if (cache[lng]) return callback(cache[lng]);
            var default_lng = app.get('config').locales[0],
                flags = gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/flags.html'),
                langs = gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/parts_lang.html'),
                flags_data = {
                    lang: i18nm,
                    current_lang_full: i18nm.__('lang_' + lng),
                    current_lang: lng,
                    lang_list_html: ''
                },
                langs_html = '';
            var host = req.get('host').replace(new RegExp('^' + default_lng + '\.'), '').replace(new RegExp('^' + lng + '\.'), '');
            for (var i = 0; i < app.get('config').locales.length; i++) {
                var _host = host;
                if (app.get('config').locales[i] != default_lng) _host = app.get('config').locales[i] + '.' + host;
                flags_data.lang_list_html += langs(gaikan, {
                    lang: i18nm,
                    url: '//' + _host + req.originalUrl,
                    lng: app.get('config').locales[i],
                    lng_full: i18nm.__('lang_' + app.get('config').locales[i])
                });
            }
            var html_output = flags(gaikan, flags_data, undefined);
            cache[lng] = html_output;
            callback(html_output);
        }
    };
    return block;
};
