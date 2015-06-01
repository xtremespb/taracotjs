module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'cp',
            version: '0.5.152',
            collections: function(_callback) {
                // Create collections
                async.series([
                    function(callback) {
                        db.createCollection('updates', function(err, collection) {
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
                _callback();
            },
            defaults: function(_callback) {
                // Create default values
                _callback();
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
