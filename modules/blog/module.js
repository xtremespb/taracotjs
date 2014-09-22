module.exports = function(app) {

    var router = app.get('express').Router(),
        gaikan = require('gaikan'),
        renderer = app.get('renderer'),
        path = app.get('path'),
        ObjectId = require('mongodb').ObjectID,
        moment = require('moment'),
        user_cache = {},
        xbbcode = require('../../core/xbbcode.js');

    var i18nm = new(require('i18n-2'))({
        locales: app.get('config').locales,
        directory: app.get('path').join(__dirname, 'lang'),
        extension: '.js'
    });

    router.get(/^\/blog(\/(keywords|area)\/(.*))?\/?$/, function(req, res) {
        var _locale = req.i18n.getLocale();
        i18nm.setLocale(_locale);
        var query = {
            post_lang: _locale,
            post_draft: {
                $ne: '1'
            }
        };
        var blog_page_url = '/blog?page=';
        if (req.params && req.params[1] && req.params[2]) {
            if (req.params[1] == 'area') {
                var blog_areas;
                try {
                    blog_areas = JSON.parse(app.set('settings').blog_areas);
                } catch (ex) {
                    blog_areas = [];
                }
                var area = '';
                for (var a = 0; a < blog_areas.length; a++) {
                    if (blog_areas[a].id == req.params[2]) area = blog_areas[a].id;
                }
                if (area) {
                    query.post_area = area;
                    blog_page_url = '/blog/area/' + area + '?page=';
                }
            }
            if (req.params[1] == 'keywords') {
                var keyword = String(req.params[2]).replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ').replace(/\//g, '');
                if (keyword && keyword.length > 2 && keyword.length < 50) {
                    query.post_keywords = new RegExp('(^|, )' + keyword + '($|,)');
                    blog_page_url = '/blog/keyword/' + keyword + '?page=';
                }
            }
        }
        var total = 0,
            page = parseInt(req.query.page) || 1,
            max_pages = 10,
            items_per_page = 10;
        if (page && (page == "NaN" || page < 0)) return render_page(i18nm.__('blog_error'), i18nm.__('invalid_skip_value'), req, res, 'error');
        var skip = (page - 1) * items_per_page;
        app.get('mongodb').collection('blog').find(query).count(function(err, items_count) {
            if (!err && items_count > 0) {
                var data = app.get('mongodb').collection('blog').find(query, {
                    skip: skip,
                    limit: items_per_page
                }).sort({
                    post_timestamp: -1
                }).toArray(function(err, items) {
                    // Error handler
                    // if (err) return res.send(err);
                    if (items && items.length) {
                        var users_arr = [],
                            users_hash = {};
                        for (var u = 0; u < items.length; u++) {
                            if (!users_hash[items[u].post_user_id]) {
                                users_hash[items[u].post_user_id] = 1;
                                users_arr.push({
                                    _id: new ObjectId(items[u].post_user_id)
                                });
                            }
                        }
                        app.get('mongodb').collection('users').find({
                            $or: users_arr
                        }).toArray(function(err, users_db) {
                            var usernames = {};
                            if (users_db) {
                                for (var k = 0; k < users_db.length; k++) usernames[users_db[k]._id] = users_db[k].username;
                            }
                            var blog_feed = '';
                            var parts_post = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_post.html');
                            var parts_pagination = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_pagination.html');
                            var parts_page_normal = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_page_normal.html');
                            var parts_page_span = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_page_span.html');
                            var parts_badge = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_badge.html');
                            var parts_badge_link = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_badge_link.html');
                            var parts_keyword = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_keyword.html');
                            var parts_button = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_button.html');
                            var parts_buttons_wrap = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_buttons_wrap.html');
                            var blog_areas;
                            try {
                                blog_areas = JSON.parse(app.set('settings').blog_areas);
                            } catch (ex) {
                                blog_areas = [];
                            }
                            for (var i = 0; i < items.length; i++) {
                                if (items[i].post_title) items[i].post_title = items[i].post_title.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
                                if (items[i].post_keywords) items[i].post_keywords = items[i].post_keywords.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
                                if (items[i].post_area) items[i].post_area = items[i].post_area.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
                                if (items[i].post_content) items[i].post_content = items[i].post_content.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                var timestamp = '',
                                    badges = '';
                                if (items[i].post_timestamp) {
                                    timestamp = moment(items[i].post_timestamp).locale(_locale).fromNow();
                                } else {
                                    timestamp = moment().locale(_locale).fromNow();
                                }
                                badges += parts_badge(gaikan, {
                                    icon: 'clock-o',
                                    text: timestamp
                                }, undefined);
                                if (usernames[items[i].post_user_id]) {
                                    badges += parts_badge(gaikan, {
                                        icon: 'user',
                                        text: usernames[items[i].post_user_id]
                                    }, undefined);
                                }
                                var keywords = '';
                                if (items[i].post_keywords) {
                                    var keywords_arr = items[i].post_keywords.split(',');
                                    for (var kw = 0; kw < keywords_arr.length; kw++) {
                                        var keyword = keywords_arr[kw].replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
                                        keywords += ', ' + parts_keyword(gaikan, {
                                            url: '/blog/keywords/' + keyword,
                                            text: keyword
                                        });
                                    }
                                    keywords = keywords.replace(/, /, '');
                                }
                                var post_area = '';
                                for (var a = 0; a < blog_areas.length; a++) {
                                    if (blog_areas[a].id == items[i].post_area) post_area = blog_areas[a][_locale];
                                }
                                var content = items[i].post_content_html;
                                if (items[i].post_cut) {
                                    content = items[i].post_content_cut_html;
                                }
                                var buttons = '';
                                if (items[i].post_cut) {
                                    buttons += parts_button(gaikan, {
                                        icon: 'angle-double-right',
                                        text: i18nm.__('read_more'),
                                        url: '/blog/post/' + items[0]._id.toHexString()
                                    }, undefined);
                                }
                                if (buttons) {
                                    buttons = parts_buttons_wrap(gaikan, {
                                        buttons: buttons
                                    }, undefined);
                                }
                                blog_feed += parts_post(gaikan, {
                                    lang: i18nm,
                                    post_title: items[i].post_title,
                                    post_content: content,
                                    post_area_id: items[i].post_area,
                                    post_area: post_area,
                                    post_keywords: keywords,
                                    post_badges: badges,
                                    buttons: buttons,
                                    post_url: '/blog/post/' + items[i]._id.toHexString()
                                }, undefined);
                            }
                            // Pagination begin
                            var num_pages = Math.ceil(items_count / items_per_page);
                            var pgnt = '';
                            if (num_pages > 1) {
                                if (num_pages > max_pages) {
                                    if (page > 1) {
                                        // pgnt += '<li id="taracot-pgnt-' + (page - 1) + '"><a href="#"><i class="uk-icon-angle-double-left"></i></a></li>';
                                        var _p = page - 1;
                                        pgnt += parts_page_normal(gaikan, {
                                            url: blog_page_url + _p,
                                            text: '«'
                                        }, undefined);
                                    }
                                    if (page > 3) {
                                        // pgnt += '<li id="taracot-pgnt-1"><a href="#">1</i></a></li>';
                                        pgnt += parts_page_normal(gaikan, {
                                            url: '/blog?page=1',
                                            text: '1'
                                        }, undefined);
                                    }
                                    var _st = page - 2;
                                    if (_st < 1) {
                                        _st = 1;
                                    }
                                    if (_st - 1 > 1) {
                                        // pgnt += '<li>...</li>';
                                        pgnt += parts_page_span(gaikan, {
                                            class: 'taracot-dots',
                                            text: '...'
                                        }, undefined);
                                    }
                                    var _en = page + 2;
                                    if (_en > num_pages) {
                                        _en = num_pages;
                                    }
                                    for (var i = _st; i <= _en; i++) {
                                        // pgnt += '<li id="taracot-pgnt-' + i + '"><a href="#">' + i + '</a></li>';
                                        if (page == i) {
                                            pgnt += parts_page_span(gaikan, {
                                                class: 'active',
                                                text: i
                                            }, undefined);
                                        } else {
                                            pgnt += parts_page_normal(gaikan, {
                                                url: blog_page_url + i,
                                                text: i
                                            }, undefined);
                                        }
                                    }
                                    if (_en < num_pages - 1) {
                                        // pgnt += '<li><span>...</span></li>';
                                        pgnt += parts_page_span(gaikan, {
                                            class: 'taracot-dots',
                                            text: '...'
                                        }, undefined);
                                    }
                                    if (page <= num_pages - 3) {
                                        // pgnt += '<li id="taracot-pgnt-' + num_pages + '"><a href="#">' + num_pages + '</a></li>';
                                        pgnt += parts_page_normal(gaikan, {
                                            url: blog_page_url + num_pages,
                                            text: num_pages
                                        }, undefined);
                                    }
                                    if (page < num_pages) {
                                        // pgnt += '<li id="taracot-pgnt-' + (page + 1) + '"><a href="#"><i class="uk-icon-angle-double-right"></i></a></li>';
                                        var _p = page + 1;
                                        pgnt += parts_page_normal(gaikan, {
                                            url: blog_page_url + _p,
                                            text: '»'
                                        }, undefined);
                                    }
                                } else {
                                    for (var i = 1; i <= num_pages; i++) {
                                        // pgnt += '<li id="taracot-pgnt-' + i + '"><a href="#">' + i + '</a></li>';
                                        if (i == page) {
                                            pgnt += parts_page_span(gaikan, {
                                                class: 'active',
                                                text: i
                                            }, undefined);
                                        } else {
                                            pgnt += parts_page_normal(gaikan, {
                                                url: blog_page_url + i,
                                                text: i
                                            }, undefined);
                                        }
                                    }
                                }
                                blog_feed += parts_pagination(gaikan, {
                                    pages: pgnt
                                }, undefined);

                            } // Pagination needed
                            // Pagination end
                            return render_page(i18nm.__('module_name'), blog_feed, req, res);
                        }); // users data
                    } else {
                        // No items handler
                        // return res.send('no items');
                    }
                }); // data
            } else { // Error or count = 0
                // Error or no count = 0
                // return res.send(err + ' -- ' + items_count);
            }
        }); // count
    });

    router.get('/blog/post', function(req, res, next) {
        var _locale = req.i18n.getLocale();
        i18nm.setLocale(_locale);
        var mode = app.set('settings').blog_mode || 'private',
            areas = app.set('settings').blog_areas || '[]';
        var data = {
            title: i18nm.__('blog_post'),
            page_title: i18nm.__('blog_post'),
            keywords: '',
            description: '',
            extra_css: "\n\t" + '<link rel="stylesheet" href="/modules/blog/css/main.css" type="text/css"><link rel="stylesheet" href="/modules/blog/js/wysibb/theme/default/wbbtheme.css" type="text/css">'
        };
        var render = renderer.render_file(path.join(__dirname, 'views'), 'post', {
            lang: i18nm,
            data: data,
            blog_mode: mode,
            blog_areas: areas,
            locale: _locale,
            blog_data: false
        }, req);
        data.content = render;
        return app.get('renderer').render(res, undefined, data, req);
    });

    router.post('/blog/post/save', function(req, res, next) {
        var _locale = req.i18n.getLocale();
        var rep = {
            status: 1
        };
        i18nm.setLocale(_locale);
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var post_id = req.body.post_id,
            post_title = req.body.post_title,
            post_area = req.body.post_area,
            post_keywords = req.body.post_keywords,
            post_content = req.body.post_content,
            post_draft = '',
            post_comments = '';
        if (req.body.post_draft) post_draft = '1';
        if (req.body.post_comments) post_comments = '1';
        if (!post_title || post_title.length > 100) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_title");
            return res.send(JSON.stringify(rep));
        }
        if (post_keywords) {
            var keywords_arr = post_keywords.replace(/[\'\"<>\&]/g, "").split(',');
            var keywords_arr_unique = keywords_arr.filter(function(item, pos) {
                return keywords_arr.indexOf(item) == pos;
            });
            post_keywords = '';
            for (var kw = 0; kw < keywords_arr_unique.length; kw++) post_keywords += ', ' + keywords_arr_unique[kw].replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
            post_keywords = post_keywords.replace(/, /, '');
        }
        if (!post_keywords || post_keywords.length > 250) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_keywords");
            return res.send(JSON.stringify(rep));
        }
        if (!post_area) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_area");
            return res.send(JSON.stringify(rep));
        }
        if (!post_content) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_content");
            return res.send(JSON.stringify(rep));
        }
        post_title = post_title.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
        post_keywords = post_keywords.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
        post_area = post_area.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
        post_content = post_content.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        var blog_areas;
        try {
            blog_areas = JSON.parse(app.set('settings').blog_areas);
        } catch (ex) {
            blog_areas = [];
        }
        var post_area_ = '';
        for (var i = 0; i < blog_areas.length; i++) {
            if (blog_areas[i].id == post_area) post_area_ = blog_areas[i].id;
        }
        post_area = post_area_;
        if (post_id && !post_id.match(/^[a-f0-9]{24}$/)) post_id = undefined;
        // Process cut and bbcode
        post_content = post_content.replace(/\[cut\]/ig, '[cut]');
        var post_content_arr = post_content.split('[cut]'),
            post_content_html = '',
            post_content_cut_html = '',
            cut = 0;
        var bbcode_post = xbbcode.process({
            text: post_content.replace(/\[cut\]/ig, ""),
            removeMisalignedTags: true,
            addInLineBreaks: true
        });
        if (!bbcode_post || bbcode_post.error) {
            rep.status = 0;
            rep.error = i18nm.__(bbcode_post.error);
            return res.send(JSON.stringify(rep));
        }
        post_content_html = bbcode_post.html;
        if (post_content_arr.length > 1) {
            var post_content_cut = post_content_arr[0],
                bbcode_cut = xbbcode.process({
                    text: post_content_cut,
                    removeMisalignedTags: true,
                    addInLineBreaks: true
                });
            if (!bbcode_cut || bbcode_cut.error) {
                rep.status = 0;
                rep.error = i18nm.__(bbcode_cut.error);
                return res.send(JSON.stringify(rep));
            }
            post_content_cut_html = bbcode_cut.html;
            cut = 1;
        }
        // Save
        var update = {
            post_title: post_title,
            post_area: post_area,
            post_keywords: post_keywords,
            post_content: post_content,
            post_content_html: post_content_html,
            post_cut: cut,
            post_content_cut_html: post_content_cut_html,
            post_draft: post_draft,
            post_comments: post_comments
        };
        console.log(update);
        if (post_id) { // Save changes to the old post
            app.get('mongodb').collection('blog').find({
                _id: new ObjectId(post_id)
            }).toArray(function(err, items) {
                if (err) {
                    rep.status = 0;
                    return res.send(JSON.stringify(rep));
                }
                if (!items || !items.length) {
                    rep.status = 0;
                    rep.error = i18nm.__("unable_to_find_post");
                    return res.send(JSON.stringify(rep));
                }
                app.get('mongodb').collection('blog').update({
                    _id: new ObjectId(post_id)
                }, {
                    $set: update
                }, function(_err, _items) {
                    if (_err) {
                        rep.status = 0;
                        return res.send(JSON.stringify(rep));
                    }
                    // Success
                    return res.send(JSON.stringify(rep));
                });
            });
        } else { // Create a new post
            update.post_timestamp = Date.now();
            update.post_user_id = req.session.auth._id;
            update.post_lang = _locale;
            app.get('mongodb').collection('blog').insert(update, function(_err, _items) {
                if (_err) {
                    rep.status = 0;
                    return res.send(JSON.stringify(rep));
                }
                // Success
                return res.send(JSON.stringify(rep));
            });
        }
        return res.send(JSON.stringify(rep));
    });

    router.get('/blog/post/:id', function(req, res, next) {
        var _locale = req.i18n.getLocale();
        i18nm.setLocale(_locale);
        var id = req.params.id;
        if (!id || !id.match(/^[a-f0-9]{24}$/)) return render_page(i18nm.__('blog_error'), i18nm.__('post_not_found'), req, res, 'error');
        app.get('mongodb').collection('blog').find({
            _id: new ObjectId(id)
        }).toArray(function(err, items) {
            if (err) return render_page(i18nm.__('blog_error'), i18nm.__('db_request_failed'), req, res, 'error');
            if (!items || !items.length) return render_page(i18nm.__('blog_error'), i18nm.__('post_not_found'), req, res, 'error');
            app.get('mongodb').collection('users').find({
                _id: new ObjectId(items[0].post_user_id)
            }).toArray(function(err, users_db) {
                var parts_badge = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_badge.html');
                var parts_badge_link = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_badge_link.html');
                var parts_keyword = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_keyword.html');
                var parts_button_class = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_button_class.html');
                var parts_button_delete_post = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_button_delete_post.html');
                var parts_buttons_wrap = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_buttons_wrap.html');
                try {
                    blog_areas = JSON.parse(app.set('settings').blog_areas);
                } catch (ex) {
                    blog_areas = [];
                }
                var post_area = '';
                for (var a = 0; a < blog_areas.length; a++) {
                    if (blog_areas[a].id == items[0].post_area) post_area = blog_areas[a][_locale];
                }
                var timestamp = '',
                    badges = '';
                if (items[0].post_timestamp) {
                    timestamp = moment(items[0].post_timestamp).locale(_locale).fromNow();
                } else {
                    timestamp = moment().locale(_locale).fromNow();
                }
                badges += parts_badge(gaikan, {
                    icon: 'clock-o',
                    text: timestamp
                }, undefined);
                if (users_db[0].username) {
                    badges += parts_badge(gaikan, {
                        icon: 'user',
                        text: users_db[0].username
                    }, undefined);
                }
                var keywords = '';
                if (items[0].post_keywords) {
                    var keywords_arr = items[0].post_keywords.split(',');
                    for (var kw = 0; kw < keywords_arr.length; kw++) {
                        var keyword = keywords_arr[kw].replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
                        keywords += ', ' + parts_keyword(gaikan, {
                            url: '/blog/keywords/' + keyword,
                            text: keyword
                        });
                    }
                    keywords = keywords.replace(/, /, '');
                }
                var buttons = '';
                if (req.session.auth._id === items[0].post_user_id) {
                    buttons += parts_button_class(gaikan, {
                        icon: 'pencil',
                        text: i18nm.__('edit_post'),
                        class: 'button-small',
                        url: '/blog/post/edit/' + items[0]._id.toHexString()
                    }, undefined);
                }
                if (req.session.auth.status == 2) {
                    buttons += parts_button_delete_post(gaikan, {
                        text: i18nm.__('delete_post'),
                        post_del_confirm: i18nm.__('post_del_confirm'),
                        url: '/blog/post/delete/' + items[0]._id.toHexString()
                    }, undefined);
                }
                if (buttons) {
                    buttons = parts_buttons_wrap(gaikan, {
                        buttons: buttons
                    }, undefined);
                }

                if (items[0].post_title) items[0].post_title = items[0].post_title.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
                if (items[0].post_keywords) items[0].post_keywords = items[0].post_keywords.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
                if (items[0].post_area) items[0].post_area = items[0].post_area.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
                if (items[0].post_content) items[0].post_content = items[0].post_content.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

                var data = {
                    title: items[0].post_title + ' | ' + i18nm.__('module_name'),
                    page_title: items[0].post_title + ' | ' + i18nm.__('module_name'),
                    keywords: '',
                    description: '',
                    extra_css: '<link rel="stylesheet" href="/modules/blog/css/frontend.css">',
                    lang: i18nm,
                    post_title: items[0].post_title,
                    post_content: items[0].post_content_html,
                    post_area_id: items[0].post_area,
                    post_area: post_area,
                    post_keywords: keywords,
                    buttons: buttons,
                    post_badges: badges
                };
                var render = renderer.render_file(path.join(__dirname, 'views'), 'post_view', {
                    lang: i18nm,
                    data: data
                }, req);
                data.content = render;
                return app.get('renderer').render(res, undefined, data, req);
            });
        });
    });

    router.get('/blog/post/edit/:id', function(req, res, next) {
        var _locale = req.i18n.getLocale();
        i18nm.setLocale(_locale);
        var id = req.params.id;
        if (!id || !id.match(/^[a-f0-9]{24}$/)) return render_page(i18nm.__('blog_error'), i18nm.__('post_not_found'), req, res, 'error');
        app.get('mongodb').collection('blog').find({
            _id: new ObjectId(id)
        }).toArray(function(err, items) {
            if (err) return render_page(i18nm.__('blog_error'), i18nm.__('db_request_failed'), req, res, 'error');
            if (!items || !items.length) return render_page(i18nm.__('blog_error'), i18nm.__('post_not_found'), req, res, 'error');
            var mode = app.set('settings').blog_mode || 'private',
                areas = app.set('settings').blog_areas || '[]';
            var data = {
                title: i18nm.__('edit_post'),
                page_title: i18nm.__('edit_post'),
                keywords: '',
                description: '',
                extra_css: "\n\t" + '<link rel="stylesheet" href="/modules/blog/css/main.css" type="text/css"><link rel="stylesheet" href="/modules/blog/js/wysibb/theme/default/wbbtheme.css" type="text/css">'
            };
            if (items[0].post_title) items[0].post_title = items[0].post_title.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
            if (items[0].post_keywords) items[0].post_keywords = items[0].post_keywords.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
            if (items[0].post_area) items[0].post_area = items[0].post_area.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
            if (items[0].post_content) items[0].post_content = items[0].post_content.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            var render = renderer.render_file(path.join(__dirname, 'views'), 'post', {
                lang: i18nm,
                data: data,
                blog_mode: mode,
                blog_areas: areas,
                locale: _locale,
                blog_data: JSON.stringify(items[0])
            }, req);
            data.content = render;
            return app.get('renderer').render(res, undefined, data, req);
        });
    });

    var render_page = function(title, body, req, res, template) {
        if (!template) template = 'blog';
        var page_data = {
            title: title,
            page_title: title,
            keywords: '',
            description: '',
            extra_css: '<link rel="stylesheet" href="/modules/blog/css/frontend.css">'
        };
        var render = renderer.render_file(path.join(__dirname, 'views'), template, {
            lang: i18nm,
            title: title,
            content: body
        }, req);
        page_data.content = render;
        app.get('renderer').render(res, undefined, page_data, req);
    };

    return router;
};
