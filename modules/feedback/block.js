var _timestamp_settings_query = {},
    feedback_cache = {},
    gaikan = require('gaikan'),
    crypto = require('crypto');
module.exports = function(app) {
    var locales = app.get('config').locales.avail;
    var i18nm = new(require('i18n-2'))({
        locales: app.get('config').locales.avail,
        directory: app.get('path').join(__dirname, 'lang'),
        extension: '.js',
        devMode: app.get('config').locales.dev_mode
    });
    var block = {
        data_sync: function(_par) {
            if (_par) {
                _par = _par.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\[/g, '{').replace(/\]/g, '}').replace(/#/g, ',').replace(/\(\(/g, "[").replace(/\)\)/g, "]");
                _par = '{' + _par + '}';
            }
            try {
                _par = JSON.parse(_par);
            } catch (ex) {
                return "Feedback module error: " + ex;
            }
            var lng = _par.lang || locales[0],
                par = _par.data;
            i18nm.setLocale(lng);
            if (!(par instanceof Array)) return "Invalid form data";
            var form_data = JSON.stringify(par),
                form_checksum = crypto.createHash('md5').update(app.get('config').salt + form_data).digest('hex');
            if (_timestamp_settings_query[lng + form_checksum] && (Date.now() - _timestamp_settings_query[lng + form_checksum] <= 60000) && feedback_cache[lng + form_checksum]) return feedback_cache[lng + form_checksum];
            var feedback = gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/feedback.html'),
                field_text = gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/field_text.html'),
                field_textarea = gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/field_textarea.html'),
                field_select = gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/field_select.html'),
                field_select_option = gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/field_select_option.html'),
                field_asterisk = gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/field_asterisk.html'),
                fields_html = '';

            for (var i = 0; i < par.length; i++) {
                if (par[i].type) {
                    var data = {};
                    if (par[i].id) data.id = par[i].id;
                    if (par[i]['label_' + lng]) data.label = par[i]['label_' + lng];
                    if (par[i].class) data.class = ' ' + par[i].class;
                    if (par[i].mandatory) data.asterisk = field_asterisk(gaikan, undefined, undefined);
                    if (par[i].type == 'text' || par[i].type == 'email') {
                        fields_html += field_text(gaikan, data, undefined);
                    }
                    if (par[i].type == 'textarea') {
                        fields_html += field_textarea(gaikan, data, undefined);
                    }
                    if (par[i].type == 'select') {
                        var options = par[i].values;
                        if (!options || !(options instanceof Array)) return 'Invalid values for select: ' + par[i].id;
                        data.options = '';
                        for (var o = 0; o < options.length; o++) {
                            data.options += field_select_option(gaikan, {
                                value: options[o]['value_' + lng]
                            }, undefined);
                        }
                        fields_html += field_select(gaikan, data, undefined);
                    }
                }
            }
            var _cap = 'b64';
            if (app.get('config').captcha == 'captcha_gm') {
                _cap = 'png';
            }
            var res = feedback(gaikan, {
                fields: fields_html,
                form_data: form_data,
                current_lang: lng,
                form_checksum: form_checksum,
                captcha: _cap,
                lang: i18nm
            }, undefined);
            feedback_cache[lng + form_checksum] = res;
            _timestamp_settings_query[lng + form_checksum] = Date.now();
            return res;
        }
    };
    return block;
};
