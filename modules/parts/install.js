module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'parts',
            version: '0.5.35',
            collections: function(_callback) {
                // Create collections
                async.series([
                    function(callback) {
                        db.createCollection('parts', function(err, collection) {
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
                        ensure_indexes('parts', ['pname', 'plang'], null, true, function() {
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
                async.series([
                    function(callback) {
                        db.collection('parts').insert({
                            pname: 'test',
                            plang: 'en',
                            pvalue: 'Just a test example'
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('parts').insert({
                            pname: 'test',
                            plang: 'ru',
                            pvalue: 'Тестовый элемент'
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    }
                ], function(err) {
                    if (err) return _callback(err);
                    _callback();
                });
            },
            misc: function(_callback) {
                // Other things to do
                _callback();
            },
            uninstall: function(_callback) {
                var collections = ['parts'];
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
