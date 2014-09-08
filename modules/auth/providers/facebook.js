module.exports = function(app) {
    var router = app.get('express').Router();
    var config_auth = require('../../../config_auth');
    var request = require('request');
    var crypto = require('crypto');
    var config = app.get('config');
    var fs = require("fs");
    var gm = false;
    if (app.get('config').graphicsmagick) {
        gm = require('gm');
    }

    router.get('/facebook', function(req, res) {
        var code = req.query.code;
        if (!code) return res.redirect(303, "/auth?reason=no_code&rnd=" + Math.random().toString().replace('.', ''));
        var url = 'https://graph.facebook.com/oauth/access_token?client_id=' + config_auth.facebook.clientID + '&client_secret=' + config_auth.facebook.clientSecret + '&redirect_uri=' + config_auth.facebook.callbackURL + '&code=' + code + '&rnd=' + Math.random().toString().replace('.', '');
        request.get(url, function(error, response, body) {
            if (error || !body) {
                return res.redirect(303, "/auth?reason=no_response&rnd=" + Math.random().toString().replace('.', ''));
            }
            var res_arr1 = body.split(/&/);
            var data = {};
            for (var i = 0; i < res_arr1.length; i++) {
                var res_arr2 = res_arr1[i].split(/=/);
                if (res_arr2.length == 2) data[res_arr2[0]] = res_arr2[1];
            }
            if (!data.access_token) return res.redirect(303, "/auth?reason=no_access_token&rnd=" + Math.random().toString().replace('.', ''));
            var data_url = 'https://graph.facebook.com/me?access_token=' + data.access_token;
            request.get(data_url, function(error, response, body) {
                if (error || response.statusCode != 200) {
                    // return res.send(body);
                    return res.redirect(303, "/auth?reason=no_response_token&rnd=" + Math.random().toString().replace('.', ''));
                }
                var user_data = JSON.parse(body);
                // return res.send(JSON.stringify(user_data));
                app.get('mongodb').collection('users').find({
                    email: user_data.email
                }, {
                    limit: 1
                }).toArray(function(err, items) {
                    if (err) return res.redirect(303, "/auth?reason=database_request_failed&rnd=" + Math.random().toString().replace('.', ''));
                    if (typeof items == 'undefined' || !items || !items.length) {
                        var _now = Date.now();
                        var user = {
                            username: 'fb_' + _now,
                            realname: user_data.name,
                            email: user_data.email,
                            username_auth: 'fb_' + _now,
                            status: 1
                        };
                        app.get('mongodb').collection('users').insert(user, function(err, items) {
                            if (err) return res.redirect(303, "/auth?reason=database_insert_failed&rnd=" + Math.random().toString().replace('.', ''));
                            var user_id = items[0]._id.toHexString();
                            if (!user_id) return res.redirect(303, "/auth?reason=database_insert_failed&rnd=" + Math.random().toString().replace('.', ''));
                            app.get('mongodb').collection('users').find({
                                _id: items[0]._id
                            }, {
                                limit: 1
                            }).toArray(function(err, items) {
                                if (err || typeof items == 'undefined' || !items || !items.length) return res.redirect(303, "/auth?reason=auth_failed&rnd=" + Math.random().toString().replace('.', ''));
                                req.session.auth = items[0];
                                delete req.session.auth.password;
                                if (!gm) return res.redirect(303, "/auth/profile?reason=no_avatar_support&rnd=" + Math.random().toString().replace('.', ''));
                                var afn = crypto.createHash('md5').update(config.salt + '.' + req.session.auth._id).digest('hex');
                                var file = fs.createWriteStream(app.get('config').dir.avatars + '/' + afn + '.jpg');
                                request.get('http://graph.facebook.com/' + user_data.id + '/picture?type=large').pipe(file).on('close', function() {
                                    if (!fs.existsSync(app.get('config').dir.avatars + '/' + afn + '.jpg')) return res.redirect(303, "/auth/profile?reason=reg_complete&rnd=" + Math.random().toString().replace('.', ''));
                                    var img = gm(app.get('config').dir.avatars + '/' + afn + '.jpg');
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
                                                return res.redirect(303, "/auth/profile?reason=reg_complete&rnd=" + Math.random().toString().replace('.', ''));
                                            });
                                        } else {
                                            return res.redirect(303, "/auth/profile?reason=reg_complete&rnd=" + Math.random().toString().replace('.', ''));
                                        }
                                    });
                                });
                            });
                        });
                    } else {
                        req.session.auth = items[0];
                        delete req.session.auth.password;
                        return res.redirect(303, "/auth/profile?rnd=" + Math.random().toString().replace('.', ''));
                    }
                });
            });
        });
    });
    return router;
};
