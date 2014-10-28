var _timestamp_settings_query = {},
    menu_cache = {},
    gaikan = require('gaikan'),
    crypto = require('crypto');
module.exports = function(app) {
    var locales = app.get('config').locales;
    var i18nm = new(require('i18n-2'))({
        locales: app.get('config').locales,
        directory: app.get('path').join(__dirname, 'lang'),
        extension: '.js',
        devMode: app.get('config').locales_dev_mode
    });
    var block = {
        data_sync: function(par) {
            var lng = i18nm.getLocale();
            if (par) {
                par = par.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\[/g, '{').replace(/\]/g, '}').replace(/#/g, ',').replace(/\(\(/g, "[").replace(/\)\)/g, "]");
                par = '[' + par + ']';
            }
            try {
                par = JSON.parse(par);
            } catch (ex) {
                return "Feedback module error: " + ex;
            }
            if (!(par instanceof Array)) return "Invalid form data";
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
            var form_data = JSON.stringify(par);
            return feedback(gaikan, {
                fields: fields_html,
                form_data: form_data,
                current_lang: lng,
                form_checksum: crypto.createHash('md5').update(app.get('config').salt + form_data).digest('hex'),
                lang: i18nm
            }, undefined);
        }
    };
    return block;
};
