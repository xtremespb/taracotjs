module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'social',
            version: '0.5.152',
            collections: function(_callback) {
                // Create collections
                async.series([
                    function(callback) {
                        db.createCollection('social_friends', function(err, collection) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.createCollection('social_conversations', function(err, collection) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.createCollection('social_messages', function(err, collection) {
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
                async.series([
                    function(callback) {
                        ensure_indexes('social_friends', ['u1', 'u2', 'friends'], null, true, function() {
                            callback();
                        });
                    },
                    function(callback) {
                        ensure_indexes('social_conversations', ['u1', 'u2'], null, true, function() {
                            callback();
                        });
                    },
                    function(callback) {
                        ensure_indexes('social_messages', ['last_tstamp'], null, null, function() {
                            callback();
                        });
                    }
                ], function(err) {
                    if (err) return _callback(err);
                    _callback();
                });
            },
            defaults: function(_callback) {
                // Create default values
                _callback();
            },
            misc: function(_callback) {
                // Other things to do
                _callback();
            },
            uninstall: function(_callback) {
                var collections = ['social_friends', 'social_conversations', 'social_messages'];
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
