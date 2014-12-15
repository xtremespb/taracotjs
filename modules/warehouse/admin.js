module.exports = function(app) {
    // Sort order hash
    var sort_cells = {
        pcategory: 1,
        pfilename: 1,
        ptitle: 1,
        plang: 1
    };
    var sort_cell_default = 'pcategory';
    var sort_cell_default_mode = 1;
    // Set items per page for this module
    var items_per_page = 30;
    //
    var router = app.get('express').Router();
    var ObjectId = require('mongodb').ObjectID;
    var i18nm = new(require('i18n-2'))({
        locales: app.get('config').locales,
        directory: app.get('path').join(__dirname, 'lang'),
        extension: '.js',
        devMode: app.get('config').locales_dev_mode
    });
    var parser = app.get('parser');
    var crypto = require('crypto');
    var fs = require("fs-extra");
    var gm = false;
    if (app.get('config').graphicsmagick) {
        gm = require('gm');
    }
    var util = require('util');
    router.get_module_name = function(req) {
        i18nm.setLocale(req.session.current_locale);
        return i18nm.__("module_name");
    };
    router.get('/', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (!req.session.auth || req.session.auth.status < 2) {
            req.session.auth_redirect = '/cp/warehouse';
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
            var whitems = [],
                whcollections = [],
                whcurs = [];
            if (!err && db && db.length) {
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'items' && db[i].data)
                        try {
                            whitems = JSON.parse(db[i].data);
                        } catch (ex) {}
                    if (db[i].conf == 'collections' && db[i].data)
                        try {
                            whcollections = JSON.parse(db[i].data);
                        } catch (ex) {}
                    if (db[i].conf == 'curs' && db[i].data)
                        try {
                            whcurs = JSON.parse(db[i].data);
                        } catch (ex) {}
                }
            }
            app.get('mongodb').collection('warehouse_categories').find({
                oname: 'categories_json'
            }, {
                limit: 1
            }).toArray(function(err, items) {
                var categories;
                if (!items || !items.length || !items[0].ovalue) {
                    categories = '[{"id":"j1_1","text":"/","data":null,"parent":"#","type":"root"}]';
                } else {
                    categories = items[0].ovalue;
                }
                var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'warehouse_control', {
                    lang: i18nm,
                    categories: categories,
                    whitems: JSON.stringify(whitems),
                    whcollections: JSON.stringify(whcollections),
                    whcurs: JSON.stringify(whcurs),
                    auth: req.session.auth,
                    current_locale: req.session.current_locale,
                    locales: JSON.stringify(app.get('config').locales)
                }, req);
                app.get('cp').render(req, res, {
                    body: body,
                    css: '<link rel="stylesheet" href="/modules/warehouse/css/main.css">' + "\n\t\t" + '<link rel="stylesheet" href="/js/jstree/theme/style.min.css">' + "\n\t\t"
                }, i18nm, 'warehouse', req.session.auth);
            });
        });
    });

    /*

    warehouse

    */

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
        // Get warehouse from MongoDB
        rep.items = [];
        var find_query = {};
        if (query) {
            find_query = {
                $or: [{
                    pfilename: new RegExp(query, 'i')
                }, {
                    ptitle: new RegExp(query, 'i')
                }, {
                    pcategory: new RegExp(query, 'i')
                }]
            };
        }
        app.get('mongodb').collection('warehouse').find(find_query).count(function(err, items_count) {
            if (!err && items_count > 0) {
                rep.total = items_count;
                app.get('mongodb').collection('warehouse').find(find_query, {
                    skip: skip,
                    limit: items_per_page
                }).sort(sort).toArray(function(err, items) {
                    if (typeof items != 'undefined' && !err) {
                        // Generate array
                        for (var i = 0; i < items.length; i++) {
                            var arr = [];
                            arr.push(items[i]._id);
                            if (items[i].pcategory != '/') {
                                items[i].pfilename = '/' + items[i].pfilename;
                                items[i].pfilename = items[i].pfilename.replace(/\/$/, '');
                            }
                            arr.push(items[i].pcategory + items[i].pfilename);
                            arr.push(items[i].ptitle);
                            arr.push(items[i].plang);
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

    router.post('/data/list/all', function(req, res) {
        var lng = req.session.current_locale;
        i18nm.setLocale(lng);
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        var rep = {
                items: []
            }
            // Get warehouse from MongoDB
        app.get('mongodb').collection('warehouse').find({
            "plang": lng
        }, {
            limit: 1000
        }).sort({
            "ptitle": 1
        }).toArray(function(err, items) {
            if (typeof items != 'undefined' && !err) {
                // Generate array
                for (var i = 0; i < items.length; i++) {
                    var arr = [];
                    if (items[i].pcategory != '/') {
                        items[i].pfilename = '/' + items[i].pfilename;
                        items[i].pfilename = items[i].pfilename.replace(/\/$/, '');
                    }
                    arr.push(items[i].pcategory + items[i].pfilename);
                    arr.push(items[i].ptitle);
                    rep.items.push(arr);
                }
            }
            // Return results
            rep.status = 1;
            res.send(JSON.stringify(rep));
        }); // data

    });

    router.post('/data/rootcat', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {};
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        // Get warehouse from MongoDB
        app.get('mongodb').collection('warehouse').find({
            pfilename: ''
        }, {
            limit: 100
        }).toArray(function(err, items) {
            rep.root_warehouse = [];
            if (!err && typeof items != 'undefined') {
                for (var i = 0; i < items.length; i++) rep.root_warehouse.push(items[i].pcategory);
            }
            rep.status = 1;
            res.send(JSON.stringify(rep));
        });
    });

    router.post('/data/load', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {};
        var id = req.body.pid;
        if (id && !id.match(/^[a-f0-9]{24}$/)) {
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
        // Get warehouse from MongoDB
        rep.data = {};
        app.get('mongodb').collection('warehouse').find({
            pfilename: ''
        }, {
            limit: 100
        }).toArray(function(err, items) {
            rep.root_warehouse = [];
            if (!err && typeof items != 'undefined') {
                for (var i = 0; i < items.length; i++) rep.root_warehouse.push(items[i].pcategory);
            }
            app.get('mongodb').collection('warehouse').find({
                _id: new ObjectId(id)
            }, {
                limit: 1
            }).toArray(function(err, items) {
                if (typeof items != 'undefined' && !err) {
                    if (items.length > 0) {
                        rep.data = items[0];
                        // Set lock
                        if (!rep.data.lock_username) {
                            rep.data.lock_username = req.session.auth.username;
                            rep.data.lock_timestamp = Date.now();
                            app.get('mongodb').collection('warehouse').update({
                                _id: new ObjectId(id)
                            }, {
                                $set: {
                                    lock_username: rep.data.lock_username,
                                    lock_timestamp: rep.data.lock_timestamp
                                }
                            }, function(_err) {});
                        }
                    }
                }
                // Return results
                rep.status = 1;
                res.send(JSON.stringify(rep));
            });
        });
    });

    router.post('/data/lock', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        var rep = {};
        var id = req.body.pid;
        var lock_username = req.body.username;
        if (!id) {
            rep.status = 1;
            return res.send(JSON.stringify(rep));
        }
        if ((id && !id.match(/^[a-f0-9]{24}$/)) || lock_username.length > 80) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            res.send(JSON.stringify(rep));
            return;
        }
        var data = {};
        if (!lock_username) lock_username = '';
        data.lock_username = '';
        if (lock_username) data.lock_timestamp = 1000;
        app.get('mongodb').collection('warehouse').update({
            _id: new ObjectId(id)
        }, {
            $set: data
        }, function(_err) {
            if (_err) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
                res.send(JSON.stringify(rep));
                return;
            }
            rep.status = 1;
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
        var ptitle = req.body.ptitle,
            pshortdesc = req.body.pshortdesc,
            pfilename = req.body.pfilename,
            pcategory = req.body.pcategory,
            pcategory_id = req.body.pcategory_id,
            plang = req.body.plang,
            plangcopy = req.body.plangcopy,
            pkeywords = req.body.pkeywords,
            pdesc = req.body.pdesc,
            pcontent = req.body.pcontent,
            id = req.body.pid,
            pimages = req.body.pimages,
            pchars = req.body.pchars,
            pamount = req.body.pamount,
            pprice = req.body.pprice,
            pweight = req.body.pweight,
            pcurs = req.body.pcurs,
            current_timestamp = req.body.current_timestamp;
        if (pimages && !util.isArray(pimages)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            return res.send(JSON.stringify(rep));
        }
        if (pimages) {
            for (var im = 0; im < pimages.length; im++) {
                if (!pimages[im].match(/^[a-f0-9]{32}$/)) {
                    rep.status = 0;
                    rep.error = i18nm.__("invalid_query");
                    return res.send(JSON.stringify(rep));
                }
            }
        } else {
            pimages = [];
        }
        if (pchars) {
            for (var pc = 0; pc < pchars.length; pc++) {
                if (!pchars[pc].id || !pchars[pc].id.match(/^[a-z0-9]{1,50}$/i)) {
                    rep.status = 0;
                    rep.error = i18nm.__("invalid_query");
                    return res.send(JSON.stringify(rep));
                }
                if (pchars[pc].val) pchars[pc].val = pchars[pc].val.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
            }
        } else {
            pchars = [];
        }
        if (typeof id != 'undefined' && id) {
            if (!id.match(/^[a-f0-9]{24}$/)) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
                return res.send(JSON.stringify(rep));
            }
        }
        var _plang = app.get('config').locales[0];
        for (var i = 0; i < app.get('config').locales.length; i++) {
            if (plang == app.get('config').locales[i]) {
                _plang = app.get('config').locales[i];
            }
        }
        plang = _plang;
        // Check form fields
        if (!ptitle || !ptitle.length || ptitle.length > 100) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_ptitle");
            res.send(JSON.stringify(rep));
            return;
        }
        if (pshortdesc && pshortdesc.length > 1024) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_pshortdesc");
            res.send(JSON.stringify(rep));
            return;
        }
        if (!pcategory_id.match(/^[A-Za-z0-9_\-\.]{1,20}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_category");
            res.send(JSON.stringify(rep));
            return;
        }
        if (!pfilename.match(/^[A-Za-z0-9_\-\.]{0,80}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_pfilename");
            res.send(JSON.stringify(rep));
            return;
        }
        if (!pamount || parseInt(pamount) != pamount || pamount < -1) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_amount");
            return res.send(JSON.stringify(rep));
        }
        if (!pprice || parseFloat(pprice) != pprice || pprice < 0) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_price");
            return res.send(JSON.stringify(rep));
        }
        if (!pweight || parseFloat(pweight) != pweight || pweight < 0) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_weight");
            return res.send(JSON.stringify(rep));
        }
        if (!pcurs || !pcurs.match(/^[a-z0-9]{1,20}$/i)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_price");
            return res.send(JSON.stringify(rep));
        }

        // Save

        app.get('mongodb').collection('menu').find({
            lang: plang
        }, {
            limit: 1
        }).toArray(function(err, items) {
            var search_data = parser.words(parser.html2text(pshortdesc + "\n\n" + pcontent), ptitle);
            if (id) {
                app.get('mongodb').collection('menu').find({
                    lang: plang
                }, {
                    limit: 1
                }).toArray(function(err, items) {
                    var menu_source, menu_uikit, menu_uikit_offcanvas, menu_raw, menu_id;
                    if (!err && items && items.length && items[0].menu_source && items[0].menu_raw && items[0].menu_uikit) {
                        menu_source = items[0].menu_source;
                        menu_raw = items[0].menu_raw;
                        menu_uikit = items[0].menu_uikit;
                        menu_uikit_offcanvas = items[0].menu_uikit_offcanvas;
                    }
                    app.get('mongodb').collection('warehouse').find({
                        pfilename: pfilename,
                        plang: plang,
                        _id: {
                            $ne: new ObjectId(id)
                        }
                    }, {
                        limit: 1
                    }).toArray(function(err, items) {
                        if ((typeof items != 'undefined' && items.length > 0) || err) {
                            rep.status = 0;
                            rep.error = i18nm.__("page_exists");
                            rep.err_fields.push('pfilename');
                            res.send(JSON.stringify(rep));
                            return;
                        }
                        app.get('mongodb').collection('warehouse').find({
                            _id: new ObjectId(id)
                        }, {
                            limit: 1
                        }).toArray(function(err, items) {
                            if (typeof items != 'undefined' && !err) {
                                if (items.length > 0) {
                                    var update = {
                                        ptitle: ptitle,
                                        pshortdesc: pshortdesc,
                                        pfilename: pfilename,
                                        pcategory: pcategory,
                                        pcategory_id: pcategory_id,
                                        plang: plang,
                                        pkeywords: pkeywords,
                                        pdesc: pdesc,
                                        pimages: pimages,
                                        pchars: pchars,
                                        pcontent: pcontent,
                                        pamount: pamount,
                                        pprice: pprice,
                                        pweight: pweight,
                                        pcurs: pcurs,
                                        lock_username: '',
                                        lock_timestamp: 0,
                                        last_modified: Date.now()
                                    };
                                    if (items[0].lock_username && items[0].lock_username != req.session.auth.username) {
                                        rep.status = 0;
                                        rep.lock_username = items[0].lock_username;
                                        rep.lock_timestamp = items[0].lock_timestamp;
                                        rep.locked = 1;
                                        return res.send(JSON.stringify(rep));
                                    }
                                    if (items[0].last_modified && items[0].last_modified != current_timestamp) {
                                        rep.status = 0;
                                        rep.outdated = 1;
                                        rep.current_timestamp = items[0].last_modified;
                                        return res.send(JSON.stringify(rep));
                                    }
                                    app.get('mongodb').collection('warehouse').update({
                                        _id: new ObjectId(id)
                                    }, update, function(_err) {
                                        rep.status = 1;
                                        res.send(JSON.stringify(rep));
                                        if (!_err) {
                                            var data1 = app.get('mongodb').collection('search_index').find({
                                                space: 'warehouse',
                                                item_id: id
                                            }).toArray(function(si_err, si_items) {
                                                if (err) return;
                                                var url = '/catalog/item/' + pfilename;
                                                url = url.replace(/(\/+)/, '/');
                                                var data = {
                                                    swords: search_data.words,
                                                    sdesc: pshortdesc,
                                                    stitle: ptitle,
                                                    slang: plang,
                                                    surl: url
                                                };
                                                if (si_items && si_items.length) {
                                                    app.get('mongodb').collection('search_index').update({
                                                        item_id: id
                                                    }, {
                                                        $set: data
                                                    }, function() {});
                                                } else {
                                                    data.item_id = id;
                                                    data.space = 'warehouse';
                                                    app.get('mongodb').collection('search_index').insert(data, function() {});
                                                }
                                            });
                                        }
                                    });
                                    if (menu_source) {
                                        var url_old = items[0].pcategory;
                                        if (url_old != '/') url_old += '/';
                                        url_old += items[0].pfilename;
                                        if (items[0].pcategory != '/') {
                                            url_old = url_old.replace(/\/$/, '');
                                        }
                                        var url_new = pcategory;
                                        if (url_new != '/') url_new += '/';
                                        url_new += pfilename;
                                        if (pcategory != '/') {
                                            url_new = url_new.replace(/\/$/, '');
                                        }
                                        var rx1 = new RegExp('href=\"' + url_old + '\"');
                                        var rx2 = new RegExp('>' + url_old + '<');
                                        menu_source = menu_source.replace(rx1, 'href="' + url_new + '"').replace(rx2, '>' + url_new + '<');
                                        menu_raw = menu_raw.replace(rx1, 'href="' + url_new + '"');
                                        menu_uikit = menu_uikit.replace(rx1, 'href="' + url_new + '"');
                                        menu_uikit_offcanvas = menu_uikit_offcanvas.replace(rx1, 'href="' + url_new + '"');
                                        var data = {
                                            lang: plang,
                                            menu_source: menu_source,
                                            menu_raw: menu_raw,
                                            menu_uikit: menu_uikit,
                                            menu_uikit_offcanvas: menu_uikit_offcanvas
                                        };
                                        app.get('mongodb').collection('menu').update({
                                            lang: plang
                                        }, data, function() {});
                                    }
                                    return;
                                }
                            } else {
                                rep.status = 0;
                                rep.error = i18nm.__("id_not_found");
                                res.send(JSON.stringify(rep));
                            }
                        });
                    });
                });
            } else {
                var data1 = app.get('mongodb').collection('warehouse').find({
                    pfilename: pfilename
                }, {
                    limit: 1
                }).toArray(function(err, items) {
                    if ((typeof items != 'undefined' && items.length > 0) || err) {
                        rep.status = 0;
                        rep.error = i18nm.__("page_exists");
                        rep.err_fields.push('pfilename');
                        res.send(JSON.stringify(rep));
                        return;
                    }
                    app.get('mongodb').collection('warehouse').insert({
                        ptitle: ptitle,
                        pshortdesc: pshortdesc,
                        pfilename: pfilename,
                        pcategory: pcategory,
                        pcategory_id: pcategory_id,
                        plang: plang,
                        pkeywords: pkeywords,
                        pdesc: pdesc,
                        pimages: pimages,
                        pamount: pamount,
                        pprice: pprice,
                        pweight: pweight,
                        pcurs: pcurs,
                        pcontent: pcontent,
                        last_modified: Date.now()
                    }, function(_err, _items) {
                        if (!_err) {
                            var url = pcategory + '/' + pfilename;
                            url = url.replace(/(\/+)/, '/');
                            var data = {
                                swords: search_data.words,
                                slang: plang,
                                sdesc: search_data.desc,
                                stitle: ptitle,
                                surl: url,
                                item_id: _items[0]._id.toHexString(),
                                space: 'warehouse'
                            };
                            app.get('mongodb').collection('search_index').insert(data, function() {});
                        }
                        rep.status = 1;
                        res.send(JSON.stringify(rep));
                    });
                });
            }

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
                app.get('mongodb').collection('warehouse').remove({
                    _id: new ObjectId(ids[i])
                }, dummy);
                app.get('mongodb').collection('search_index').remove({
                    item_id: ids[i]
                }, dummy);
            }
        }
        res.send(JSON.stringify(rep));
    });

    router.post('/data/upload', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {};
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        if (!req.files || !req.files.file) {
            rep.status = 0;
            rep.error = i18nm.__("no_file_sent");
            res.send(JSON.stringify(rep));
            return;
        }
        var file = req.files.file;
        if (!gm || (file.mimetype != 'image/png' && file.mimetype != 'image/jpeg')) {
            rep.status = 0;
            rep.error = i18nm.__("not_images");
            res.send(JSON.stringify(rep));
            return;
        }
        if (file.size > app.get('config').max_upload_file_mb * 1048576) {
            rep.status = 0;
            rep.error = i18nm.__("file_too_big");
            res.send(JSON.stringify(rep));
            return;
        }
        var _filename = crypto.createHash('md5').update(file.originalname + Date.now() + Math.random()).digest('hex');
        var _extension = file.extension || '';
        if (_filename) _filename = _filename.toLowerCase();
        if (_extension) _extension = _extension.toLowerCase();
        var img = gm(app.get('config').dir.tmp + '/' + file.name);
        img.autoOrient();
        img.size(function(err, size) {
            if (err) {
                rep.status = 0;
                rep.error = i18nm.__("upload_failed");
                fs.unlinkSync(app.get('config').dir.tmp + '/' + file.name);
                return res.send(JSON.stringify(rep));
            }
            img.setFormat('jpeg');
            if (size.width >= size.height) {
                img.resize(null, 800);
            } else {
                img.resize(800, null);
            }
            img.write(app.get('config').dir.storage + '/warehouse/' + _filename + '.jpg', function(err) {
                if (err) {
                    rep.status = 0;
                    rep.error = i18nm.__("upload_failed");
                    fs.unlinkSync(app.get('config').dir.tmp + '/' + file.name);
                    return res.send(JSON.stringify(rep));
                }
                if (size.width >= size.height) {
                    img.resize(null, 300);
                    img.crop(300, 300, 0, 0);
                } else {
                    img.resize(300, null);
                    img.crop(300, 300, 0, 0);
                }
                img.write(app.get('config').dir.storage + '/warehouse/tn_' + _filename + '.jpg', function(err) {
                    if (err) {
                        rep.status = 0;
                        rep.error = i18nm.__("upload_failed");
                        fs.unlinkSync(app.get('config').dir.tmp + '/' + file.name);
                        return res.send(JSON.stringify(rep));
                    }
                    fs.unlinkSync(app.get('config').dir.tmp + '/' + file.name);
                    rep.status = 1;
                    rep.id = _filename;
                    res.send(JSON.stringify(rep));
                    return;
                });
            });
        });
    });

    router.post('/data/upload/delete', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {};
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        pimages = req.body.pimages;
        if (pimages && !util.isArray(pimages)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            return res.send(JSON.stringify(rep));
        }
        if (pimages) {
            for (var im = 0; im < pimages.length; im++) {
                if (!pimages[im].match(/^[a-f0-9]{32}$/)) {
                    rep.status = 0;
                    rep.error = i18nm.__("invalid_query");
                    return res.send(JSON.stringify(rep));
                }
            }
        } else {
            pimages = [];
        }
        for (var i = 0; i < pimages.length; i++) {
            var _filename = pimages[i];
            if (fs.existsSync(app.get('config').dir.storage + '/warehouse/' + _filename + '.jpg')) fs.unlinkSync(app.get('config').dir.storage + '/warehouse/' + _filename + '.jpg');
            if (fs.existsSync(app.get('config').dir.storage + '/warehouse/tn_' + _filename + '.jpg')) fs.unlinkSync(app.get('config').dir.storage + '/warehouse/tn_' + _filename + '.jpg');
        }
        rep.status = 1;
        res.send(JSON.stringify(rep));
    });

    var dummy = function() {};

    /*

    Folders

    */

    router.post('/data/categories/load', function(req, res) {
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
        app.get('mongodb').collection('warehouse_categories').find({
            oname: 'categories_json'
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err) {
                rep.status = 0;
                rep.error = i18nm.__("cannot_load_db_data");
                res.send(JSON.stringify(rep));
                return;
            }
            if (!items || !items.length || !items[0].ovalue) {
                rep.categories = '[{"id":"j1_1","text":"/","data":null,"parent":"#","type":"root"}]';
                res.send(JSON.stringify(rep));
                return;
            }
            rep.categories = items[0].ovalue;
            res.send(JSON.stringify(rep));
        });
    });

    router.post('/data/categories/save', function(req, res) {
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
        var json = req.body.json;
        try {
            JSON.parse(json);
        } catch (e) {
            rep.status = 0;
            rep.error = i18nm.__("cannot_parse_json");
            res.send(JSON.stringify(rep));
            return;
        }
        app.get('mongodb').collection('warehouse_categories').remove(function(err) {
            if (!err) {
                app.get('mongodb').collection('warehouse_categories').insert({
                    oname: 'categories_json',
                    ovalue: json
                }, function(err) {
                    if (err) {
                        rep.status = 0;
                        rep.error = i18nm.__("cannot_save_db_data");
                        res.send(JSON.stringify(rep));
                        return;
                    }
                    res.send(JSON.stringify(rep));
                });
            }
        });
    });
    return router;
};
