module.exports = function(app) {

    var router = app.get('express').Router(),
        gaikan = require('gaikan'),
        renderer = app.get('renderer'),
        path = app.get('path'),
        ObjectId = require('mongodb').ObjectID,
        fs = require('fs'),
        parser = app.get('parser'),
        async = require('async');

    var catalog = gaikan.compileFromFile(path.join(__dirname, 'views') + '/catalog.html'),
        cart = gaikan.compileFromFile(path.join(__dirname, 'views') + '/cart.html'),
        checkout = gaikan.compileFromFile(path.join(__dirname, 'views') + '/checkout.html'),
        orders = gaikan.compileFromFile(path.join(__dirname, 'views') + '/orders.html'),
        catalog_item = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_catalog_item.html'),
        catalog_item_view = gaikan.compileFromFile(path.join(__dirname, 'views') + '/item.html'),
        pt_li_a = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_li_a.html'),
        pt_nav_sub = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_nav_sub.html'),
        pt_btn_mini = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_btn_mini.html'),
        pt_btn_mini_disabled = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_btn_mini_disabled.html'),
        pt_btn = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_btn.html'),
        pt_btn_disabled = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_btn_disabled.html'),
        pt_pagination = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_pagination.html'),
        pt_page_normal = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_page_normal.html'),
        pt_page_span = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_page_span.html'),
        pt_tn_img = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_tn_img.html'),
        pt_desc_list = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_desc_list.html'),
        pt_desc_list_item = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_desc_list_item.html'),
        pt_cart = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_cart.html'),
        pt_cart_item = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_cart_item.html'),
        pt_checkout = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_checkout.html'),
        pt_checkout_item = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_checkout_item.html'),
        pt_alert_warning = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_alert_warning.html'),
        pt_select_option = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_select_option.html'),
        pt_orders = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_orders.html'),
        pt_orders_tr = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_orders_tr.html');

    var i18nm = new(require('i18n-2'))({
        locales: app.get('config').locales,
        directory: app.get('path').join(__dirname, 'lang'),
        extension: '.js',
        devMode: app.get('config').locales_dev_mode
    });

    var _default_folders_hash = [{
        "id": "j1_1",
        "text": "/",
        "data": null,
        "parent": "#",
        "type": "root"
    }];

    var countries = ["AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BA", "BW", "BV", "BR", "IO", "BN", "BG", "BF", "BI", "KH", "CM", "CA", "CV", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MK", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "AN", "NC", "NZ", "NI", "NE", "NG", "NU", "NF", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "SO", "ZA", "GS", "ES", "LK", "SD", "SR", "SJ", "SZ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU", "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW"];

    router.post('/ajax/order', function(req, res, next) {
        var _locale = req.session.current_locale;
        i18nm.setLocale(_locale);
        if (!req.session.auth || req.session.auth.status < 1)
            return res.send(JSON.stringify({
                status: 0,
                error: i18nm.__('unauth')
            }));
        var id = req.body.id;
        if (!id || !id.match(/^[a-f0-9]{24}$/))
            return res.send(JSON.stringify({
                status: 0,
                error: i18nm.__('invalid_id')
            }));
        // Get order information
        app.get('mongodb').collection('warehouse_orders').find({
            _id: new ObjectId(id)
        }).toArray(function(err, whorders) {
            if (err || !whorders || !whorders.length || whorders[0].user_id != req.session.auth._id)
                return res.send(JSON.stringify({
                    status: 0,
                    error: i18nm.__('unauth')
                }));
            var rep = whorders[0];
            rep.status = 1;
            // Get warehouse configuration
            app.get('mongodb').collection('warehouse_conf').find({
                $or: [{
                    conf: 'curs'
                }]
            }).toArray(function(err, db) {
                var whcurs = [];
                if (!err && db && db.length) {
                    for (var i = 0; i < db.length; i++) {
                        if (db[i].conf == 'curs' && db[i].data)
                            try {
                                whcurs = JSON.parse(db[i].data);
                            } catch (ex) {}
                    }
                }
                var cart = whorders[0].cart_data,
                    warehouse_query = [];
                rep.cart_data = [];
                for (var key in cart) warehouse_query.push({
                    pfilename: key
                });
                // Get requested warehouse items
                app.get('mongodb').collection('warehouse').find({
                    $or: warehouse_query,
                    plang: _locale
                }).toArray(function(wh_err, whitems) {
                    var moment = require('moment');
                    var whitems_hash = {};
                    if (whitems && whitems.length)
                        for (var wi = 0; wi < whitems.length; wi++)
                            whitems_hash[whitems[wi].pfilename] = whitems[wi].ptitle;
                    for (var key in cart)
                        rep.cart_data.push({
                            title: whitems_hash[key] || key,
                            amount: cart[key]
                        });
                    rep.order_timestamp = moment(rep.order_timestamp).format('L LT');
                    return res.send(JSON.stringify(rep));
                });
            });
        });
    });

    router.get('/orders', function(req, res, next) {
        var _locale = req.session.current_locale;
        i18nm.setLocale(_locale);
        var page = parseInt(req.query.page) || 1,
            sort = req.query.sort || 't',
            show_all = req.query.show_all || '1',
            init_find = req.query.find || '',
            init_cat = req.query.cat || '';
        if (sort && sort != 't' && sort != 'u' && sort != 'd') sort = 't';
        if (show_all && show_all != '1' && show_all != '0') show_all = '1';
        if (page && (page == "NaN" || page < 0)) page = 1;
        if (init_cat) init_cat = init_cat.trim().replace(/\"/g, '').replace(/</g, '').replace(/>/g, '');
        if (init_find) init_find = init_find.trim().replace(/\"/g, '').replace(/</g, '').replace(/>/g, '');
        if (!req.session.auth || req.session.auth.status < 1) {
            req.session.auth_redirect = "/catalog/orders?rnd=" + Math.random().toString().replace('.', '') + '&page=' + page + '&sort=' + sort + '&show_all=' + show_all + '&find=' + init_find + '&cat=' + init_cat;
            res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        var moment = require('moment');
        app.get('mongodb').collection('warehouse_conf').find({
            $or: [{
                conf: 'curs'
            }]
        }).toArray(function(err, db) {
            var whcurs = [];
            if (!err && db && db.length) {
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'curs' && db[i].data)
                        try {
                            whcurs = JSON.parse(db[i].data);
                        } catch (ex) {}
                }
            }
            app.get('mongodb').collection('warehouse_orders').find({
                user_id: req.session.auth._id
            }, {
                limit: 100
            }).sort({
                order_timestamp: -1
            }).toArray(function(err, whorders) {
                var orders_html = i18nm.__('no_orders');
                if (!err && whorders && whorders.length) {
                    var orders_list_html = '';
                    for (var o = 0; o < whorders.length; o++)
                        orders_list_html += pt_orders_tr(gaikan, {
                            lang: i18nm,
                            id: whorders[o]._id,
                            order_id: whorders[o].order_id,
                            order_date: moment(whorders[o].order_timestamp).format('L LT'),
                            order_status: i18nm.__('order_status_list')[whorders[o].order_status],
                            order_sum: whorders[o].sum_total + ' ' + whcurs[0][_locale]
                        }, undefined);
                    orders_html = pt_orders(gaikan, {
                        lang: i18nm,
                        items: orders_list_html
                    }, undefined);
                }
                var out_html = orders(gaikan, {
                    lang: i18nm,
                    init_sort: sort,
                    init_view: show_all,
                    init_path: init_cat,
                    init_page: page,
                    init_find: init_find,
                    orders_html: orders_html
                }, undefined);
                var data = {
                    title: i18nm.__('my_orders'),
                    current_lang: _locale,
                    page_title: i18nm.__('my_orders'),
                    content: out_html,
                    keywords: '',
                    description: '',
                    extra_css: "\n\t" + '<link rel="stylesheet" href="/modules/catalog/css/frontend.css" type="text/css">'
                };
                app.get('renderer').render(res, undefined, data, req);
            });
        });
    });

    router.post('/ajax/checkout', function(req, res, next) {
        var _locale = req.session.current_locale;
        i18nm.setLocale(_locale);
        if (!req.session.auth || req.session.auth.status < 1)
            return res.send(JSON.stringify({
                status: 0,
                error: i18nm.__('unauth'),
                stop: 1
            }));
        var ship_method = (req.body.ship_method || '').replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, ''),
            ship_name = (req.body.ship_name || '').replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/</g, '').replace(/>/g, '').replace(/\"/g, '&quot;'),
            ship_street = (req.body.ship_street || '').replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/</g, '').replace(/>/g, '').replace(/\"/g, '&quot;'),
            ship_city = (req.body.ship_city || '').replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/</g, '').replace(/>/g, '').replace(/\"/g, '&quot;'),
            ship_region = (req.body.ship_region || '').replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/</g, '').replace(/>/g, '').replace(/\"/g, '&quot;'),
            ship_country = (req.body.ship_country || '').replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/</g, '').replace(/>/g, '').replace(/\"/g, '&quot;'),
            ship_zip = (req.body.ship_zip || '').replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/</g, '').replace(/>/g, '').replace(/\"/g, '&quot;'),
            ship_phone = (req.body.ship_phone || '').replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/</g, '').replace(/>/g, '').replace(/\"/g, '&quot;'),
            ship_comment = (req.body.ship_comment || '').replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/</g, '').replace(/>/g, '').replace(/\"/g, '&quot;').replace(/\n/g, ' '),
            total_cost = parseFloat(req.body.total_cost);
        var shipping_address = {};
        if (!ship_method.match(/_noaddr$/i)) {
            var errors = [];
            if (!ship_name || !ship_name.length || ship_name.length > 80) errors.push(i18nm.__('invalid_name'));
            if (!ship_street || !ship_street.length || ship_street.length > 120) errors.push(i18nm.__('invalid_street'));
            if (!ship_city || !ship_city.length || ship_city.length > 120) errors.push(i18nm.__('invalid_city'));
            if (!ship_region || !ship_region.length || ship_region.length > 120) errors.push(i18nm.__('invalid_region'));
            if (!ship_country || !ship_country.match(/^[A-Z]{2}$/)) errors.push(i18nm.__('invalid_country'));
            if (!ship_zip || !ship_zip.match(/^[0-9]{5,6}$/)) errors.push(i18nm.__('invalid_country'));
            if (!ship_phone || !ship_phone.match(/^[0-9\+]{1,40}$/)) errors.push(i18nm.__('invalid_phone'));
            if (ship_comment && ship_comment.length > 1024) errors.push(i18nm.__('invalid_comment'));
            if (!total_cost || total_cost < 0) errors.push(i18nm.__('invalid_total_cost'));
            if (!errors.length) {
                var country = '';
                for (var cn = 0; cn < countries.length; cn++)
                    if (countries[cn] == ship_country) country = countries[cn];
                if (!country) errors.push(i18nm.__('invalid_country'));
            }
            if (errors.length)
                return res.send(JSON.stringify({
                    status: 0,
                    error: errors.join('. ')
                }));
            shipping_address = {
                ship_name: ship_name,
                ship_street: ship_street,
                ship_city: ship_city,
                ship_region: ship_region,
                ship_country: ship_country,
                ship_zip: ship_zip,
                ship_phone: ship_phone
            };
        }
        app.get('mongodb').collection('warehouse_conf').find({
            $or: [{
                conf: 'curs'
            }, {
                conf: 'ship'
            }]
        }).toArray(function(err, db) {
            var whcurs = [],
                whship = [];
            if (!err && db && db.length) {
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'curs' && db[i].data)
                        try {
                            whcurs = JSON.parse(db[i].data);
                        } catch (ex) {}
                }
                for (var s = 0; s < db.length; s++) {
                    if (db[s].conf == 'ship' && db[s].data)
                        try {
                            whship = JSON.parse(db[s].data);
                        } catch (ex) {}
                }
            }
            var whship_found;
            for (var sh = 0; sh < whship.length; sh++)
                if (whship[sh].id === ship_method) whship_found = whship[sh];
            if (!whship_found)
                return res.send(JSON.stringify({
                    status: 0,
                    error: i18nm.__('invalid_ship_method')
                }));
            var curs_hash = {},
                rate_hash = {};
            for (var cs = 0; cs < whcurs.length; cs++) {
                curs_hash[whcurs[cs].id] = whcurs[cs][_locale] || whcurs[cs].id;
                rate_hash[whcurs[cs].id] = whcurs[cs].exr || 1;
            }
            var catalog_cart = req.session.catalog_cart || [];
            var warehouse_query = [];
            for (var ca = 0; ca < catalog_cart.length; ca++) warehouse_query.push({
                pfilename: catalog_cart[ca].sku
            });
            app.get('mongodb').collection('warehouse').find({
                $or: warehouse_query,
                plang: _locale
            }).toArray(function(wh_err, whitems) {
                var subtotal = 0,
                    total_weight = 0,
                    total_amount = 0;
                if (whitems) {
                    var cart = {};
                    for (var wi = 0; wi < whitems.length; wi++) {
                        var amount = 0;
                        for (var cc = 0; cc < catalog_cart.length; cc++)
                            if (catalog_cart[cc].sku == whitems[wi].pfilename) amount = catalog_cart[cc].amount || 0;
                        var currency = curs_hash[whitems[wi].pcurs] || whitems[wi].pcurs,
                            sum = whitems[wi].pprice * amount;
                        if (parseInt(whitems[wi].pamount) > -1 && parseInt(whitems[wi].pamount) < amount)
                            return res.send(JSON.stringify({
                                status: 0,
                                error: i18nm.__('item_missing') + ': ' + whitems[wi].ptitle,
                                stop: 1
                            }));
                        cart[whitems[wi].pfilename] = parseFloat(amount);
                        subtotal += sum * rate_hash[whitems[wi].pcurs];
                        total_weight += whitems[wi].pweight * amount;
                        total_amount = parseInt(total_amount) + parseInt(amount);
                    }
                    var ship_cost = whship_found.price;
                    if (whship_found.weight > 0 && total_weight > 0) ship_cost *= Math.ceil(total_weight / whship_found.weight);
                    if (whship_found.amnt > 0) ship_cost *= Math.ceil(total_amount / whship_found.amnt);
                    var total = ship_cost + subtotal;
                    if (total_cost != total)
                        return res.send(JSON.stringify({
                            status: 0,
                            error: i18nm.__('invalid_total_cost'),
                            stop: 1
                        }));
                    // Update the amounts
                    var update_items = [];
                    for (var key in cart) update_items.push(key);
                    async.each(update_items, function(item, callback) {
                        app.get('mongodb').collection('warehouse').update({
                            pfilename: item
                        }, {
                            $inc: {
                                pamount: -cart[item]
                            }
                        }, function(err) {
                            callback(err);
                        });
                    }, function(update_err) {
                        app.get('mongodb').collection('warehouse').find({
                            $or: warehouse_query,
                            plang: _locale
                        }).toArray(function(uc_err, ucitems) {
                            var fail = false;
                            if (uc_err || update_err || !ucitems) fail = true;
                            if (ucitems && !fail)
                                for (var uci = 0; uci < ucitems.length; uci++)
                                    if (ucitems[uci].pamount < 0) fail = true;
                            if (fail) {
                                // Something went wrong, we need to rollback the transaction
                                async.each(update_items, function(item, callback) {
                                    app.get('mongodb').collection('warehouse').update({
                                        pfilename: item,
                                        pamount: {
                                            $ne: -1
                                        }
                                    }, {
                                        $inc: {
                                            pamount: cart[item]
                                        }
                                    }, function(err) {
                                        callback(err);
                                    });
                                }, function(rollback_err) {
                                    return res.send(JSON.stringify({
                                        status: 0,
                                        error: i18nm.__('order_place_failed'),
                                        stop: 1
                                    }));
                                });
                            } else {
                                // Let's place an order
                                // Get unique order ID
                                app.get('mongodb').collection('counters').findAndModify({
                                    _id: 'warehouse_orders'
                                }, [], {
                                    $inc: {
                                        seq: 1
                                    }
                                }, {
                                    new: true
                                }, function(err, counters) {
                                    var order_id;
                                    if (err || !counters || !counters.seq) order_id = Date.now();
                                    if (counters.seq) order_id = counters.seq;
                                    // Insert a new order into warehouse_orders collection
                                    app.get('mongodb').collection('warehouse_orders').insert({
                                        user_id: req.session.auth._id,
                                        order_id: order_id,
                                        order_timestamp: Date.now(),
                                        order_status: 0,
                                        cart_data: cart,
                                        ship_method: ship_method,
                                        sum_subtotal: subtotal,
                                        sum_total: total,
                                        shipping_address: shipping_address,
                                        ship_comment: ship_comment
                                    }, function(err) {
                                        if (err) {
                                            // Something went wrong, we need to rollback the transaction
                                            async.each(update_items, function(item, callback) {
                                                app.get('mongodb').collection('warehouse').update({
                                                    pfilename: item,
                                                    pamount: {
                                                        $ne: -1
                                                    }
                                                }, {
                                                    $inc: {
                                                        pamount: cart[item]
                                                    }
                                                }, function(err) {
                                                    callback(err);
                                                });
                                            }, function(rollback_err) {
                                                return res.send(JSON.stringify({
                                                    status: 0,
                                                    error: i18nm.__('order_place_failed'),
                                                    stop: 1
                                                }));
                                            });
                                        } else {
                                            // Everything's fine, order has been placed
                                            // Try to store shipping address in the database
                                            app.get('mongodb').collection('warehouse_addr').update({
                                                _id: req.session.auth._id,
                                            }, {
                                                shipping_address: shipping_address
                                            }, {
                                                upsert: true,
                                                safe: false
                                            }, function() {
                                                // Return success
                                                return res.send(JSON.stringify({
                                                    status: 1,
                                                    order_id: order_id
                                                }));
                                            });
                                        }
                                    });
                                });

                            }
                        });
                    });
                } else {
                    return res.send(JSON.stringify({
                        status: 0,
                        error: i18nm.__('no_items_in_checkout'),
                        stop: 1
                    }));
                }
            });
        });
    });

    router.get('/checkout', function(req, res, next) {
        var _locale = req.session.current_locale;
        i18nm.setLocale(_locale);
        var page = parseInt(req.query.page) || 1,
            sort = req.query.sort || 't',
            show_all = req.query.show_all || '1',
            init_find = req.query.find || '',
            init_cat = req.query.cat || '';
        if (sort && sort != 't' && sort != 'u' && sort != 'd') sort = 't';
        if (show_all && show_all != '1' && show_all != '0') show_all = '1';
        if (page && (page == "NaN" || page < 0)) page = 1;
        if (init_cat) init_cat = init_cat.trim().replace(/\"/g, '').replace(/</g, '').replace(/>/g, '');
        if (init_find) init_find = init_find.trim().replace(/\"/g, '').replace(/</g, '').replace(/>/g, '');
        if (!req.session.auth || req.session.auth.status < 1) {
            req.session.auth_redirect = "/catalog/checkout?rnd=" + Math.random().toString().replace('.', '') + '&page=' + page + '&sort=' + sort + '&show_all=' + show_all + '&find=' + init_find + '&cat=' + init_cat;
            res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        app.get('mongodb').collection('warehouse_conf').find({
            $or: [{
                conf: 'curs'
            }, {
                conf: 'ship'
            }]
        }).toArray(function(err, db) {
            var whcurs = [],
                whship = [];
            if (!err && db && db.length) {
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'curs' && db[i].data)
                        try {
                            whcurs = JSON.parse(db[i].data);
                        } catch (ex) {}
                }
                for (var s = 0; s < db.length; s++) {
                    if (db[s].conf == 'ship' && db[s].data)
                        try {
                            whship = JSON.parse(db[s].data);
                        } catch (ex) {}
                }
            }
            var curs_hash = {},
                rate_hash = {};
            for (var cs = 0; cs < whcurs.length; cs++) {
                curs_hash[whcurs[cs].id] = whcurs[cs][_locale] || whcurs[cs].id;
                rate_hash[whcurs[cs].id] = whcurs[cs].exr || 1;
            }
            var catalog_cart = req.session.catalog_cart || [];
            var warehouse_query = [];
            for (var ca = 0; ca < catalog_cart.length; ca++) warehouse_query.push({
                pfilename: catalog_cart[ca].sku
            });
            app.get('mongodb').collection('warehouse').find({
                $or: warehouse_query,
                plang: _locale
            }).toArray(function(wh_err, whitems) {
                var checkout_html = '';
                var subtotal = 0,
                    missing_items = [],
                    total_weight = 0,
                    total_amount = 0;
                if (whitems) {
                    for (var wi = 0; wi < whitems.length; wi++) {
                        var amount = 0;
                        for (var cc = 0; cc < catalog_cart.length; cc++)
                            if (catalog_cart[cc].sku == whitems[wi].pfilename) amount = catalog_cart[cc].amount || 0;
                        var currency = curs_hash[whitems[wi].pcurs] || whitems[wi].pcurs,
                            sum = whitems[wi].pprice * amount,
                            item_missing = '';
                        if (parseInt(whitems[wi].pamount) > -1 && parseInt(whitems[wi].pamount) < amount) {
                            missing_items.push(whitems[wi].pfilename);
                            item_missing = pt_alert_warning(gaikan, {
                                msg: i18nm.__('item_missing')
                            }, undefined);
                        }
                        subtotal += sum * rate_hash[whitems[wi].pcurs];
                        total_weight += whitems[wi].pweight * amount;
                        total_amount = parseInt(total_amount) + parseInt(amount);
                        checkout_html += pt_checkout_item(gaikan, {
                            lang: i18nm,
                            title: whitems[wi].ptitle,
                            price: whitems[wi].pprice,
                            sku: whitems[wi].pfilename,
                            amount: amount,
                            item_missing: item_missing,
                            sum: sum,
                            currency: currency
                        }, undefined);
                    }
                    checkout_html = pt_checkout(gaikan, {
                        body: checkout_html,
                        subtotal: subtotal,
                        subtotal_currency: whcurs[0][_locale],
                        lang: i18nm
                    }, undefined);
                } else {
                    checkout_html = i18nm.__('no_items_in_checkout');
                }
                var country_list_html = '',
                    sm_list_html = '';
                for (var i = 0; i < countries.length; i++)
                    country_list_html += pt_select_option(gaikan, {
                        val: countries[i],
                        text: i18nm.__('country_list')[i]
                    }, undefined);
                for (var sm = 0; sm < whship.length; sm++)
                    sm_list_html += pt_select_option(gaikan, {
                        val: whship[sm].id,
                        text: whship[sm][_locale]
                    }, undefined);
                var out_html = checkout(gaikan, {
                    lang: i18nm,
                    checkout_html: checkout_html,
                    country_list_html: country_list_html,
                    sm_list_html: sm_list_html,
                    init_checkout: JSON.stringify(catalog_cart || []),
                    init_sort: sort,
                    init_view: show_all,
                    init_path: init_cat,
                    init_page: page,
                    init_find: init_find,
                    total_weight: total_weight,
                    total_amount: total_amount,
                    shipping_methods: JSON.stringify(whship),
                    subtotal_currency: whcurs[0][_locale],
                    subtotal: subtotal,
                    missing_items: JSON.stringify(missing_items)
                }, undefined);
                var data = {
                    title: i18nm.__('checkout'),
                    current_lang: _locale,
                    page_title: i18nm.__('checkout'),
                    content: out_html,
                    keywords: '',
                    description: '',
                    extra_css: "\n\t" + '<link rel="stylesheet" href="/modules/catalog/css/frontend.css" type="text/css">'
                };
                app.get('renderer').render(res, undefined, data, req);
            });
        });
    });

    router.post('/ajax/cart', function(req, res, next) {
        var _locale = req.session.current_locale;
        i18nm.setLocale(_locale);
        // Get and validate cart values
        var cart_values = req.body.values;
        if (!cart_values || !cart_values.length) return res.send(JSON.stringify({
            status: 0
        }));
        for (var i = 0; i < cart_values.length; i++)
            if (!cart_values[i].id || !cart_values[i].id.match(/^[A-Za-z0-9_\-\.]{0,80}$/) || isNaN(parseInt(cart_values[i].val)) || parseInt(cart_values[i].val) < 0) return res.send(JSON.stringify({
                status: 0
            }));
            // Generate hash pairs: sku -> amount
        var cart_values_hash = {};
        for (var cv = 0; cv < cart_values.length; cv++) cart_values_hash[cart_values[cv].id] = cart_values[cv].val;
        // Get cart from session
        var catalog_cart = req.session.catalog_cart || [],
            subtotal = 0;
        // Get currency data
        app.get('mongodb').collection('warehouse_conf').find({
            $or: [{
                conf: 'curs'
            }]
        }).toArray(function(err, db) {
            var whcurs = [];
            // Parse currency data if available
            if (!err && db && db.length) {
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'curs' && db[i].data)
                        try {
                            whcurs = JSON.parse(db[i].data);
                        } catch (ex) {}
                }
            }
            // Generate currency and exchange rate hashes
            var curs_hash = {},
                rate_hash = {};
            for (var cs = 0; cs < whcurs.length; cs++) {
                curs_hash[whcurs[cs].id] = whcurs[cs][_locale] || whcurs[cs].id;
                rate_hash[whcurs[cs].id] = whcurs[cs].exr || 1;
            }
            // Generate new catalog cart
            var _catalog_cart = [];
            for (var cc = 0; cc < catalog_cart.length; cc++) {
                var ncv = cart_values_hash[catalog_cart[cc].sku];
                if (ncv !== undefined) {
                    if (parseInt(ncv) > 999) ncv = 999;
                    catalog_cart[cc].amount = ncv;
                    if (ncv > 0) {
                        _catalog_cart.push(catalog_cart[cc]);
                    }
                } else {
                    _catalog_cart.push(catalog_cart[cc]);
                }
            }
            var warehouse_query = [];
            for (var ca = 0; ca < catalog_cart.length; ca++) warehouse_query.push({
                pfilename: catalog_cart[ca].sku
            });
            if (!warehouse_query.length) {
                var cart = [];
                for (var wi = 0; wi < catalog_cart.length; wi++)
                    cart.push({
                        id: catalog_cart[wi].sku,
                        sum: 0,
                        amount: 0
                    });
                req.session.catalog_cart = _catalog_cart;
                return res.send(JSON.stringify({
                    status: 1,
                    subtotal: 0,
                    cart: cart,
                    cart_size: 0
                }));
            }
            app.get('mongodb').collection('warehouse').find({
                $or: warehouse_query,
                plang: _locale
            }).toArray(function(wh_err, whitems) {
                if (wh_err) return res.send(JSON.stringify({
                    status: 0
                }));
                var cart = [];
                for (var wi = 0; wi < whitems.length; wi++) {
                    var amount = cart_values_hash[whitems[wi].pfilename];
                    if (parseInt(whitems[wi].pamount) != -1 && amount > parseInt(whitems[wi].pamount)) {
                        amount = parseInt(whitems[wi].pamount);
                        for (var wit = 0; wit < _catalog_cart.length; wit++) {
                            if (_catalog_cart[wit].sku == whitems[wi].pfilename) {
                                _catalog_cart[wit].amount = amount;
                                if (amount === 0) _catalog_cart.splice(wit, 1);
                            }
                        }
                    }
                    sum = amount * whitems[wi].pprice;
                    cart.push({
                        id: whitems[wi].pfilename,
                        sum: sum,
                        amount: amount
                    });
                    subtotal += sum * rate_hash[whitems[wi].pcurs];
                }
                req.session.catalog_cart = _catalog_cart;
                return res.send(JSON.stringify({
                    status: 1,
                    subtotal: subtotal,
                    cart: cart,
                    cart_size: _catalog_cart.length
                }));
            });
        });
    });

    router.get('/cart', function(req, res, next) {
        var _locale = req.session.current_locale;
        i18nm.setLocale(_locale);
        var page = parseInt(req.query.page) || 1,
            sort = req.query.sort || 't',
            show_all = req.query.show_all || '1',
            init_find = req.query.find || '',
            init_cat = req.query.cat || '',
            sku = req.query.sku;
        if (sort && sort != 't' && sort != 'u' && sort != 'd') sort = 't';
        if (show_all && show_all != '1' && show_all != '0') show_all = '1';
        if (page && (page == "NaN" || page < 0)) page = 1;
        if (init_cat) init_cat = init_cat.trim().replace(/\"/g, '').replace(/</g, '').replace(/>/g, '');
        if (init_find) init_find = init_find.trim().replace(/\"/g, '').replace(/</g, '').replace(/>/g, '');
        if (sku && !sku.match(/^[A-Za-z0-9_\-\.]{0,80}$/)) sku = '';
        app.get('mongodb').collection('warehouse_conf').find({
            $or: [{
                conf: 'curs'
            }]
        }).toArray(function(err, db) {
            var whcurs = [];
            if (!err && db && db.length) {
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'curs' && db[i].data)
                        try {
                            whcurs = JSON.parse(db[i].data);
                        } catch (ex) {}
                }
            }
            var curs_hash = {},
                rate_hash = {};
            for (var cs = 0; cs < whcurs.length; cs++) {
                curs_hash[whcurs[cs].id] = whcurs[cs][_locale] || whcurs[cs].id;
                rate_hash[whcurs[cs].id] = whcurs[cs].exr || 1;
            }
            var catalog_cart = req.session.catalog_cart || [];
            if (sku) {
                var _sku_found;
                for (var cc = 0; cc < catalog_cart.length; cc++)
                    if (catalog_cart[cc].sku == sku) _sku_found = true;
                if (!_sku_found) {
                    catalog_cart.push({
                        sku: sku,
                        amount: 1
                    });
                    req.session.catalog_cart = catalog_cart;
                }
                return res.redirect(303, "/catalog/cart?rnd=" + Math.random().toString().replace('.', '') + '&page=' + page + '&sort=' + sort + '&show_all=' + show_all + '&find=' + init_find + '&cat=' + init_cat);
            }
            var warehouse_query = [];
            for (var ca = 0; ca < catalog_cart.length; ca++) warehouse_query.push({
                pfilename: catalog_cart[ca].sku
            });
            app.get('mongodb').collection('warehouse').find({
                $or: warehouse_query,
                plang: _locale
            }).toArray(function(wh_err, whitems) {
                var cart_html = '';
                if (whitems) {
                    var subtotal = 0;
                    for (var wi = 0; wi < whitems.length; wi++) {
                        var amount = 0;
                        for (var cc = 0; cc < catalog_cart.length; cc++)
                            if (catalog_cart[cc].sku == whitems[wi].pfilename) amount = catalog_cart[cc].amount || 0;
                        if (parseInt(whitems[wi].pamount) != -1 && amount > parseInt(whitems[wi].pamount)) amount = parseInt(whitems[wi].pamount);
                        var currency = curs_hash[whitems[wi].pcurs] || whitems[wi].pcurs,
                            sum = whitems[wi].pprice * amount;
                        subtotal += sum * rate_hash[whitems[wi].pcurs];
                        cart_html += pt_cart_item(gaikan, {
                            lang: i18nm,
                            title: whitems[wi].ptitle,
                            price: whitems[wi].pprice,
                            sku: whitems[wi].pfilename,
                            amount: amount,
                            sum: sum,
                            currency: currency
                        }, undefined);
                    }
                    cart_html = pt_cart(gaikan, {
                        body: cart_html,
                        subtotal: subtotal,
                        subtotal_currency: whcurs[0][_locale],
                        lang: i18nm
                    }, undefined);
                } else {
                    cart_html = i18nm.__('no_items_in_cart');
                }
                var out_html = cart(gaikan, {
                    lang: i18nm,
                    cart_html: cart_html,
                    init_cart: JSON.stringify(catalog_cart || []),
                    init_sort: sort,
                    init_view: show_all,
                    init_path: init_cat,
                    init_page: page,
                    init_find: init_find
                }, undefined);
                var data = {
                    title: i18nm.__('cart'),
                    current_lang: _locale,
                    page_title: i18nm.__('cart'),
                    content: out_html,
                    keywords: '',
                    description: '',
                    extra_css: "\n\t" + '<link rel="stylesheet" href="/modules/catalog/css/frontend.css" type="text/css">'
                };
                app.get('renderer').render(res, undefined, data, req);
            });
        });
    });

    router.get('/item/:sku', function(req, res, next) {
        var _locale = req.session.current_locale;
        i18nm.setLocale(_locale);
        var sku = req.params.sku;
        if (!sku || !sku.match(/^[A-Za-z0-9_\-\.]{0,80}$/)) return next();
        var page = parseInt(req.query.page) || 1,
            sort = req.query.sort || 't',
            show_all = req.query.show_all || '1',
            init_find = req.query.find,
            init_cat = req.query.cat;
        if (sort && sort != 't' && sort != 'u' && sort != 'd') sort = 't';
        if (show_all && show_all != '1' && show_all != '0') show_all = '1';
        if (page && (page == "NaN" || page < 0)) page = 1;
        if (init_cat) init_cat = init_cat.trim().replace(/\"/g, '').replace(/</g, '').replace(/>/g, '');
        if (init_find) init_find = init_find.trim().replace(/\"/g, '').replace(/</g, '').replace(/>/g, '');
        app.get('mongodb').collection('warehouse_conf').find({
            $or: [{
                conf: 'items'
            }, {
                conf: 'collections'
            }, {
                conf: 'curs'
            }, {
                conf: 'misc'
            }]
        }).toArray(function(err, db) {
            var whitems = [],
                whcurs = [],
                whmisc = [];
            if (!err && db && db.length) {
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'items' && db[i].data)
                        try {
                            whitems = JSON.parse(db[i].data);
                        } catch (ex) {}
                    if (db[i].conf == 'curs' && db[i].data)
                        try {
                            whcurs = JSON.parse(db[i].data);
                        } catch (ex) {}
                    if (db[i].conf == 'misc' && db[i].data)
                        try {
                            whmisc = JSON.parse(db[i].data);
                        } catch (ex) {}
                }
            }
            var curs_hash = {},
                items_hash = {},
                misc_hash = {};
            for (var ms = 0; ms < whmisc.length; ms++) misc_hash[whmisc[ms].id] = whmisc[ms][_locale];
            for (var cs = 0; cs < whcurs.length; cs++)
                curs_hash[whcurs[cs].id] = whcurs[cs][_locale] || whcurs[cs].id;
            for (var cit = 0; cit < whitems.length; cit++)
                items_hash[whitems[cit].id] = whitems[cit][_locale] || whitems[cit].id;
            // Load warehouse categories
            app.get('mongodb').collection('warehouse_categories').find({
                oname: 'categories_json'
            }, {
                limit: 1
            }).toArray(function(err, items) {
                var warehouse_categories;
                if (!items || !items.length || !items[0].ovalue) {
                    warehouse_categories = _default_folders_hash;
                } else {
                    warehouse_categories = JSON.parse(items[0].ovalue);
                }
                warehouse_categories = folders_make_hash(warehouse_categories);
                // Rock and roll
                app.get('mongodb').collection('warehouse').find({
                    pfilename: sku,
                    plang: _locale
                }, {
                    limit: 1
                }).toArray(function(wh_err, whitems) {
                    if (wh_err || !whitems || !whitems.length) return next();
                    var whitem = whitems[0];
                    var current_cat_title = folders_find_title_by_path(warehouse_categories, '/' + whitem.pcategory, req) || i18nm.__('module_name'),
                        _current_path = folders_find_path(warehouse_categories, whitem.pcategory_id).reverse(),
                        current_path = '',
                        bread = get_bread(warehouse_categories, whitem.pcategory_id, req, true),
                        btn_buy = '';
                    for (var _cp = 0; _cp < _current_path.length; _cp++) current_path += '/' + _current_path[_cp].name;
                    var primary_img = '/modules/catalog/images/placeholder_300.png',
                        primary_img_full = '#',
                        thumb_img = '';
                    if (whitem.pimages && whitem.pimages.length) {
                        if (fs.existsSync(app.get('config').dir.storage + '/warehouse/tn_' + whitem.pimages[0] + '.jpg'))
                            primary_img = app.get('config').dir.storage_url + '/warehouse/tn_' + whitem.pimages[0] + '.jpg';
                        if (fs.existsSync(app.get('config').dir.storage + '/warehouse/' + whitem.pimages[0] + '.jpg'))
                            primary_img_full = app.get('config').dir.storage_url + '/warehouse/' + whitem.pimages[0] + '.jpg';
                        if (whitem.pimages.length > 1)
                            for (var pi = 1; pi < whitem.pimages.length; pi++)
                                if (fs.existsSync(app.get('config').dir.storage + '/warehouse/tn_' + whitem.pimages[pi] + '.jpg'))
                                    thumb_img += pt_tn_img(gaikan, {
                                        src: app.get('config').dir.storage_url + '/warehouse/tn_' + whitem.pimages[pi] + '.jpg',
                                        url: app.get('config').dir.storage_url + '/warehouse/' + whitem.pimages[pi] + '.jpg'
                                    });
                    }
                    var pchars = '',
                        pgeninfo = '';
                    if (whitem.pchars && whitem.pchars.length) {
                        var pci = '';
                        for (var wip = 0; wip < whitem.pchars.length; wip++) {
                            pci += pt_desc_list_item(gaikan, {
                                par: items_hash[whitem.pchars[wip].id] || whitem.pchars[wip].id,
                                val: whitem.pchars[wip].val || '&nbsp;'
                            }, undefined);
                        }
                        pchars = pt_desc_list(gaikan, {
                            items: pci
                        }, undefined);
                    }
                    // Generate general (item) info
                    pgeninfo += pt_desc_list_item(gaikan, {
                        par: i18nm.__('sku'),
                        val: whitem.pfilename
                    }, undefined);
                    var item_avail = i18nm.__('item_avail');
                    if (parseInt(whitem.pamount) === 0) item_avail = i18nm.__('item_not_avail');
                    pgeninfo += pt_desc_list_item(gaikan, {
                        par: i18nm.__('avail'),
                        val: item_avail
                    }, undefined);
                    pgeninfo += pt_desc_list_item(gaikan, {
                        par: i18nm.__('item_weight'),
                        val: whitem.pweight + ' ' + misc_hash.weight_units
                    }, undefined);
                    pgeninfo = pt_desc_list(gaikan, {
                        items: pgeninfo
                    }, undefined);
                    if (parseInt(whitem.pamount) === 0) {
                        btn_buy = pt_btn_disabled(gaikan, {
                            lang: i18nm
                        }, undefined);
                    } else {
                        btn_buy = pt_btn(gaikan, {
                            lang: i18nm
                        }, undefined);
                    }
                    whitem.pcurs = curs_hash[whitem.pcurs] || whitem.pcurs;
                    var catalog_cart = req.session.catalog_cart || [];
                    var total_cart_items_count = 0;
                    if (catalog_cart.length)
                        for (var cc = 0; cc < catalog_cart.length; cc++) total_cart_items_count += parseInt(catalog_cart[cc].amount);
                    var url_data = '?sort=' + sort + '&page=' + page + '&show_all=' + show_all + '&cat=' + (init_cat || '') + '&find=' + (init_find || '');
                    var out_html = catalog_item_view(gaikan, {
                        lang: i18nm,
                        whitem: whitem,
                        bread: bread,
                        primary_img: primary_img,
                        primary_img_full: primary_img_full,
                        thumb_img: thumb_img,
                        btn_buy: btn_buy,
                        pchars: pchars,
                        pgeninfo: pgeninfo,
                        init_sort: sort,
                        init_view: show_all,
                        init_path: init_cat,
                        init_page: page,
                        init_find: init_find,
                        url_data: url_data,
                        cart_items_count: total_cart_items_count
                    });
                    var data = {
                        title: whitem.ptitle,
                        current_lang: _locale,
                        page_title: whitem.ptitle,
                        content: out_html,
                        keywords: whitem.pkeywords,
                        description: whitem.pdesc,
                        extra_css: "\n\t" + '<link rel="stylesheet" href="/modules/catalog/css/frontend.css" type="text/css">'
                    };
                    var layout = whitem.playout || undefined;
                    return app.get('renderer').render(res, layout, data, req);
                });
            }); // Load warehouse categories
        }); // Load warehouse configuration
    });

    //
    // Load catalog feed based on user query
    //

    router.get(/^(.*)?$/, function(req, res, next) {
        var _locale = req.session.current_locale;
        i18nm.setLocale(_locale);
        var param = req.params[0],
            url_parts = param.split('/');
        url_parts.forEach(function(fn) {
            if (fn.match(/ /)) return next(); // whitespace
            if (fn.match(/^[\^<>\/\:\"\\\|\?\*\x00-\x1f]+$/)) return next(); // invalid characters
        });
        if (!param.match(/^[a-zA-Z_0-9\-\/]+$/)) return next(); // invalid characters
        var current_cat = url_parts.join('/');
        if (current_cat) current_cat = current_cat.replace(/\/$/, '');
        var find_query = {
                plang: _locale
            },
            sort_query = {};
        var total = 0,
            page = parseInt(req.query.page) || 1,
            max_pages = 10,
            items_per_page = 2,
            sort = req.query.sort || 't',
            show_all = req.query.show_all || '1',
            page_url = '',
            search_query = req.query.find;
        if (sort && sort != 't' && sort != 'u' && sort != 'd') sort = 't';
        if (show_all && show_all != '1' && show_all != '0') show_all = '1';
        if (page && (page == "NaN" || page < 0)) page = 1;
        if (show_all != '1') find_query.pamount = {
            $ne: '0'
        };
        if (sort == 't') sort_query = {
            ptitle: 1
        };
        if (sort == 'u') sort_query = {
            pprice: 1
        };
        if (sort == 'd') sort_query = {
            pprice: -1
        };
        var skip = (page - 1) * items_per_page;
        if (search_query) search_query = search_query.trim().replace(/\"/g, '').replace(/</g, '').replace(/>/g, '');
        if (search_query) {
            var query_words = parser.words(search_query).words.split(/ /);
            if (query_words && query_words.length) {
                query_words = parser.stem_all(query_words);
                var query_arr = [];
                for (var i = 0; i < query_words.length; i++) {
                    query_arr.push({
                        $or: [{
                            ptitle: new RegExp(query_words[i])
                        }, {
                            pshortdesc: new RegExp(query_words[i])
                        }]
                    });
                }
                find_query.$and = query_arr;
            }
        }
        // Load warehouse settings
        app.get('mongodb').collection('warehouse_conf').find({
            conf: 'curs'
        }).toArray(function(err, db) {
            var curs = [];
            if (!err && db && db.length) {
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'curs' && db[i].data)
                        try {
                            curs = JSON.parse(db[i].data);
                        } catch (ex) {}
                }
            }
            var curs_hash = {};
            for (var cs = 0; cs < curs.length; cs++)
                curs_hash[curs[cs].id] = curs[cs][_locale] || curs[cs].id;
            // Load warehouse categories
            app.get('mongodb').collection('warehouse_categories').find({
                oname: 'categories_json'
            }, {
                limit: 1
            }).toArray(function(err, items) {
                var warehouse_categories;
                if (!items || !items.length || !items[0].ovalue) {
                    warehouse_categories = _default_folders_hash;
                } else {
                    warehouse_categories = JSON.parse(items[0].ovalue);
                }
                warehouse_categories = folders_make_hash(warehouse_categories);
                var current_cat_title = folders_find_title_by_path(warehouse_categories, current_cat, req) || i18nm.__('module_name'),
                    current_cat_id = folders_find_id_by_path(warehouse_categories, current_cat) || '#',
                    current_neighborhood = folders_find_neighborhood(warehouse_categories, current_cat_id),
                    current_neighborhood_html = '',
                    current_children,
                    current_children_html = '',
                    _current_path = folders_find_path(warehouse_categories, current_cat_id).reverse(),
                    current_path = '';
                if (current_cat && current_cat_id == '#') return next();
                for (var _cp = 0; _cp < _current_path.length; _cp++) current_path += '/' + _current_path[_cp].name;
                page_url = _get_url(current_path, show_all, sort, '', search_query);
                if (current_cat && current_cat != '#' && current_cat != 'j1_1') current_children = folders_find_children(warehouse_categories, current_cat_id);
                for (var cn = 0; cn < current_neighborhood.length; cn++) {
                    var cn_path = folders_find_path(warehouse_categories, current_neighborhood[cn]).reverse(),
                        cn_url = '',
                        cn_title = cn_path[cn_path.length - 1][_locale];
                    for (var p = 0; p < cn_path.length; p++) cn_url += '/' + cn_path[p].name;
                    if (current_neighborhood[cn] == current_cat_id) {
                        var sub_html = '';
                        if (current_children) {
                            var children_html = '';
                            for (var cd = 0; cd < current_children.length; cd++) {
                                var cd_path = folders_find_path(warehouse_categories, current_children[cd]).reverse(),
                                    cd_url = '',
                                    cd_title = cd_path[cd_path.length - 1][_locale];
                                for (var pc = 0; pc < cd_path.length; pc++) cd_url += '/' + cd_path[pc].name;
                                children_html += pt_li_a(gaikan, {
                                    class: '',
                                    url: '/catalog' + cd_url,
                                    text: cd_title
                                });
                            }
                            sub_html = pt_nav_sub(gaikan, {
                                items: children_html
                            }, undefined);
                        }
                        current_neighborhood_html += pt_li_a(gaikan, {
                            class: 'uk-active',
                            url: '',
                            sub: sub_html,
                            text: cn_title
                        });
                    } else {
                        current_neighborhood_html += pt_li_a(gaikan, {
                            class: '',
                            url: '/catalog' + cn_url,
                            text: cn_title
                        });
                    }
                }
                if (current_cat_id != '#') {
                    var children_all = folders_find_children_all(warehouse_categories, current_cat_id),
                        children_req = [];
                    for (var ca = 0; ca < children_all.length; ca++)
                        children_req.push({
                            pcategory_id: children_all[ca]
                        });
                    children_req.push({
                        pcategory_id: current_cat_id
                    });
                    find_query.$or = children_req;
                }
                app.get('mongodb').collection('warehouse').find(find_query).count(function(whc_err, _whcount) {
                    app.get('mongodb').collection('warehouse').find(find_query, {
                        skip: skip,
                        limit: items_per_page
                    }).sort(sort_query).toArray(function(wh_err, whitems) {
                        var warehouse_count = 0,
                            current_cat_bread = get_bread(warehouse_categories, current_cat_id, req),
                            catalog_items_html = '';
                        if (!whc_err) warehouse_count = parseInt(_whcount);
                        if (warehouse_count > 0) { // There is something in the warehouse
                            for (var wi = 0; wi < whitems.length; wi++) {
                                var title = whitems[wi].ptitle,
                                    thumb = '/modules/catalog/images/placeholder_50.png',
                                    desc = whitems[wi].pshortdesc || '',
                                    sku = whitems[wi].pfilename || '0',
                                    price = whitems[wi].pprice,
                                    amount = parseInt(whitems[wi].pamount),
                                    currency = curs_hash[whitems[wi].pcurs],
                                    btn_buy = '';
                                if (whitems[wi].pimages && whitems[wi].pimages.length)
                                    if (fs.existsSync(app.get('config').dir.storage + '/warehouse/tn_' + whitems[wi].pimages[0] + '.jpg'))
                                        thumb = app.get('config').dir.storage_url + '/warehouse/tn_' + whitems[wi].pimages[0] + '.jpg';
                                if (amount === 0) {
                                    btn_buy = pt_btn_mini_disabled(gaikan, {
                                        lang: i18nm
                                    }, undefined);
                                } else {
                                    btn_buy = pt_btn_mini(gaikan, {
                                        lang: i18nm,
                                        sku: sku,
                                        cat: (current_path || '/')
                                    }, undefined);
                                }
                                catalog_items_html += catalog_item(gaikan, {
                                    lang: i18nm,
                                    thumb: thumb,
                                    title: title,
                                    sku: sku,
                                    price: price,
                                    btn_buy: btn_buy,
                                    currency: currency,
                                    item_url: '/catalog/item/' + sku + '?page=' + page + '&sort=' + sort + '&show_all=' + show_all + '&find=' + (search_query || '') + '&cat=' + (current_path || '/'),
                                    desc: desc
                                }, undefined);
                            }
                        } else { // No warehouse items in current category

                        }
                        // Pagination begin
                        var num_pages = Math.ceil(warehouse_count / items_per_page),
                            pgnt = '';
                        if (num_pages > 1) {
                            if (num_pages > max_pages) {
                                if (page > 1) {
                                    var _p = page - 1;
                                    pgnt += pt_page_normal(gaikan, {
                                        url: page_url + _p,
                                        text: 'В«'
                                    }, undefined);
                                }
                                if (page > 3) {
                                    pgnt += pt_page_normal(gaikan, {
                                        url: '/blog?page=1',
                                        text: '1'
                                    }, undefined);
                                }
                                var _st = page - 2;
                                if (_st < 1) {
                                    _st = 1;
                                }
                                if (_st - 1 > 1) {
                                    pgnt += pt_page_span(gaikan, {
                                        class: 'taracot-dots',
                                        text: '...'
                                    }, undefined);
                                }
                                var _en = page + 2;
                                if (_en > num_pages) {
                                    _en = num_pages;
                                }
                                for (var i = _st; i <= _en; i++) {
                                    if (page == i) {
                                        pgnt += pt_page_span(gaikan, {
                                            class: 'active',
                                            text: i
                                        }, undefined);
                                    } else {
                                        pgnt += pt_page_normal(gaikan, {
                                            url: page_url + i,
                                            text: i
                                        }, undefined);
                                    }
                                }
                                if (_en < num_pages - 1) {
                                    pgnt += pt_page_span(gaikan, {
                                        class: 'taracot-dots',
                                        text: '...'
                                    }, undefined);
                                }
                                if (page <= num_pages - 3) {
                                    pgnt += pt_page_normal(gaikan, {
                                        url: page_url + num_pages,
                                        text: num_pages
                                    }, undefined);
                                }
                                if (page < num_pages) {
                                    var _p = page + 1;
                                    pgnt += pt_page_normal(gaikan, {
                                        url: page_url + _p,
                                        text: 'В»'
                                    }, undefined);
                                }
                            } else {
                                for (var i = 1; i <= num_pages; i++) {
                                    if (i == page) {
                                        pgnt += pt_page_span(gaikan, {
                                            class: 'active',
                                            text: i
                                        }, undefined);
                                    } else {
                                        pgnt += pt_page_normal(gaikan, {
                                            url: page_url + i,
                                            text: i
                                        }, undefined);
                                    }
                                }
                            }
                        } // Pagination needed
                        // Pagination end
                        var filter_show = '',
                            filter_sort = '';
                        if (show_all == '1') {
                            filter_show += _get_html_li_a('uk-active', _get_url(current_path, '1', sort, page, search_query), i18nm.__('all'));
                            filter_show += _get_html_li_a('', _get_url(current_path, '0', sort, page, search_query), i18nm.__('stock_only'));
                        } else {
                            filter_show += _get_html_li_a('', _get_url(current_path, '1', sort, page, search_query), i18nm.__('all'));
                            filter_show += _get_html_li_a('uk-active', _get_url(current_path, '0', sort, page, search_query), i18nm.__('stock_only'));
                        }
                        if (sort == 't') {
                            filter_sort += _get_html_li_a('uk-active', _get_url(current_path, show_all, 't', page, search_query), i18nm.__('title'));
                            filter_sort += _get_html_li_a('', _get_url(current_path, show_all, 'u', page, search_query), i18nm.__('price_up'));
                            filter_sort += _get_html_li_a('', _get_url(current_path, show_all, 'd', page, search_query), i18nm.__('price_down'));
                        }
                        if (sort == 'u') {
                            filter_sort += _get_html_li_a('', _get_url(current_path, show_all, 't', page, search_query), i18nm.__('title'));
                            filter_sort += _get_html_li_a('uk-active', _get_url(current_path, show_all, 'u', page, search_query), i18nm.__('price_up'));
                            filter_sort += _get_html_li_a('', _get_url(current_path, show_all, 'd', page, search_query), i18nm.__('price_down'));
                        }
                        if (sort == 'd') {
                            filter_sort += _get_html_li_a('', _get_url(current_path, show_all, 't', page, search_query), i18nm.__('title'));
                            filter_sort += _get_html_li_a('', _get_url(current_path, show_all, 'u', page, search_query), i18nm.__('price_up'));
                            filter_sort += _get_html_li_a('uk-active', _get_url(current_path, show_all, 'd', page, search_query), i18nm.__('price_down'));
                        }
                        var catalog_cart = req.session.catalog_cart || [];
                        var total_cart_items_count = 0;
                        if (catalog_cart.length)
                            for (var cc = 0; cc < catalog_cart.length; cc++) total_cart_items_count += parseInt(catalog_cart[cc].amount);
                        var url_data = '?sort=' + sort + '&page=' + page + '&show_all=' + show_all + '&cat=' + (current_path || '') + '&find=' + (search_query || '');
                        out_html = catalog(gaikan, {
                            lang: i18nm,
                            current_cat_title: current_cat_title,
                            current_cat_bread: current_cat_bread,
                            current_neighborhood_html: current_neighborhood_html,
                            catalog_items: catalog_items_html,
                            pagination: pt_pagination(gaikan, {
                                pages: pgnt
                            }, undefined),
                            filter_show: filter_show,
                            filter_sort: filter_sort,
                            init_sort: sort,
                            init_view: show_all,
                            init_path: current_path,
                            init_page: page,
                            init_find: search_query,
                            url_data: url_data,
                            cart_items_count: total_cart_items_count
                        });
                        var data = {
                            title: current_cat_title,
                            current_lang: _locale,
                            page_title: current_cat_title,
                            content: out_html,
                            keywords: '',
                            description: '',
                            extra_css: "\n\t" + '<link rel="stylesheet" href="/modules/catalog/css/frontend.css" type="text/css">'
                        };
                        return app.get('renderer').render(res, undefined, data, req);
                    });
                });
            });
        });
    });

    //
    // Helper functions
    //

    var _get_html_li_a = function(_class, _url, _text) {
        return pt_li_a(gaikan, {
            class: _class || '',
            url: _url || '',
            text: _text || ''
        });
    };

    var _get_url = function(_path, _all, _sort, _page, _find) {
        if (!_path) _path = '';
        if (!_all) _all = '1';
        if (!_sort) _sort = 't';
        if (!_find) _find = '';
        return '/catalog' + _path + '?find=' + _find + '&sort=' + _sort + '&show_all=' + _all + '&page=' + _page;
    };

    var folders_make_hash = function(fldrs) {
        var fh = {};
        for (var i = 0; i < fldrs.length; i++) {
            fh[fldrs[i].id] = fldrs[i];
            delete fh[fldrs[i].id].id;
        }
        return fh;
    };

    var folders_find_id_by_path = function(fldrs_hash, path, _level) {
        if (!fldrs_hash || !path) return;
        var path_parts = path.replace(/^\//, '').split('/');
        if (!_level) _level = 0;
        for (var key in fldrs_hash) {
            if (fldrs_hash[key].text == path_parts[_level]) {
                if (_level + 1 === path_parts.length) return key || '';
                _level++;
                folders_find_id_by_path(fldrs_hash[key], path, _level);
            }
        }
        return '';
    };

    var folders_find_title_by_path = function(fldrs_hash, path, req, _level) {
        if (!fldrs_hash || !path || !path.length) return;
        var path_parts = path.replace(/^\//, '').split('/');
        if (!_level) _level = 0;
        for (var key in fldrs_hash) {
            if (fldrs_hash[key].text == path_parts[_level]) {
                if (_level + 1 === path_parts.length) return fldrs_hash[key].data.lang[req.session.current_locale] || key || '';
                _level++;
                folders_find_id_by_path(fldrs_hash[key], path, req, _level);
            }
        }
        return '';
    };

    var folders_find_path = function(fldrs_hash, id, _path) {
        var path = _path || [];
        if (fldrs_hash && id && fldrs_hash[id] && fldrs_hash[id].parent && fldrs_hash[id].parent != '#') {
            var pi = {
                name: fldrs_hash[id].text
            };
            var locales = app.get('config').locales;
            if (fldrs_hash[id].data && fldrs_hash[id].data.lang) {
                for (var i = 0; i < locales.length; i++) {
                    pi[locales[i]] = fldrs_hash[id].data.lang[locales[i]];
                }
            }
            path.push(pi);
            folders_find_path(fldrs_hash, fldrs_hash[id].parent, path);
        }
        return path;
    };

    var folders_find_parent = function(fldrs_hash, id) {
        for (var k in fldrs_hash) {
            if (k == id && fldrs_hash[k] && fldrs_hash[k].parent) return fldrs_hash[k].parent;
        }
        return '';
    };

    var folders_find_children = function(fldrs_hash, id) {
        var children = [];
        for (var k in fldrs_hash)
            if (fldrs_hash[k].parent == id) children.push(k);
        return children;
    };

    var folders_find_children_all = function(fldrs_hash, id, _children) {
        var children = _children || [];
        for (var k in fldrs_hash)
            if (fldrs_hash[k].parent == id) {
                folders_find_children_all(fldrs_hash, k, children);
                children.push(k);
            }
        return children;
    };

    var folders_find_neighborhood = function(fldrs_hash, id) {
        var parent = folders_find_parent(fldrs_hash, id) || 'j1_1',
            children = [];
        for (var k in fldrs_hash)
            if (fldrs_hash[k].parent == parent) children.push(k);
        return children;
    };

    var get_bread = function(folders, folder_id, req, lsa) {
        var bread = folders_find_path(folders, folder_id).reverse();
        var bread_html = '';
        var bread_path = '';
        var title_arr = [];
        bread_html += '<li><a href="/catalog">' + i18nm.__('module_name') + '</a></li>';
        for (var i = 0; i < bread.length; i++) {
            bread_path += '/' + bread[i].name;
            var ln = bread[i][req.session.current_locale] || bread[i].name;
            if (bread.length - 1 == i && !lsa) {
                bread_html += '<li>' + ln + '</li>';
            } else {
                bread_html += '<li><a href="/catalog' + bread_path + '">' + ln + '</a></li>';
            }
            title_arr.push(ln);
        }
        if (!bread.length) bread_html += '<li>' + i18nm.__('all_catalog_items') + '</li>';
        title_arr = title_arr.reverse();
        var bread_html_uikit = '<ul class="uk-breadcrumb">' + bread_html + '</ul>';
        var bread_html_bootstrap = '<ol class="breadcrumb">' + bread_html + '</ol>';
        return {
            raw: bread,
            html: bread_html,
            html_uikit: bread_html_uikit,
            html_bootstrap: bread_html_bootstrap,
            title_arr: title_arr
        };
    };

    return router;
};
