module.exports = function(app) {
    var router = app.get('express').Router(),
        ObjectId = require('mongodb').ObjectID,
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales,
            directory: app.get('path').join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales_dev_mode
        }),
        util = require('util');
    router.get_module_name = function(req) {
        i18nm.setLocale(req.session.current_locale);
        return i18nm.__("module_name_cp");
    };
    router.get('/', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (!req.session.auth || req.session.auth.status < 2) {
            req.session.auth_redirect = '/cp/warehouseconf';
            res.redirect(303, "/auth/cp?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        app.get('mongodb').collection('warehouse_conf').find({
            $or: [{
                conf: 'items'
            }, {
                conf: 'collections'
            }, {
                conf: 'curs'
            }]
        }).toArray(function(err, db) {
            var items = [],
                collections = [],
                curs = [];
            if (!err && db && db.length) {
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'items' && db[i].data)
                        try {
                            items = JSON.parse(db[i].data);
                        } catch (ex) {}
                    if (db[i].conf == 'collections' && db[i].data)
                        try {
                            collections = JSON.parse(db[i].data);
                        } catch (ex) {}
                    if (db[i].conf == 'curs' && db[i].data)
                        try {
                            curs = JSON.parse(db[i].data);
                        } catch (ex) {}
                }
            }
            var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'warehouseconf_cp', {
                lang: i18nm,
                auth: req.session.auth,
                init_descitems: JSON.stringify(items),
                items: JSON.stringify(items),
                collections: JSON.stringify(collections),
                curs: JSON.stringify(curs),
                current_locale: req.session.current_locale,
                locales: JSON.stringify(app.get('config').locales)
            }, req);
            app.get('cp').render(req, res, {
                body: body,
                css: '<link rel="stylesheet" href="/modules/warehouseconf/css/main.css">' + "\n\t\t"
            }, i18nm, 'warehouseconf_cp', req.session.auth);
        });
    });
    router.post('/config/save', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        var descitems = req.body.descitems,
            descitems_update = [],
            collections = req.body.collections,
            curs = req.body.curs,
            curs_update = [];
        if (descitems && util.isArray(descitems)) {
            for (var i = 0; i < descitems.length; i++) {
                var ui = {};
                if (descitems[i].id && descitems[i].id.match(/^[a-z0-9]{1,50}$/i)) {
                    ui.id = descitems[i].id;
                    for (l = 0; l < app.get('config').locales.length; l++) {
                        var li = descitems[i][app.get('config').locales[l]];
                        if (li) {
                            li = li.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
                            ui[app.get('config').locales[l]] = li;
                        }
                    }
                    descitems_update.push(ui);
                }
            }
        }
        if (curs && util.isArray(curs)) {
            for (var j = 0; j < curs.length; j++) {
                var uc = {};
                if (curs[j].id && curs[j].id.match(/^[a-z0-9]{1,50}$/i)) {
                    uc.id = curs[j].id;
                    for (l = 0; l < app.get('config').locales.length; l++) {
                        var lc = curs[j][app.get('config').locales[l]];
                        if (lc) {
                            lc = lc.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
                            uc[app.get('config').locales[l]] = lc;
                        }
                    }
                    curs_update.push(uc);
                }
            }
        }
        if (collections && util.isArray(collections)) {
            for (var c = 0; c < collections.length; c++) {
                if (collections[c].id) collections[c].id = collections[c].id.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
                if (collections[c].items) for (ci = 0; ci < collections[c].items; ci++) collections[c].items[ci] = collections[c].items[ci].replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
            }
        }
        app.get('mongodb').collection('warehouse_conf').remove({}, function() {
            app.get('mongodb').collection('warehouse_conf').insert([{
                conf: 'items',
                data: JSON.stringify(descitems_update)
            }, {
                conf: 'collections',
                data: JSON.stringify(collections)
            }, {
                conf: 'curs',
                data: JSON.stringify(curs)
            }], function(err) {
                if (err) {
                    rep.status = 0;
                    return res.send(JSON.stringify(rep));
                }
                return res.send(JSON.stringify(rep));
            });
        });
    });
    return router;
};
