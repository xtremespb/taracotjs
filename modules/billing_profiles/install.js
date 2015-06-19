var async = require('async');

module.exports = function(db, ensure_indexes, config) {
    var is = {
        name: 'billing_profiles',
        version: '0.5.170',
        collections: function(_callback) {
            // Create collections
            async.series([
                function(callback) {
                    db.createCollection('billing_transactions', function(err, collection) {
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
            ensure_indexes('users', ['billing_funds'], null, null, function() {
                ensure_indexes('billing_transactions', ['user_id'], null, null, function() {
                    _callback();
                });
            });
        },
        defaults: function(_callback) {
            db.collection('counters').remove({
                "_id": "billing_payment"
            }, function() {
                db.collection('counters').insert({
                    "_id": "billing_payment",
                    "seq": 0
                }, function(err) {
                    if (err) return _callback(err);
                    _callback();
                });
            });
        },
        misc: function(_callback) {
            // Misc. tasks
            _callback();
        },
        uninstall: function(_callback) {
            // Uninstall tasks
            _callback();
        }
    };
    return is;
};
