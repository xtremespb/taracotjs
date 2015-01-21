module.exports = function(app) {

    var router = app.get('express').Router(),
        gaikan = require('gaikan'),
        renderer = app.get('renderer'),
        path = app.get('path'),
        ObjectId = require('mongodb').ObjectID,
        crypto = require('crypto'),
        fs = require('fs'),
        async = require('async'),
        socketsender = require('../../core/socketsender')(app),
        redis_client = app.get('redis_client');

    var i18nm = new(require('i18n-2'))({
        locales: app.get('config').locales.avail,
        directory: app.get('path').join(__dirname, 'lang'),
        extension: '.js',
        devMode: app.get('config').locales.dev_mode
    });

    router.get('/', function(req, res, next) {
        var _locale = req.session.current_locale;
        i18nm.setLocale(_locale);
        var moment = require('moment');
        moment.locale(_locale);
        var mode = app.set('settings').social_mode || 'private',
            areas = app.set('settings').social_areas || '[]';
        if (!req.session.auth || req.session.auth.status < 1) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/social';
            res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        var data = {
            title: i18nm.__('social'),
            page_title: i18nm.__('social'),
            keywords: '',
            description: '',
            extra_css: "\n\t" + '<link rel="stylesheet" href="/modules/social/css/frontend.css" type="text/css">'
        };
        var _regdate = i18nm.__('unknown_regdate');
        if (req.session.auth.regdate) _regdate = req.session.auth.regdate;
        app.get('mongodb').collection('social_friends').find({
            $or: [{
                u1: req.session.auth._id,
                friends: '1'
            }, {
                u2: req.session.auth._id,
                friends: '1'
            }]
        }).count(function(err, friends_count) {
            app.get('mongodb').collection('social_friends').find({
                u2: req.session.auth._id,
                friends: {
                    $ne: '1'
                }
            }).count(function(err, inv_count) {
                var current_user = {
                    username: req.session.auth.username,
                    realname: req.session.auth.realname,
                    name: req.session.auth.realname || req.session.auth.username,
                    avatar: req.session.auth.avatar,
                    regdate: req.session.auth.regdate,
                    regdate_text: moment(_regdate).format('LLL'),
                    email: req.session.auth.email,
                    id: req.session.auth._id,
                    id_hash: crypto.createHash('md5').update(app.get('config').salt + '.' + req.session.auth._id).digest('hex')
                };
                var render = renderer.render_file(path.join(__dirname, 'views'), 'social', {
                    lang: i18nm,
                    locale: _locale,
                    data: data,
                    current_user: JSON.stringify(current_user),
                    _current_user: current_user,
                    friends_count: friends_count || '0',
                    inv_count: inv_count || '0'
                }, req);
                data.content = render;
                return app.get('renderer').render(res, undefined, data, req);
            });
        });
    });

    router.post('/user/friends/search', function(req, res, next) {
        var _locale = req.session.current_locale;
        var rep = {
            status: 1,
            items_per_page: 30
        };
        i18nm.setLocale(_locale);
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var query = req.body.query,
            skip = req.body.skip;
        if (!query || !String(query).length || String(query).length < 3 || String(query).length > 100) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            return res.send(JSON.stringify(rep));
        }
        if (skip) skip = parseInt(skip);
        if (skip && (typeof skip != 'number' || skip % 1 !== 0 || skip < 0)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            return res.send(JSON.stringify(rep));
        }
        if (!skip) skip = 0;
        skip = skip * rep.items_per_page;
        query = query.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
        var db_query = {
            $and: [{
                $or: [{
                    username: new RegExp(query, 'i')
                }, {
                    email: new RegExp(query, 'i')
                }, {
                    realname: new RegExp(query, 'i')
                }]
            }, {
                status: {
                    $ne: 0
                }
            }]
        };
        app.get('mongodb').collection('users').find(db_query).count(function(err, items_count) {
            if (err || !items_count) {
                rep.status = 0;
                rep.error = i18nm.__("no_items_found");
                return res.send(JSON.stringify(rep));
            }
            app.get('mongodb').collection('users').find(db_query, {
                skip: skip,
                limit: rep.items_per_page
            }).sort({
                username: 1
            }).toArray(function(err, items) {
                if (err || !items) {
                    rep.status = 0;
                    rep.error = i18nm.__("no_items_found");
                    return res.send(JSON.stringify(rep));
                }
                rep.items = items;
                var _multi = redis_client.multi();
                for (var j = 0; j < rep.items.length; j++) {
                    _multi.get(app.get('config').redis.prefix + 'socketio_online_' + rep.items[j]._id);
                }
                _multi.exec(function(err, online) {
                    if (err || !online) online = [];
                    for (var i = 0; i < rep.items.length; i++) {
                        if (rep.items[i].password) delete rep.items[i].password;
                        rep.items[i].avatar = "/images/avatars/default.png";
                        rep.items[i].user_online = '0';
                        if (online && online[i] && online[i] == 1) rep.items[i].user_online = '1';
                        var afn = crypto.createHash('md5').update(app.get('config').salt + '.' + rep.items[i]._id.toHexString()).digest('hex');
                        if (fs.existsSync(path.join(__dirname, '..', '..', 'public', 'images', 'avatars', afn + '.jpg'))) rep.items[i].avatar = '/images/avatars/' + afn + '.jpg';
                    }
                    return res.send(JSON.stringify(rep));
                });
            });
        });
    });

    router.post('/user/friends/data', function(req, res, next) {
        var _locale = req.session.current_locale;
        var rep = {
            status: 1,
            items_per_page: 10
        };
        i18nm.setLocale(_locale);
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var user = req.body.user;
        if (!user.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_username");
            return res.send(JSON.stringify(rep));
        }
        var db_query = {
            _id: new ObjectId(user)
        };
        app.get('mongodb').collection('users').find(db_query, {
            limit: 1
        }).toArray(function(err, items) {
            if (err || !items) {
                rep.status = 0;
                rep.error = i18nm.__("user_not_found");
                return res.send(JSON.stringify(rep));
            }
            app.get('mongodb').collection('social_friends').find({
                $or: [{
                    $and: [{
                        u1: req.session.auth._id
                    }, {
                        u2: items[0]._id.toHexString()
                    }]
                }, {
                    $and: [{
                        u1: items[0]._id.toHexString()
                    }, {
                        u2: req.session.auth._id
                    }]
                }]
            }, {
                limit: 1
            }).toArray(function(err, sst) {
                var friendship = '0';
                if (sst && sst.length) {
                    if (sst[0].friends == '1') {
                        friendship = 1;
                    } else {
                        if (sst[0].u1 == req.session.auth._id) friendship = 2;
                        if (sst[0].u2 == req.session.auth._id) friendship = 3;
                    }
                }
                var user = items[0];
                if (user.password) delete user.password;
                if (user.email) delete user.email;
                user.avatar = "/images/avatars/default.png";
                var afn = crypto.createHash('md5').update(app.get('config').salt + '.' + user._id.toHexString()).digest('hex');
                if (fs.existsSync(path.join(__dirname, '..', '..', 'public', 'images', 'avatars', afn + '.jpg'))) user.avatar = '/images/avatars/' + afn + '.jpg';
                rep.user = user;
                rep.friendship = friendship;
                return res.send(JSON.stringify(rep));
            });
        });
    });

    router.post('/user/friendship/request', function(req, res, next) {
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
        var fid = req.body.id;
        if (!fid.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_user_id");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('users').find({
            _id: new ObjectId(fid)
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err || !items) {
                rep.status = 0;
                rep.error = i18nm.__("user_not_found");
                return res.send(JSON.stringify(rep));
            }
            if (items[0]._id.toHexString() == req.session.auth._id) {
                rep.status = 0;
                rep.error = i18nm.__("user_not_found");
                return res.send(JSON.stringify(rep));
            }
            app.get('mongodb').collection('social_friends').find({
                $or: [{
                    $and: [{
                        u1: req.session.auth._id
                    }, {
                        u2: items[0]._id.toHexString()
                    }, {
                        friends: ''
                    }]
                }, {
                    $and: [{
                        u1: items[0]._id.toHexString()
                    }, {
                        u2: req.session.auth._id
                    }, {
                        friends: ''
                    }]
                }]
            }, {
                limit: 1
            }).toArray(function(err, items) {
                if (err || (items && items.length)) {
                    rep.status = 0;
                    rep.error = i18nm.__("friendship_request_already_sent");
                    return res.send(JSON.stringify(rep));
                }
                app.get('mongodb').collection('social_friends').insert({
                    u1: req.session.auth._id,
                    u2: String(fid),
                    friends: ''
                }, function(err, items) {
                    if (err) {
                        rep.status = 0;
                        rep.error = i18nm.__("friendship_request_error");
                        return res.send(JSON.stringify(rep));
                    }
                    // Friendship request saved
                    var _sm = {
                        friend_id: fid
                    };
                    socketsender.emit(fid, 'social_new_inv', _sm);
                    rep.friend_id = fid;
                    return res.send(JSON.stringify(rep));
                });
            });
        });
    });

    router.post('/user/friendship/accept', function(req, res, next) {
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
        var fid = req.body.id;
        if (!fid.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_user_id");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('users').find({
            _id: new ObjectId(fid)
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err || !items) {
                rep.status = 0;
                rep.error = i18nm.__("user_not_found");
                return res.send(JSON.stringify(rep));
            }
            if (items[0]._id.toHexString() == req.session.auth._id) {
                rep.status = 0;
                rep.error = i18nm.__("user_not_found");
                return res.send(JSON.stringify(rep));
            }
            var db_query = {
                u1: items[0]._id.toHexString(),
                u2: req.session.auth._id,
                friends: {
                    $ne: '1'
                }
            };
            app.get('mongodb').collection('social_friends').find(db_query, {
                limit: 1
            }).toArray(function(err, items) {
                if (err || !items || !items.length) {
                    rep.status = 0;
                    rep.error = i18nm.__("no_friendship_request_found");
                    return res.send(JSON.stringify(rep));
                }
                app.get('mongodb').collection('social_friends').update({
                    _id: items[0]._id
                }, {
                    $set: {
                        friends: '1'
                    }

                }, function(err, items) {
                    if (err) {
                        rep.status = 0;
                        rep.error = i18nm.__("friendship_request_error");
                        return res.send(JSON.stringify(rep));
                    }
                    // Friendship request saved
                    var _sm = {
                        friend_id: fid
                    };
                    socketsender.emit(req.session.auth._id, 'social_new_friend', _sm);
                    socketsender.emit(fid, 'social_new_friend', _sm);
                    rep.friend_id = fid;
                    return res.send(JSON.stringify(rep));
                });
            });
        });
    });

    router.post('/user/friendship/remove', function(req, res, next) {
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
        var fid = req.body.id;
        if (!fid.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_user_id");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('users').find({
            _id: new ObjectId(fid)
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err || !items) {
                rep.status = 0;
                rep.error = i18nm.__("user_not_found");
                return res.send(JSON.stringify(rep));
            }
            if (items[0]._id.toHexString() == req.session.auth._id) {
                rep.status = 0;
                rep.error = i18nm.__("user_not_found");
                return res.send(JSON.stringify(rep));
            }
            app.get('mongodb').collection('social_friends').find({
                $or: [{
                    $and: [{
                        u1: req.session.auth._id
                    }, {
                        u2: items[0]._id.toHexString()
                    }, {
                        friends: '1'
                    }]
                }, {
                    $and: [{
                        u1: items[0]._id.toHexString()
                    }, {
                        u2: req.session.auth._id
                    }, {
                        friends: '1'
                    }]
                }]
            }, {
                limit: 1
            }).toArray(function(err, items) {
                if (err || !items || !items.length) {
                    rep.status = 0;
                    rep.error = i18nm.__("not_friends");
                    return res.send(JSON.stringify(rep));
                }
                app.get('mongodb').collection('social_friends').remove({
                    _id: items[0]._id
                }, function(err, items) {
                    if (err) {
                        rep.status = 0;
                        rep.error = i18nm.__("friendship_remove_error");
                        return res.send(JSON.stringify(rep));
                    }
                    var _sm = {
                        friend_id: fid
                    };
                    socketsender.emit(fid, 'social_unfriend', _sm);
                    return res.send(JSON.stringify(rep));
                });
            });
        });
    });

    router.post('/user/friends/inv', function(req, res, next) {
        var _locale = req.session.current_locale;
        var rep = {
            status: 1,
            items_per_page: 10
        };
        i18nm.setLocale(_locale);
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var skip = req.body.skip;
        if (skip) skip = parseInt(skip);
        if (skip && (typeof skip != 'number' || skip % 1 !== 0 || skip < 0)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            return res.send(JSON.stringify(rep));
        }
        if (!skip) skip = 0;
        skip = skip * rep.items_per_page;
        var db_query = {
            $and: [{
                u2: req.session.auth._id
            }, {
                friends: ''
            }]
        };
        app.get('mongodb').collection('social_friends').find(db_query).count(function(err, items_count) {
            if (err || !items_count) {
                rep.status = 0;
                rep.error = i18nm.__("no_invitations_found");
                return res.send(JSON.stringify(rep));
            }
            app.get('mongodb').collection('social_friends').find(db_query, {
                skip: skip,
                limit: rep.items_per_page
            }).toArray(function(err, items) {
                if (err || !items || !items.length) {
                    rep.status = 0;
                    rep.error = i18nm.__("ajax_failed");
                    return res.send(JSON.stringify(rep));
                }
                var users = [];
                for (var i = 0; i < items.length; i++) {
                    users.push({
                        _id: new ObjectId(items[i].u1)
                    });
                }
                app.get('mongodb').collection('users').find({
                    $or: users
                }).sort({
                    username: 1
                }).toArray(function(err, items) {
                    if (err || !items || !items.length) {
                        rep.status = 0;
                        rep.error = i18nm.__("ajax_failed");
                        return res.send(JSON.stringify(rep));
                    }
                    rep.items = items;
                    var _multi = redis_client.multi();
                    for (var j = 0; j < rep.items.length; j++) {
                        _multi.get(app.get('config').redis.prefix + 'socketio_online_' + rep.items[j]._id);
                    }
                    _multi.exec(function(err, online) {
                        if (err || !online) online = [];
                        for (var i = 0; i < rep.items.length; i++) {
                            if (rep.items[i].password) delete rep.items[i].password;
                            rep.items[i].user_online = '0';
                            if (online && online[i] && online[i] == 1) rep.items[i].user_online = '1';
                            rep.items[i].avatar = "/images/avatars/default.png";
                            var afn = crypto.createHash('md5').update(app.get('config').salt + '.' + rep.items[i]._id.toHexString()).digest('hex');
                            if (fs.existsSync(path.join(__dirname, '..', '..', 'public', 'images', 'avatars', afn + '.jpg'))) rep.items[i].avatar = '/images/avatars/' + afn + '.jpg';
                        }
                        return res.send(JSON.stringify(rep));
                    });
                });
            });
        });
    });

    router.post('/user/friends/list', function(req, res, next) {
        var _locale = req.session.current_locale;
        var rep = {
            status: 1,
            items_per_page: 10
        };
        i18nm.setLocale(_locale);
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var skip = req.body.skip;
        if (skip) skip = parseInt(skip);
        if (skip && (typeof skip != 'number' || skip % 1 !== 0 || skip < 0)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            return res.send(JSON.stringify(rep));
        }
        if (!skip) skip = 0;
        skip = skip * rep.items_per_page;
        var db_query = {
            $or: [{
                u1: req.session.auth._id,
                friends: '1'
            }, {
                u2: req.session.auth._id,
                friends: '1'
            }]
        };
        app.get('mongodb').collection('social_friends').find(db_query).count(function(err, items_count) {
            if (err || !items_count) {
                rep.status = 0;
                rep.error = i18nm.__("no_friends_found");
                return res.send(JSON.stringify(rep));
            }
            app.get('mongodb').collection('social_friends').find(db_query, {
                skip: skip,
                limit: rep.items_per_page
            }).toArray(function(err, items) {
                if (err || !items || !items.length) {
                    rep.status = 0;
                    rep.error = i18nm.__("ajax_failed");
                    return res.send(JSON.stringify(rep));
                }
                var users = [];
                for (var i = 0; i < items.length; i++) {
                    var itp = items[i].u1;
                    if (req.session.auth._id == itp) itp = items[i].u2;
                    users.push({
                        _id: new ObjectId(itp)
                    });
                }
                app.get('mongodb').collection('users').find({
                    $or: users
                }).sort({
                    username: 1
                }).toArray(function(err, items) {
                    if (err || !items || !items.length) {
                        rep.status = 0;
                        rep.error = i18nm.__("ajax_failed");
                        return res.send(JSON.stringify(rep));
                    }
                    rep.items = items;
                    var _multi = redis_client.multi();
                    for (var j = 0; j < rep.items.length; j++) {
                        _multi.get(app.get('config').redis.prefix + 'socketio_online_' + rep.items[j]._id);
                    }
                    _multi.exec(function(err, online) {
                        if (err || !online) online = [];
                        for (var i = 0; i < rep.items.length; i++) {
                            rep.items[i].user_online = '0';
                            if (online && online[i] && online[i] == 1) rep.items[i].user_online = '1';
                            if (rep.items[i].password) delete rep.items[i].password;
                            rep.items[i].avatar = "/images/avatars/default.png";
                            var afn = crypto.createHash('md5').update(app.get('config').salt + '.' + rep.items[i]._id.toHexString()).digest('hex');
                            if (fs.existsSync(path.join(__dirname, '..', '..', 'public', 'images', 'avatars', afn + '.jpg'))) rep.items[i].avatar = '/images/avatars/' + afn + '.jpg';
                        }
                        return res.send(JSON.stringify(rep));
                    });
                });
            });
        });
    });

    router.post('/user/messages/load', function(req, res, next) {
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
        var uid = req.body.id;
        if (!uid.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_user_id");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('users').find({
            _id: new ObjectId(uid)
        }, {
            limit: 1
        }).toArray(function(err, m_user) {
            if (err || !m_user) {
                rep.status = 0;
                rep.error = i18nm.__("user_not_found");
                return res.send(JSON.stringify(rep));
            }
            if (m_user[0]._id.toHexString() == req.session.auth._id) {
                rep.status = 0;
                rep.error = i18nm.__("user_not_found");
                return res.send(JSON.stringify(rep));
            }
            app.get('mongodb').collection('social_conversations').find({
                $or: [{
                    $and: [{
                        u1: req.session.auth._id
                    }, {
                        u2: m_user[0]._id.toHexString()
                    }]
                }, {
                    $and: [{
                        u1: m_user[0]._id.toHexString()
                    }, {
                        u2: req.session.auth._id
                    }]
                }]
            }, {
                limit: 1
            }).toArray(function(err, conversation) {
                if (err) {
                    rep.status = 0;
                    rep.error = i18nm.__("cannot_load_conversation");
                    return res.send(JSON.stringify(rep));
                }
                async.series([
                    function(callback) {
                        if (!conversation || !conversation.length) {
                            app.get('mongodb').collection('social_conversations').insert({
                                u1: req.session.auth._id,
                                u2: m_user[0]._id.toHexString()
                            }, function() {
                                callback();
                            });
                        } else {
                            callback();
                        }
                    },
                    function(callback) {
                        var db_query_msg = {
                            $or: [{
                                $and: [{
                                    u1: req.session.auth._id
                                }, {
                                    u2: m_user[0]._id.toHexString()
                                }]
                            }, {
                                $and: [{
                                    u1: m_user[0]._id.toHexString()
                                }, {
                                    u2: req.session.auth._id
                                }]
                            }]
                        };
                        app.get('mongodb').collection('social_messages').find(db_query_msg).count(function(err, total_msg_cnt) {
                            if (err) {
                                rep.status = 0;
                                rep.error = i18nm.__("cannot_load_messages");
                                callback();
                                return res.send(JSON.stringify(rep));
                            }
                            var _last = 0;
                            if (total_msg_cnt > 150) _last = total_msg_cnt - 150;
                            app.get('mongodb').collection('social_messages').find(db_query_msg).skip(_last).sort({
                                tstamp: 1
                            }).toArray(function(err, messages) {
                                if (err) {
                                    rep.status = 0;
                                    rep.error = i18nm.__("cannot_load_messages");
                                    callback();
                                    return res.send(JSON.stringify(rep));
                                }
                                rep.messages = [];
                                if (messages.length) rep.messages = messages;
                                rep.user = m_user[0];
                                rep.user.avatar = "/images/avatars/default.png";
                                delete rep.user.password;
                                delete rep.user.email;
                                rep.me = {};
                                rep.me.username = req.session.auth.username;
                                rep.me.realname = req.session.auth.realname;
                                rep.me.avatar = req.session.auth.avatar;
                                rep.me.id = req.session.auth._id;
                                redis_client.get(app.get('config').redis.prefix + 'socketio_online_' + m_user[0]._id.toHexString(), function(err, online) {
                                    rep.user.online = '0';
                                    if (online && online == 1) rep.user.online = '1';
                                    app.get('mongodb').collection('social_conversations').find({
                                        $or: [{
                                            u1: req.session.auth._id,
                                            u2: m_user[0]._id.toHexString()
                                        }, {
                                            u1: m_user[0]._id.toHexString(),
                                            u2: req.session.auth._id
                                        }]
                                    }).toArray(function(err, _conv) {
                                        if (err || !_conv || !_conv.length) return;
                                        var uid = 'u1_unread_flag';
                                        if (_conv[0].u2 == req.session.auth._id) uid = 'u2_unread_flag';
                                        var update = {
                                            $set: {}
                                        };
                                        update.$set[uid] = '';
                                        app.get('mongodb').collection('social_conversations').update({
                                            _id: _conv[0]._id
                                        }, update, function(err) {});
                                    });
                                    var afn = crypto.createHash('md5').update(app.get('config').salt + '.' + rep.user._id.toHexString()).digest('hex');
                                    if (fs.existsSync(path.join(__dirname, '..', '..', 'public', 'images', 'avatars', afn + '.jpg'))) rep.user.avatar = '/images/avatars/' + afn + '.jpg';
                                    callback();
                                    return res.send(JSON.stringify(rep));
                                });
                            });
                        });
                    }
                ]);

            });
        });
    });

    router.post('/user/messages/save', function(req, res, next) {
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
        var uid = req.body.user_id;
        if (!uid || !uid.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_user_id");
            return res.send(JSON.stringify(rep));
        }
        var msg = req.body.msg;
        if (msg) msg = msg.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ').replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\n\r\t]/g, ' ');
        if (!msg) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_msg");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('users').find({
            _id: new ObjectId(uid)
        }, {
            limit: 1
        }).toArray(function(err, m_user) {
            if (err || !m_user) {
                rep.status = 0;
                rep.error = i18nm.__("user_not_found");
                return res.send(JSON.stringify(rep));
            }
            if (m_user[0]._id.toHexString() == req.session.auth._id) {
                rep.status = 0;
                rep.error = i18nm.__("user_not_found");
                return res.send(JSON.stringify(rep));
            }
            app.get('mongodb').collection('social_messages').insert({
                u1: req.session.auth._id,
                u2: m_user[0]._id.toHexString(),
                msg: msg,
                tstamp: Date.now()
            }, function(err) {
                if (err) {
                    rep.status = 0;
                    rep.error = i18nm.__("cannot_send_message");
                    return res.send(JSON.stringify(rep));
                }
                app.get('mongodb').collection('social_conversations').find({
                    $or: [{
                        u1: req.session.auth._id,
                        u2: m_user[0]._id.toHexString()
                    }, {
                        u1: m_user[0]._id.toHexString(),
                        u2: req.session.auth._id
                    }]
                }).toArray(function(err, _conv) {
                    if (err || !_conv || !_conv.length) return;
                    var uid = 'u1_unread_flag';
                    if (_conv[0].u2 == m_user[0]._id.toHexString()) uid = 'u2_unread_flag';
                    var update = {
                        $set: {
                            last_tstamp: Date.now()
                        },
                        $inc: {
                            msg_count: 1
                        }
                    };
                    update.$set[uid] = '1';
                    app.get('mongodb').collection('social_conversations').update({
                        _id: _conv[0]._id
                    }, update, function(err) {});

                });
                var _sm = {
                    from: req.session.auth._id,
                    to: m_user[0]._id.toHexString(),
                    msg: msg,
                    tstamp: Date.now()
                };
                socketsender.emit(req.session.auth._id, 'social_chat_msg', _sm);
                socketsender.emit(m_user[0]._id.toHexString(), 'social_chat_msg', _sm);
                return res.send(JSON.stringify(rep));
            });
        });
    });

    router.post('/user/messages/conversations', function(req, res, next) {
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
        app.get('mongodb').collection('social_conversations').find({
            $or: [{
                u1: req.session.auth._id
            }, {
                u2: req.session.auth._id
            }]
        }).sort({
            last_tstamp: -1
        }).toArray(function(err, conversations) {
            if (err) {
                rep.status = 0;
                rep.error = i18nm.__("cannot_load_conversation");
                return res.send(JSON.stringify(rep));
            }
            if (conversations && conversations.length) {
                var users = [];
                for (var i = 0; i < conversations.length; i++) {
                    var user = conversations[i].u1;
                    if (user == req.session.auth._id) user = conversations[i].u2;
                    users.push({
                        _id: new ObjectId(user)
                    });
                }
                app.get('mongodb').collection('users').find({
                    $or: users
                }).toArray(function(err, users) {
                    if (err || !users || !users.length) {
                        rep.status = 0;
                        rep.error = i18nm.__("cannot_load_conversation");
                        return res.send(JSON.stringify(rep));
                    }
                    var users_hash = {};
                    for (var u = 0; u < users.length; u++) {
                        users[u].avatar = "/images/avatars/default.png";
                        var afn = crypto.createHash('md5').update(app.get('config').salt + '.' + users[u]._id.toHexString()).digest('hex');
                        if (fs.existsSync(path.join(__dirname, '..', '..', 'public', 'images', 'avatars', afn + '.jpg'))) users[u].avatar = '/images/avatars/' + afn + '.jpg';
                        users_hash[users[u]._id] = users[u];
                    }
                    var conv = [];
                    var _multi = redis_client.multi();
                    for (var j = 0; j < conversations.length; j++) {
                        var usr = conversations[j].u1;
                        if (usr == req.session.auth._id) usr = conversations[j].u2;
                        _multi.get(app.get('config').redis.prefix + 'socketio_online_' + usr);
                    }
                    _multi.exec(function(err, online) {
                        if (err || !online) online = [];
                        for (var c = 0; c < conversations.length; c++) {
                            var user = conversations[c].u1;
                            if (user == req.session.auth._id) user = conversations[c].u2;
                            var uid = 'u1_unread_flag';
                            if (conversations[c].u2 == req.session.auth._id) uid = 'u2_unread_flag';
                            var unread_flag = '0';
                            if (uid in conversations[c] && conversations[c][uid] == '1') unread_flag = '1';
                            var ci = {
                                user_id: user,
                                avatar: users_hash[user].avatar,
                                name: users_hash[user].realname || users_hash[user].username,
                                last_tstamp: conversations[c].last_tstamp || Date.now(),
                                msg_count: conversations[c].msg_count || 0,
                                unread_flag: unread_flag,
                                user_online: '0'
                            };
                            if (online && online[c] && online[c] == 1) ci.user_online = '1';
                            conv.push(ci);
                        }
                        rep.conversations = conv;
                        return res.send(JSON.stringify(rep));
                    });
                });
            } else {
                rep.conversations = [];
                return res.send(JSON.stringify(rep));
            }
        });
    });

    router.post('/user/messages/markread', function(req, res, next) {
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
        var fid = req.body.id;
        if (!fid.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_user_id");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('social_conversations').find({
            $or: [{
                u1: req.session.auth._id,
                u2: fid
            }, {
                u1: fid,
                u2: req.session.auth._id
            }]
        }).toArray(function(err, _conv) {
            if (err || !_conv || !_conv.length) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_user_id");
                return res.send(JSON.stringify(rep));
            }
            var uid = 'u1_unread_flag';
            if (_conv[0].u2 == req.session.auth._id) uid = 'u2_unread_flag';
            var update = {
                $set: {}
            };
            update.$set[uid] = '';
            app.get('mongodb').collection('social_conversations').update({
                _id: _conv[0]._id
            }, update, function(err) {});
            return res.send(JSON.stringify(rep));
        });
    });

    router.post('/user/messages/typing', function(req, res, next) {
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
        var fid = req.body.id;
        if (!fid.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_user_id");
            return res.send(JSON.stringify(rep));
        }
        var mode = req.body.mode;
        if (mode != 'start' && mode != 'stop') {
            rep.status = 0;
            rep.error = i18nm.__("invalid_mode");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('social_conversations').find({
            $or: [{
                u1: req.session.auth._id,
                u2: fid
            }, {
                u1: fid,
                u2: req.session.auth._id
            }]
        }).toArray(function(err, _conv) {
            if (err || !_conv || !_conv.length) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_user_id");
                return res.send(JSON.stringify(rep));
            }
            var _sm = {
                rct: fid,
                mod: mode
            };
            socketsender.emit(fid, 'social_typing', _sm);
            return res.send(JSON.stringify(rep));
        });
    });

    return router;
};
