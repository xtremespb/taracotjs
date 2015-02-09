var gaikan = require('gaikan');
module.exports = function(app) {
    var locales = app.get('config').locales.avail,
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales.avail,
            directory: app.get('path').join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales.dev_mode
        }),
        fs = require('fs'),
        flags = fs.existsSync(app.get('path').join(__dirname, 'views') + '/custom_flags.html') ? gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/custom_flags.html') : gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/flags.html'),
        flags_li = fs.existsSync(app.get('path').join(__dirname, 'views') + '/custom_part_mail_fields.html') ? gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/custom_flags_li.html') : gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/flags_li.html'),
        langs = fs.existsSync(app.get('path').join(__dirname, 'views') + '/custom_parts_lang.html') ? gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/custom_parts_lang.html') : gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/parts_lang.html');

    var block = {
        data: function(req, res, callback) {
            var lng = req.session.current_locale;
            var default_lng = app.get('config').locales.avail[0],
                flags_data = {
                    lang: i18nm,
                    current_lang_full: i18nm.__('lang_' + lng),
                    current_lang: lng,
                    lang_list_html: ''
                },
                langs_html = '';
            var host = req.get('host').replace(new RegExp('^' + default_lng + '\.'), '').replace(new RegExp('^' + lng + '\.'), '');
            for (var i = 0; i < app.get('config').locales.avail.length; i++) {
                var _host = host;
                if (app.get('config').locales.avail[i] != default_lng) _host = app.get('config').locales.avail[i] + '.' + host;
                flags_data.lang_list_html += langs(gaikan, {
                    lang: i18nm,
                    url: '//' + _host + req.originalUrl,
                    lng: app.get('config').locales.avail[i],
                    lng_full: i18nm.__('lang_' + app.get('config').locales.avail[i])
                });
            }
            var html_output = flags(gaikan, flags_data, undefined),
                html_output_li = flags_li(gaikan, flags_data, undefined),
                data = {
                    top: html_output,
                    li: html_output_li
                };
            callback(data);
        }
    };
    return block;
};
