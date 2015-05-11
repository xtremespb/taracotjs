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
        });

    router.get('/', function(req, res) {
        if (!req.session.auth || req.session.auth.status < 1) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/chat';
            res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        i18nm.setLocale(req.session.current_locale);
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
                })
            }, req);
        data.content = render;
        app.get('renderer').render(res, undefined, data, req);
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
        if (channel && !channel.match(/^[A-Za-z0-9_\-]{3,20}$/)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_channel");
            return res.send(JSON.stringify(rep));
        }
        if (msg.length < 2 && msg.length > 1024) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_msg");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('users').find({
            username: (channel || req.session.auth.username)
        }).toArray(function(err, users) {
            if (!users || !users.length) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_channel");
                return res.send(JSON.stringify(rep));
            }
            rep.msg_data = {
                username: req.session.auth.username,
                timestamp: timestamp,
                message: msg,
                type: 'u',
                channel: channel
            };
            redis_client.publish(config.redis.prefix + 'medved_broadcast', JSON.stringify({
                msgtype: 'taracot_chat_message',
                msg: rep.msg_data
            }));
            app.get('mongodb').collection('chat').insert(rep.msg_data, function() {
                return res.send(JSON.stringify(rep));
            });
        });
    });

    return router;
};
