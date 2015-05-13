module.exports = function(app) {

    var router = app.get('express').Router(),
        path = require('path'),
        async = require('async'),
        renderer = app.get('renderer'),
        moment = require('moment'),
        config = app.get('config'),
        crypto = require('crypto'),
        S = require('string'),
        socketsender = require('../../core/socketsender')(app),
        redis_client = app.get('redis_client'),
        ObjectId = require('mongodb').ObjectID,
        i18nm = new(require('i18n-2'))({
            locales: config.locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: config.locales.dev_mode
        }),
        history_length = 50;

    router.get('/', function(req, res) {
        if (!req.session.auth || req.session.auth.status < 1) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/chat';
            res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        i18nm.setLocale(req.session.current_locale);
        var users_online = [],
            messages_data = {};
        async.series([
            function(callback) {
                redis_client.lrange(config.redis.prefix + 'socketio_users_online', 0, 100, function(err, reply) {
                    if (reply) users_online = reply;
                    callback();
                });
            },
            function(callback) {
                var query_channels = [''],
                    channels_hash = {};
                if (req.session.chat_channels && req.session.chat_channels.length)
                    for (var cc in req.session.chat_channels) {
                        var channel_id = crypto.createHash('md5').update([req.session.auth.username, req.session.chat_channels[cc]].sort().join(' ')).digest('hex');
                        channels_hash[channel_id] = req.session.chat_channels[cc];
                        query_channels.push(channel_id);
                    }
                async.eachSeries(query_channels, function(channel, esc) {
                        app.get('mongodb').collection('chat').find({
                            channel_id: channel
                        }).count(function(err, msg_count) {
                            if (err) return esc(true);
                            if (!msg_count) msg_count = 0;
                            var skip = 0;
                            if (msg_count > history_length) skip = msg_count - history_length;
                            app.get('mongodb').collection('chat').find({
                                channel_id: channel
                            }).skip(skip).sort({
                                timestamp: 1
                            }).toArray(function(err, messages) {
                                if (messages && messages.length) {
                                    for (var mi in messages) {
                                        messages[mi].channel = channels_hash[channel] || '';
                                        if (!messages_data[messages[mi].channel]) messages_data[messages[mi].channel] = [];
                                        delete messages[mi].channel_id;
                                        delete messages[mi]._id;
                                        messages_data[messages[mi].channel].push(messages[mi]);
                                    }
                                }
                                esc();
                            });
                        });
                    },
                    function() {
                        callback();
                    });
            },
            function(callback) {
                var data = {
                        title: i18nm.__('module_name'),
                        page_title: i18nm.__('module_name'),
                        keywords: '',
                        description: '',
                        extra_css: '<link rel="stylesheet" href="/modules/chat/css/main.css" type="text/css">'
                    },
                    render = renderer.render_file(path.join(__dirname, 'views'), 'chat', {
                        lang: i18nm,
                        data: data,
                        current_locale: req.session.current_locale,
                        current_username: req.session.auth.username,
                        current_user: JSON.stringify({
                            id: req.session.auth._id,
                            id_hash: crypto.createHash('md5').update(config.salt + '.' + req.session.auth._id).digest('hex')
                        }),
                        messages_data: JSON.stringify(messages_data),
                        users_online: JSON.stringify(users_online)
                    }, req);
                data.content = render;
                app.get('renderer').render(res, undefined, data, req);
                return callback();
            }
        ]);
    });

    router.post('/ajax/msg', function(req, res) {
        var rep = {
            status: 1
        };
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var msg = S(req.body.msg || '').stripTags().s.replace(/[\n\r\t]/gm, ''),
            channel = req.body.channel || '',
            timestamp = Date.now();
        if (channel && (!channel.match(/^[A-Za-z0-9_\-]{3,20}$/) || channel == req.session.auth.username)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_channel");
            return res.send(JSON.stringify(rep));
        }
        if (msg.length < 2 && msg.length > 1024) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_msg");
            return res.send(JSON.stringify(rep));
        }
        async.series([
            function(callback) {
                if (channel && channel.length) {
                    app.get('mongodb').collection('users').find({
                        username: (channel || req.session.auth.username)
                    }).toArray(function(err, users) {
                        if (!users || !users.length) {
                            rep.status = 0;
                            rep.error = i18nm.__("invalid_channel");
                            res.send(JSON.stringify(rep));
                            return callback(true);
                        }
                        callback();
                    });
                } else {
                    callback();
                }
            },
            function(callback) {
                var channel_id = '';
                if (channel && channel.length)
                    channel_id = crypto.createHash('md5').update([req.session.auth.username, channel].sort().join(' ')).digest('hex');
                rep.msg_data = {
                    username: req.session.auth.username,
                    timestamp: timestamp,
                    message: msg,
                    type: 'u',
                    channel_id: channel_id
                };
                app.get('mongodb').collection('chat').insert(rep.msg_data, function() {
                    return callback();
                });
            },
            function(callback) {
                if (channel && channel.length) {
                    if (!req.session.chat_channels) req.session.chat_channels = [];
                    if (req.session.chat_channels.indexOf(channel) == -1)
                        req.session.chat_channels.push(channel);
                }
                callback();
            },
            function(callback) {
                rep.msg_data.channel = channel;
                redis_client.publish(config.redis.prefix + 'medved_broadcast', JSON.stringify({
                    msgtype: 'taracot_chat_message',
                    msg: rep.msg_data
                }));
                res.send(JSON.stringify(rep));
                return callback();
            },
        ]);
    });

    router.post('/ajax/channel/close', function(req, res) {
        var rep = {
            status: 1
        };
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var channel = req.body.channel;
        if (!channel || !channel.match(/^[A-Za-z0-9_\-]{3,20}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_channel");
            return res.send(JSON.stringify(rep));
        }
        if (req.session.chat_channels && req.session.chat_channels.length && req.session.chat_channels.indexOf(channel) != -1)
            req.session.chat_channels.splice(req.session.chat_channels.indexOf(channel), 1);
        res.send(JSON.stringify(rep));
    });

    router.post('/ajax/channel/history', function(req, res) {
        var rep = {
            status: 1
        };
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var channel = req.body.channel;
        if (!channel || !channel.match(/^[A-Za-z0-9_\-]{3,20}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_channel");
            return res.send(JSON.stringify(rep));
        }
        if (!req.session.chat_channels) req.session.chat_channels = [];
        if (req.session.chat_channels.indexOf(channel) == -1)
            req.session.chat_channels.push(channel);
        var channel_id = crypto.createHash('md5').update([req.session.auth.username, channel].sort().join(' ')).digest('hex'),
            messages_data = {};
        app.get('mongodb').collection('chat').find({
            channel_id: channel_id
        }).count(function(err, msg_count) {
            if (err) return esc(true);
            if (!msg_count) msg_count = 0;
            var skip = 0;
            if (msg_count > history_length) skip = msg_count - history_length;
            app.get('mongodb').collection('chat').find({
                channel_id: channel_id
            }).skip(skip).sort({
                timestamp: 1
            }).toArray(function(err, messages) {
                if (messages && messages.length) {
                    for (var mi in messages) {
                        messages[mi].channel = channel;
                        if (!messages_data[channel]) messages_data[channel] = [];
                        delete messages[mi].channel_id;
                        delete messages[mi]._id;
                        messages_data[channel].push(messages[mi]);
                    }
                }
                rep.messages = messages_data;
                res.send(JSON.stringify(rep));
            });
        });
    });

    return router;
};
