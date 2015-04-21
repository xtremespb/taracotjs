var fs = require('fs-extra');

module.exports = function(db, ensure_indexes, config) {
    var is = {
        name: 'support',
        version: '0.5.91',
        collections: function(_callback) {
            _callback();
        },
        indexes: function(_callback) {
            _callback();
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
