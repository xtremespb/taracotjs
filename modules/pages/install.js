module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'pages',
            version: '0.5.20',
            collections: function(_callback) {
                // Create collections
                async.series([
                    function(callback) {
                        db.createCollection('pages', function(err, collection) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.createCollection('page_folders', function(err, collection) {
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
                        ensure_indexes('pages', ['pfolder', 'pfilename', 'plang', 'ptitle'], null, null, function() {
                            callback();
                        });
                    },
                    function(callback) {
                        ensure_indexes('page_folders', ['oname'], null, null, function() {
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
                            db.collection('pages').insert({
                                ptitle: 'Default page',
                                pfolder: '/',
                                pfilename: '',
                                plang: 'en',
                                playout: config.layouts.default,
                                pfolder_id: 'j1_1',
                                pkeywords: 'sample, keywords, here',
                                pdesc: 'This is the sample page',
                                pcontent: 'The installation is complete ;-)'
                            }, function(err) {
                                if (err) return callback(err);
                                callback();
                            });
                        },
                        function(callback) {
                            db.collection('search_index').insert({
                                "item_id": "54c0ef39c00ad59027af778a",
                                "sdesc": "The installation is complete ;-)",
                                "slang": "en",
                                "space": "pages",
                                "stitle": "Default page",
                                "surl": "/",
                                "swords": "installation complete default page"
                            }, function(err) {
                                if (err) return callback(err);
                                callback();
                            });
                        },
                        function(callback) {
                            db.collection('pages').insert({
                                ptitle: 'Главная страница',
                                pfolder: '/',
                                pfilename: '',
                                plang: 'ru',
                                playout: config.layouts.default,
                                pfolder_id: 'j1_1',
                                pkeywords: 'образец, ключевых, слов',
                                pdesc: 'Тестовая страница',
                                pcontent: 'Инсталляция успешно выполнена ;-)'
                            }, function(err) {
                                if (err) return callback(err);
                                callback();
                            });
                        },
                        function(callback) {
                            db.collection('search_index').insert({
                                "swords": "инсталляция успешно выполнена главная страница",
                                "sdesc": "Инсталляция успешно выполнена ;-)",
                                "stitle": "Главная страница",
                                "slang": "ru",
                                "surl": "/",
                                "item_id": "54c0ef39c00ad59027af778b",
                                "space": "pages"
                            }, function(err) {
                                if (err) return callback(err);
                                callback();
                            });
                        },
                        function(callback) {
                            db.collection('page_folders').insert({
                                oname: 'folders_json',
                                ovalue: '[{"id":"j1_1","text":"/","data":null,"parent":"#","type":"root"}]'
                            }, function(err) {
                                if (err) return callback(err);
                                callback();
                            });
                        }
                    ],
                    function(err) {
                        if (err) return _callback(err);
                        _callback();
                    });
            },
            misc: function(_callback) {
                // Other things to do
                _callback();
            },
            uninstall: function(_callback) {
                var collections = ['pages', 'page_folders'];
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
