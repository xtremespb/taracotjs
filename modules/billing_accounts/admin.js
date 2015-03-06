// Sort order hash

var sort_cells = {
        baccount: 1,
        buser: 1,
        bplan: 1,
        bexp: 1
    },
    sort_cell_default = 'baccount',
    sort_cell_default_mode = 1;

// Set items per page for this module

var items_per_page = 30;

module.exports = function(app) {
    var router = app.get('express').Router(),
        path = require('path'),
        ObjectId = require('mongodb').ObjectID,
        async = require('async'),
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales.dev_mode
        });
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
            }]
        }).toArray(function(err, db) {
            var hosting = [],
                domains = [],
                misc = [];
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
                }
            }
            var body = app.get('renderer').render_file(path.join(__dirname, 'views'), 'billing_accounts_cp', {
                lang: i18nm,
                auth: req.session.auth,
                hosting: JSON.stringify(hosting),
                domains: JSON.stringify(domains),
                misc: JSON.stringify(misc),
                current_locale: req.session.current_locale,
                current_user: req.session.auth.username,
                locales: JSON.stringify(app.get('config').locales.avail)
            }, req);
            app.get('cp').render(req, res, {
                body: body,
                css: '<link rel="stylesheet" href="/modules/billing_accounts/css/main.css">'
            }, i18nm, 'billing_conf_cp', req.session.auth);
        });
    });

    router.post('/data/list', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            ipp: items_per_page
        };
        var skip = req.body.skip;
        var query = req.body.query;
        var sort_mode = req.body.sort_mode;
        var sort_cell = req.body.sort_cell;
        if (typeof skip != 'undefined')
            if (!skip.match(/^[0-9]{1,10}$/)) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
                return res.send(JSON.stringify(rep));
            }
        if (typeof query != 'undefined')
            if (!query.match(/^[\w\sА-Яа-я0-9_\-\.]{3,40}$/)) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
                return res.send(JSON.stringify(rep));
            }
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var sort = {};
        sort[sort_cell_default] = sort_cell_default_mode;
        if (sort_cells && sort_cells[sort_cell]) {
            sort = {};
            sort[sort_cell] = 1;
            if (typeof sort_mode != 'undefined' && sort_mode == -1) {
                sort[sort_cell] = -1;
            }
        }
        rep.items = [];
        var find_query = {};
        if (query) {
            find_query = {
                $or: [{
                    baccount: new RegExp(query, 'i')
                }, {
                    buser_save: new RegExp(query, 'i')
                }, {
                    bplan: new RegExp(query, 'i')
                }]
            };
            var tsq = {};
            tsq["pdata." + req.session.current_locale + '.ptitle'] = new RegExp(query, 'i');
            find_query.$or.push(tsq);
        }
        app.get('mongodb').collection('billing_accounts').find(find_query).count(function(err, items_count) {
            if (!err && items_count > 0) {
                rep.total = items_count;
                app.get('mongodb').collection('billing_accounts').find(find_query, {
                    skip: skip,
                    limit: items_per_page
                }).sort(sort).toArray(function(err, items) {
                    var users_hash = {};
                    async.series([
                        function(callback) {
                            var _q_users = [],
                                _q_check = {};
                            if (!err && items && items.length) {
                                for (var i = 0; i < items.length; i++) {
                                    if (!_q_check[items[i].buser]) {
                                        _q_users.push({
                                            _id: new ObjectId(items[i].buser)
                                        });
                                        _q_check[items[i].buser] = 1;
                                    }
                                }
                            }
                            if (_q_users.length) {
                                app.get('mongodb').collection('users').find({
                                    $or: _q_users
                                }).toArray(function(err, items) {
                                    if (!err && items && items.length)
                                        for (var i = 0; i < items.length; i++)
                                            users_hash[items[i]._id] = items[i].username;
                                    callback();
                                });
                            } else {
                                callback();
                            }
                        },
                        function(callback) {
                            if (!err && items && items.length) {
                                for (var i = 0; i < items.length; i++) {
                                    var arr = [];
                                    arr.push(items[i]._id);
                                    arr.push(items[i].baccount);
                                    arr.push(users_hash[items[i].buser] || items[i].buser);
                                    arr.push(items[i].bplan);
                                    arr.push(items[i].bexp);
                                    arr.push(items[i].btype);
                                    rep.items.push(arr);
                                }
                            }
                            // Return results
                            rep.status = 1;
                            res.send(JSON.stringify(rep));
                            return callback();
                        }
                    ]);
                }); // data
            } else { // Error or count = 0
                rep.status = 1;
                rep.total = '0';
                res.send(JSON.stringify(rep));
            }
        }); // count
    });

    router.post('/data/delete', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var ids = req.body.ids;
        if (typeof ids != 'object' || ids.length < 1) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            return res.send(JSON.stringify(rep));
        }
        for (var i = 0; i < ids.length; i++) {
            if (ids[i].match(/^[a-f0-9]{24}$/)) {
                app.get('mongodb').collection('billing_accounts').remove({
                    _id: new ObjectId(ids[i])
                }, dummy);
            }
        }
        res.send(JSON.stringify(rep));
    });

    router.post('/data/save', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var baccount = req.body.baccount,
            bplan = req.body.bplan,
            buser = req.body.buser,
            bexp = req.body.bexp,
            btype = req.body.btype,
            id = req.body.id;
        // Validate
        if (id)
            if (typeof id != 'string' || !id.match(/^[a-f0-9]{24}$/)) {
                rep.status = 0;
                rep.err_msg = i18nm.__("invalid_id");
                return res.send(JSON.stringify(rep));
            }
        if (btype != 'h' && btype != 'd') {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_account_type");
            return res.send(JSON.stringify(rep));
        }
        if (btype == 'h')
            if (!baccount || typeof baccount != 'string' || !baccount.match(/^[A-Za-z0-9_\-]{3,20}$/)) {
                rep.status = 0;
                rep.err_msg = i18nm.__("invalid_account");
                rep.err_field = 'account';
                return res.send(JSON.stringify(rep));
            }
        if (btype == 'd')
            if (!baccount || typeof baccount != 'string' || !baccount.match(/^[A-ZА-Яа-яa-z0-9_\-]{2,63}$/)) {
                rep.status = 0;
                rep.err_msg = i18nm.__("invalid_account");
                rep.err_field = 'account';
                return res.send(JSON.stringify(rep));
            }
        if (!buser || typeof buser != 'string' || !buser.match(/^[A-Za-z0-9_\-]{3,20}$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_user");
            rep.err_field = 'user';
            return res.send(JSON.stringify(rep));
        }
        if (!bexp || !isInt(parseInt(bexp))) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_exp");
            rep.err_field = 'exp';
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('billing_conf').find({
            $or: [{
                conf: 'hosting'
            }, {
                conf: 'domains'
            }, {
                conf: 'misc'
            }]
        }).toArray(function(err, db) {
            var hosting = [],
                domains = [],
                misc = [];
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
                }
            }
            if (btype == 'h') {
                var _bplan;
                for (var plan in hosting)
                    if (hosting[plan].id === bplan) _bplan = hosting[plan].id;
                if (!_bplan) {
                    rep.status = 0;
                    rep.err_msg = i18nm.__("invalid_plan");
                    rep.err_field = 'plan';
                    return res.send(JSON.stringify(rep));
                }
                bplan = _bplan;
            }
            if (btype == 'd') {
                var _zone;
                for (var zone in domains)
                    if (domains[zone].id === bplan) _zone = domains[zone].id;
                if (!_zone) {
                    rep.status = 0;
                    rep.err_msg = i18nm.__("invalid_domain_zone");
                    rep.err_field = 'plan';
                    return res.send(JSON.stringify(rep));
                }
                bplan = _zone;
            }
            var check_query = {
                baccount: baccount,
                btype: btype
            };
            if (id) check_query._id = {
                $ne: new ObjectId(id)
            };
            app.get('mongodb').collection('billing_accounts').find(check_query).toArray(function(err, acts) {
                if (err || (acts && acts.length)) {
                    rep.status = 0;
                    rep.err_msg = i18nm.__("account_already_exists");
                    rep.err_field = 'account';
                    return res.send(JSON.stringify(rep));
                }
                app.get('mongodb').collection('users').find({
                    username: buser
                }).toArray(function(err, users) {
                    if (!err && users && users.length) {
                        var update = {
                                btype: btype,
                                buser: users[0]._id,
                                buser_save: buser,
                                baccount: baccount,
                                bplan: bplan,
                                bexp: bexp
                            },
                            query = {};
                        if (id) {
                            query._id = new ObjectId(id);
                        } else {
                            query.baccount = baccount;
                            query.btype = btype;
                        }
                        res.send(JSON.stringify(rep));
                        app.get('mongodb').collection('billing_accounts').update(query, update, {
                            safe: false,
                            upsert: true
                        }, function(err, result) {
                            if (err) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                return res.send(JSON.stringify(rep));
                            }
                            res.send(JSON.stringify(rep));
                        });
                    } else {
                        rep.status = 0;
                        rep.err_msg = i18nm.__("user_unknown_in_system");
                        rep.err_field = 'user';
                        return res.send(JSON.stringify(rep));
                    }
                });
            });
        });
    });

    router.post('/data/load', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var id = req.body.id;
        // Validate
        if (!id || typeof id != 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_id");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('billing_accounts').find({
            _id: new ObjectId(id)
        }).toArray(function(err, users) {
            if (err || !users || !users.length) {
                rep.status = 0;
                rep.err_msg = i18nm.__("ajax_failed");
                return res.send(JSON.stringify(rep));
            }
            rep.account = users[0];
            app.get('mongodb').collection('billing_accounts').update({
                _id: new ObjectId(id)
            }, {
                $set: {
                    block: req.session.auth.username
                }
            }, function(err) {
                return res.send(JSON.stringify(rep));
            });
        });
    });

    router.post('/data/unlock', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        var id = req.body.id;
        if (!id || !id.match(/^[a-f0-9]{24}$/)) {
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
        app.get('mongodb').collection('billing_accounts').update({
            _id: new ObjectId(id)
        }, {
            $set: {
                block: undefined
            }
        }, function(err) {
            return res.send(JSON.stringify(rep));
        });
    });

    var dummy = function() {};

    function isInt(n) {
        return Number(n) === n && n % 1 === 0;
    }

    return router;
};
