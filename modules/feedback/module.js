module.exports = function(app) {
    var router = app.get('express').Router(),
        config = app.get('config'),
        path = require('path'),
        crypto = require('crypto'),
        mailer = app.get('mailer'),
        gaikan = require('gaikan'),
        i18nm = new(require('i18n-2'))({
            locales: config.locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales.dev_mode
        }),
        fs = require('fs'),
        part_mail_fields = fs.existsSync(path.join(__dirname, 'views') + '/custom_part_mail_fields.html') ? gaikan.compileFromFile(path.join(__dirname, 'views') + '/custom_part_mail_fields.html') : gaikan.compileFromFile(path.join(__dirname, 'views') + '/part_mail_fields.html');
    router.post('/send', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        var lng = req.session.current_locale;
        i18nm.setLocale(lng);
        var fields = req.body.fields,
            captcha = req.body.captcha,
            form_data = req.body.form_data,
            form_checksum = req.body.form_checksum;
        if (!captcha.match(/^[0-9]{4}$/)) {
            res.send(JSON.stringify({
                result: 0,
                field: 'captcha',
                error: i18nm.__("invalid_captcha")
            }));
            return;
        }
        if (captcha != req.session.captcha) {
            req.session.captcha = 0;
            res.send(JSON.stringify({
                result: 0,
                field: 'captcha',
                error: i18nm.__("invalid_captcha")
            }));
            return;
        }
        req.session.captcha = 0;
        try {
            form_data = JSON.parse(JSON.stringify(form_data));
        } catch (ex) {
            return res.send(JSON.stringify({
                result: 0,
                field: 'captcha',
                error: i18nm.__("invalid_form_data")
            }));
        }
        if (crypto.createHash('md5').update(app.get('config').salt + JSON.stringify(form_data) + lng).digest('hex') != form_checksum)
            return res.send(JSON.stringify({
                result: 0,
                field: 'captcha',
                error: i18nm.__("invalid_form_data")
            }));
        var email_data = [];
        for (var i = 0; i < form_data.length; i++) {
            var val = '';
            for (var f = 0; f < fields.length; f++) {
                if (fields[f].id == form_data[i].id) val = fields[f].val;
            }
            val = val.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
            if (form_data[i].mandatory && !val) {
                return res.send(JSON.stringify({
                    result: 0,
                    field: form_data[i].id,
                    error: i18nm.__("mandatory_field_empty") + ': ' + form_data[i]['label_' + lng]
                }));
            }
            if (val && form_data[i].type == 'email')
                if (!val.match(/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/)) {
                    return res.send(JSON.stringify({
                        result: 0,
                        field: form_data[i].id,
                        error: i18nm.__("invalid_email") + ': ' + form_data[i]['label_' + lng]
                    }));
                }
            if (val && form_data[i].type == 'select') {
                var options = form_data[i].values;
                if (!options || !(options instanceof Array))
                    return res.send(JSON.stringify({
                        result: 0,
                        field: 'captcha',
                        error: i18nm.__("invalid_form_data")
                    }));
                var _opt_found = false;
                for (var o = 0; o < options.length; o++)
                    if (options[o]['value_' + lng] == val) _opt_found = true;
                if (!_opt_found)
                    return res.send(JSON.stringify({
                        result: 0,
                        field: 'captcha',
                        error: i18nm.__("invalid_form_data")
                    }));
            }
            val = val.replace(/\"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[\n\r\t]/g, " ");
            email_data.push({
                label: form_data[i]['label_' + lng],
                value: val
            });
        }
        var fields_html = '',
            fields_txt = '';
        for (var fa = 0; fa < email_data.length; fa++) {
            fields_html += part_mail_fields(gaikan, {
                field: email_data[fa].label,
                value: email_data[fa].value
            }, undefined);
            fields_txt += email_data[fa].label + ":\t" + email_data[fa].value + "\n";
        }
        mailer.send(config.mailer.feedback, i18nm.__('mail_feedback_on') + ': ' + app.get('settings').site_title, path.join(__dirname, 'views'), 'mail_feedback_html', 'mail_feedback_txt', {
            lang: i18nm,
            fields_html: fields_html,
            fields_txt: fields_txt,
            site_title: app.get('settings').site_title
        }, req, function() {
            return res.send(JSON.stringify({
                result: 1
            }));
        });
    });
    return router;
};
