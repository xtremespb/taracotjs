var async = require('async');

module.exports = function(db, ensure_indexes, config) {
    var is = {
        name: 'chat',
        version: '0.5.169',
        collections: function(_callback) {
            // Create collections
            async.series([
                function(callback) {
                    db.createCollection('chat', function(err, collection) {
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
                    ensure_indexes('chat', ['channel_id', 'timestamp', 'msg_deleted'], null, null, function() {
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
