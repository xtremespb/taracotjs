module.exports = function(app) {
    var router = app.get('express').Router(),
        path = require('path'),
        ObjectId = require('mongodb').ObjectID,
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales.dev_mode
        }),
        async = require('async');
    router.get_module_name = function(req) {
        i18nm.setLocale(req.session.current_locale);
        return i18nm.__("module_name_cp");
    };
    router.get('/', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (!req.session.auth || req.session.auth.status < 2) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/cp/siteconf';
            res.redirect(303, "/auth/cp?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        var query = {
            $or: [{
                oname: 'site_mode'
            }, {
                oname: 'site_auth'
            }]
        };
        for (var l = 0; l < app.get('config').locales.avail.length; l++) {
            query.$or.push({
                oname: 'site_title',
                olang: app.get('config').locales.avail[l]
            });
            query.$or.push({
                oname: 'site_keywords',
                olang: app.get('config').locales.avail[l]
            });
            query.$or.push({
                oname: 'site_description',
                olang: app.get('config').locales.avail[l]
            });
        }
        app.get('mongodb').collection('settings').find(query).toArray(function(err, items) {
            var mode = '',
                authn = '',
                areas = '[]',
                meta = [];
            if (!err && items && items.length) {
                for (var i = 0; i < items.length; i++) {
                    if (items[i].oname == 'site_mode') mode = items[i].ovalue;
                    if (items[i].oname == 'site_auth') authn = items[i].ovalue;
                    if (items[i].oname == 'site_title' || items[i].oname == 'site_keywords' || items[i].oname == 'site_description') {
                        var item = {
                            id: items[i].oname,
                            val: items[i].ovalue,
                            lang: items[i].olang
                        };
                        meta.push(item);
                    }
                }
            }
            var body = app.get('renderer').render_file(path.join(__dirname, 'views'), 'siteconf_cp', {
                lang: i18nm,
                auth: req.session.auth,
                init_mode: mode,
                init_authn: authn,
                init_meta: JSON.stringify(meta),
                locales: JSON.stringify(app.get('config').locales.avail)
            }, req);
            app.get('cp').render(req, res, {
                body: body,
                css: '<link rel="stylesheet" href="/modules/siteconf/css/main.css">'
            }, i18nm, 'siteconf_cp', req.session.auth);
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
        var mode = req.body.mode,
            authn = req.body.authn,
            metadata = req.body.metadata;
        if (mode != 'private' && mode != 'invites' && mode != 'public' && mode != 'maintenance') {
            rep.status = 0;
            return res.send(JSON.stringify(rep));
        }
        try {
            if (metadata) metadata = JSON.parse(JSON.stringify(metadata));
        } catch (ex) {
            rep.status = 0;
            return res.send(JSON.stringify(rep));
        }
        if (!metadata || !(metadata instanceof Array)) {
            rep.status = 0;
            return res.send(JSON.stringify(rep));
        }
        var items = [];
        for (var i = 0; i < metadata.length; i++) {
            if (metadata[i].id == 'site_title' || metadata[i].id == 'site_description' || metadata[i].id == 'site_keywords') {
                for (var l = 0; l < app.get('config').locales.avail.length; l++) {
                    var item = {
                        olang: app.get('config').locales.avail[l],
                        oname: metadata[i].id,
                        ovalue: ''
                    };
                    if (metadata[i][app.get('config').locales.avail[l]]) item.ovalue = metadata[i][app.get('config').locales.avail[l]].replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r]/g, ' ');
                    items.push(item);
                }

            }
        }
        items.push({
            olang: '',
            oname: 'site_mode',
            ovalue: mode
        });
        items.push({
            olang: '',
            oname: 'site_auth',
            ovalue: authn
        });
        async.each(items, function(item, callback) {
            app.get('mongodb').collection('settings').update({
                oname: item.oname,
                olang: item.olang
            }, item, {
                upsert: true
            }, function(err, result) {
                if (err || !result) return callback(true);
                callback();
            });
        }, function(err) {
            if (err) {
                rep.status = 0;
                return res.send(JSON.stringify(rep));
            } else {
                return res.send(JSON.stringify(rep));
            }
        });
    });
    return router;
};
