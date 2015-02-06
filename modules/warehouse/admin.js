module.exports = function(app) {

    // Sort order hash

    var sort_cells = {
            pcategory: 1,
            pfilename: 1,
            plock: 1,
            ptitle: 1
        },
        sort_cell_default = 'pcategory',
        sort_cell_default_mode = 1;

    // Set items per page for this module

    var items_per_page = 30;

    var router = app.get('express').Router(),
        ObjectId = require('mongodb').ObjectID,
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales.avail,
            directory: app.get('path').join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales.dev_mode
        }),
        parser = app.get('parser'),
        async = require('async'),
        util = require('util'),
        crypto = require('crypto'),
        fs = require("fs-extra"),
        gm;

    if (app.get('config').graphicsmagick) {
        gm = require('gm');
    }

    router.get_module_name = function(req) {
        i18nm.setLocale(req.session.current_locale);
        return i18nm.__("module_name");
    };

    router.get('/', function(req, res) {
        i18nm.setLocale(req.session.current_locale);

        if (!req.session.auth || req.session.auth.status < 2) {
            req.session.auth_redirect_host = req.get('host');
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
                    // Set default value for categories
                    categories = '[{"id":"j1_1","text":"/","data":null,"parent":"#","type":"root"}]';
                } else {
                    categories = items[0].ovalue;
                }
                var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'warehouse_control', {
                    lang: i18nm,
                    categories: categories,
                    auth: req.session.auth,
                    locales: JSON.stringify(app.get('config').locales.avail),
                    layouts: JSON.stringify(app.get('config').layouts),
                    current_locale: req.session.current_locale,
                    whitems: JSON.stringify(whitems),
                    whcollections: JSON.stringify(whcollections),
                    whcurs: JSON.stringify(whcurs)
                }, req);

                app.get('cp').render(req, res, {
                    body: body,
                    css: '<link rel="stylesheet" href="/modules/warehouse/css/main.css">' + '<link rel="stylesheet" href="/js/jstree/theme/style.min.css">'
                }, i18nm, 'warehouse', req.session.auth);

            });
        });
    });

    /*

    Pages

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
                    pfilename: new RegExp(query, 'i')
                }, {
                    pcategory: new RegExp(query, 'i')
                }]
            };
            var tsq = {};
            tsq["pdata." + req.session.current_locale + '.ptitle'] = new RegExp(query, 'i');
            find_query.$or.push(tsq);
        }
        app.get('mongodb').collection('warehouse').find(find_query).count(function(err, items_count) {
            if (!err && items_count > 0) {
                rep.total = items_count;
                app.get('mongodb').collection('warehouse').find(find_query, {
                    skip: skip,
                    limit: items_per_page
                }).sort(sort).toArray(function(err, items) {
                    if (!err && items && items.length) {
                        for (var i = 0; i < items.length; i++) {
                            var arr = [];
                            arr.push(items[i]._id);
                            if (items[i].pcategory != '/') {
                                items[i].pfilename = '/' + items[i].pfilename;
                                items[i].pfilename = items[i].pfilename.replace(/\/$/, '');
                            }
                            arr.push(items[i].pcategory + items[i].pfilename);
                            if (items[i].pdata && items[i].pdata[req.session.current_locale])
                                arr.push(items[i].pdata[req.session.current_locale].ptitle);
                            arr.push(items[i].plock);
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
        var id = req.body.pid,
            unlock = req.body.unlock;
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
        var root_pages = [];
        async.series([
                function(callback) {
                    // Get root pages
                    app.get('mongodb').collection('warehouse').find({
                        pfilename: ''
                    }, {
                        pcategory: 1
                    }, {
                        limit: 1000
                    }).toArray(function(err, items) {
                        if (!err && typeof items != 'undefined') {
                            for (var i = 0; i < items.length; i++) root_pages.push(items[i].pcategory);
                        }
                        callback();
                    });
                },
                function(callback) {
                    // Unlock
                    if (unlock) {
                        app.get('mongodb').collection('warehouse').update({
                            _id: new ObjectId(id)
                        }, {
                            $set: {
                                plock: ''
                            }
                        }, function(err) {
                            return callback();
                        });
                    } else {
                        callback();
                    }
                },
                function(callback) {
                    // Get page from MongoDB
                    app.get('mongodb').collection('warehouse').find({
                        _id: new ObjectId(id)
                    }).toArray(function(err, page_data) {
                        if (err || !page_data || !page_data.length) {
                            rep.status = 0;
                            rep.error = i18nm.__("no_results_in_table");
                            return callback(true);
                        }
                        rep.status = 1;
                        rep.warehouse_data = page_data[0];
                        rep.root_pages = root_pages;
                        return callback();
                    });
                },
                function(callback) {
                    // Set locking
                    if (rep.warehouse_data && !rep.warehouse_data.plock) {
                        app.get('mongodb').collection('warehouse').update({
                            _id: new ObjectId(id)
                        }, {
                            $set: {
                                plock: req.session.auth.username
                            }
                        }, function(err) {
                            return callback();
                        });
                    } else {
                        callback();
                    }
                }
            ],
            function(err) {
                return res.send(JSON.stringify(rep));
            }
        );
    });

    router.post('/data/unlock', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {};
        var id = req.body.pid;
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
        async.series([
                function(callback) {
                    // Unlock
                    app.get('mongodb').collection('warehouse').update({
                        _id: new ObjectId(id)
                    }, {
                        $set: {
                            plock: undefined
                        }
                    }, function(err) {
                        return callback();
                    });
                }
            ],
            function(err) {
                return res.send(JSON.stringify(rep));
            }
        );
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
        // Fields validation
        var warehouse_data = req.body.save_data;
        if (!warehouse_data) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            return res.send(JSON.stringify(rep));
        }
        if (warehouse_data._id)
            if (!warehouse_data._id.match(/^[a-f0-9]{24}$/)) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
                return res.send(JSON.stringify(rep));
            }
        if (!warehouse_data.pcategory_id || !warehouse_data.pcategory_id.match(/^[A-Za-z0-9_\-\.]{1,20}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_folder");
            return res.send(JSON.stringify(rep));
        }
        if (!warehouse_data.pfilename || !warehouse_data.pfilename.match(/^[A-Za-z0-9_\-\.]{0,80}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_pfilename");
            return res.send(JSON.stringify(rep));
        }
        if (!warehouse_data.pimages) warehouse_data.pimages = [];
        if (!util.isArray(warehouse_data.pimages)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            return res.send(JSON.stringify(rep));
        }
        for (var im = 0; im < warehouse_data.pimages.length; im++) {
            if (!warehouse_data.pimages[im].match(/^[a-f0-9]{32}$/)) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
                return res.send(JSON.stringify(rep));
            }
        }
        if (!warehouse_data.pamount || parseInt(warehouse_data.pamount) != warehouse_data.pamount || warehouse_data.pamount < 0) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_amount");
            return res.send(JSON.stringify(rep));
        }
        warehouse_data.pamount = parseInt(warehouse_data.pamount);
        if (!warehouse_data.pprice || parseFloat(warehouse_data.pprice) != warehouse_data.pprice || warehouse_data.pprice < 0) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_price");
            return res.send(JSON.stringify(rep));
        }
        warehouse_data.pprice = parseFloat(warehouse_data.pprice);
        if (!warehouse_data.pweight || parseFloat(warehouse_data.pweight) != warehouse_data.pweight || warehouse_data.pweight < 0) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_weight");
            return res.send(JSON.stringify(rep));
        }
        warehouse_data.pweight = parseFloat(warehouse_data.pweight);
        if (!warehouse_data.pcurs || !warehouse_data.pcurs.match(/^[a-z0-9]{1,20}$/i)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_price");
            return res.send(JSON.stringify(rep));
        }
        if (warehouse_data.pamount_unlimited == '1') {
            warehouse_data.pamount_unlimited = 1;
        } else {
            warehouse_data.pamount_unlimited = 0;
        }
        // Validate language-related data
        if (!warehouse_data.pdata || typeof warehouse_data.pdata != 'object') {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            return res.send(JSON.stringify(rep));
        }
        for (var pd in warehouse_data.pdata) {

            if (!warehouse_data.pdata[pd].pchars) warehouse_data.pdata[pd].pchars = [];
            if (!util.isArray(warehouse_data.pdata[pd].pchars)) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
                return res.send(JSON.stringify(rep));
            }
            for (var pc = 0; pc < warehouse_data.pdata[pd].pchars.length; pc++) {
                if (!warehouse_data.pdata[pd].pchars[pc].id || !warehouse_data.pdata[pd].pchars[pc].id.match(/^[a-z0-9\-_]{1,50}$/i)) {
                    rep.status = 0;
                    rep.error = i18nm.__("invalid_query");
                    return res.send(JSON.stringify(rep));
                }
                if (parseFloat(warehouse_data.pdata[pd].pchars[pc].val) == warehouse_data.pdata[pd].pchars[pc].val) {
                    warehouse_data.pdata[pd].pchars[pc].val = parseFloat(warehouse_data.pdata[pd].pchars[pc].val);
                } else {
                    if (warehouse_data.pdata[pd].pchars[pc].val) {
                        warehouse_data.pdata[pd].pchars[pc].val = warehouse_data.pdata[pd].pchars[pc].val.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
                    } else {
                        warehouse_data.pdata[pd].pchars[pc].val = '';
                    }
                }
            }

            if (!warehouse_data.pdata[pd].ptitle || warehouse_data.pdata[pd].ptitle.length > 100) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
                return res.send(JSON.stringify(rep));
            }
            if (!warehouse_data.pdata[pd].pshortdesc || warehouse_data.pdata[pd].pshortdesc.length > 100) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
                return res.send(JSON.stringify(rep));
            }
            var _plang = app.get('config').locales.avail[0];
            for (var i = 0; i < app.get('config').locales.avail.length; i++)
                if (warehouse_data.pdata[pd].plang == app.get('config').locales.avail[i])
                    _plang = app.get('config').locales.avail[i];
            warehouse_data.pdata[pd].plang = _plang;
            var _playout = app.get('config').layouts.default;
            for (var j = 0; j < app.get('config').layouts.avail.length; j++)
                if (warehouse_data.pdata[pd].playout == app.get('config').layouts.avail[j])
                    _playout = app.get('config').layouts.avail[j];
            warehouse_data.pdata[pd].playout = _playout;
        }
        var update = {
            pfilename: warehouse_data.pfilename,
            pcategory: warehouse_data.pcategory,
            pcategory_id: warehouse_data.pcategory_id,
            pimages: warehouse_data.pimages,
            pamount: warehouse_data.pamount,
            pamount_unlimited: warehouse_data.pamount_unlimited,
            pprice: warehouse_data.pprice,
            pweight: warehouse_data.pweight,
            pcurs: warehouse_data.pcurs,
            pdata: {}
        };
        for (var l in app.get('config').locales.avail)
            if (warehouse_data.pdata[app.get('config').locales.avail[l]]) {
                var lang = app.get('config').locales.avail[l];
                update.pdata[lang] = {};
                try {
                    update.pdata[lang].ptitle = warehouse_data.pdata[lang].ptitle;
                    update.pdata[lang].pshortdesc = warehouse_data.pdata[lang].pshortdesc;
                    update.pdata[lang].pkeywords = warehouse_data.pdata[lang].pkeywords;
                    update.pdata[lang].pdesc = warehouse_data.pdata[lang].pdesc;
                    update.pdata[lang].pcontent = warehouse_data.pdata[lang].pcontent;
                    update.pdata[lang].pchars = warehouse_data.pdata[lang].pchars;
                } catch (ex) {
                    rep.status = 0;
                    rep.error = i18nm.__("invalid_query") + ' (' + ex + ')';
                    return res.send(JSON.stringify(rep));
                }
            }
        async.series([
            function(callback) {
                if (warehouse_data._id) {
                    app.get('mongodb').collection('warehouse').find({
                        _id: new ObjectId(warehouse_data._id)
                    }, {
                        plock: 1
                    }).toArray(function(err, items) {
                        if (items && items.length)
                            if (items[0].plock && items[0].plock != req.session.auth.username) {
                                rep.status = 0;
                                rep.error = i18nm.__("locked_by") + ': ' + items[0].plock;
                                return callback(true);
                            }
                        callback();
                    });
                } else {
                    callback();
                }
            },
            function(callback) {
                var query = {
                    pfilename: warehouse_data.pfilename
                };
                if (warehouse_data._id)
                    query._id = {
                        $ne: new ObjectId(warehouse_data._id)
                    };
                app.get('mongodb').collection('warehouse').find(query, {
                    pfilename: 1
                }, {
                    limit: 1
                }).toArray(function(err, items) {
                    if (err || (items && items.length)) {
                        rep.status = 0;
                        rep.error = i18nm.__("page_exists");
                        return callback(true);
                    }
                    callback();
                });
            },
            function(callback) {
                var update_query = {
                    pfilename: warehouse_data.pfilename,
                    pcategory: warehouse_data.pcategory,
                };
                if (warehouse_data._id)
                    update_query = {
                        _id: new ObjectId(warehouse_data._id)
                    };
                app.get('mongodb').collection('warehouse').update(update_query, update, {
                    safe: false,
                    upsert: true
                }, function(err, result) {
                    if (err) return callback(true);
                    if (result && result._id) warehouse_data._id = result._id;
                    return callback();
                });
            },
            function(callback) {
                var search_data = [];
                for (var pd in warehouse_data.pdata)
                    search_data.push({
                        pr: parser.words(parser.html2text(warehouse_data.pdata[pd].pcontent), warehouse_data.pdata[pd].ptitle),
                        title: warehouse_data.pdata[pd].ptitle,
                        lang: pd,
                        desc: warehouse_data.pdata[pd].pdesc
                    });
                async.eachSeries(search_data, function(pd, _callback) {
                    var data = {
                        swords: pd.pr.words,
                        sdesc: pd.pr.desc,
                        stitle: pd.title,
                        slang: pd.lang,
                        item_id: warehouse_data._id,
                        surl: '/catalog/item' + (warehouse_data.pcategory + '/' + warehouse_data.pfilename).replace(/(\/+)/, '/').replace(/\s/g,''),
                        space: 'warehouse'
                    };
                    app.get('mongodb').collection('search_index').update({
                        item_id: warehouse_data._id,
                        slang: pd.lang
                    }, data, {
                        upsert: true,
                        safe: false
                    }, function() {
                        _callback();
                    });
                }, function(err) {
                    callback();
                });
            }
        ], function(err) {
            return res.send(JSON.stringify(rep));
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
