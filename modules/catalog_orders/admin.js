module.exports = function(app) {
    // Sort order hash
    var sort_cells = {
        order_id: 1,
        item_id: 1,
        order_timestamp: 1,
        order_status: 1,
        sum_total: 1
    };
    var sort_cell_default = 'order_timestamp';
    var sort_cell_default_mode = -1;
    // Set items per page for this module
    var items_per_page = 30;
    //
    var router = app.get('express').Router();
    var ObjectId = require('mongodb').ObjectID;
    var gaikan = require('gaikan');
    var path = require('path');
    var async = require('async');
    var mailer = app.get('mailer');
    var i18nm = new(require('i18n-2'))({
        locales: app.get('config').locales,
        directory: app.get('path').join(__dirname, 'lang'),
        extension: '.js',
        devMode: app.get('config').locales_dev_mode
    });
    var countries = ["AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BA", "BW", "BV", "BR", "IO", "BN", "BG", "BF", "BI", "KH", "CM", "CA", "CV", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MK", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "AN", "NC", "NZ", "NI", "NE", "NG", "NU", "NF", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "SO", "ZA", "GS", "ES", "LK", "SD", "SR", "SJ", "SZ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU", "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW"];
    var pt_select_option = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_select_option.html');

    router.get_module_name = function(req) {
        i18nm.setLocale(req.session.current_locale);
        return i18nm.__("module_name");
    };

    router.get('/', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (!req.session.auth || req.session.auth.status < 2) {
            req.session.auth_redirect = '/cp/catalog_orders';
            res.redirect(303, "/auth/cp?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        app.get('mongodb').collection('warehouse_conf').find({
            $or: [{
                conf: 'ship'
            }, {
                conf: 'curs'
            }]
        }).toArray(function(err, db) {
            var whship = [],
                whcurs = [];
            if (!err && db && db.length) {
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'ship' && db[i].data)
                        try {
                            whship = JSON.parse(db[i].data);
                        } catch (ex) {}
                    if (db[i].conf == 'curs' && db[i].data)
                        try {
                            whcurs = JSON.parse(db[i].data);
                        } catch (ex) {}
                }
            }
            var sm = [];
            for (var s = 0; s < whship.length; s++) sm.push({
                id: whship[s].id,
                val: whship[s][req.session.current_locale]
            });
            var country_list_html = '';
            for (var c = 0; c < countries.length; c++)
                country_list_html += pt_select_option(gaikan, {
                    val: countries[c],
                    text: i18nm.__('country_list')[c]
                }, undefined);
            var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'catalog_orders_control', {
                lang: i18nm,
                locales: JSON.stringify(app.get('config').locales),
                order_status_list: JSON.stringify(i18nm.__('order_status_list')),
                shipping_methods: JSON.stringify(sm),
                country_list_html: country_list_html,
                auth_user_id: req.session.auth._id
            }, req);
            app.get('cp').render(req, res, {
                body: body,
                css: '<link rel="stylesheet" href="/modules/catalog_orders/css/main.css">' + "\n\t\t"
            }, i18nm, 'catalog_orders', req.session.auth);

        });
    });

    router.post('/data/list', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var moment = require('moment');
        moment.locale(req.session.current_locale);
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
        // Get catalog_orders from MongoDB
        rep.items = [];
        var find_query = {};
        if (query) {
            find_query = {
                $or: [{
                    order_id: new RegExp(query, 'i')
                }, {
                    ship_method: new RegExp(query, 'i')
                }]
            };
        }
        app.get('mongodb').collection('warehouse_orders').find(find_query).count(function(err, items_count) {
            if (!err && items_count > 0) {
                rep.total = items_count;
                app.get('mongodb').collection('warehouse_orders').find(find_query, {
                    skip: skip,
                    limit: items_per_page
                }).sort(sort).toArray(function(err, items) {
                    if (typeof items != 'undefined' && !err) {
                        var status_list = i18nm.__('order_status_list');
                        // Generate array
                        for (var i = 0; i < items.length; i++) {
                            var arr = [];
                            arr.push(items[i]._id);
                            arr.push(items[i].order_id);
                            arr.push(moment(items[i].order_timestamp).format('L LT'));
                            arr.push(status_list[items[i].order_status]);
                            arr.push(items[i].sum_total);
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
        var moment = require('moment');
        moment.locale(req.session.current_locale);
        var rep = {};
        var item_id = req.body.id;
        if (typeof item_id == 'undefined' || !item_id.match(/^[a-f0-9]{24}$/)) {
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
        // Get catalog_orders from MongoDB
        rep.data = {};
        app.get('mongodb').collection('warehouse_orders').find({
            _id: new ObjectId(item_id)
        }, {
            limit: 1
        }).toArray(function(err, items) {
            rep.data = [];
            if (typeof items != 'undefined' && !err)
                if (items.length > 0) rep.data = items[0];
            if (rep.data) rep.data.order_timestamp = moment(rep.data.order_timestamp).format('L LT');
            var cart_query = [];
            if (rep.data.cart_data)
                for (var ci in rep.data.cart_data)
                    cart_query.push({
                        pfilename: ci
                    });
            if (cart_query.length) {
                app.get('mongodb').collection('warehouse').find({
                    $or: cart_query,
                    plang: req.session.current_locale
                }).toArray(function(wh_err, whitems) {
                    rep.data.warehouse_titles = {};
                    if (whitems)
                        for (var i = 0; i < whitems.length; i++) rep.data.warehouse_titles[whitems[i].pfilename] = whitems[i].ptitle;
                    if (items[0].locked_by && items[0].locked_by != req.session.auth._id) {
                        app.get('mongodb').collection('users').find({
                            _id: new ObjectId(items[0].locked_by)
                        }).toArray(function(us_err, usitems) {
                            var user = items[0].locked_by;
                            if (!us_err && usitems && usitems.length)
                                user = usitems[0].username;
                            rep.status = 0;
                            rep.error = i18nm.__("locked");
                            rep.locked_by = user;
                            return res.send(JSON.stringify(rep));
                        });
                    } else {
                        app.get('mongodb').collection('warehouse_orders').update({
                            _id: new ObjectId(item_id)
                        }, {
                            $set: {
                                locked_by: req.session.auth._id
                            }
                        }, function() {
                            // Return results
                            rep.status = 1;
                            res.send(JSON.stringify(rep));
                        });
                    }
                });
            } else {
                // Return results
                rep.status = 1;
                res.send(JSON.stringify(rep));
            }
        });
    });

    router.post('/data/unlock', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var id = req.body.id;
        // Check data
        if (!req.session.auth || req.session.auth.status < 2 || !id || !id.match(/^[a-f0-9]{24}$/))
            return res.send(JSON.stringify({
                status: 0
            }));
        app.get('mongodb').collection('warehouse_orders').update({
            _id: new ObjectId(id)
        }, {
            $set: {
                locked_by: undefined
            }
        }, function() {
            // Return result
            return res.send(JSON.stringify({
                status: 1
            }));
        });
    });

    router.post('/data/sku', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var sku = req.body.sku;
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2 || !sku.match(/^[A-Za-z0-9_\-\.]{1,80}$/))
            return res.send(JSON.stringify({
                status: 0
            }));
        app.get('mongodb').collection('warehouse').find({
            pfilename: sku,
            plang: req.session.current_locale
        }).toArray(function(wh_err, whitems) {
            var title = i18nm.__('unknown_sku');
            if (!wh_err && whitems && whitems.length)
                title = whitems[0].ptitle;
            return res.send(JSON.stringify({
                status: 1,
                title: title
            }));
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
        var id = req.body.id,
            order_status = parseInt(req.body.order_status),
            sum_subtotal = parseFloat(req.body.sum_subtotal) || 0,
            sum_total = parseFloat(req.body.sum_total) || 0,
            shipping_method = req.body.shipping_method,
            shipping_address = req.body.shipping_address || {},
            ship_comment = req.body.ship_comment,
            ship_track = req.body.ship_track,
            cart_data = req.body.cart_data || [];
        // Validation
        if (!id || !id.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('warehouse_conf').find({
            $or: [{
                conf: 'ship'
            }, {
                conf: 'curs'
            }]
        }).toArray(function(err, db) {
            var whship = [];
            if (!err && db && db.length)
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'ship' && db[i].data)
                        try {
                            whship = JSON.parse(db[i].data);
                        } catch (ex) {}
                }
            var shipping_method_found = false;
            for (var wi = 0; wi < whship.length; wi++)
                if (whship[wi].id == shipping_method) shipping_method_found = true;
            if (!shipping_method_found) {
                rep.status = 0;
                rep.err_fields.push('shipping_method');
            }
            if (!sum_subtotal || sum_subtotal < 0) {
                rep.status = 0;
                rep.err_fields.push('sum_subtotal');
            }
            if (!sum_total || sum_total < 0) {
                rep.status = 0;
                rep.err_fields.push('sum_total');
            }
            if (typeof order_status === undefined || order_status < 0 || order_status > 4) {
                rep.status = 0;
                rep.err_fields.push('order_status');
            }
            if (ship_comment && ship_comment.length > 1024) {
                rep.status = 0;
                rep.err_fields.push('ship_comment');
            }
            if (rep.status === 0) return res.send(JSON.stringify(rep));
            var shipping_address_f = {
                ship_name: '',
                ship_street: '',
                ship_city: '',
                ship_region: '',
                ship_country: '',
                ship_zip: '',
                ship_phone: ''
            };
            if (shipping_address.ship_name && shipping_address.ship_name.length && shipping_address.ship_name.length < 81) shipping_address_f.ship_name = shipping_address.ship_name.replace(/</g, '').replace(/>/g, '').replace(/\"/g, '&quot;');
            if (shipping_address.ship_street && shipping_address.ship_street.length && shipping_address.ship_street.length < 121) shipping_address_f.ship_street = shipping_address.ship_street.replace(/</g, '').replace(/>/g, '').replace(/\"/g, '&quot;');
            if (shipping_address.ship_city && shipping_address.ship_city.length && shipping_address.ship_city.length < 121) shipping_address_f.ship_city = shipping_address.ship_city.replace(/</g, '').replace(/>/g, '').replace(/\"/g, '&quot;');
            if (shipping_address.ship_region && shipping_address.ship_region.length && shipping_address.ship_region.length < 121) shipping_address_f.ship_region = shipping_address.ship_region.replace(/</g, '').replace(/>/g, '').replace(/\"/g, '&quot;');
            if (shipping_address.ship_country && shipping_address.ship_country.match(/^[A-Z]{2}$/)) shipping_address_f.ship_country = shipping_address.ship_country;
            if (shipping_address.ship_zip && shipping_address.ship_zip.match(/^[0-9]{5,6}$/)) shipping_address_f.ship_zip = shipping_address.ship_zip;
            if (shipping_address.ship_phone && shipping_address.ship_phone.match(/^[0-9\+]{1,40}$/)) shipping_address_f.ship_phone = shipping_address.ship_phone;
            if (ship_comment && ship_comment.length < 1025) {
                ship_comment = ship_comment.replace(/</g, '').replace(/>/g, '').replace(/\"/g, '&quot;').replace(/\n/g, ' ');
            } else {
                ship_comment = '';
            }
            if (ship_track && ship_track.length < 81) {
                ship_track = ship_track.replace(/</g, '').replace(/>/g, '').replace(/\"/g, '&quot;').replace(/\n/g, ' ');
            } else {
                ship_track = '';
            }
            var cart_data_f = {};
            for (var key in cart_data)
                if (key.match(/^[A-Za-z0-9_\-\.]{1,80}$/)) cart_data_f[key] = parseInt(cart_data[key]) || 1;
            app.get('mongodb').collection('warehouse_orders').find({
                _id: new ObjectId(id)
            }, {
                limit: 1
            }).toArray(function(err, woitems) {
                if (err || !woitems || !woitems.length) {
                    rep.status = 0;
                    rep.error = i18nm.__("invalid_query");
                    return res.send(JSON.stringify(rep));
                }
                if (woitems[0]) {
                    app.get('mongodb').collection('users').find({
                        _id: new ObjectId(woitems[0].user_id)
                    }).toArray(function(us_err, usitems) {
                        if (woitems[0].order_status != order_status && !us_err && usitems && usitems.length && usitems[0].email) {
                            var mail_data = {
                                lang: i18nm,
                                order_id: woitems[0].order_id,
                                order_status_old: i18nm.__('order_status_list')[woitems[0].order_status],
                                order_status: i18nm.__('order_status_list')[order_status],
                                ship_track: ship_track || i18nm.__('no_tracking_number_yet'),
                                view_url: app.get('config').protocol + '://' + req.get('host') + '/catalog/orders?mode=view&order_id=' + id,
                                subj: i18nm.__('your_order_id') + ' ' + woitems[0].order_id
                            };
                            mailer.send(usitems[0].email, i18nm.__('your_order_id') + ' ' + woitems[0].order_id + ' (' + app.get('settings').site_title + ')', path.join(__dirname, 'views'), 'mail_statuschange_html', 'mail_statuschange_txt', mail_data, req);
                        }
                        app.get('mongodb').collection('warehouse_orders').update({
                            _id: new ObjectId(id)
                        }, {
                            $set: {
                                order_status: order_status,
                                cart_data: cart_data_f,
                                ship_method: shipping_method,
                                sum_subtotal: sum_subtotal,
                                sum_total: sum_total,
                                shipping_address: shipping_address_f,
                                ship_comment: ship_comment,
                                ship_track: ship_track,
                                locked_by: undefined
                            }
                        }, function() {
                            res.send(JSON.stringify(rep));
                        });
                    });
                }
            });
        });
    });

    router.post('/data/cancel', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        var id = req.body.id;
        // Validation
        if (!id || !id.match(/^[a-f0-9]{24}$/))
            return res.send({
                status: 0,
                error: i18nm.__("invalid_query")
            });
        app.get('mongodb').collection('warehouse_orders').find({
            _id: new ObjectId(id)
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err || !items || !items.length) return res.send({
                status: 0,
                error: i18nm.__("invalid_query")
            });
            var cart = items[0].cart_data,
                update_items = [];
            for (var key in cart) update_items.push(key);
            // Rollback the warehouse items amounts transaction
            async.each(update_items, function(item, callback) {
                app.get('mongodb').collection('warehouse').update({
                    pfilename: item,
                    pamount: {
                        $ne: -1
                    }
                }, {
                    $inc: {
                        pamount: cart[item],
                    }
                }, function(err) {
                    callback(err);
                });
            }, function(rollback_err) {
                // Set the order status to "Cancelled"
                app.get('mongodb').collection('warehouse_orders').update({
                        _id: new ObjectId(id)
                    }, {
                        $set: {
                            order_status: 4
                        }
                    },
                    function() {
                        // Send notification to user
                        app.get('mongodb').collection('users').find({
                            _id: new ObjectId(items[0].user_id)
                        }).toArray(function(us_err, usitems) {
                            if (!us_err && usitems && usitems.length && usitems[0].email) {
                                var mail_data = {
                                    lang: i18nm,
                                    order_id: items[0].order_id,
                                    order_status_old: i18nm.__('order_status_list')[items[0].order_status],
                                    order_status: i18nm.__('order_status_list')[4],
                                    ship_track: items[0].ship_track || i18nm.__('no_tracking_number_yet'),
                                    view_url: app.get('config').protocol + '://' + req.get('host') + '/catalog/orders?mode=view&order_id=' + id,
                                    subj: i18nm.__('your_order_id') + ' ' + items[0].order_id
                                };
                                mailer.send(usitems[0].email, i18nm.__('your_order_id') + ' ' + items[0].order_id + ' (' + app.get('settings').site_title + ')', path.join(__dirname, 'views'), 'mail_statuschange_html', 'mail_statuschange_txt', mail_data, req);
                                // OK
                                return res.send({
                                    status: 1
                                });
                            }
                        });
                    });
            });

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
                app.get('mongodb').collection('warehouse_orders').remove({
                    _id: new ObjectId(ids[i])
                }, dummy);
            }
        }
        res.send(JSON.stringify(rep));
    });

    var dummy = function() {};

    return router;
};
