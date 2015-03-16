var _debug_proxy_url = 'http://10.206.247.66:8080',
    request = require('request');

module.exports = function(app) {
    var config = app.get('config'),
        ispmanager = {
            user_exists: function(username, callback) {
                request({
                    url: config.billing_frontend.ispmanager.url + '?authinfo=' + config.billing_frontend.ispmanager.login + ':' + config.billing_frontend.ispmanager.pwd + '&out=text&func=user.edit&elid=' + username,
                    proxy: _debug_proxy_url,
                    rejectUnauthorized: false,
                    timeout: 10000, // 10 seconds
                    json: false
                }, function(error, response, body) {
                    var rep = {
                        error: error,
                        response: response,
                        body: body,
                        status: -1
                    };
                    if (!error && response.statusCode === 200) {
                        if (body.match(/has invalid value/)) {
                            rep.status = 0;
                            return callback(rep);
                        }
                        if (body.match(/^ERROR/)) return callback(rep);
                        rep.status = 1;
                        return callback(rep);
                    } else {
                        callback(rep);
                    }
                });
            },
            user_action: function(username, action, callback) {
                request({
                    url: config.billing_frontend.ispmanager.url + '?authinfo=' + config.billing_frontend.ispmanager.login + ':' + config.billing_frontend.ispmanager.pwd + '&out=text&func=user.' + action + '&elid=' + username,
                    proxy: _debug_proxy_url,
                    rejectUnauthorized: false,
                    timeout: 10000, // 10 seconds
                    json: false
                }, function(error, response, body) {
                    var rep = {
                        error: error,
                        response: response,
                        body: body,
                        status: -1
                    };
                    if (!error && response.statusCode === 200) {
                        if (body.match(/^ERROR/)) {
                            rep.status = 2;
                            return callback(rep);
                        }
                        rep.status = 1;
                        return callback(rep);
                    } else {
                        callback(rep);
                    }
                });
            },
            user_create: function(username, password, plan, callback) {
                request({
                    url: config.billing_frontend.ispmanager.url + '?authinfo=' + config.billing_frontend.ispmanager.login + ':' + config.billing_frontend.ispmanager.pwd + '&out=text&func=user.edit&sok=ok&name=' + username + '&preset=' + plan + '&passwd=' + password,
                    proxy: _debug_proxy_url,
                    rejectUnauthorized: false,
                    timeout: 10000, // 10 seconds
                    json: false
                }, function(error, response, body) {
                    var rep = {
                        error: error,
                        response: response,
                        body: body,
                        status: -1
                    };
                    if (!error && response.statusCode === 200) {
                        if (body.match(/This password is/)) {
                            rep.status = 3;
                            return callback(rep);
                        }
                        if (body.match(/^ERROR/)) {
                            rep.status = 2;
                            return callback(rep);
                        }
                        if (body.match(/^OK/)) {
                            rep.status = 1;
                            return callback(rep);
                        }
                        rep.status = 2;
                        return callback(rep);
                    } else {
                        callback(rep);
                    }
                });
            }
        };
    return ispmanager;
};
