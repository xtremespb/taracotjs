module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        ObjectId = require('mongodb').ObjectID,
        is = {
            name: 'pages',
            version: '0.5.51',
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
                        ensure_indexes('pages', ['pfolder', 'pfilename'], null, null, function() {
                            async.eachSeries(config.locales.avail, function(lng, __callback) {
                                ensure_indexes('pages', ['pdata.' + lng + '.ptitle'], null, null, function() {
                                    __callback();
                                });
                            }, function(err) {
                                callback();
                            });
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
                                "_id": new ObjectId('54d23755b91e307022edb199'),
                                "pfilename": "",
                                "pfolder": "/",
                                "pfolder_id": "j1_1",
                                "pdata": {
                                    "en": {
                                        "ptitle": "Default page",
                                        "pkeywords": "sample, keywords, here",
                                        "pdesc": "This is the sample page",
                                        "pcontent": "<p>Congratulations! The installation is complete.</p>\n\n<p>Get started the administration of your TaracotJS installation: <a href=\"/cp\">control panel</a> (username &quot;admin&quot;, password &quot;admin&quot; without quotes by default).</p>\n\n<p>You can get more info on using TaracotJS here:</p>\n\n<ul>\n\t<li><a href=\"https://taracot.org\">official website</a></li>\n\t<li><a href=\"https://github.com/xtremespb/taracotjs\">sources at GitHub</a></li>\n\t<li><a href=\"https://demo.taracot.org\">demo website</a></li>\n</ul>\n\n<p>Please don&#39;t hesitate to post any comments or bugs at GitHub website.</p>\n"
                                    },
                                    "ru": {
                                        "ptitle": "Главная страница",
                                        "pkeywords": "образец, ключевых, слов",
                                        "pdesc": "Тестовая страница",
                                        "pcontent": "<p>Поздравляем! Установка TaracotJS успешно выполнена.</p>\n\n<p>Начните управление Вашим сайтом, зайдя в <a href=\"/cp\">панель управления</a> (имя пользователя &quot;admin&quot;, пароль &quot;admin&quot; без кавычек по умолчанию).</p>\n\n<p>Больше информации о системе:</p>\n\n<ul>\n\t<li><a href=\"https://taracot.org\">официальный веб-сайт</a></li>\n\t<li><a href=\"https://github.com/xtremespb/taracotjs\">исходный код на GitHub</a></li>\n\t<li><a href=\"https://demo.taracot.org\">демонстрационный сайт</a></li>\n</ul>\n\n<p>Пожалуйста, не стесняйтесь отправлять Ваши замечания, пожалания и баги на GitHub.</p>\n"
                                    }
                                }
                            }, function(err) {
                                if (err) return callback(err);
                                callback();
                            });
                        },
                        function(callback) {
                            db.collection('search_index').insert({
                                "swords": "congratulations the installation complete get started administration your taracotjs control panel username admin password without quotes default you can more info using here official website httpstaracotorg sources github httpsgithubcomxtremespbtaracotjs demo httpsdemotaracotorg please don't hesitate post any comments bugs page",
                                "sdesc": "",
                                "stitle": "Default page",
                                "slang": "en",
                                "item_id": "54d23755b91e307022edb199",
                                "surl": "/",
                                "space": "pages"
                            }, function(err) {
                                if (err) return callback(err);
                                callback();
                            });
                        },
                        function(callback) {
                            db.collection('search_index').insert({
                                "swords": "поздравляем установка taracotjs успешно выполнена начните управление вашим сайтом зайдя панель управления имя пользователя admin пароль без кавычек умолчанию больше информации системе официальный веб-сайт httpstaracotorg исходный код github httpsgithubcomxtremespbtaracotjs демонстрационный сайт httpsdemotaracotorg пожалуйста стесняйтесь отправлять ваши замечания пожалания баги главная страница",
                                "sdesc": "",
                                "stitle": "Главная страница",
                                "slang": "ru",
                                "item_id": "54d23755b91e307022edb199",
                                "surl": "/",
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
