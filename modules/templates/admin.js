var glob = require("glob"),
    fs = require('fs');

module.exports = function(app) {
    // Sort order hash
    var sort_cells = {
            pname: 1,
            lang: 1
        },
        sort_cell_default = 'pname',
        sort_cell_default_mode = 1;
    // Set items per page for this module
    var items_per_page = 10000;
    //
    var router = app.get('express').Router(),
        ObjectId = require('mongodb').ObjectID,
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales.avail,
            directory: app.get('path').join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales.dev_mode
        });
    router.get_module_name = function(req) {
        i18nm.setLocale(req.session.current_locale);
        return i18nm.__("module_name");
    };
    router.get('/', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (!req.session.auth || req.session.auth.status < 2) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/cp/templates';
            res.redirect(303, "/auth/cp?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'templates_control', {
            lang: i18nm,
            locales: JSON.stringify(app.get('config').locales.avail)
        }, req);
        app.get('cp').render(req, res, {
            body: body,
            css: '<link rel="stylesheet" href="/modules/templates/css/main.css">' + "\n\t\t"
        }, i18nm, 'menu', req.session.auth);
    });
    router.post('/data/list', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            ipp: items_per_page,
            items: [],
            status: 1
        };
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        rep.total = 0;
        glob("../views/*.html", {}, function(err1, views) {
            if (!err1 && views)
                for (var i = 0; i < views.length; i++) {
                    var item = views[i].replace(/^\.\.\//, ''),
                        id = item.replace(/\//g, '__').replace(/\.html$/, ''),
                        _a = [];
                    _a.push(id);
                    _a.push(item);
                    rep.items.push(_a);
                    rep.total++;
                }
            glob("../modules/*/views/*.html", {}, function(err2, modules) {
                if (!err2 && modules)
                    for (var i = 0; i < modules.length; i++) {
                        var item = modules[i].replace(/^\.\.\//, ''),
                            id = item.replace(/\//g, '__').replace(/\.html$/, ''),
                            _a = [];
                        _a.push(id);
                        _a.push(item);
                        rep.items.push(_a);
                        rep.total++;
                    }
                res.send(JSON.stringify(rep));
            });
        });
    });
    router.post('/data/load', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            data: {},
            status: 1
        };
        var template_id = req.body.id;
        if (!template_id || !template_id.match(/^[a-z0-9_]{1,200}$/i) || template_id.indexOf('views__') < 0) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            return res.send(JSON.stringify(rep));
        }
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        // Check if template exists
        var template = template_id.replace(/__/g, '/') + '.html';
        if (!fs.existsSync('../' + template)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_template");
            return res.send(JSON.stringify(rep));
        }
        // Get template
        fs.readFile('../' + template, 'utf8', function(err, data) {
            if (err) {
                rep.status = 0;
                rep.error = err;
                return res.send(JSON.stringify(rep));
            }
            rep.data.pvalue = data;
            rep.data.id = template_id;
            return res.send(JSON.stringify(rep));
        });
    });
    router.post('/data/save', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            err_fields: [],
            status: 1
        };
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        var pvalue = req.body.pvalue,
            id = req.body.id;
        if (!id || !id.match(/^[a-z0-9_]{1,200}$/i) || id.indexOf('views__') < 0) {
            rep.status = 0;
            ep.err_fields.push('pvalue');
        }
        if (pvalue.length > 2097152) { // 2MB
            rep.status = 0;
            rep.err_fields.push('pvalue');
        }
        var template = id.replace(/__/g, '/') + '.html';
        if (!fs.existsSync('../' + template)) {
            rep.status = 0;
            rep.err_fields.push('pvalue');
        }
        if (rep.status === 0) return res.send(JSON.stringify(rep));
        fs.writeFile('../' + template, pvalue, function(err) {
            if (err) {
                rep.status = 0;
                rep.err_fields.push('pvalue');
            }
            return res.send(JSON.stringify(rep));
        });
    });

    var dummy = function() {};

    return router;
};
