module.exports = function(app) {
    var router = app.get('express').Router(),
        path = require('path'),
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales.dev_mode
        }),
        fs = require('fs'),
        max_log_items = 100,
        gaikan = require('gaikan'),
        parts_table = fs.existsSync(path.join(__dirname, 'views') + '/custom_parts_table.html') ? gaikan.compileFromFile(path.join(__dirname, 'views') + '/custom_parts_table.html') : gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_table.html'),
        parts_table_tr = fs.existsSync(path.join(__dirname, 'views') + '/custom_parts_table_tr.html') ? gaikan.compileFromFile(path.join(__dirname, 'views') + '/custom_parts_table_tr.html') : gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_table_tr.html'),
        parts_stack_btn = fs.existsSync(path.join(__dirname, 'views') + '/custom_parts_stack_btn.html') ? gaikan.compileFromFile(path.join(__dirname, 'views') + '/custom_parts_stack_btn.html') : gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_stack_btn.html');

    router.get_module_name = function(req) {
        i18nm.setLocale(req.session.current_locale);
        return i18nm.__("module_name_cp");
    };
    router.get('/', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (!req.session.auth || req.session.auth.status < 2) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/cp/log';
            res.redirect(303, "/auth/cp?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        var log_data = {
            lang: i18nm,
            auth: req.session.auth,
            log_html: ''
        };
        if (!fs.existsSync(app.get('config').log.file.filename)) {
            log_data.log_html = i18nm.__('no_log_file_available_yet');
            return app.get('cp').render(req, res, {
                body: app.get('renderer').render_file(path.join(__dirname, 'views'), 'log', log_data, req),
                css: '<link rel="stylesheet" href="/modules/log/css/main.css">'
            }, i18nm, 'log', req.session.auth);
        }
        fs.readFile(app.get('config').log.file.filename, function(err, data) {
            if (err) {
                log_data.log_html = i18nm.__('cannot_read_log');
                return app.get('cp').render(req, res, {
                    body: app.get('renderer').render_file(path.join(__dirname, 'views'), 'log', log_data, req),
                    css: '<link rel="stylesheet" href="/modules/log/css/main.css">'
                }, i18nm, 'log', req.session.auth);
            }
            var log_arr = data.toString().split("\n"),
                log_html = '';
            if (log_arr) log_arr = log_arr.reverse();
            for (var i in log_arr)
                if (i <= max_log_items) {
                    var item_json;
                    try {
                        item_json = JSON.parse(log_arr[i]);
                    } catch (ex) {}
                    if (item_json) {
                        var stack_btn = '';
                        if (item_json.stack) stack_btn = parts_stack_btn(gaikan, {
                            lang: i18nm,
                            stack: item_json.stack
                        }, undefined);
                        log_html += parts_table_tr(gaikan, {
                            lang: i18nm,
                            item: item_json,
                            stack_btn: stack_btn
                        }, undefined);
                    }
                }
            if (log_html.length) log_data.log_html = parts_table(gaikan, {
                lang: i18nm,
                rows: log_html,
                total: log_arr.length - 1
            }, undefined);
            if (!log_html) log_data.log_html = i18nm.__('no_log_file_available_yet');
            return app.get('cp').render(req, res, {
                body: app.get('renderer').render_file(path.join(__dirname, 'views'), 'log', log_data, req),
                css: '<link rel="stylesheet" href="/modules/log/css/main.css">'
            }, i18nm, 'log', req.session.auth);
        });
    });
    return router;
};
