module.exports = function(app) {

    var router = app.get('express').Router(),
        gaikan = require('gaikan'),
        renderer = app.get('renderer'),
        path = app.get('path'),
        ObjectId = require('mongodb').ObjectID,
        fs = require('fs'),
        parser = app.get('parser');

    var catalog = gaikan.compileFromFile(path.join(__dirname, 'views') + '/catalog.html'),
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
        pt_desc_list_item = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_desc_list_item.html');

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

    router.get('/item/:sku', function(req, res, next) {
        var _locale = req.session.current_locale;
        i18nm.setLocale(_locale);
        var sku = req.params.sku;
        if (!sku || !sku.match(/^[A-Za-z0-9_\-\.]{0,80}$/)) return next();
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
                whcurs = [];
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
                }
            }
            var curs_hash = {},
                items_hash = {};
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
                    pfilename: sku
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
                    var pchars = '';
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
                    if (whitem.amount === 0) {
                        btn_buy = pt_btn_disabled(gaikan, {
                            lang: i18nm
                        }, undefined);
                    } else {
                        btn_buy = pt_btn(gaikan, {
                            lang: i18nm
                        }, undefined);
                    }
                    whitem.pcurs = curs_hash[whitem.pcurs] || whitem.pcurs;
                    var out_html = catalog_item_view(gaikan, {
                        lang: i18nm,
                        whitem: whitem,
                        bread: bread,
                        primary_img: primary_img,
                        primary_img_full: primary_img_full,
                        thumb_img: thumb_img,
                        btn_buy: btn_buy,
                        pchars: pchars
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
                                        lang: i18nm
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
                            init_find: search_query
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
