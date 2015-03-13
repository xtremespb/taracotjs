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
                    if (!error && response.statusCode === 200) {
                        if (body.match(/has invalid value/)) return callback(0);
                        return callback(1);
                    } else {
                        callback(-1);
                    }
                });

            },
            create_user: function(username, password, plan, callback) {
                request({
                    url: config.billing_frontend.ispmanager.url + '?authinfo=' + config.billing_frontend.ispmanager.login + ':' + config.billing_frontend.ispmanager.pwd + '&out=text&func=user.edit&elid=' + username,
                    proxy: _debug_proxy_url,
                    rejectUnauthorized: false,
                    timeout: 10000, // 10 seconds
                    json: false
                }, function(error, response, body) {
                    if (!error && response.statusCode === 200) {
                        if (body.match(/has invalid value/)) return callback(0);
                        return callback(1);
                    } else {
                        callback(-1);
                    }
                });

            }
        };
    return ispmanager;
};
