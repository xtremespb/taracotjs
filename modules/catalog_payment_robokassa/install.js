module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'catalog_payment_robokassa',
            version: '0.5.20',
            collections: function(_callback) {
                // Create collections
                _callback();
            },
            indexes: function(_callback) {
                // Create indexes
                _callback();
            },
            defaults: function(_callback) {
                // Create default values
                _callback();
            },
            misc: function(_callback) {
                // Misc. tasks
                _callback();
            }
        };
    return is;
};
