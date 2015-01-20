module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'siteconf',
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
            }
        };
    return is;
};
