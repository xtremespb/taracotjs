module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'search',
            version: '0.5.125',
            collections: function(_callback) {
                // Create collections
                async.series([
                    function(callback) {
                        db.createCollection('search_index', function(err, collection) {
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
                        ensure_indexes('search_index', ['swords', 'space', 'item_id'], null, true, function() {
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
                var collections = ['search_index'];
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
