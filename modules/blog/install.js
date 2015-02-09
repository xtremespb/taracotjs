module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'blog',
            version: '0.5.40',
            collections: function(_callback) {
                // Create collections
                async.series([
                    function(callback) {
                        db.createCollection('blog', function(err, collection) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.createCollection('blog_comments', function(err, collection) {
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
                        ensure_indexes('blog', ['post_timestamp'], null, null, function() {
                            ensure_indexes('blog', ['post_moderated', 'post_filtered', 'post_draft', 'post_user_id', 'post_keywords', 'post_area', 'post_lang'], null, true, function() {
                                callback();
                            });
                        });
                    },
                    function(callback) {
                        ensure_indexes('blog_comments', ['post_id', 'comment_timestamp'], null, true, function() {
                            callback();
                        });
                    }
                ], function(err) {
                    if (err) _callback(err);
                    _callback();
                });
            },
            defaults: function(_callback) {
                // Create default values
                async.series([
                    function(callback) {
                        db.collection('settings').insert({
                            oname: 'blog_mode',
                            ovalue: 'moderation',
                            olang: ''
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('settings').insert({
                            oname: 'blog_areas',
                            ovalue: '[{"id":"test","en":"Test blog area","ru":"Тестовый раздел"}]',
                            olang: ''
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
                var collections = ['blog', 'blog_comments'];
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
