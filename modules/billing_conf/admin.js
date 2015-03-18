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
        util = require('util');
    router.get_module_name = function(req) {
        i18nm.setLocale(req.session.current_locale);
        return i18nm.__("module_name_cp");
    };
    router.get('/', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (!req.session.auth || req.session.auth.status < 2) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/cp/billing_conf';
            res.redirect(303, "/auth/cp?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        app.get('mongodb').collection('billing_conf').find({
            $or: [{
                conf: 'hosting'
            }, {
                conf: 'domains'
            }, {
                conf: 'misc'
            }, {
                conf: 'payment'
            }]
        }).toArray(function(err, db) {
            var hosting = [],
                domains = [],
                misc = [],
                payment = [];
            if (!err && db && db.length) {
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'hosting' && db[i].data)
                        try {
                            hosting = JSON.parse(db[i].data);
                        } catch (ex) {}
                    if (db[i].conf == 'domains' && db[i].data)
                        try {
                            domains = JSON.parse(db[i].data);
                        } catch (ex) {}
                    if (db[i].conf == 'misc' && db[i].data)
                        try {
                            misc = JSON.parse(db[i].data);
                        } catch (ex) {}
                    if (db[i].conf == 'payment' && db[i].data)
                        try {
                            payment = JSON.parse(db[i].data);
                        } catch (ex) {}
                }
            }
            var body = app.get('renderer').render_file(path.join(__dirname, 'views'), 'billing_conf_cp', {
                lang: i18nm,
                auth: req.session.auth,
                hosting: JSON.stringify(hosting),
                domains: JSON.stringify(domains),
                payment: JSON.stringify(payment),
                misc: JSON.stringify(misc),
                current_locale: req.session.current_locale,
                locales: JSON.stringify(app.get('config').locales.avail)
            }, req);
            app.get('cp').render(req, res, {
                body: body,
                css: '<link rel="stylesheet" href="/modules/billing_conf/css/main.css">'
            }, i18nm, 'billing_conf_cp', req.session.auth);
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
        var hosting = req.body.hosting,
            hosting_update = [],
            domains = req.body.domains,
            domains_update = [],
            payment = req.body.payment,
            payment_update = [],
            misc = req.body.misc,
            misc_update = [];
        if (hosting && util.isArray(hosting)) {
            for (var i = 0; i < hosting.length; i++) {
                var ui = {};
                if (hosting[i].id && hosting[i].id.match(/^[a-z0-9\-_]{1,50}$/i)) {
                    ui.id = hosting[i].id;
                    ui.price = hosting[i].price;
                    if (ui.price) ui.price = parseFloat(ui.price);
                    if (isNaN(ui.price)) ui.price = 0;
                    for (l = 0; l < app.get('config').locales.avail.length; l++) {
                        var li = hosting[i][app.get('config').locales.avail[l]];
                        if (li) {
                            li = li.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
                            ui[app.get('config').locales.avail[l]] = li;
                        }
                    }
                    hosting_update.push(ui);
                }
            }
        }
        if (domains && util.isArray(domains)) {
            for (var j = 0; j < domains.length; j++) {
                var uc = {};
                if (domains[j].id && domains[j].id.match(/^[a-zа-я0-9\-_]{1,50}$/i)) {
                    uc.id = domains[j].id;
                    uc.reg = domains[j].reg;
                    uc.up = domains[j].up;
                    if (uc.reg) uc.reg = parseFloat(uc.reg);
                    if (isNaN(uc.reg)) uc.reg = 0;
                    if (uc.up) uc.up = parseFloat(uc.up);
                    if (isNaN(uc.up)) uc.up = 0;
                    domains_update.push(uc);
                }
            }
        }
        if (payment && util.isArray(payment)) {
            for (var p = 0; p < payment.length; p++) {
                var pi = {};
                if (payment[p].id && payment[p].id.match(/^[a-z0-9\-_]{1,50}$/i)) {
                    pi.id = payment[p].id;
                    for (l = 0; l < app.get('config').locales.avail.length; l++) {
                        var lp = payment[p][app.get('config').locales.avail[l]];
                        if (lp) {
                            lp = lp.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
                            pi[app.get('config').locales.avail[l]] = lp;
                        }
                    }
                    payment_update.push(pi);
                }
            }
        }
        if (misc && util.isArray(misc)) {
            for (var mi = 0; mi < misc.length; mi++) {
                var uim = {};
                if (misc[mi].id && (misc[mi].id == 'currency')) {
                    uim.id = misc[mi].id;
                    for (l = 0; l < app.get('config').locales.avail.length; l++) {
                        var lim = misc[mi][app.get('config').locales.avail[l]];
                        if (lim) {
                            lim = lim.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
                            uim[app.get('config').locales.avail[l]] = lim;
                        }
                    }
                    misc_update.push(uim);
                }
            }
        }
        app.get('mongodb').collection('billing_conf').remove({}, function() {
            app.get('mongodb').collection('billing_conf').insert([{
                conf: 'hosting',
                data: JSON.stringify(hosting_update)
            }, {
                conf: 'domains',
                data: JSON.stringify(domains_update)
            }, {
                conf: 'misc',
                data: JSON.stringify(misc_update)
            }, {
                conf: 'payment',
                data: JSON.stringify(payment_update)
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
