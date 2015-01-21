module.exports = function(app) {
    // Sort order hash
    var sort_cells = {
        invcode: 1,
        invdate: 1,
        invused: 1
    };
    var sort_cell_default = 'invdate';
    var sort_cell_default_mode = -1;
    // Set items per page for this module
    var items_per_page = 30;
    //
    var router = app.get('express').Router();
    var ObjectId = require('mongodb').ObjectID;
    var i18nm = new(require('i18n-2'))({
        locales: app.get('config').locales.avail,
        directory: app.get('path').join(__dirname, 'lang'),
        extension: '.js',
        devMode: app.get('config').locales.dev_mode
    });
    var crypto = require('crypto');
    router.get_module_name = function(req) {
        i18nm.setLocale(req.session.current_locale);
        return i18nm.__("module_name");
    };
    router.get('/', function(req, res) {
    	var _locale = req.session.current_locale;
        i18nm.setLocale(_locale);
        if (!req.session.auth || req.session.auth.status < 2) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/cp/invites';
            res.redirect(303, "/auth/cp?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'invites_control', {
            lang: i18nm,
            locales: JSON.stringify(app.get('config').locales.avail),
            current_locale: _locale
        }, req);
        app.get('cp').render(req, res, {
            body: body,
            css: '<link rel="stylesheet" href="/modules/invites/css/main.css">' + "\n\t\t"
        }, i18nm, 'invites', req.session.auth);
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
        if (typeof skip != 'undefined') {
            if (!skip.match(/^[0-9]{1,10}$/)) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
                res.send(JSON.stringify(rep));
                return;
            }
        }
        if (typeof query != 'undefined') {
            if (!query.match(/^[\w\sА-Яа-я0-9_\-\.]{3,40}$/)) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
                res.send(JSON.stringify(rep));
                return;
            }
        }
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        var sort = {};
        sort[sort_cell_default] = sort_cell_default_mode;
        if (typeof sort_cell != 'undefined') {
            if (typeof sort_cells[sort_cell] != 'undefined') {
                sort = {};
                sort[sort_cell] = 1;
                if (typeof sort_mode != 'undefined' && sort_mode == -1) {
                    sort[sort_cell] = -1;
                }
            }
        }
        // Get invites from MongoDB
        rep.items = [];
        var find_query = {};
        if (query) {
            find_query = {
                invcode: new RegExp(query, 'i')
            };
        }
        app.get('mongodb').collection('invites').find(find_query).count(function(err, items_count) {
            if (!err && items_count > 0) {
                rep.total = items_count;
                app.get('mongodb').collection('invites').find(find_query, {
                    skip: skip,
                    limit: items_per_page
                }).sort(sort).toArray(function(err, items) {
                    if (typeof items != 'undefined' && !err) {
                        // Generate array
                        for (var i = 0; i < items.length; i++) {
                            var arr = [];
                            arr.push(items[i]._id);
                            arr.push(items[i].invdate);
                            arr.push(items[i].invcode);
                            arr.push(items[i].invused);
                            rep.items.push(arr);
                        }
                    }
                    // Return results
                    rep.status = 1;
                    res.send(JSON.stringify(rep));
                }); // data
            } else { // Error or count = 0
                rep.status = 1;
                rep.total = '0';
                res.send(JSON.stringify(rep));
            }
        }); // count
    });
    router.post('/data/load', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {};
        var user_id = req.body.id;
        if (typeof user_id == 'undefined' || !user_id.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            res.send(JSON.stringify(rep));
            return;
        }
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        // Get invites from MongoDB
        rep.data = {};
        app.get('mongodb').collection('invites').find({
            _id: new ObjectId(user_id)
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (typeof items != 'undefined' && !err) {
                if (items.length > 0) {
                    rep.data = items[0];
                }
            }
            // Return results
            rep.status = 1;
            res.send(JSON.stringify(rep));
        });
    });
    router.post('/data/generate', function(req, res) {
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
        var invcode = crypto.createHash('md5').update(Date.now() + Math.random().toString()).digest('hex') + crypto.createHash('md5').update(Date.now() + Math.random().toString()).digest('hex'),
        	invdate = Date.now();
        app.get('mongodb').collection('invites').insert({
            invdate: invdate,
            invcode: invcode,
            invused: '0'
        }, function() {
            rep.status = 1;
            rep.invdate = invdate;
            rep.invcode = invcode;
            rep.invused = '0';
            res.send(JSON.stringify(rep));
        });
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
            res.send(JSON.stringify(rep));
            return;
        }
        var ids = req.body.ids;
        if (typeof ids != 'object' || ids.length < 1) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            res.send(JSON.stringify(rep));
            return;
        }
        for (var i = 0; i < ids.length; i++) {
            if (ids[i].match(/^[a-f0-9]{24}$/)) {
                app.get('mongodb').collection('invites').remove({
                    _id: new ObjectId(ids[i])
                }, dummy);
            }
        }
        res.send(JSON.stringify(rep));
    });

    var dummy = function() {};

    return router;
};
