module.exports = function(app) {
    var router = app.get('express').Router(),
        path = require('path'),
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales.avail,
            directory: path.join(__dirname, 'lang'),
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
            req.session.auth_redirect = '/cp/menu';
            res.redirect(303, "/auth/cp?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        app.get('mongodb').collection('pages').find({
            plang: req.session.current_locale
        }, {
            limit: 100
        }).sort({
            ptitle: 1
        }).toArray(function(err, items) {
            var pages = [];
            if (typeof items != 'undefined' && !err) {
                for (var i = 0; i < items.length; i++) {
                    var item = {};
                    if (items[i].ptitle) item.ptitle = items[i].ptitle;
                    if (items[i].pfolder) item.purl = items[i].pfolder;
                    if (items[i].pfolder != '/') item.purl += '/';
                    if (items[i].pfilename) item.purl += items[i].pfilename;
                    if (items[i].pfolder != '/') {
                        item.purl = item.purl.replace(/\/$/, '');
                    }
                    pages.push(item);
                }
            }
            var body = app.get('renderer').render_file(path.join(__dirname, 'views'), 'menu_control', {
                lang: i18nm,
                locales: JSON.stringify(app.get('config').locales.avail),
                pages: JSON.stringify(pages)
            }, req);
            app.get('cp').render(req, res, {
                body: body,
                css: '<link rel="stylesheet" href="/modules/menu/css/main.css">'
            }, i18nm, 'menu', req.session.auth);
        });
    });
    router.post('/data/load', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        var lng = req.body.lng;
        var _lng = app.get('config').locales.avail[0];
        for (var i = 0; i < app.get('config').locales.avail.length; i++) {
            if (lng == app.get('config').locales.avail[i]) _lng = app.get('config').locales.avail[i];
        }
        lng = _lng;
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        app.get('mongodb').collection('menu').find({
            lang: lng
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err) {
                rep.status = 0;
                rep.error = i18nm.__("database_error");
                res.send(JSON.stringify(rep));
                return;
            }
            if (typeof items != 'undefined' && items && items.length) {
                rep.menu_source = items[0].menu_source || '';
            } else {
                rep.menu_source = '';
            }
            res.send(JSON.stringify(rep));
        });
    });
    router.post('/data/save', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        var lng = req.body.lng;
        var menu_source = req.body.menu_source || '',
            menu_uikit = req.body.menu_uikit || '',
            menu_uikit_offcanvas = req.body.menu_uikit_offcanvas || '',
            menu_raw = req.body.menu_raw || '';
        menu_source = menu_source.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ').replace(/\n/g, '');
        menu_uikit = menu_uikit.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ').replace(/\n/g, '');
        menu_uikit_offcanvas = menu_uikit_offcanvas.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ').replace(/\n/g, '');
        menu_raw = menu_raw.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ').replace(/\n/g, '');
        var _lng = app.get('config').locales.avail[0];
        for (var i = 0; i < app.get('config').locales.avail.length; i++) {
            if (lng == app.get('config').locales.avail[i]) _lng = app.get('config').locales.avail[i];
        }
        lng = _lng;
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        app.get('mongodb').collection('menu').find({
            lang: lng
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err) {
                rep.status = 0;
                rep.error = i18nm.__("database_error");
                res.send(JSON.stringify(rep));
                return;
            }
            var data = {
                lang: lng,
                menu_source: menu_source,
                menu_raw: menu_raw,
                menu_uikit: menu_uikit,
                menu_uikit_offcanvas: menu_uikit_offcanvas
            };
            if (typeof items != 'undefined' && items && items.length) {
                app.get('mongodb').collection('menu').update({
                    lang: lng
                }, data, function(err) {
                    if (err) {
                        rep.status = 0;
                        rep.error = i18nm.__("database_error");
                        res.send(JSON.stringify(rep));
                        return;
                    }
                    rep.status = 1;
                    res.send(JSON.stringify(rep));
                });
            } else {
                app.get('mongodb').collection('menu').insert(data, function(err) {
                    if (err) {
                        rep.status = 0;
                        rep.error = i18nm.__("database_error");
                        res.send(JSON.stringify(rep));
                        return;
                    }
                    rep.status = 1;
                    res.send(JSON.stringify(rep));
                });
            }
        });
    });
    return router;
};
