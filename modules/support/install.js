var fs = require('fs-extra'),
    async = require('async');

module.exports = function(db, ensure_indexes, config) {
    var is = {
        name: 'support',
        version: '0.5.152',
        collections: function(_callback) {
            // Create collections
            async.series([
                function(callback) {
                    db.createCollection('support', function(err, collection) {
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
                    ensure_indexes('support', ['ticket_id', 'user_id'], null, true, function() {
                        callback();
                    });
                }
            ], function(err) {
                if (err) return _callback(err);
                _callback();
            });

        },
        defaults: function(_callback) {
            db.collection('counters').remove({
                "_id": "support"
            }, function() {
                db.collection('counters').insert({
                    "_id": "support",
                    "seq": 0
                }, function(err) {
                    if (err) return _callback(err);
                    _callback();
                });
            });
        },
        misc: function(_callback) {
            // Other things to do
            _callback();
        },
        uninstall: function(_callback) {
            // Uninstall tasks
            _callback();
        }
    };
    return is;
};
