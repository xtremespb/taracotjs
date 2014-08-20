module.exports = function(app) {
    var router = app.get('express').Router();
    var renderer = app.get('renderer');
    var config = app.get('config');
    var path = app.get('path');
    var mailer = app.get('mailer');
    var crypto = require('crypto');
    var i18nm = new(require('i18n-2'))({
        locales: config.locales,
        directory: path.join(__dirname, 'lang'),
        extension: '.js'
    });
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
        i18nm.setLocale(req.i18n.getLocale());
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
            extra_css: "\n\t" + '<link rel="stylesheet" href="/modules/auth/css/user_auth.css" type="text/css">'
        };
        var render = renderer.render_file(path.join(__dirname, 'views'), 'login_user', {
            lang: i18nm,
            captcha: _cap,
            captcha_req: captcha_req,
            data: data,
            redirect: req.session.auth_redirect
        }, req);
        data.content = render;
        app.get('renderer').render(res, undefined, data, req);
    });
    router.get('/cp', function(req, res) {
        i18nm.setLocale(req.i18n.getLocale());
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
        var render = renderer.render_file(path.join(__dirname, 'views'), 'login_cp', {
            lang: i18nm,
            captcha: _cap,
            captcha_req: captcha_req,
            redirect: req.session.auth_redirect
        }, req);
        res.send(render);
    });
    router.get('/register', function(req, res) {
        i18nm.setLocale(req.i18n.getLocale());
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
            title: i18nm.__('register'),
            page_title: i18nm.__('register'),
            keywords: '',
            description: '',
            extra_css: "\n\t" + '<link rel="stylesheet" href="/modules/auth/css/register.css" type="text/css">'
        };
        var render = renderer.render_file(path.join(__dirname, 'views'), 'register', {
            lang: i18nm,
            captcha: _cap,
            captcha_req: true,
            data: data,
            redirect: req.session.auth_redirect
        }, req);
        data.content = render;
        app.get('renderer').render(res, undefined, data, req);
    });
    router.post('/register/process', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        i18nm.setLocale(req.i18n.getLocale());
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
        var data = app.get('mongodb').collection('users').find({
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
                return;
            }
            if (typeof items != 'undefined') {
                if (items.length > 0) {
                    res.send(JSON.stringify({
                        result: 0,
                        field: "reg_username",
                        error: i18nm.__("username_or_email_already_registered")
                    }));
                    return;
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
                status: 0
            }, function(err, items) {
                if (err) {
                    res.send(JSON.stringify({
                        result: 0,
                        error: i18nm.__("reg_failed")
                    }));
                    return;
                }
                var user_id = items[0]._id.toHexString();
                var register_url = req.protocol + '://' + req.get('host') + '/auth/activate?user=' + user_id + '&code=' + act_code;
                mailer.send(email, i18nm.__('mail_register_on') + ': ' + app.get('settings').site_title, path.join(__dirname, 'views'), 'mail_register_html', 'mail_register_txt', {
                    lang: i18nm,
                    site_title: app.get('settings').site_title,
                    register_url: register_url
                });
                // Success
                req.session.captcha_req = false;
                res.send(JSON.stringify({
                    result: 1
                }));
            });
        });
    });
    router.get('/activate', function(req, res) {
        i18nm.setLocale(req.i18n.getLocale());
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
            data.content = renderer.render_file(path.join(__dirname, 'views'), 'activate', {
                lang: i18nm,
                data: data,
                act_res: act_res,
                act_status: false,
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
                data.content = renderer.render_file(path.join(__dirname, 'views'), 'activate', {
                    lang: i18nm,
                    data: data,
                    act_res: i18nm.__("unable_to_activate"),
                    act_status: false,
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
                }
                data.content = renderer.render_file(path.join(__dirname, 'views'), 'activate', {
                    lang: i18nm,
                    data: data,
                    act_res: act_msg,
                    act_status: act_status,
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
        i18nm.setLocale(req.i18n.getLocale());
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
            extra_css: "\n\t" + '<link rel="stylesheet" href="/modules/auth/css/reset.css" type="text/css">'
        };
        var render = renderer.render_file(path.join(__dirname, 'views'), 'reset', {
            lang: i18nm,
            captcha: _cap,
            captcha_req: true,
            data: data,
            redirect: req.session.auth_redirect
        }, req);
        data.content = render;
        app.get('renderer').render(res, undefined, data, req);
    });
    router.post('/reset/process', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        i18nm.setLocale(req.i18n.getLocale());
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
        var data = app.get('mongodb').collection('users').find({
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
                    var reset_url = req.protocol + '://' + req.get('host') + '/auth/password?user=' + user_id + '&code=' + res_code;
                    mailer.send(email, i18nm.__('mail_reset_on') + ': ' + app.get('settings').site_title, path.join(__dirname, 'views'), 'mail_reset_html', 'mail_reset_txt', {
                        lang: i18nm,
                        site_title: app.get('settings').site_title,
                        reset_url: reset_url
                    });
                    // Success
                    req.session.captcha_req = false;
                    res.send(JSON.stringify({
                        result: 1
                    }));
                });
        });
    });
    router.get('/password', function(req, res) {
        i18nm.setLocale(req.i18n.getLocale());
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
            status: { $ne: 0 }
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
        i18nm.setLocale(req.i18n.getLocale());
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
        var data = app.get('mongodb').collection('users').find({
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
        i18nm.setLocale(req.i18n.getLocale());
        if (!req.session.auth || req.session.auth.status < 1) {
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
        i18nm.setLocale(req.i18n.getLocale());
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
        var data = app.get('mongodb').collection('users').find({
            username_auth: username,
            password: password_hex
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (typeof items != 'undefined' && !err) {
                if (items.length > 0 && items[0].status > 0) {
                    req.session.captcha_req = false;
                    req.session.auth = items[0];
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
        i18nm.setLocale(req.i18n.getLocale());
        if (!req.session.auth || req.session.auth.status < 1) {
            req.session.auth_redirect = '/auth/profile';
            res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        var data = {
            title: i18nm.__('profile'),
            page_title: i18nm.__('profile'),
            keywords: '',
            description: '',
            extra_css: "\n\t" + '<link rel="stylesheet" href="/modules/auth/css/user_profile.css" type="text/css">'
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
        i18nm.setLocale(req.i18n.getLocale());
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
            if (realname) realname = realname.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ').replace(/</, '').replace(/>/, '').replace(/\"/, '');
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
            username = username.toLowerCase();
            var md5 = crypto.createHash('md5');
            var password_hex = md5.update(config.salt + '.' + password).digest('hex');
            app.get('mongodb').collection('users').find({
                username: username,
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
                            if (email_new) {
                                delete req.session.auth;
                                var user_id = items[0]._id.toHexString();
                                var register_url = req.protocol + '://' + req.get('host') + '/auth/activate?user=' + user_id + '&code=' + update.act_code;
                                mailer.send(email_new, i18nm.__('mail_change_email_on') + ': ' + app.get('settings').site_title, path.join(__dirname, 'views'), 'mail_change_email_html', 'mail_change_email_txt', {
                                    lang: i18nm,
                                    site_title: app.get('settings').site_title,
                                    register_url: register_url
                                });
                            }
                            var rr = { result: 1 };
                            if (realname) {
                                rr.realname = realname;
                                req.session.auth.realname = realname;
                            }
                            res.send(JSON.stringify(rr));
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
    return router;
};