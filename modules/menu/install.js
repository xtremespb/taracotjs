module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'menu',
            version: '0.5.169',
            collections: function(_callback) {
                // Create collections
                async.series([
                    function(callback) {
                        db.createCollection('menu', function(err, collection) {
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
                        ensure_indexes('menu', ['lang'], null, true, function() {
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
                        db.collection('menu').insert({
                            "lang": "en",
                            "menu_source": "[{\"id\":\"j3_1\",\"text\":\"/\",\"data\":null,\"parent\":\"#\",\"type\":\"root\"},{\"id\":\"j3_2\",\"text\":\"Home\",\"data\":{\"url\":\"/\"},\"parent\":\"j3_1\",\"type\":\"folder\"},{\"id\":\"j3_3\",\"text\":\"Blog\",\"data\":{\"url\":\"/blog\"},\"parent\":\"j3_1\",\"type\":\"folder\"},{\"id\":\"j3_4\",\"text\":\"Social\",\"data\":{\"url\":\"/social\"},\"parent\":\"j3_1\",\"type\":\"folder\"},{\"id\":\"j3_5\",\"text\":\"Shop\",\"data\":{\"url\":\"/catalog\"},\"parent\":\"j3_1\",\"type\":\"folder\"},{\"id\":\"j3_6\",\"text\":\"Chat\",\"data\":{\"url\":\"/chat\"},\"parent\":\"j3_1\",\"type\":\"folder\"},{\"id\":\"j3_7\",\"text\":\"Support\",\"data\":{\"url\":\"/support\"},\"parent\":\"j3_1\",\"type\":\"folder\"},{\"id\":\"j3_8\",\"text\":\"Feedback\",\"data\":{\"url\":\"/feedback\"},\"parent\":\"j3_1\",\"type\":\"folder\"}]"
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('menu').insert({
                            "lang": "ru",
                            "menu_source": "[{\"id\":\"j3_1\",\"text\":\"/\",\"data\":null,\"parent\":\"#\",\"type\":\"root\"},{\"id\":\"j3_2\",\"text\":\"Главная\",\"data\":{\"url\":\"/\"},\"parent\":\"j3_1\",\"type\":\"folder\"},{\"id\":\"j3_3\",\"text\":\"Блог\",\"data\":{\"url\":\"/blog\"},\"parent\":\"j3_1\",\"type\":\"folder\"},{\"id\":\"j3_4\",\"text\":\"Соц. сеть\",\"data\":{\"url\":\"/social\"},\"parent\":\"j3_1\",\"type\":\"folder\"},{\"id\":\"j3_5\",\"text\":\"Магазин\",\"data\":{\"url\":\"/catalog\"},\"parent\":\"j3_1\",\"type\":\"folder\"},{\"id\":\"j3_6\",\"text\":\"Чат\",\"data\":{\"url\":\"/chat\"},\"parent\":\"j3_1\",\"type\":\"folder\"},{\"id\":\"j3_7\",\"text\":\"Поддержка\",\"data\":{\"url\":\"/support\"},\"parent\":\"j3_1\",\"type\":\"folder\"},{\"id\":\"j3_8\",\"text\":\"Обратная связь\",\"data\":{\"url\":\"/feedback\"},\"parent\":\"j3_1\",\"type\":\"folder\"}]"
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
                var collections = ['menu'];
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
