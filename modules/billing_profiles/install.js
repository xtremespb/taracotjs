module.exports = function(db, ensure_indexes, config) {
    var is = {
        name: 'billing_profiles',
        version: '0.5.89',
        collections: function(_callback) {
            // Create collections
            _callback();
        },
        indexes: function(_callback) {
            // Create indexes
            ensure_indexes('users', ['billing_funds'], null, null, function() {
                _callback();
            });
        },
        defaults: function(_callback) {
            db.collection('counters').remove({
                "_id": "warehouse_orders"
            }, function() {
                db.collection('counters').insert({
                    "_id": "warehouse_orders",
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
