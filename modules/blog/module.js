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

    var i18nm = new(require('i18n-2'))({
        locales: app.get('config').locales,
        directory: app.get('path').join(__dirname, 'lang'),
        extension: '.js',
        devMode: app.get('config').locales_dev_mode
    });

    //
    // Load blog feed based on user query
    //

    router.get(/^\/blog(\/(keywords|area|user|moderation)\/(.*))?\/?$/, function(req, res) {
        var _locale = req.session.current_locale;
        var moment = require('moment');
        i18nm.setLocale(_locale);
        moment.locale(_locale);
        var query = {
            post_lang: _locale,
            post_draft: {
                $ne: '1'
            },
            post_deleted: {
                $ne: '1'
            },
            post_moderated: '1'
        };
        var blog_page_url = '/blog?page=';
        var check_user = '';
        if (req.params && req.params[1] && req.params[2] && req.params[1] == 'user') check_user = String(req.params[2]).replace(/\//, '');
        get_id_by_username(check_user, function(check_user_data) {
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
                if (req.params[1] == 'user') {
                    if (check_user_data && check_user_data._id) {
                        query.post_user_id = check_user_data._id.toHexString();
                        blog_page_url = '/blog/user/' + check_user + '?page=';
                        if (String(check_user_data._id.toHexString()) === String(req.session.auth._id)) {
                            delete query.post_draft;
                            delete query.post_moderated;
                        }
                    }
                }
                if (req.params[1] == 'moderation') {
                    var allow = false;
                    if (req.session.auth && req.session.auth.status == 2) allow = true;
                    if (req.session.auth && req.session.auth.groups_hash && req.session.auth.groups_hash.blog_moderator) allow = true;
                    if (allow) {
                        query.post_moderated = '';
                        blog_page_url = '/blog/moderation/all/?page=';
                    } else {
                        return render_page(i18nm.__('blog_error'), i18nm.__('moderate_permission_denied'), req, res, 'error');
                    }
                }
            }
            var total = 0,
                page = parseInt(req.query.page) || 1,
                max_pages = 10,
                items_per_page = 10;
            if (page && (page == "NaN" || page < 0)) return render_page(i18nm.__('blog_error'), i18nm.__('invalid_skip_value'), req, res, 'error');
            var skip = (page - 1) * items_per_page;
            app.get('mongodb').collection('blog').find({
                post_moderated: '',
                post_deleted: '',
                post_draft: ''
            }).count(function(modreq_err, modreq_count) {
                app.get('mongodb').collection('blog').find(query).count(function(err, items_count) {
                    if (!err && items_count > 0) {
                        app.get('mongodb').collection('blog').find(query, {
                            skip: skip,
                            limit: items_per_page
                        }).sort({
                            post_timestamp: -1
                        }).toArray(function(err, items) {
                            // Error handler
                            if (err) return render_page(i18nm.__('module_name'), i18nm.__('no_records_found'), req, res, 'error');
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
                                    var parts_moderation_alert = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_moderation_alert.html');
                                    var blog_areas;
                                    try {
                                        blog_areas = JSON.parse(app.set('settings').blog_areas);
                                    } catch (ex) {
                                        blog_areas = [];
                                    }
                                    if (modreq_count && modreq_count > 0) {
                                        blog_feed += parts_moderation_alert(gaikan, {
                                            notice: i18nm.__('posts_avaiting_moderation'),
                                            count: modreq_count
                                        }, undefined);
                                    }
                                    for (var i = 0; i < items.length; i++) {
                                        if (items[i].post_title) items[i].post_title = items[i].post_title.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
                                        if (items[i].post_keywords) items[i].post_keywords = items[i].post_keywords.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
                                        if (items[i].post_area) items[i].post_area = items[i].post_area.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
                                        if (items[i].post_content) items[i].post_content = items[i].post_content.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                        var timestamp = '',
                                            badges = '';
                                        if (items[i].post_timestamp) {
                                            timestamp = moment(items[i].post_timestamp).fromNow();
                                        } else {
                                            timestamp = moment(Date.now()).fromNow();
                                        }
                                        badges += parts_badge(gaikan, {
                                            icon: 'clock-o',
                                            text: timestamp
                                        }, undefined);
                                        if (usernames[items[i].post_user_id]) {
                                            badges += parts_badge_link(gaikan, {
                                                icon: 'user',
                                                text: usernames[items[i].post_user_id],
                                                url: '/blog/user/' + usernames[items[i].post_user_id]
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
                                            blog_text: i18nm.__('module_name'),
                                            post_url: '/blog/post/' + items[i]._id.toHexString()
                                        }, undefined);
                                    }
                                    // Pagination begin
                                    var num_pages = Math.ceil(items_count / items_per_page);
                                    var pgnt = '';
                                    if (num_pages > 1) {
                                        if (num_pages > max_pages) {
                                            if (page > 1) {
                                                var _p = page - 1;
                                                pgnt += parts_page_normal(gaikan, {
                                                    url: blog_page_url + _p,
                                                    text: '«'
                                                }, undefined);
                                            }
                                            if (page > 3) {
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
                                                pgnt += parts_page_span(gaikan, {
                                                    class: 'taracot-dots',
                                                    text: '...'
                                                }, undefined);
                                            }
                                            if (page <= num_pages - 3) {
                                                pgnt += parts_page_normal(gaikan, {
                                                    url: blog_page_url + num_pages,
                                                    text: num_pages
                                                }, undefined);
                                            }
                                            if (page < num_pages) {
                                                var _p = page + 1;
                                                pgnt += parts_page_normal(gaikan, {
                                                    url: blog_page_url + _p,
                                                    text: '»'
                                                }, undefined);
                                            }
                                        } else {
                                            for (var i = 1; i <= num_pages; i++) {
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
                                return render_page(i18nm.__('module_name'), i18nm.__('no_records_found'), req, res, 'error');
                            }
                        }); // data
                    } else { // Error or count = 0
                        // Error or no count = 0
                        return render_page(i18nm.__('module_name'), i18nm.__('no_records_found'), req, res, 'error');
                    }
                }); // count
            });
        }); // get_username_by_id
    });

    //
    // Create new post (GUI)
    //

    router.get('/blog/post', function(req, res, next) {
        var _locale = req.session.current_locale;
        i18nm.setLocale(_locale);
        var mode = app.set('settings').blog_mode || 'private',
            areas = app.set('settings').blog_areas || '[]';

        if (!req.session.auth || req.session.auth.status < 1) {
            req.session.auth_redirect = '/blog/post';
            res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }

        if (mode == 'private') {
            var allow = false;
            if (req.session.auth && req.session.auth.status == 2) allow = true;
            if (req.session.auth && req.session.auth.groups_hash && req.session.auth.groups_hash.blog_post) allow = true;
            if (req.session.auth && req.session.auth.groups_hash && req.session.auth.groups_hash.blog_moderator) allow = true;
            if (!allow) return render_page(i18nm.__('blog_error'), i18nm.__('unauth_to_create_post'), req, res, 'error');
        }
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

    //
    // Save changes to post (or create new post) (AJAX)
    //

    router.post('/blog/post/save', function(req, res, next) {
        var _locale = req.session.current_locale;
        var rep = {
            status: 1
        };
        i18nm.setLocale(_locale);
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var mode = app.set('settings').blog_mode || 'private';
        if (mode == 'private') {
            var allow = false;
            if (req.session.auth && req.session.auth.status == 2) allow = true;
            if (req.session.auth && req.session.auth.groups_hash && req.session.auth.groups_hash.blog_post) allow = true;
            if (req.session.auth && req.session.auth.groups_hash && req.session.auth.groups_hash.blog_moderator) allow = true;
            if (!allow) {
                rep.status = 0;
                rep.error = i18nm.__("unauth_to_create_post");
                return res.send(JSON.stringify(rep));
            }
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
            text: post_content.replace(/\[cut\]/ig, "").replace(/\[\/\*\]/g, ''),
            removeMisalignedTags: true,
            addInLineBreaks: true
        });
        if (!bbcode_post || bbcode_post.error) {
            rep.status = 0;
            rep.error = i18nm.__('bbcode_process_failed');
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
        if (mode == 'moderation') {
            update.post_moderated = '';
            if (req.session.auth.status == 2) update.post_moderated = '1';
            if (req.session.auth.groups_hash && req.session.auth.groups_hash.blog_moderator) update.post_moderated = '1';
        } else {
            update.post_moderated = '1';
        }
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
                var id_session = String(req.session.auth._id);
                var id_post = String(items[0].post_user_id);
                if (id_session != id_post) {
                    var allow = false;
                    if (req.session.auth && req.session.auth.status == 2) allow = true;
                    if (req.session.auth && req.session.auth.groups_hash && req.session.auth.groups_hash.blog_moderator) allow = true;
                    if (!allow) {
                        rep.status = 0;
                        rep.error = i18nm.__("unauth_to_create_post");
                        return res.send(JSON.stringify(rep));
                    }
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
            update.post_deleted = '';
            app.get('mongodb').collection('blog').insert(update, function(_err, _items) {
                if (_err) {
                    rep.status = 0;
                    return res.send(JSON.stringify(rep));
                }
                // Success
                if (_items[0]._id) rep.post_id = _items[0]._id.toHexString();
                return res.send(JSON.stringify(rep));
            });
        }
    });

    //
    // View post (GUI)
    //

    router.get('/blog/post/:id', function(req, res, next) {
        var _locale = req.session.current_locale;
        i18nm.setLocale(_locale);
        var moment = require('moment');
        moment.locale(_locale);
        var id = req.params.id;
        if (!id || !id.match(/^[a-f0-9]{24}$/)) return render_page(i18nm.__('blog_error'), i18nm.__('post_not_found'), req, res, 'error');
        app.get('mongodb').collection('blog').find({
            _id: new ObjectId(id)
        }).toArray(function(err, items) {
            if (err) return render_page(i18nm.__('blog_error'), i18nm.__('db_request_failed'), req, res, 'error');
            if (!items || !items.length) return render_page(i18nm.__('blog_error'), i18nm.__('post_not_found'), req, res, 'error');
            var mb = false;
            if (req.session.auth && req.session.auth.status == 2) mb = true;
            if (req.session.auth && req.session.auth.groups_hash && req.session.auth.groups_hash.blog_moderator) mb = true;
            var own_post = false;
            if (req.session.auth && req.session.auth._id == items[0].post_user_id) own_post = true;
            if (items[0].post_draft && !mb && !own_post) return render_page(i18nm.__('blog_error'), i18nm.__('post_is_a_draft'), req, res, 'error');
            var id_session;
            if (req.session.auth) id_session = String(req.session.auth._id);
            var id_post = String(items[0].post_user_id);
            if (id_session != id_post)
                if (items[0].post_draft && items[0].status < 2 && req.session.auth.groups_hash && req.session.auth.groups_hash.blog_moderator) return render_page(i18nm.__('blog_error'), i18nm.__('post_not_found'), req, res, 'error');
            app.get('mongodb').collection('blog_comments').find({
                post_id: items[0]._id.toHexString()
            }, {
                limit: 10000
            }).sort({
                comment_timestamp: 1
            }).toArray(function(cm_err, cm_items) {
                var query_users = [];
                var query_users_hash = {};
                query_users.push({
                    _id: new ObjectId(items[0].post_user_id)
                });
                query_users_hash[String(items[0].post_user_id)] = 1;
                for (var ci = 0; ci < cm_items.length; ci++)
                    if (!query_users_hash[cm_items[ci].comment_user_id]) {
                        query_users_hash[cm_items[ci].comment_user_id] = 1;
                        query_users.push({
                            _id: new ObjectId(cm_items[ci].comment_user_id)
                        });
                    }
                app.get('mongodb').collection('users').find({
                    $or: query_users
                }).toArray(function(err, users_db) {
                    var users_db_hash = {},
                        avatars_hash = {};
                    for (var u = 0; u < users_db.length; u++) users_db_hash[users_db[u]._id.toHexString()] = users_db[u].username;
                    for (var key in users_db_hash) {
                        var afn = crypto.createHash('md5').update(app.get('config').salt + '.' + key).digest('hex');
                        if (fs.existsSync(path.join(__dirname, '..', '..', 'public', 'images', 'avatars', afn + '.jpg'))) avatars_hash[key] = '/images/avatars/' + afn + '.jpg';
                    }
                    var parts_badge = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_badge.html');
                    var parts_badge_link = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_badge_link.html');
                    var parts_keyword = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_keyword.html');
                    var parts_button_class = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_button_class.html');
                    var parts_button_delete_post = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_button_delete_post.html');
                    var parts_buttons_wrap = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_buttons_wrap.html');
                    var parts_moderation_badge = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_moderation_badge.html');
                    var parts_comments_form = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_comments_form.html');
                    var parts_comment = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_comment.html');
                    var parts_comment_delete = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_comment_delete.html');
                    var parts_comment_deleted = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_comment_deleted.html');

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
                        timestamp = moment(items[0].post_timestamp).fromNow();
                    } else {
                        timestamp = moment(Date.now()).fromNow();
                    }
                    badges += parts_badge(gaikan, {
                        icon: 'clock-o',
                        text: timestamp
                    }, undefined);
                    if (users_db_hash[items[0].post_user_id]) {
                        badges += parts_badge_link(gaikan, {
                            icon: 'user',
                            text: users_db_hash[items[0].post_user_id],
                            url: '/blog/user/' + users_db_hash[items[0].post_user_id]
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
                    var id_session;
                    if (req.session.auth) id_session = String(req.session.auth._id);
                    var id_post = String(items[0].post_user_id);
                    if ((req.session.auth && id_session === id_post) || (req.session.auth && req.session.auth.status == 2) || (req.session.auth && req.session.auth.groups_hash && req.session.auth.groups_hash.blog_moderator)) {
                        buttons += parts_button_class(gaikan, {
                            icon: 'pencil',
                            text: i18nm.__('edit_post'),
                            class: 'button-small',
                            url: '/blog/post/edit/' + items[0]._id.toHexString()
                        }, undefined);
                    }
                    if (req.session.auth && req.session.auth.status == 2) {
                        buttons += parts_button_delete_post(gaikan, {
                            text: i18nm.__('delete_post'),
                            post_del_confirm: i18nm.__('post_del_confirm'),
                            url: '/blog/post/moderate/delete/' + items[0]._id.toHexString()
                        }, undefined);
                    }
                    var mode = app.set('settings').blog_mode || 'private';

                    if (mode == 'moderation') {
                        if (mb && !items[0].post_moderated) buttons += parts_button_class(gaikan, {
                            icon: 'unlock',
                            text: i18nm.__('allow_post'),
                            class: 'button-small',
                            url: '/blog/post/moderate/allow/' + items[0]._id.toHexString()
                        }, undefined);
                        if (mb && items[0].post_moderated) buttons += parts_button_class(gaikan, {
                            icon: 'lock',
                            text: i18nm.__('disallow_post'),
                            class: 'button-small',
                            url: '/blog/post/moderate/disallow/' + items[0]._id.toHexString()
                        }, undefined);
                    }
                    if (buttons) {
                        buttons = parts_buttons_wrap(gaikan, {
                            buttons: buttons
                        }, undefined);
                    }

                    var _move_comment_to_parent = function(comment_to_move, parent_id, _area) {
                        var area = _area || cm_items;
                        for (var i = 0; i < area.length; i++) {
                            if (area[i] && area[i].children) _move_comment_to_parent(comment_to_move, parent_id, area[i].children);
                            if (area[i] && area[i]._id.toHexString() == parent_id) {
                                if (!area[i].children) area[i].children = [];
                                area[i].children.push(comment_to_move);
                            }
                        }
                    };

                    for (var c = 0; c < cm_items.length; c++) {
                        if (cm_items[c] && cm_items[c].comment_parent) {
                            _move_comment_to_parent(cm_items[c], String(cm_items[c].comment_parent));
                            delete cm_items[c];
                        }
                    }

                    var comments = '';

                    var _get_comments = function(item, level) {
                        if (!level) level = 0;
                        if (item) {
                            var timestamp;
                            if (item.comment_timestamp) {
                                timestamp = item.comment_timestamp;
                            } else {
                                timestamp = Date.now();
                            }
                            var avatar_url = avatars_hash[item.comment_user_id] || "/images/avatars/default.png";
                            var delete_btn = '';
                            if (mb) {
                                delete_btn = parts_comment_delete(gaikan, {
                                    id: item._id.toHexString(),
                                    text_delete: i18nm.__('delete_comment')
                                }, undefined);
                            }
                            if (item.comment_deleted) {
                                comments += parts_comment_deleted(gaikan, {
                                    comment_id: item._id.toHexString(),
                                    level: level * 15,
                                    deleted_text: i18nm.__('comment_deleted')
                                });
                            } else {
                                comments += parts_comment(gaikan, {
                                    username: users_db_hash[item.comment_user_id],
                                    comment: item.comment_text,
                                    reply_link: i18nm.__('reply_link'),
                                    comment_id: item._id.toHexString(),
                                    timestamp: moment(timestamp).format('L LT'),
                                    level: level * 15,
                                    avatar_url: avatar_url,
                                    delete_btn: delete_btn
                                });
                            }
                            if (item.children)
                                for (var i = 0; i < item.children.length; i++) _get_comments(item.children[i], level + 1);
                        }
                    };

                    for (var c = 0; c < cm_items.length; c++) _get_comments(cm_items[c]);

                    if (items[0].post_title) items[0].post_title = items[0].post_title.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
                    if (items[0].post_keywords) items[0].post_keywords = items[0].post_keywords.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
                    if (items[0].post_area) items[0].post_area = items[0].post_area.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, '');
                    if (items[0].post_content) items[0].post_content = items[0].post_content.replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

                    var title_ex = items[0].post_title;
                    if (!items[0].post_moderated) title_ex += parts_moderation_badge(gaikan, {
                        notice: i18nm.__('post_needs_moderation')
                    }, undefined);

                    var comments_form = '',
                        comments_flow = '';

                    if (req.session.auth && req.session.auth.status > 0 && items[0].post_comments) {
                        comments_form = parts_comments_form(gaikan, {
                            lang: i18nm
                        }, undefined);
                    }

                    var data = {
                        title: items[0].post_title + ' | ' + i18nm.__('module_name'),
                        page_title: items[0].post_title + ' | ' + i18nm.__('module_name'),
                        keywords: '',
                        description: '',
                        extra_css: '<link rel="stylesheet" href="/modules/blog/css/frontend.css">',
                        lang: i18nm,
                        current_locale: _locale,
                        post_title: title_ex,
                        post_content: items[0].post_content_html,
                        post_area_id: items[0].post_area,
                        post_area: post_area,
                        post_keywords: keywords,
                        blog_text: i18nm.__('module_name'),
                        post_id: items[0]._id.toHexString(),
                        buttons: buttons,
                        post_badges: badges,
                        comments_form: comments_form,
                        comments_flow: comments
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
    });

    //
    // Edit post (GUI)
    //

    router.get('/blog/post/edit/:id', function(req, res, next) {
        var _locale = req.session.current_locale;
        i18nm.setLocale(_locale);
        var id = req.params.id;
        if (!id || !id.match(/^[a-f0-9]{24}$/)) return render_page(i18nm.__('blog_error'), i18nm.__('post_not_found'), req, res, 'error');
        app.get('mongodb').collection('blog').find({
            _id: new ObjectId(id)
        }).toArray(function(err, items) {
            if (err) return render_page(i18nm.__('blog_error'), i18nm.__('db_request_failed'), req, res, 'error');
            if (!items || !items.length) return render_page(i18nm.__('blog_error'), i18nm.__('post_not_found'), req, res, 'error');
            var id_session;
            if (req.session.auth) id_session = String(req.session.auth._id);
            var id_post = String(items[0].post_user_id);
            if (id_session != id_post) {
                var allow = false;
                if (req.session.auth && req.session.auth.status == 2) allow = true;
                if (req.session.auth && req.session.auth.groups_hash && req.session.auth.groups_hash.blog_moderator) allow = true;
                if (!allow) return render_page(i18nm.__('blog_error'), i18nm.__('unauth_to_edit_post'), req, res, 'error');
            }
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

    router.get('/blog/post/moderate/:func/:id', function(req, res, next) {
        var id = req.params.id,
            fn = req.params.func;
        if (!id || !id.match(/^[a-f0-9]{24}$/) || !fn) return render_page(i18nm.__('blog_error'), i18nm.__('post_not_found'), req, res, 'error');
        if (fn != 'allow' && fn != 'disallow' && fn != 'delete') return render_page(i18nm.__('blog_error'), i18nm.__('invalid_moderation_function'), req, res, 'error');
        var allow = false;
        if (req.session.auth && req.session.auth.status == 2) allow = true;
        if (req.session.auth && req.session.auth.groups_hash && req.session.auth.groups_hash.blog_moderator) allow = true;
        if (!allow) return render_page(i18nm.__('blog_error'), i18nm.__('moderate_permission_denied'), req, res, 'error');
        app.get('mongodb').collection('blog').find({
            _id: new ObjectId(id)
        }).toArray(function(err, items) {
            if (err || !items || !items.length) return render_page(i18nm.__('blog_error'), i18nm.__('post_not_found'), req, res, 'error');
            if (items[0].post_deleted) return render_page(i18nm.__('moderation'), i18nm.__('post_has_been_deleted'), req, res, 'error');
            if (fn == 'allow') {
                app.get('mongodb').collection('blog').update({
                    _id: new ObjectId(id)
                }, {
                    $set: {
                        post_moderated: '1'
                    }
                }, function(_err, _items) {
                    if (_err) return render_page(i18nm.__('moderation'), i18nm.__('moderate_actions_failed'), req, res, 'error');
                    return res.redirect(303, "/blog/post/" + id + "?rnd=" + Math.random().toString().replace('.', ''));
                });
            }
            if (fn == 'disallow') {
                app.get('mongodb').collection('blog').update({
                    _id: new ObjectId(id)
                }, {
                    $set: {
                        post_moderated: ''
                    }
                }, function(_err, _items) {
                    if (_err) return render_page(i18nm.__('moderation'), i18nm.__('moderate_actions_failed'), req, res, 'error');
                    return res.redirect(303, "/blog/post/" + id + "?rnd=" + Math.random().toString().replace('.', ''));
                });
            }
            if (fn == 'delete') {
                app.get('mongodb').collection('blog').update({
                    _id: new ObjectId(id)
                }, {
                    $set: {
                        post_deleted: '1'
                    }
                }, function(_err, _items) {
                    if (_err) return render_page(i18nm.__('moderation'), i18nm.__('moderate_actions_failed'), req, res, 'error');
                    render_page(i18nm.__('moderation'), i18nm.__('post_has_been_deleted'), req, res, 'error');
                });
            }
        });
    });

    //
    // Post comment
    //

    router.post('/blog/post/comment', function(req, res, next) {
        var _locale = req.session.current_locale;
        var moment = require('moment');
        moment.locale(_locale);
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
            comment_parent = req.body.comment_parent || '',
            comment_text = req.body.comment_text;
        if (!post_id || !post_id.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_post");
            return res.send(JSON.stringify(rep));
        }
        if (comment_parent && !comment_parent.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_post");
            return res.send(JSON.stringify(rep));
        }
        comment_text = comment_text.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ').replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, ' ');
        if (!comment_text || comment_text.length < 2 || comment_text.length > 2048) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_comment");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('blog').find({
            _id: new ObjectId(post_id)
        }).toArray(function(err, items) {
            if (err || !items || !items.length) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_post");
                return res.send(JSON.stringify(rep));
            }
            if (!items[0].post_comments) {
                rep.status = 0;
                rep.error = i18nm.__("comments_disallowed");
                return res.send(JSON.stringify(rep));
            }
            var parts_comment = gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_comment.html'),
                timestamp = Date.now();
            var comment = {
                comment_parent: comment_parent,
                post_id: post_id,
                comment_text: comment_text,
                comment_timestamp: Date.now(),
                comment_user_id: req.session.auth._id
            };
            app.get('mongodb').collection('blog_comments').insert(comment, function(_err, _items) {
                if (_err) {
                    rep.status = 0;
                    rep.error = i18nm.__("invalid_comment");
                    return res.send(JSON.stringify(rep));
                }
                var comment_html = parts_comment(gaikan, {
                    username: req.session.auth.username,
                    comment: comment_text,
                    reply_link: i18nm.__('reply_link'),
                    comment_id: _items[0]._id.toHexString(),
                    timestamp: moment(timestamp).format('L LT'),
                    level: '[set_margin]',
                    avatar_url: req.session.auth.avatar
                });
                rep.comment_html = comment_html;
                rep.comment_id = _items[0]._id.toHexString();
                return res.send(JSON.stringify(rep));
            });
        });
    });

    //
    // Delete comment
    //

    router.post('/blog/post/comment/delete', function(req, res, next) {
        var _locale = req.session.current_locale;
        var rep = {
            status: 1
        };
        i18nm.setLocale(_locale);
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var mb = false;
        if (req.session.auth && req.session.auth.status == 2) mb = true;
        if (req.session.auth && req.session.auth.groups_hash && req.session.auth.groups_hash.blog_moderator) mb = true;
        if (!mb) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var comment_id = req.body.comment_id;
        if (!comment_id || !comment_id.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_comment");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('blog_comments').find({
            _id: new ObjectId(comment_id)
        }).toArray(function(err, items) {
            if (err || !items || !items.length) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_comment");
                return res.send(JSON.stringify(rep));
            }
            app.get('mongodb').collection('blog_comments').update({
                    _id: new ObjectId(comment_id)
                }, {
                    $set: {
                        comment_deleted: '1'
                    }
                },
                function(_err, _items) {
                    if (_err) {
                        rep.status = 0;
                        rep.error = i18nm.__("invalid_comment");
                        return res.send(JSON.stringify(rep));
                    }
                    return res.send(JSON.stringify(rep));
                });
        });
    });

    //
    // Helper functions
    //

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
            content: body,
            current_locale: req.session.current_locale
        }, req);
        page_data.content = render;
        app.get('renderer').render(res, undefined, page_data, req);
    };

    var get_id_by_username = function(user, callback) {
        if (!user || !user.match(/^[A-Za-z0-9_\-]{3,20}$/)) return callback();
        app.get('mongodb').collection('users').find({
            username: user
        }).toArray(function(err, items) {
            if (err || !items || !items.length) return callback();
            callback(items[0]);
        });
    };

    return router;
};
