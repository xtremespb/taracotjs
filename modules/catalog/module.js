module.exports = function(app) {

    var router = app.get('express').Router(),
        gaikan = require('gaikan'),
        renderer = app.get('renderer'),
        path = app.get('path'),
        ObjectId = require('mongodb').ObjectID,
        user_cache = {},
        xbbcode = require('../../core/xbbcode.js'),
        crypto = require('crypto'),
        fs = require('fs');

    var catalog = gaikan.compileFromFile(path.join(__dirname, 'views') + '/catalog.html');

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

    //
    // Load catalog feed based on user query
    //

    router.get(/^(.*)?$/, function(req, res, next) {
        var _locale = req.session.current_locale;
        i18nm.setLocale(_locale);
        var param = req.params[0],
            url_parts = param.split('/');
        if (!param.match(/^[a-zA-Z_0-9\-\/]+$/)) return next(); // invalid characters
        var current_cat = url_parts.join('/');
        if (current_cat) current_cat = current_cat.replace(/\/$/, '');
        var find_query = {};
        if (current_cat) find_query = {
            pcategory: current_cat
        };
        var total = 0,
            page = parseInt(req.query.page) || 1,
            max_pages = 10,
            items_per_page = 10;
        if (page && (page == "NaN" || page < 0)) page = 1;
        var skip = (page - 1) * items_per_page;
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
                current_neighborhood = folders_find_neighborhood(warehouse_categories, current_cat_id);
            for (var cn = 0; cn < current_neighborhood.length; cn++) {
                var cn_path = folders_find_path(warehouse_categories, current_neighborhood[cn]).reverse(),
                    cn_url = '',
                    cn_title = cn_path[cn_path.length-1][_locale];
                for (var p = 0; p < cn_path.length; p++) cn_url += '/' + cn_path[p].name;

            }
            app.get('mongodb').collection('warehouse').find(find_query).count(function(whc_err, _whcount) {
                app.get('mongodb').collection('warehouse').find(find_query, {
                    skip: skip,
                    limit: items_per_page
                }).toArray(function(wh_err, whitems) {
                    var warehouse_count = 0,
                        current_cat_bread = get_bread(warehouse_categories, current_cat_id, req);
                    if (!whc_err) warehouse_count = parseInt(_whcount);
                    if (warehouse_count > 0) { // There is something in the warehouse
                    } else { // No warehouse items in current category

                    }
                    out_html = catalog(gaikan, {
                        current_cat_title: current_cat_title,
                        current_cat_bread: current_cat_bread
                    });
                    var data = {
                        title: current_cat_title,
                        current_lang: _locale,
                        page_title: current_cat_title,
                        content: out_html,
                        keywords: '',
                        description: ''
                    };
                    var layout = items[0].playout || undefined;
                    return app.get('renderer').render(res, layout, data, req);
                });
            });
        });
    });

    //
    // Helper functions
    //

    var render_page = function(title, body, req, res, template) {
        if (!template) template = 'catalog';
        var page_data = {
            title: title,
            page_title: title,
            keywords: '',
            description: '',
            extra_css: '<link rel="stylesheet" href="/modules/catalog/css/frontend.css">'
        };
        var render = renderer.render_file(path.join(__dirname, 'views'), template, {
            lang: i18nm,
            title: title,
            content: body,
            current_locale: req.session.current_locale
        }, req);
        page_data.content = render;
        app.get('renderer').render(res, undefined, page_data, req);
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
        for (var k in fldrs_hash)
            if (k == id && fldrs_hash[k] && fldrs_hash[k].parent) return fldrs_hash[k].parent;
        return '';
    };

    var folders_find_neighborhood = function(fldrs_hash, id) {
        var parent = folders_find_parent(fldrs_hash, id) || 'j1_1',
            children = [];
        for (var k in fldrs_hash) {
            if (fldrs_hash[k].parent == parent) children.push(k);
        }
        return children;
    };

    var get_bread = function(folders, folder_id, req) {
        var bread = folders_find_path(folders, folder_id).reverse();
        var bread_html = '';
        var bread_path = '';
        var title_arr = [];
        bread_html += '<li><a href="/catalog">' + i18nm.__('module_name') + '</a></li>';
        for (var i = 0; i < bread.length; i++) {
            bread_path += '/' + bread[i].name;
            var ln = bread[i][req.session.current_locale] || bread[i].name;
            if (bread.length - 1 == i) {
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
