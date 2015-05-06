var crypto = require('crypto'),
    async = require('async');

module.exports = function(db, ensure_indexes, config) {
    var is = {
            name: 'auth',
            version: '0.5.126',
            collections: function(_callback) {
                // Create collections
                async.series([
                    function(callback) {
                        db.createCollection('users', function(err, collection) {
                            if (err) return callback(err);
                            callback();
                        });
                    }
                ], function(err) {
                    if (err) return _callback(err);
                    _callback();
                });
            },
            indexes: function(_callback) {
                // Create indexes
                ensure_indexes('users', ['username', 'email', 'realname', 'status'], null, null, function() {
                    ensure_indexes('users', ['act_code', 'res_code', 'username_auth', 'password', 'username_vk_uid'], null, true, function() {
                        _callback();
                    });
                });
            },
            defaults: function(_callback) {
                // Create default values
                db.collection('users').remove({
                    username: 'admin'
                }, function() {
                    var password_md5 = crypto.createHash('md5').update(config.salt + '.admin').digest('hex');
                    db.collection('users').insert({
                        username: 'admin',
                        username_auth: 'admin',
                        email: 'default@taracot.org',
                        realname: 'Website Administrator',
                        status: 2,
                        regdate: Date.now(),
                        password: password_md5
                    }, function(err) {
                        if (err) if (err) return callback(err);
                        _callback();
                    });
                });
            },
            misc: function(_callback) {
                // Other things to do
                _callback();
            },
            uninstall: function(_callback) {
                var collections = ['users'];
                async.eachSeries(collections, function(name, e_callback) {
                    db.collection(name).drop(function(err) {
                        if (err) return e_callback(err);
                        e_callback();
                    });

                }, function(err) {
                	if (err) return _callback(err);
                	_callback();
                });
            }
        };
    return is;
};
