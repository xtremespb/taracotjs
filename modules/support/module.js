var sort_cells = {
        ticket_id: 1,
        user_id: 1,
        ticket_subj: 1,
        ticket_status: 1,
        ticket_prio: 1,
        ticket_date: 1
    },
    sort_cell_default = 'ticket_id',
    sort_cell_default_mode = -1,
    support_upload_file_mb = 10;

// Set items per page for this module
var items_per_page = 30;

module.exports = function(app) {

    var router = app.get('express').Router(),
        path = require('path'),
        async = require('async'),
        renderer = app.get('renderer'),
        moment = require('moment'),
        mailer = app.get('mailer'),
        config = app.get('config'),
        crypto = require('crypto'),
        fs = require('fs-extra'),
        S = require('string'),
        socketsender = require('../../core/socketsender')(app),
        redis_client = app.get('redis_client'),
        ObjectId = require('mongodb').ObjectID,
        i18nm = new(require('i18n-2'))({
            locales: config.locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: config.locales.dev_mode
        });

    router.get('/', function(req, res) {
        if (!req.session.auth || req.session.auth.status < 1) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/support';
            res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        i18nm.setLocale(req.session.current_locale);
        var data = {
                title: i18nm.__('module_name'),
                page_title: i18nm.__('module_name'),
                keywords: '',
                description: '',
                extra_css: '<link rel="stylesheet" href="/modules/support/css/frontend.css" type="text/css">'
            },
            render = renderer.render_file(path.join(__dirname, 'views'), 'support_frontend', {
                lang: i18nm,
                data: data,
                status_list: JSON.stringify(i18nm.__('status_list')),
                prio_list: JSON.stringify(i18nm.__('prio_list')),
                current_locale: req.session.current_locale
            }, req);
        data.content = render;
        app.get('renderer').render(res, undefined, data, req);
    });

    router.get('/dashboard', function(req, res) {
        var has_support_group;
        if (req.session.auth && req.session.auth.groups_hash && req.session.auth.groups_hash.support) has_support_group = 1;
        if (!req.session.auth || (req.session.auth.status < 2 && !has_support_group)) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/support/dashboard';
            res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        i18nm.setLocale(req.session.current_locale);
        var data = {
                title: i18nm.__('module_dashboard'),
                page_title: i18nm.__('module_dashboard'),
                keywords: '',
                description: '',
                extra_css: '<link rel="stylesheet" href="/modules/support/css/dashboard.css" type="text/css">'
            },
            render = renderer.render_file(path.join(__dirname, 'views'), 'support_dashboard', {
                lang: i18nm,
                data: data,
                status_list: JSON.stringify(i18nm.__('status_list')),
                prio_list: JSON.stringify(i18nm.__('prio_list')),
                current_locale: req.session.current_locale,
                current_username: req.session.auth.username,
                current_user: JSON.stringify({
                    id: req.session.auth._id,
                    id_hash: crypto.createHash('md5').update(app.get('config').salt + '.' + req.session.auth._id).digest('hex')
                })
            }, req);
        data.content = render;
        app.get('renderer').render(res, undefined, data, req);
    });

    router.post('/ajax/list', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            ipp: items_per_page
        };
        var skip = req.body.skip;
        var sort_mode = req.body.sort_mode;
        var sort_cell = req.body.sort_cell;
        if (typeof skip != 'undefined')
            if (!skip.match(/^[0-9]{1,10}$/)) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
                return res.send(JSON.stringify(rep));
            }
        if (!req.session.auth || req.session.auth.status < 1) {
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
        app.get('mongodb').collection('support').find({
            user_id: req.session.auth._id
        }).count(function(err, items_count) {
            if (!err && items_count > 0) {
                rep.total = items_count;
                app.get('mongodb').collection('support').find({
                    user_id: req.session.auth._id
                }, {
                    skip: skip,
                    limit: items_per_page
                }).sort(sort).toArray(function(err, items) {
                    if (!err && items && items.length) {
                        for (var i = 0; i < items.length; i++) {
                            var arr = [];
                            arr.push(items[i]._id);
                            arr.push(items[i].ticket_id);
                            arr.push(items[i].ticket_subj);
                            arr.push(items[i].ticket_status);
                            arr.push(items[i].ticket_prio);
                            arr.push(items[i].ticket_date);
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

    router.post('/ajax/dashboard/list', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (req.session.auth && req.session.auth.groups_hash && req.session.auth.groups_hash.support) has_support_group = 1;
        if (!req.session.auth || (req.session.auth.status < 2 && !has_support_group)) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/support';
            res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        var rep = {
            ipp: items_per_page
        };
        var skip = req.body.skip;
        var sort_mode = req.body.sort_mode;
        var sort_cell = req.body.sort_cell;
        if (typeof skip != 'undefined')
            if (!skip.match(/^[0-9]{1,10}$/)) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
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
        app.get('mongodb').collection('support').find().count(function(err, items_count) {
            if (!err && items_count > 0) {
                rep.total = items_count;
                app.get('mongodb').collection('support').find({}, {
                    skip: skip,
                    limit: items_per_page
                }).sort(sort).toArray(function(err, items) {
                    if (!err && items && items.length) {
                        var users_query = [],
                            users_hash = {};
                        for (var p in items) {
                            if (!users_hash[items[p].user_id]) {
                                users_query.push({
                                    _id: new ObjectId(items[p].user_id)
                                });
                                users_hash[items[p].user_id] = 1;
                            }
                            if (items[p].ticket_replies && items[p].ticket_replies.length)
                                for (var tr in items[p].ticket_replies)
                                    if (!users_hash[items[p].ticket_replies[tr].reply_user]) {
                                        users_query.push({
                                            _id: new ObjectId(items[p].ticket_replies[tr].reply_user)
                                        });
                                        users_hash[items[p].ticket_replies[tr].reply_user] = 1;
                                    }
                        }
                        app.get('mongodb').collection('users').find({
                            $or: users_query
                        }).toArray(function(err, users) {
                            var users_db = {};
                            if (!err && users && users.length)
                                for (var ui in users)
                                    users_db[users[ui]._id] = users[ui].username;
                            for (var i in items) {
                                var last_reply, reply_count;
                                if (items[i].ticket_replies && items[i].ticket_replies.length) {
                                    last_reply = items[i].ticket_replies[items[i].ticket_replies.length - 1].reply_user;
                                    reply_count = items[i].ticket_replies.length;
                                }
                                if (last_reply) last_reply = users_db[last_reply];
                                var arr = [];
                                arr.push(items[i]._id);
                                arr.push(items[i].ticket_id);
                                arr.push(users_db[items[i].user_id]);
                                arr.push(last_reply);
                                arr.push(items[i].ticket_subj);
                                arr.push(items[i].ticket_status);
                                arr.push(items[i].ticket_prio);
                                arr.push(items[i].ticket_date);
                                arr.push(reply_count);
                                arr.push(items[i].locked_by);
                                rep.items.push(arr);
                            }
                            // Return results
                            rep.status = 1;
                            res.send(JSON.stringify(rep));
                        });
                    }
                }); // data
            } else { // Error or count = 0
                rep.status = 1;
                rep.total = '0';
                res.send(JSON.stringify(rep));
            }
        }); // count
    });

    router.post('/ajax/ticket/create', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var ticket_subj = req.body.ticket_subj,
            ticket_prio = parseInt(req.body.ticket_prio),
            ticket_msg = req.body.ticket_msg;
        if (!ticket_subj || ticket_subj.length > 100) {
            rep.status = 0;
            rep.error = i18nm.__("form_data_incorrect");
            rep.err_field = 'ticket_subj';
            return res.send(JSON.stringify(rep));
        }
        ticket_subj = S(ticket_subj).stripTags().s.replace(/\n/g, '<br>');
        if (!ticket_prio || ticket_prio < 1 || ticket_prio > 3) {
            rep.status = 0;
            rep.error = i18nm.__("form_data_incorrect");
            rep.err_field = 'ticket_prio';
            return res.send(JSON.stringify(rep));
        }
        if (!ticket_msg || ticket_msg.length > 4096) {
            rep.status = 0;
            rep.error = i18nm.__("form_data_incorrect");
            rep.err_field = 'ticket_msg';
            return res.send(JSON.stringify(rep));
        }
        ticket_msg = S(ticket_msg).stripTags().s.replace(/\n/g, '<br>');
        app.get('mongodb').collection('counters').findAndModify({
            _id: 'support'
        }, [], {
            $inc: {
                seq: 1
            }
        }, {
            new: true
        }, function(err, counters) {
            var ticket_id;
            if (err || !counters || !counters.seq) ticket_id = Date.now();
            if (counters.seq) ticket_id = counters.seq;
            app.get('mongodb').collection('support').insert({
                user_id: req.session.auth._id,
                ticket_id: ticket_id,
                ticket_date: Date.now(),
                ticket_status: 1,
                ticket_subj: ticket_subj,
                ticket_prio: ticket_prio,
                ticket_msg: ticket_msg,
                ticket_replies: []
            }, function(err) {
                if (err) {
                    rep.status = 0;
                    rep.error = i18nm.__("database_error");
                    return res.send(JSON.stringify(rep));
                }
                rep.ticket_id = ticket_id;
                return res.send(JSON.stringify(rep));
            });
        });
    });

    router.post('/ajax/ticket/reply', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        if (!req.session.auth || req.session.auth.status < 1) return res.send({
            status: 0,
            error: i18nm.__("unauth")
        });
        var id = req.body.id,
            ticket_msg = req.body.ticket_reply_msg;
        if (!id || !id.match(/^[a-f0-9]{24}$/))
            return res.send({
                status: 0,
                error: i18nm.__("invalid_query")
            });
        if (!ticket_msg || ticket_msg.length > 4096) {
            rep.status = 0;
            rep.error = i18nm.__("form_data_incorrect");
            rep.err_field = 'ticket_msg';
            return res.send(JSON.stringify(rep));
        }
        ticket_msg = S(ticket_msg).stripTags().s.replace(/\n/g, '<br>');
        app.get('mongodb').collection('support').find({
            _id: new ObjectId(id)
        }).toArray(function(err, items) {
            if (err || !items || items.length != 1)
                return res.send({
                    status: 0,
                    error: i18nm.__("invalid_ticket")
                });
            var ticket = items[0],
                has_support_group,
                reply_date = Date.now();
            if (req.session.auth.groups_hash && req.session.auth.groups_hash.support) has_support_group = 1;
            if (ticket.user_id != req.session.auth._id && req.session.auth.status < 2 && !has_support_group)
                return res.send({
                    status: 0,
                    error: i18nm.__("unauth")
                });
            var ticket_status = ticket.ticket_status;
            if ((req.session.auth.status == 2 || has_support_group) && ticket_status == 1)
                ticket_status = 2;
            app.get('mongodb').collection('support').update({
                _id: new ObjectId(ticket._id)
            }, {
                $set: {
                    ticket_date: Date.now(),
                    ticket_status: ticket_status,
                },
                $push: {
                    ticket_replies: {
                        reply_msg: ticket_msg,
                        reply_date: reply_date,
                        reply_user: req.session.auth._id
                    }
                }
            }, function(err) {
                if (err)
                    return res.send({
                        status: 0,
                        error: i18nm.__("database_error")
                    });
                rep.ticket_id = ticket.ticket_id;
                rep.reply_date = reply_date;
                // Get list of users and broadcast a message
                app.get('mongodb').collection('users').find({
                    $or: [{
                        status: 2
                    }, {
                        groups: {
                            $regex: 'support'
                        }
                    }],
                }).toArray(function(err, users) {
                    var _multi = redis_client.multi();
                    if (!err && users && users.length) {
                        for (var ui in users)
                            _multi.get(config.redis.prefix + 'socketio_online_' + users[ui]._id);
                    }
                    _multi.exec(function(err, online) {
                        if (online && online.length)
                            for (var oi in users)
                                if (online[oi] && users[oi]._id != req.session.auth._id)
                                    socketsender.emit(users[oi]._id, 'ticket_changed', {
                                        ticket_id: ticket._id,
                                        locked_by: req.session.auth.username,
                                        ticket_date: Date.now(),
                                        ticket_status: ticket_status,
                                        reply_user: req.session.auth.username
                                    });
                        return res.send(JSON.stringify(rep));
                    });
                });
                // End of message broadcast
            });
        });
    });

    router.post('/ajax/ticket/load', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var has_support_group;
        if (req.session.auth && req.session.auth.groups_hash && req.session.auth.groups_hash.support) has_support_group = 1;
        var id = req.body.id;
        if (!id || !id.match(/^[a-f0-9]{24}$/))
            return res.send({
                status: 0,
                error: i18nm.__("invalid_query")
            });
        app.get('mongodb').collection('support').find({
            _id: new ObjectId(id)
        }).toArray(function(err, items) {
            if (err || !items || items.length != 1 || (req.session.auth._id != items[0].user_id && req.session.auth.status < 2 && !has_support_group))
                return res.send({
                    status: 0,
                    error: i18nm.__("invalid_ticket")
                });
            rep.ticket = items[0];
            var users_query = [{
                    _id: new ObjectId(rep.ticket.user_id)
                }],
                users_hash = {};
            users_hash[rep.ticket.user_id] = 1;
            if (rep.ticket.ticket_replies)
                for (var rt in rep.ticket.ticket_replies)
                    if (!users_hash[rep.ticket.ticket_replies[rt].reply_user]) {
                        users_hash[rep.ticket.ticket_replies[rt].reply_user] = 1;
                        users_query.push({
                            _id: new ObjectId(rep.ticket.ticket_replies[rt].reply_user)
                        });
                    }
            app.get('mongodb').collection('users').find({
                $or: users_query
            }).toArray(function(err, items) {
                rep.users = {};
                if (!err && items && items.length)
                    for (var ui in items)
                        rep.users[items[ui]._id] = {
                            username: items[ui].username,
                            realname: items[ui].realname,
                            email: items[ui].email
                        };
                if (!rep.ticket.locked_by) {
                    app.get('mongodb').collection('support').update({
                        _id: new ObjectId(id)
                    }, {
                        $set: {
                            locked_by: req.session.auth.username
                        }
                    }, function(err) {
                        rep.items = items;
                        // Get list of users and broadcast a message
                        app.get('mongodb').collection('users').find({
                            $or: [{
                                status: 2
                            }, {
                                groups: {
                                    $regex: 'support'
                                }
                            }],
                        }).toArray(function(err, users) {
                            var _multi = redis_client.multi();
                            if (!err && users && users.length) {
                                for (var ui in users)
                                    _multi.get(config.redis.prefix + 'socketio_online_' + users[ui]._id);
                            }
                            _multi.exec(function(err, online) {
                                if (online && online.length)
                                    for (var oi in users)
                                        if (online[oi] && users[oi]._id != req.session.auth._id)
                                            socketsender.emit(users[oi]._id, 'ticket_changed', {
                                                ticket_id: id,
                                                locked_by: req.session.auth.username
                                            });
                                return res.send(JSON.stringify(rep));
                            });
                        });
                        // End of message broadcast
                    });
                } else {
                    return res.send(JSON.stringify(rep));
                }
            });
        });
    });

    router.post('/ajax/upload', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var id = parseInt(req.body.ticket_id),
            reply_id = parseInt(req.body.reply_id);
        if (!id || id.isNaN || id < 1)
            return res.send({
                status: 0,
                error: i18nm.__("invalid_query")
            });
        if (reply_id && (reply_id.isNaN || reply_id < 1))
            return res.send({
                status: 0,
                error: i18nm.__("invalid_query")
            });
        if (!req.files || !req.files.file) {
            rep.status = 0;
            rep.error = i18nm.__("no_file_sent");
            return res.send(JSON.stringify(rep));
        }
        var file = req.files.file;
        if (file.size > support_upload_file_mb * 1048576) {
            rep.status = 0;
            rep.error = i18nm.__("file_too_big");
            res.send(JSON.stringify(rep));
            return;
        }
        var ext = path.extname(file.originalname),
            dn = id + '_' + Date.now();
        if (!check_filename(file.originalname) || !ext) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_filename_syntax");
            res.send(JSON.stringify(rep));
            return;
        }
        ext = ext.toLowerCase();
        app.get('mongodb').collection('support').find({
            ticket_id: id,
            user_id: req.session.auth._id
        }).toArray(function(err, items) {
            if (err || !items || items.length != 1)
                return res.send({
                    status: 0,
                    error: i18nm.__("invalid_ticket")
                });
            var ticket = items[0];
            fs.move(app.get('config').dir.tmp + '/' + file.name, path.join(__dirname, 'files', dn + ext), function(err) {
                console.log(err);
                if (err) return res.send({
                    status: 0,
                    error: i18nm.__('upload_failed')
                });
                if (reply_id) {
                    for (var i in ticket.ticket_replies)
                        if (ticket.ticket_replies[i].reply_date == reply_id)
                            ticket.ticket_replies[i].attachment = dn + ext;
                    app.get('mongodb').collection('support').update({
                        _id: new ObjectId(ticket._id)
                    }, {
                        $set: {
                            ticket_replies: ticket.ticket_replies
                        }
                    }, function(err) {
                        if (err)
                            return res.send({
                                status: 0,
                                error: i18nm.__("database_error")
                            });
                        return res.send(JSON.stringify(rep));
                    });
                } else {
                    app.get('mongodb').collection('support').update({
                        _id: new ObjectId(ticket._id)
                    }, {
                        $set: {
                            attachment: dn + ext
                        }
                    }, function(err) {
                        if (err)
                            return res.send({
                                status: 0,
                                error: i18nm.__("database_error")
                            });
                        return res.send(JSON.stringify(rep));
                    });
                }
            });
        });
    });

    router.get('/attachment', function(req, res, next) {
        var file = req.query.file;
        if (!file || !check_filename(file) || !req.session.auth || req.session.auth.status < 1) return res.status(404) && next();
        fs.exists(path.join(__dirname, 'files', file), function(ex) {
            if (!ex) return res.status(404) && next();
            var options = {
                root: path.join(__dirname, 'files'),
                dotfiles: 'deny',
                headers: {
                    'x-timestamp': Date.now(),
                    'x-sent': true
                }
            };
            if (req.session.auth.status == 2 || (req.session.auth.groups_hash && req.session.auth.groups_hash.support)) {
                res.sendFile(file, options, function(err) {
                    if (err) return res.status(404) && next();
                });
            } else {
                var sp = file.split(/_/);
                if (!sp || !sp.length) return res.status(404) && next();
                var ticket_id = parseInt(sp[0]);
                if (!ticket_id || ticket_id.isNaN) return res.status(404) && next();
                app.get('mongodb').collection('support').find({
                    ticket_id: ticket_id,
                    user_id: req.session.auth._id
                }).toArray(function(err, items) {
                    if (err || !items || items.length != 1) return res.status(404) && next();
                    res.sendFile(file, options, function(err) {
                        if (err) return res.status(404) && next();
                    });
                });
            }
        });
    });

    router.post('/ajax/ticket/unlock', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        var has_support_group;
        if (req.session.auth && req.session.auth.groups_hash && req.session.auth.groups_hash.support) has_support_group = 1;
        if (!req.session.auth || (req.session.auth.status < 2 && !has_support_group)) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var id = req.body.id;
        if (!id || !id.match(/^[a-f0-9]{24}$/))
            return res.send({
                status: 0,
                error: i18nm.__("invalid_query")
            });
        app.get('mongodb').collection('support').update({
            _id: new ObjectId(id)
        }, {
            $set: {
                locked_by: null
            }
        }, function(err) {
            // Get list of users and broadcast a message
            app.get('mongodb').collection('users').find({
                $or: [{
                    status: 2
                }, {
                    groups: {
                        $regex: 'support'
                    }
                }],
            }).toArray(function(err, users) {
                var _multi = redis_client.multi();
                if (!err && users && users.length) {
                    for (var ui in users)
                        _multi.get(config.redis.prefix + 'socketio_online_' + users[ui]._id);
                }
                _multi.exec(function(err, online) {
                    if (online && online.length)
                        for (var oi in users)
                            if (online[oi] && users[oi]._id != req.session.auth._id)
                                socketsender.emit(users[oi]._id, 'ticket_changed', {
                                    ticket_id: id,
                                    locked_by: undefined
                                });
                    return res.send(JSON.stringify(rep));
                });
            });
            // End of message broadcast
        });
    });

    // Helper functions

    var check_filename = function(_fn) {
        if (!_fn) return false; // don't allow null
        var fn = _fn.replace(/^\s+|\s+$/g, '');
        if (!fn || fn.length > 80) return false; // null or too long
        if (fn.match(/^\./)) return false; // starting with a dot
        if (fn.match(/^[\^<>\:\"\/\\\|\?\*\x00-\x1f]+$/)) return false; // invalid characters
        return true;
    };

    return router;
};
