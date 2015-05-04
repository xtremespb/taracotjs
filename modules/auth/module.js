module.exports = function(app) {
    var router = app.get('express').Router(),
        path = require('path'),
        renderer = app.get('renderer'),
        config = app.get('config'),
        mailer = app.get('mailer'),
        crypto = require('crypto'),
        i18nm = new(require('i18n-2'))({
            locales: config.locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales.dev_mode
        }),
        async = require('async');
    // Social Auth: begin
    var config_auth = app.get('config_auth');
    for (var key in config_auth) app.use('/auth/', require('./providers/' + key)(app));
    // Social Auth: end
    var gm = false;
    if (app.get('config').graphicsmagick) {
        gm = require('gm');
    }
    var fs = require("fs-extra");
    var ObjectId = require('mongodb').ObjectID;
    router.get('/captcha', function(req, res) {
        var c = parseInt(Math.random() * 9000 + 1000);
        req.session.captcha = c;
        var cpth = app.get('captcha').generate(c);
        if (cpth.png) {
            res.set('Content-Type', 'image/png');
            cpth.png.stream(function streamOut(err, stdout, stderr) {
                if (err) return next(err);
                stdout.pipe(res);
            });
        } else {
            next();
        }
    });
    router.post('/captcha', function(req, res) {
        var c = parseInt(Math.random() * 9000 + 1000);
        req.session.captcha = c;
        var cpth = app.get('captcha').generate(c);
        if (cpth.b64) {
            res.send(JSON.stringify({
                img: cpth.b64
            }));
        } else {
            next();
        }
    });
    router.get('/', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (typeof req.session != 'undefined' && typeof req.session.auth != 'undefined' && req.session.auth !== false) {
            res.redirect(303, "/?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        var c = parseInt(Math.random() * 9000 + 1000);
        var _cap = 'b64';
        if (app.get('config').captcha == 'captcha_gm') {
            _cap = 'png';
        }
        var captcha_req = false;
        if (req.session.captcha_req) captcha_req = true;
        var data = {
            title: i18nm.__('auth'),
            page_title: i18nm.__('auth'),
            keywords: '',
            description: '',
            extra_css: '<link rel="stylesheet" href="/modules/auth/css/user_auth.css" type="text/css">'
        };
        var _config_auth = JSON.parse(JSON.stringify(config_auth));
        for (var key in _config_auth) {
            if (_config_auth[key].clientSecret) delete _config_auth[key].clientSecret;
        }
        if (app.get('settings') && app.get('settings').site_mode && (app.get('settings').site_mode == 'private' || app.get('settings').site_mode == 'invites')) _config_auth = [];
        var redirect_host = '';
        if (req.session.auth_redirect_host) redirect_host = config.protocol + '://' + req.session.auth_redirect_host;
        var render = renderer.render_file(path.join(__dirname, 'views'), 'login_user', {
            lang: i18nm,
            captcha: _cap,
            captcha_req: captcha_req,
            data: data,
            redirect: req.session.auth_redirect,
            redirect_host: redirect_host,
            config_auth: JSON.stringify(_config_auth)
        }, req);
        data.content = render;
        app.get('renderer').render(res, undefined, data, req);
    });
    router.get('/cp', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (typeof req.session != 'undefined' && typeof req.session.auth != 'undefined' && req.session.auth !== false) {
            res.redirect(303, "/?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        var c = parseInt(Math.random() * 9000 + 1000);
        var _cap = 'b64';
        if (app.get('config').captcha == 'captcha_gm') {
            _cap = 'png';
        }
        var captcha_req = false;
        if (req.session.captcha_req) captcha_req = true;
        var redirect_host = '';
        if (req.session.auth_redirect_host) redirect_host = config.protocol + '://' + req.session.auth_redirect_host;
        var render = renderer.render_file(path.join(__dirname, 'views'), 'login_cp', {
            lang: i18nm,
            captcha: _cap,
            captcha_req: captcha_req,
            redirect_host: redirect_host,
            redirect: req.session.auth_redirect
        }, req);
        res.send(render);
    });
    router.get('/register', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (typeof req.session != 'undefined' && typeof req.session.auth != 'undefined' && req.session.auth !== false) {
            res.redirect(303, "/?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        async.series([
            function(callback) {
                if (app.get('settings') && app.get('settings').site_mode) {
                    if (app.get('settings').site_mode == 'private') {
                        render_error_page(req, res, i18nm.__('register_not_allowed'));
                        return callback(true);
                    }
                    if (app.get('settings').site_mode == 'invites') {
                        var invcode = req.query.inv;
                        if (!invcode || !invcode.match(/^[a-f0-9]{64}$/)) {
                            render_error_page(req, res, i18nm.__('invite_required_to_register'));
                            return callback(true);
                        }
                        app.get('mongodb').collection('invites').find({
                            invcode: invcode
                        }, {
                            limit: 1
                        }).toArray(function(err, items) {
                            if (err || !items || !items.length) {
                                render_error_page(req, res, i18nm.__('invite_required_to_register'));
                                return callback(true);
                            }
                            if (items[0].invused != '0') {
                                render_error_page(req, res, i18nm.__('invite_already_used'));
                                return callback(true);
                            }
                        });
                    }
                }
                callback();
            },
            function(callback) {
                var invcode = req.query.inv;
                if (!invcode || !invcode.match(/^[a-f0-9]{64}$/)) invcode = '';
                var c = parseInt(Math.random() * 9000 + 1000);
                var _cap = 'b64';
                if (app.get('config').captcha == 'captcha_gm') {
                    _cap = 'png';
                }
                var data = {
                    title: i18nm.__('register'),
                    page_title: i18nm.__('register'),
                    keywords: '',
                    description: '',
                    extra_css: '<link rel="stylesheet" href="/modules/auth/css/register.css" type="text/css">'
                };
                var redirect_host = '';
                if (req.session.auth_redirect_host) redirect_host = config.protocol + '://' + req.session.auth_redirect_host;
                var render = renderer.render_file(path.join(__dirname, 'views'), 'register', {
                    lang: i18nm,
                    captcha: _cap,
                    captcha_req: true,
                    data: data,
                    invcode: invcode,
                    redirect_host: redirect_host,
                    redirect: req.session.auth_redirect
                }, req);
                data.content = render;
                app.get('renderer').render(res, undefined, data, req);
                return callback();
            }
        ]);
    });
    router.post('/register/process', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        i18nm.setLocale(req.session.current_locale);
        if (app.get('settings') && app.get('settings').site_mode && app.get('settings').site_mode == 'private')
            return res.send(JSON.stringify({
                result: 0,
                error: i18nm.__("register_not_allowed")
            }));
        var username = req.body.username;
        var password = req.body.password;
        var email = req.body.email;
        var captcha = req.body.captcha;
        if (!captcha.match(/^[0-9]{4}$/)) {
            res.send(JSON.stringify({
                result: 0,
                field: "reg_captcha",
                error: i18nm.__("invalid_captcha")
            }));
            return;
        }
        if (captcha != req.session.captcha) {
            req.session.captcha = 0;
            res.send(JSON.stringify({
                result: 0,
                field: "reg_captcha",
                error: i18nm.__("invalid_captcha")
            }));
            return;
        }
        req.session.captcha = 0;
        if (typeof username == 'undefined' || typeof password == 'undefined') {
            res.send(JSON.stringify({
                result: 0,
                error: i18nm.__("username_password_missing")
            }));
            return;
        }
        if (!username.match(/^[A-Za-z0-9_\-]{3,20}$/)) {
            res.send(JSON.stringify({
                result: 0,
                field: "reg_username",
                error: i18nm.__("invalid_username_syntax")
            }));
            return;
        }
        if (!password.match(/^.{8,80}$/)) {
            res.send(JSON.stringify({
                result: 0,
                field: "reg_password",
                error: i18nm.__("invalid_password_syntax")
            }));
            return;
        }
        if (!email.match(/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/)) {
            res.send(JSON.stringify({
                result: 0,
                field: "reg_email",
                error: i18nm.__("invalid_email_syntax")
            }));
            return;
        }
        var username_auth = username.toLowerCase();
        email = email.toLowerCase();
        var md5 = crypto.createHash('md5');
        var password_hex = md5.update(config.salt + '.' + password).digest('hex');
        async.series([function(callback) {
            if (app.get('settings') && app.get('settings').site_mode && app.get('settings').site_mode == 'invites') {
                var invcode = req.body.invcode;
                if (!invcode || !invcode.match(/^[a-f0-9]{64}$/)) {
                    res.send(JSON.stringify({
                        result: 0,
                        field: "reg_captcha",
                        error: i18nm.__("invalid_invcode")
                    }));
                    return callback(true);
                }
                app.get('mongodb').collection('invites').find({
                    invcode: invcode
                }, {
                    limit: 1
                }).toArray(function(err, items) {
                    if (err || !items || !items.length) {
                        res.send(JSON.stringify({
                            result: 0,
                            field: "reg_captcha",
                            error: i18nm.__("invite_required_to_register")
                        }));
                        return callback(true);
                    }
                    if (items[0].invused != '0') {
                        res.send(JSON.stringify({
                            result: 0,
                            field: "reg_captcha",
                            error: i18nm.__("invite_already_used")
                        }));
                        return callback(true);
                    }
                    app.get('mongodb').collection('invites').update({
                        _id: items[0]._id
                    }, {
                        $set: {
                            invused: username
                        }
                    }, function(err) {
                        if (err) {
                            res.send(JSON.stringify({
                                result: 0,
                                field: "reg_captcha",
                                error: i18nm.__("invite_already_used")
                            }));
                            return callback(true);
                        }
                    });
                });
            }
            callback();
        }, function(callback) {
            app.get('mongodb').collection('users').find({
                $or: [{
                    username_auth: username_auth
                }, {
                    email: email
                }]
            }, {
                limit: 1
            }).toArray(function(err, items) {
                if (err) {
                    res.send(JSON.stringify({
                        result: 0,
                        error: i18nm.__("reg_failed")
                    }));
                    return callback();
                }
                if (typeof items != 'undefined') {
                    if (items.length > 0) {
                        res.send(JSON.stringify({
                            result: 0,
                            field: "reg_username",
                            error: i18nm.__("username_or_email_already_registered")
                        }));
                        return callback();
                    }
                }
                var md5 = crypto.createHash('md5');
                var act_code = md5.update(config.salt + '.' + Date.now()).digest('hex');
                app.get('mongodb').collection('users').insert({
                    username: username,
                    username_auth: username_auth,
                    password: password_hex,
                    email: email,
                    act_code: act_code,
                    regdate: Date.now(),
                    status: 0
                }, function(err, items) {
                    if (err) {
                        res.send(JSON.stringify({
                            result: 0,
                            error: i18nm.__("reg_failed")
                        }));
                        return callback();
                    }
                    var user_id = items[0]._id.toHexString();
                    var register_url = config.protocol + '://' + req.get('host') + '/auth/activate?user=' + user_id + '&code=' + act_code;
                    mailer.send(email, i18nm.__('mail_register_on') + ': ' + app.get('settings').site_title, path.join(__dirname, 'views'), 'mail_register_html', 'mail_register_txt', {
                        lang: i18nm,
                        site_title: app.get('settings').site_title,
                        register_url: register_url
                    }, req, function() {
                        // Success
                        req.session.captcha_req = false;
                        res.send(JSON.stringify({
                            result: 1
                        }));
                    });
                });
            });
        }]);
    });
    router.get('/activate', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var user = req.query.user;
        var code = req.query.code;
        var act_res;
        if (typeof user == 'undefined' || typeof code == 'undefined') {
            act_res = i18nm.__("userid_or_code_missing");
        }
        if (!user.match(/^[a-f0-9]{24}$/)) {
            act_res = i18nm.__("invalid_userid_syntax");
        }
        if (!code.match(/^[a-f0-9]{32}$/)) {
            act_res = i18nm.__("invalid_code_syntax");
        }
        var data = {
            title: i18nm.__('activate'),
            page_title: i18nm.__('activate'),
            keywords: '',
            description: '',
            extra_css: ''
        };
        if (act_res) {
            var redirect_host = '';
            if (req.session.auth_redirect_host) redirect_host = config.protocol + '://' + req.session.auth_redirect_host;
            data.content = renderer.render_file(path.join(__dirname, 'views'), 'activate', {
                lang: i18nm,
                data: data,
                act_res: act_res,
                act_status: false,
                redirect_host: redirect_host,
                redirect: req.session.auth_redirect
            }, req);
            app.get('renderer').render(res, undefined, data, req);
            return;
        }
        app.get('mongodb').collection('users').find({
            _id: new ObjectId(user),
            act_code: code,
            status: 0
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err || typeof items == 'undefined' || items.length === 0) {
                var redirect_host = '';
                if (req.session.auth_redirect_host) redirect_host = config.protocol + '://' + req.session.auth_redirect_host;
                data.content = renderer.render_file(path.join(__dirname, 'views'), 'activate', {
                    lang: i18nm,
                    data: data,
                    act_res: i18nm.__("unable_to_activate"),
                    act_status: false,
                    redirect_host: redirect_host,
                    redirect: req.session.auth_redirect
                }, req);
                return app.get('renderer').render(res, undefined, data, req);
            }
            app.get('mongodb').collection('users').update({
                _id: new ObjectId(user)
            }, {
                $set: {
                    act_code: null,
                    status: 1
                }
            }, function(err) {
                var act_status = true;
                var act_msg = i18nm.__("activation_success");
                if (err) {
                    act_res = i18nm.__("unable_to_activate");
                    act_status = false;
                } else {
                    req.session.auth = items[0];
                    req.session.auth.timestamp = Date.now();
                }
                var redirect_host = '';
                if (req.session.auth_redirect_host) redirect_host = config.protocol + '://' + req.session.auth_redirect_host;
                data.content = renderer.render_file(path.join(__dirname, 'views'), 'activate', {
                    lang: i18nm,
                    data: data,
                    act_res: act_msg,
                    act_status: act_status,
                    redirect_host: redirect_host,
                    redirect: req.session.auth_redirect
                }, req);
                app.get('mongodb').collection('users').find({
                    _id: new ObjectId(user)
                }, {
                    limit: 1
                }).toArray(function(a_err, a_items) {
                    if (typeof a_items != 'undefined' && !a_err) {
                        if (a_items.length > 0 && a_items[0].status > 0) {
                            req.session.captcha_req = false;
                            req.session.auth = a_items[0];
                            req.session.auth.timestamp = Date.now();
                            delete req.session.auth.password;
                            return app.get('renderer').render(res, undefined, data, req);
                        }
                    }
                    data.act_res = i18nm.__("unable_to_activate");
                    data.act_status = false;
                    return app.get('renderer').render(res, undefined, data, req);
                });
            });
        });
    });
    router.get('/reset', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (typeof req.session != 'undefined' && typeof req.session.auth != 'undefined' && req.session.auth !== false) {
            res.redirect(303, "/?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        var c = parseInt(Math.random() * 9000 + 1000);
        var _cap = 'b64';
        if (app.get('config').captcha == 'captcha_gm') {
            _cap = 'png';
        }
        var data = {
            title: i18nm.__('reset'),
            page_title: i18nm.__('reset'),
            keywords: '',
            description: '',
            extra_css: '<link rel="stylesheet" href="/modules/auth/css/reset.css" type="text/css">'
        };
        var redirect_host = '';
        if (req.session.auth_redirect_host) redirect_host = config.protocol + '://' + req.session.auth_redirect_host;
        var render = renderer.render_file(path.join(__dirname, 'views'), 'reset', {
            lang: i18nm,
            captcha: _cap,
            captcha_req: true,
            data: data,
            redirect_host: redirect_host,
            redirect: req.session.auth_redirect
        }, req);
        data.content = render;
        app.get('renderer').render(res, undefined, data, req);
    });
    router.post('/reset/process', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        i18nm.setLocale(req.session.current_locale);
        var email = req.body.email;
        var captcha = req.body.captcha;
        if (!captcha.match(/^[0-9]{4}$/)) {
            res.send(JSON.stringify({
                result: 0,
                field: "reset_captcha",
                error: i18nm.__("invalid_captcha")
            }));
            return;
        }
        if (captcha != req.session.captcha) {
            req.session.captcha = 0;
            res.send(JSON.stringify({
                result: 0,
                field: "reset_captcha",
                error: i18nm.__("invalid_captcha")
            }));
            return;
        }
        req.session.captcha = 0;
        if (!email.match(/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/)) {
            res.send(JSON.stringify({
                result: 0,
                field: "reset_email",
                error: i18nm.__("invalid_email_syntax")
            }));
            return;
        }
        email = email.toLowerCase();
        app.get('mongodb').collection('users').find({
            email: email
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err) {
                res.send(JSON.stringify({
                    result: 0,
                    error: i18nm.__("reset_failed")
                }));
                return;
            }
            if (typeof items == 'undefined' || !items.length) {
                res.send(JSON.stringify({
                    result: 0,
                    field: "reset_email",
                    error: i18nm.__("email_not_registered")
                }));
                return;
            }
            var md5 = crypto.createHash('md5');
            var res_code = md5.update(config.salt + '.' + Date.now()).digest('hex');
            app.get('mongodb').collection('users').update({
                    _id: items[0]._id
                }, {
                    $set: {
                        res_code: res_code
                    }
                },
                function(err) {
                    if (err) {
                        res.send(JSON.stringify({
                            result: 0,
                            error: i18nm.__("reset_failed")
                        }));
                        return;
                    }
                    var user_id = items[0]._id.toHexString();
                    var reset_url = config.protocol + '://' + req.get('host') + '/auth/password?user=' + user_id + '&code=' + res_code;
                    mailer.send(email, i18nm.__('mail_reset_on') + ': ' + app.get('settings').site_title, path.join(__dirname, 'views'), 'mail_reset_html', 'mail_reset_txt', {
                        lang: i18nm,
                        site_title: app.get('settings').site_title,
                        reset_url: reset_url
                    }, req, function() {
                        // Success
                        req.session.captcha_req = false;
                        res.send(JSON.stringify({
                            result: 1
                        }));
                    });
                });
        });
    });
    router.get('/password', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var user = req.query.user;
        var code = req.query.code;
        var reset_res;
        if (typeof user == 'undefined' || typeof code == 'undefined') {
            reset_res = i18nm.__("userid_or_code_missing");
        }
        if (!user.match(/^[a-f0-9]{24}$/)) {
            reset_res = i18nm.__("invalid_userid_syntax");
        }
        if (!code.match(/^[a-f0-9]{32}$/)) {
            reset_res = i18nm.__("invalid_code_syntax");
        }
        var data = {
            title: i18nm.__('password_change'),
            page_title: i18nm.__('password_change'),
            keywords: '',
            description: '',
            extra_css: '',
        };
        if (reset_res) {
            data.content = renderer.render_file(path.join(__dirname, 'views'), 'password', {
                lang: i18nm,
                data: data,
                reset_res: reset_res,
                reset_status: false,
                user: '',
                code: ''
            }, req);
            app.get('renderer').render(res, undefined, data, req);
            return;
        }
        app.get('mongodb').collection('users').find({
            _id: new ObjectId(user),
            res_code: code,
            status: {
                $ne: 0
            }
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err || typeof items == 'undefined' || items.length === 0) {
                data.content = renderer.render_file(path.join(__dirname, 'views'), 'password', {
                    lang: i18nm,
                    data: data,
                    reset_res: i18nm.__("unable_to_reset"),
                    reset_status: false,
                    user: '',
                    code: ''
                }, req);
                return app.get('renderer').render(res, undefined, data, req);
            }
            data.content = renderer.render_file(path.join(__dirname, 'views'), 'password', {
                lang: i18nm,
                data: data,
                reset_res: i18nm.__("fill_the_form_to_set_new_password"),
                reset_status: true,
                user: user,
                code: code
            }, req);
            return app.get('renderer').render(res, undefined, data, req);
        });
    });
    router.post('/password/process', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        i18nm.setLocale(req.session.current_locale);
        var password = req.body.password;
        var user = req.body.user;
        var code = req.body.code;
        if (typeof password == 'undefined') {
            res.send(JSON.stringify({
                result: 0,
                error: i18nm.__("password_missing")
            }));
            return;
        }
        if (!password.match(/^.{8,80}$/)) {
            res.send(JSON.stringify({
                result: 0,
                field: "reg_password",
                error: i18nm.__("invalid_password_syntax")
            }));
            return;
        }
        if (!user.match(/^[a-f0-9]{24}$/)) {
            res.send(JSON.stringify({
                result: 0,
                error: i18nm.__("invalid_userid_syntax")
            }));
            return;
        }
        if (!code.match(/^[a-f0-9]{32}$/)) {
            res.send(JSON.stringify({
                result: 0,
                error: i18nm.__("invalid_code_syntax")
            }));
            return;
        }
        var md5 = crypto.createHash('md5');
        var password_hex = md5.update(config.salt + '.' + password).digest('hex');
        app.get('mongodb').collection('users').find({
            _id: new ObjectId(user),
            res_code: code
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err) {
                res.send(JSON.stringify({
                    result: 0,
                    error: i18nm.__("unable_to_reset")
                }));
                return;
            }
            if (typeof items == 'undefined' || !items.length) {
                res.send(JSON.stringify({
                    result: 0,
                    field: "pwd_password",
                    error: i18nm.__("unable_to_reset")
                }));
                return;
            }
            app.get('mongodb').collection('users').update({
                    _id: new ObjectId(user)
                }, {
                    $set: {
                        res_code: '',
                        password: password_hex
                    }
                },
                function(err, items) {
                    if (err) {
                        res.send(JSON.stringify({
                            result: 0,
                            error: i18nm.__("unable_to_reset")
                        }));
                        return;
                    }
                    res.send(JSON.stringify({
                        result: 1
                    }));
                });
        });
    });
    router.get('/logout', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (!req.session.auth || req.session.auth.status < 1) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/auth/profile';
            res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        delete req.session.auth;
        var data = {
            title: i18nm.__('logout'),
            page_title: i18nm.__('logout'),
            keywords: '',
            description: '',
            extra_css: ''
        };
        var render = renderer.render_file(path.join(__dirname, 'views'), 'logout', {
            lang: i18nm,
            data: data
        }, req);
        data.content = render;
        app.get('renderer').render(res, undefined, data, req);
    });
    router.post('/process', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        i18nm.setLocale(req.session.current_locale);
        var username = req.body.username;
        var password = req.body.password;
        var captcha = req.body.captcha;
        if (req.session.captcha_req) {
            if (!captcha.match(/^[0-9]{4}$/)) {
                res.send(JSON.stringify({
                    result: 0,
                    field: "auth_captcha",
                    error: i18nm.__("invalid_captcha")
                }));
                return;
            }
            if (captcha != req.session.captcha) {
                req.session.captcha = 0;
                res.send(JSON.stringify({
                    result: 0,
                    field: "auth_captcha",
                    error: i18nm.__("invalid_captcha")
                }));
                return;
            }
        }
        req.session.captcha = 0;
        if (typeof username == 'undefined' || typeof password == 'undefined') {
            res.send(JSON.stringify({
                result: 0,
                error: i18nm.__("username_password_missing")
            }));
            return;
        }
        if (!username.match(/^[A-Za-z0-9_\-]{3,20}$/)) {
            res.send(JSON.stringify({
                result: 0,
                field: "auth_username",
                error: i18nm.__("invalid_username_syntax")
            }));
            return;
        }
        if (!password.match(/^.{5,80}$/)) {
            res.send(JSON.stringify({
                result: 0,
                field: "auth_password",
                error: i18nm.__("invalid_password_syntax")
            }));
            return;
        }
        username = username.toLowerCase();
        var md5 = crypto.createHash('md5');
        var password_hex = md5.update(config.salt + '.' + password).digest('hex');
        app.get('mongodb').collection('users').find({
            username_auth: username,
            password: password_hex
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (typeof items != 'undefined' && !err) {
                if (items.length > 0 && items[0].status > 0) {
                    req.session.captcha_req = false;
                    req.session.auth = items[0];
                    req.session.auth.timestamp = Date.now();
                    delete req.session.auth.password;
                    res.send(JSON.stringify({
                        result: 1
                    }));
                    return;
                }
            }
            req.session.captcha_req = true;
            res.send(JSON.stringify({
                result: 0,
                field: "auth_password",
                error: i18nm.__("auth_failed")
            }));
        });
    });
    router.get('/profile', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (!req.session.auth || req.session.auth.status < 1) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/auth/profile';
            res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        var data = {
            title: i18nm.__('profile'),
            page_title: i18nm.__('profile'),
            keywords: '',
            description: '',
            extra_css: '<link rel="stylesheet" href="/modules/auth/css/user_profile.css" type="text/css">'
        };
        var render = renderer.render_file(path.join(__dirname, 'views'), 'profile', {
            lang: i18nm,
            data: data,
            auth: req.session.auth
        }, req);
        data.content = render;
        app.get('renderer').render(res, undefined, data, req);
    });
    router.post('/profile/process', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        i18nm.setLocale(req.session.current_locale);
        if (!req.session.auth || req.session.auth.status < 1) {
            res.send(JSON.stringify({
                result: 0,
                field: "",
                error: i18nm.__("unauth")
            }));
            return;
        }
        if (req.files && req.files.file) { // Avatar upload
            if (!gm) {
                res.send(JSON.stringify({
                    result: 0,
                    field: "",
                    error: i18nm.__("server_configuration_dont_support_avatar_upload")
                }));
                return;
            }
            var file = req.files.file;
            if (file.size > app.get('config').max_upload_file_mb * 1048576) {
                res.send(JSON.stringify({
                    result: 0,
                    field: "",
                    error: i18nm.__("file_too_big")
                }));
                return;
            }
            if (file.mimetype != 'image/png' && file.mimetype != 'image/jpeg') {
                res.send(JSON.stringify({
                    result: 0,
                    field: "",
                    error: i18nm.__("unsupported_image_format")
                }));
                return;
            }

            var img = gm(app.get('config').dir.tmp + '/' + file.name);
            if (!img) {
                fs.unlinkSync(app.get('config').dir.tmp + '/' + file.name);
                res.send(JSON.stringify({
                    result: 0,
                    field: "",
                    error: i18nm.__("unsupported_image_format")
                }));
                return;
            }
            img.autoOrient();
            var afn = crypto.createHash('md5').update(config.salt + '.' + req.session.auth._id).digest('hex');
            img.size(function(err, size) {
                if (!err) {
                    if (size.width >= size.height) {
                        img.resize(null, 128);
                        img.crop(128, 128, 0, 0);
                    } else {
                        img.resize(128, null);
                        img.crop(128, 128, 0, 0);
                    }
                    img.setFormat('jpeg');
                    img.write(app.get('config').dir.avatars + '/' + afn + '.jpg', function(err) {
                        if (err) {
                            fs.unlinkSync(app.get('config').dir.tmp + '/' + file.name);
                            res.send(JSON.stringify({
                                result: 0,
                                field: "",
                                error: i18nm.__("unsupported_image_format")
                            }));
                            return;
                        }
                        res.send(JSON.stringify({
                            result: 1,
                            avatar_id: afn
                        }));
                        fs.unlinkSync(app.get('config').dir.tmp + '/' + file.name);
                        return;
                    });
                } else {
                    fs.unlinkSync(app.get('config').dir.tmp + '/' + file.name);
                    res.send(JSON.stringify({
                        result: 0,
                        field: "",
                        error: i18nm.__("unsupported_image_format")
                    }));
                    return;
                }
            });
        } else { // Profile settings
            var username = req.session.auth.username;
            var password = req.body.password;
            var password_new = req.body.password_new;
            var email_new = req.body.email_new;
            var realname = req.body.realname;
            if (typeof password == 'undefined') {
                res.send(JSON.stringify({
                    result: 0,
                    field: "password_current",
                    error: i18nm.__("username_password_missing")
                }));
                return;
            }
            if (!username.match(/^[A-Za-z0-9_\-]{3,20}$/)) {
                res.send(JSON.stringify({
                    result: 0,
                    field: "password_current",
                    error: i18nm.__("invalid_username_syntax")
                }));
                return;
            }
            if (!password.match(/^.{5,80}$/)) {
                res.send(JSON.stringify({
                    result: 0,
                    field: "password_current",
                    error: i18nm.__("invalid_password_syntax")
                }));
                return;
            }
            if (password_new && !password_new.match(/^.{8,80}$/)) {
                res.send(JSON.stringify({
                    result: 0,
                    field: "pc_password",
                    error: i18nm.__("invalid_new_password_syntax")
                }));
                return;
            }
            if (realname) realname = realname.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ').replace(/</g, '').replace(/>/g, '').replace(/\"/g, '');
            if (realname && !realname.match(/^.{1,40}$/)) {
                res.send(JSON.stringify({
                    result: 0,
                    field: "rn_realname",
                    error: i18nm.__("invalid_realname")
                }));
                return;
            }
            if (email_new && !email_new.match(/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/)) {
                res.send(JSON.stringify({
                    result: 0,
                    field: "ec_email",
                    error: i18nm.__("invalid_email_syntax")
                }));
                return;
            }
            var username_auth = username.toLowerCase();
            var md5 = crypto.createHash('md5');
            var password_hex = md5.update(config.salt + '.' + password).digest('hex');
            app.get('mongodb').collection('users').find({
                username_auth: username_auth,
                password: password_hex
            }, {
                limit: 1
            }).toArray(function(err, items) {
                if (err || typeof items == 'undefined' || !items.length) {
                    res.send(JSON.stringify({
                        result: 0,
                        field: "password_current",
                        error: i18nm.__("invalid_username_or_password")
                    }));
                    return;
                }
                if (email_new && items[0].status == 2) {
                    res.send(JSON.stringify({
                        result: 0,
                        field: "password_current",
                        error: i18nm.__("administrator_cannot_change_email")
                    }));
                    return;
                }
                app.get('mongodb').collection('users').find({
                    email: email_new
                }, {
                    limit: 1
                }).toArray(function(err, cit) {
                    if (cit && cit.length) {
                        res.send(JSON.stringify({
                            result: 0,
                            field: "password_current",
                            error: i18nm.__("email_already_taken")
                        }));
                        return;
                    }
                    var update = {};
                    if (password_new) update.password = crypto.createHash('md5').update(config.salt + '.' + password_new).digest('hex');
                    if (email_new) {
                        update.email = email_new;
                        update.status = 0;
                        update.act_code = crypto.createHash('md5').update(config.salt + '.' + Date.now()).digest('hex');
                    }
                    if (realname) update.realname = realname;
                    if (Object.keys(update).length) {
                        app.get('mongodb').collection('users').update({
                            _id: items[0]._id
                        }, {
                            $set: update
                        }, function(err) {
                            if (err) {
                                res.send(JSON.stringify({
                                    result: 0,
                                    field: "password_current",
                                    error: i18nm.__("cannot_update")
                                }));
                                return;
                            }
                            var rr = {
                                result: 1
                            };
                            if (realname) {
                                rr.realname = realname;
                                req.session.auth.realname = realname;
                            }
                            if (email_new) {
                                delete req.session.auth;
                                var user_id = items[0]._id.toHexString();
                                var register_url = config.protocol + '://' + req.get('host') + '/auth/activate?user=' + user_id + '&code=' + update.act_code;
                                mailer.send(email_new, i18nm.__('mail_change_email_on') + ': ' + app.get('settings').site_title, path.join(__dirname, 'views'), 'mail_change_email_html', 'mail_change_email_txt', {
                                    lang: i18nm,
                                    site_title: app.get('settings').site_title,
                                    register_url: register_url
                                }, req, function() {
                                    res.send(JSON.stringify(rr));
                                });
                            } else {
                                res.send(JSON.stringify(rr));
                            }
                        });
                    } else {
                        res.send(JSON.stringify({
                            result: 1
                        }));
                    }
                });
            });
        }
    });
    router.post('/oauth/process', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        i18nm.setLocale(req.session.current_locale);
        if (!req.session.auth || req.session.auth.status < 1) {
            res.send(JSON.stringify({
                result: 0,
                field: "",
                error: i18nm.__("unauth")
            }));
            return;
        }
        if (!req.session.auth.need_finish) {
            res.send(JSON.stringify({
                result: 0,
                field: "",
                error: i18nm.__("unauth")
            }));
            return;
        }
        var username = req.body.username_new;
        var password = req.body.password_new;
        if (typeof password == 'undefined') {
            res.send(JSON.stringify({
                result: 0,
                field: "password_current",
                error: i18nm.__("invalid_password_syntax")
            }));
            return;
        }
        if (!username.match(/^[A-Za-z0-9_\-]{3,20}$/)) {
            res.send(JSON.stringify({
                result: 0,
                field: "password_current",
                error: i18nm.__("invalid_username_syntax")
            }));
            return;
        }
        if (!password.match(/^.{5,80}$/)) {
            res.send(JSON.stringify({
                result: 0,
                field: "password_current",
                error: i18nm.__("invalid_password_syntax")
            }));
            return;
        }
        var username_auth = username.toLowerCase();
        password = crypto.createHash('md5').update(config.salt + '.' + password).digest('hex');
        app.get('mongodb').collection('users').find({
            username_auth: username
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err) {
                res.send(JSON.stringify({
                    result: 0,
                    field: "password_current",
                    error: i18nm.__("ajax_failed")
                }));
                return;
            }
            if (items && items.length) {
                res.send(JSON.stringify({
                    result: 0,
                    field: "set_username",
                    error: i18nm.__("username_already_registered")
                }));
                return;
            }
            app.get('mongodb').collection('users').update({
                _id: new ObjectId(req.session.auth._id)
            }, {
                $set: {
                    username: username,
                    username_auth: username_auth,
                    need_finish: '',
                    password: password
                }
            }, function(err) {
                if (err) {
                    res.send(JSON.stringify({
                        result: 0,
                        field: "set_username",
                        error: i18nm.__("cannot_update")
                    }));
                    return;
                }
                req.session.auth.username = username;
                req.session.auth.need_finish = '';
                res.send(JSON.stringify({
                    result: 1,
                    username: username
                }));
            });
        });
    });

    var render_error_page = function(req, res, error_text) {
        var data = {
            title: i18nm.__('error'),
            page_title: i18nm.__('error'),
            keywords: '',
            description: '',
            extra_css: '<link rel="stylesheet" href="/modules/auth/css/user_auth.css" type="text/css">'
        };
        var render = renderer.render_file(path.join(__dirname, 'views'), 'error', {
            lang: i18nm,
            data: data,
            error_text: error_text
        }, req);
        data.content = render;
        app.get('renderer').render(res, undefined, data, req);
    };

    return router;
};
