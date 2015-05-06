module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        fs = require('fs-extra'),
        is = {
            name: 'catalog',
            version: '0.5.126',
            collections: function(_callback) {
                // Create collections
                async.series([
                    function(callback) {
                        db.createCollection('warehouse', function(err, collection) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.createCollection('warehouse_categories', function(err, collection) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.createCollection('warehouse_conf', function(err, collection) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.createCollection('warehouse_addr', function(err, collection) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.createCollection('warehouse_orders', function(err, collection) {
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
                        ensure_indexes('warehouse', ['pfolder', 'pfilename'], null, null, function() {
                            async.eachSeries(config.locales.avail, function(lng, __callback) {
                                ensure_indexes('warehouse', ['pdata.' + lng + '.ptitle'], null, null, function() {
                                    ensure_indexes('warehouse', ['pdata.' + lng + '.pshortdesc'], null, null, function() {
                                        __callback();
                                    });
                                });
                            }, function(err) {
                                callback();
                            });
                        });
                    },
                    function(callback) {
                        ensure_indexes('warehouse_categories', ['oname'], null, null, function() {
                            callback();
                        });
                    },
                    function(callback) {
                        ensure_indexes('warehouse_conf', ['conf'], null, null, function() {
                            callback();
                        });
                    },
                    function(callback) {
                        ensure_indexes('warehouse_addr', ['user_id'], null, true, function() {
                            callback();
                        });
                    },
                    function(callback) {
                        ensure_indexes('warehouse_orders', ['order_id', 'order_status', 'order_timestamp', 'user_id'], null, null, function() {
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
                        db.collection('warehouse').insert({
                            "pfilename": "TDS00001",
                            "pcategory": "/storage/usb_flash",
                            "pcategory_id": "j1_3",
                            "pimages": ["58b8d5b8ced7332f435668b15b6eb48a"],
                            "pamount": 100,
                            "pamount_unlimited": 0,
                            "pprice": 300,
                            "pweight": 0.02,
                            "pcurs": "rur",
                            "pdata": {
                                "ru": {
                                    "ptitle": "8Gb Smart Buy Cobra",
                                    "pshortdesc": "Compact and cheap USB stick by Smart Buy",
                                    "pkeywords": "",
                                    "pdesc": "",
                                    "pcontent": "<p>Compact and robust USB stick.</p>\n",
                                    "pchars": [{
                                        "id": "capacity_gb",
                                        "val": 8
                                    }, {
                                        "id": "interface",
                                        "val": "USB 2.0"
                                    }, {
                                        "id": "color",
                                        "val": "красный"
                                    }]
                                },
                                "en": {
                                    "ptitle": "8Gb Smart Buy Cobra",
                                    "pshortdesc": "Compact and cheap USB stick by Smart Buy",
                                    "pkeywords": "",
                                    "pdesc": "",
                                    "pcontent": "<p>Компактная и надежная флешка.</p>\n",
                                    "pchars": [{
                                        "id": "capacity_gb",
                                        "val": 8
                                    }, {
                                        "id": "interface",
                                        "val": "USB 2.0"
                                    }, {
                                        "id": "color",
                                        "val": "red"
                                    }]
                                }
                            }
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('warehouse').insert({
                            "pfilename": "TDS00002",
                            "pcategory": "/storage/usb_flash",
                            "pcategory_id": "j1_3",
                            "pimages": ["139312b8960a51f7a601e01c9eb39c71", "a438ec7015acf1da5c13cb649c1afcf0"],
                            "pamount": 50,
                            "pamount_unlimited": 0,
                            "pprice": 700,
                            "pweight": 0.1,
                            "pcurs": "rur",
                            "pdata": {
                                "ru": {
                                    "pcontent": "",
                                    "ptitle": "16Gb Silicon Power I-Series",
                                    "pshortdesc": "16Gb Silicon Power I-Series, SP016GBUF2M01V1K, USB флешка, черная",
                                    "pkeywords": "",
                                    "pdesc": "",
                                    "pchars": []
                                },
                                "en": {
                                    "pcontent": "",
                                    "ptitle": "16Gb Silicon Power I-Series",
                                    "pshortdesc": "16Gb Silicon Power I-Series, SP016GBUF2M01V1K, Flash USB, black",
                                    "pkeywords": "",
                                    "pdesc": "",
                                    "pchars": []
                                }
                            }
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('warehouse').insert({
                            "pfilename": "TDS00003",
                            "pcategory": "/storage/usb_flash",
                            "pcategory_id": "j1_3",
                            "pimages": ["661e84ae052879073ed77cbf720989ad", "c157983ba9c37cde40edf5021517f223", "527fc0f513bc9505c77e2ae4c6656829"],
                            "pamount": 10,
                            "pamount_unlimited": 0,
                            "pprice": 1220,
                            "pweight": 0.04,
                            "pcurs": "rur",
                            "pdata": {
                                "ru": {
                                    "ptitle": "32Gb Transcend JetFlash 700",
                                    "pshortdesc": "32Gb Transcend JetFlash 700, TS32GJF700, USB 3.0, USB флешка",
                                    "pkeywords": "",
                                    "pdesc": "",
                                    "pcontent": "",
                                    "pchars": []
                                },
                                "en": {
                                    "ptitle": "32Gb Transcend JetFlash 700",
                                    "pshortdesc": "32Gb Transcend JetFlash 700, TS32GJF700, USB 3.0, Flash USB",
                                    "pkeywords": "",
                                    "pdesc": "",
                                    "pcontent": "",
                                    "pchars": []
                                }
                            }
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('warehouse').insert({
                            "pfilename": "TDS00004",
                            "pcategory": "/storage/floppy",
                            "pcategory_id": "j1_4",
                            "pimages": ["e686545d51dc3879f85c2a9c9b856568", "1da71e8209a3713ba4eac9f217316193"],
                            "pamount": 5,
                            "pamount_unlimited": 0,
                            "pprice": 280,
                            "pweight": 0.3,
                            "pcurs": "rur",
                            "pdata": {
                                "ru": {
                                    "ptitle": "L-Pro 3.5\", коробка (10 шт.)",
                                    "pshortdesc": "3.5\", двухсторонние, высокой плотности, отформатированные",
                                    "pkeywords": "",
                                    "pdesc": "",
                                    "pcontent": "",
                                    "pchars": [{
                                        "id": "capacity_mb",
                                        "val": 1.44
                                    }, {
                                        "id": "floppy_size",
                                        "val": "3.5&quot;"
                                    }]
                                },
                                "en": {
                                    "ptitle": "L-Pro 3.5\" BOX (10 pcs)",
                                    "pshortdesc": "3.5\" double side, high capacity, formatted",
                                    "pkeywords": "",
                                    "pdesc": "",
                                    "pcontent": "",
                                    "pchars": [{
                                        "id": "capacity_mb",
                                        "val": 1.44
                                    }, {
                                        "id": "floppy_size",
                                        "val": "3.5&quot;"
                                    }]
                                }
                            }
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('warehouse').insert({
                            "pfilename": "TDS00005",
                            "pcategory": "/storage/memory_cards/sd",
                            "pcategory_id": "j1_8",
                            "pimages": ["f437f67242c5b806e7e09c9b1e8de2fc"],
                            "pamount": 5,
                            "pamount_unlimited": 0,
                            "pprice": 1430,
                            "pweight": 0.2,
                            "pcurs": "rur",
                            "pdata": {
                                "ru": {
                                    "ptitle": "SDHC 32Gb Class 10 SanDisk Ultra",
                                    "pshortdesc": "SDHC 32Gb Class 10 SanDisk Ultra SDSDU-032G-U46",
                                    "pkeywords": "",
                                    "pdesc": "",
                                    "pcontent": "",
                                    "pchars": []
                                },
                                "en": {
                                    "ptitle": "SDHC 32Gb Class 10 SanDisk Ultra",
                                    "pshortdesc": "SDHC 32Gb Class 10 SanDisk Ultra SDSDU-032G-U46",
                                    "pkeywords": "",
                                    "pdesc": "",
                                    "pcontent": "",
                                    "pchars": []
                                }
                            }
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('warehouse').insert({
                            "pfilename": "TDS00006",
                            "pcategory": "/game_console/nes",
                            "pcategory_id": "j1_7",
                            "pimages": ["76cdb7a45539a90a9c28556f1351b958"],
                            "pamount": 0,
                            "pamount_unlimited": 0,
                            "pprice": 3000,
                            "pweight": 1.5,
                            "pcurs": "rur",
                            "pdata": {
                                "ru": {
                                    "ptitle": "Классическая консоль NES",
                                    "pshortdesc": "Приставка NES, refurbished с контроллерами, аксессуарами, и новым 72-pin разъемом",
                                    "pkeywords": "",
                                    "pdesc": "",
                                    "pcontent": "",
                                    "pchars": []
                                },
                                "en": {
                                    "ptitle": "Classic NES console",
                                    "pshortdesc": "Basic refurbished NES Nintendo System with controller, all hook-ups, and a new 72-pin",
                                    "pkeywords": "",
                                    "pdesc": "",
                                    "pcontent": "",
                                    "pchars": []
                                }
                            }
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('warehouse_categories').insert({
                                "oname": "categories_json",
                                "ovalue": "[{\"id\":\"j1_1\",\"text\":\"/\",\"data\":null,\"parent\":\"#\",\"type\":\"root\"},{\"id\":\"j1_2\",\"text\":\"storage\",\"data\":{\"lang\":{\"en\":\"Storage\",\"ru\":\"Накопители\"}},\"parent\":\"j1_1\",\"type\":\"category\"},{\"id\":\"j1_3\",\"text\":\"usb_flash\",\"data\":{\"lang\":{\"en\":\"USB sticks\",\"ru\":\"Флешки\"}},\"parent\":\"j1_2\",\"type\":\"category\"},{\"id\":\"j1_4\",\"text\":\"floppy\",\"data\":{\"lang\":{\"en\":\"Floppy\",\"ru\":\"Дискеты\"}},\"parent\":\"j1_2\",\"type\":\"category\"},{\"id\":\"j1_5\",\"text\":\"memory_cards\",\"data\":{\"lang\":{\"en\":\"Memory cards\",\"ru\":\"Карты памяти\"}},\"parent\":\"j1_2\",\"type\":\"category\"},{\"id\":\"j1_8\",\"text\":\"sd\",\"data\":{\"lang\":{\"en\":\"SD / SDHC\",\"ru\":\"SD / SDHC\"}},\"parent\":\"j1_5\",\"type\":\"category\"},{\"id\":\"j1_9\",\"text\":\"microsd\",\"data\":{\"lang\":{\"en\":\"MicroSD\",\"ru\":\"MicroSD\"}},\"parent\":\"j1_5\",\"type\":\"category\"},{\"id\":\"j1_6\",\"text\":\"game_console\",\"data\":{\"lang\":{\"en\":\"Game console\",\"ru\":\"Игровые консоли\"}},\"parent\":\"j1_1\",\"type\":\"category\"},{\"id\":\"j1_7\",\"text\":\"nes\",\"data\":{\"lang\":{\"en\":\"NES\",\"ru\":\"NES\"}},\"parent\":\"j1_6\",\"type\":\"category\"}]"
                            },
                            function(err) {
                                if (err) return callback(err);
                                callback();
                            });
                    },
                    function(callback) {
                        db.collection('warehouse_conf').insert({
                            "conf": "items",
                            "data": "[{\"id\":\"interface\",\"en\":\"Interface\",\"ru\":\"Интерфейс\"},{\"id\":\"color\",\"en\":\"Color\",\"ru\":\"Цвет\"},{\"id\":\"capacity_gb\",\"en\":\"Capacity (GB)\",\"ru\":\"Объем (Гб)\"},{\"id\":\"floppy_size\",\"en\":\"Floppy size\",\"ru\":\"Размер дискеты\"},{\"id\":\"capacity_mb\",\"en\":\"Capacity (MB)\",\"ru\":\"Объем (Мб)\"}]"
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('warehouse_conf').insert({
                            "conf": "collections",
                            "data": "[{\"id\":\"storage\",\"items\":[\"capacity_gb\",\"interface\",\"color\"]},{\"id\":\"storage_floppy\",\"items\":[\"capacity_mb\",\"floppy_size\"]}]"
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('warehouse_conf').insert({
                            "conf": "curs",
                            "data": "[{\"id\":\"rur\",\"exr\":\"1\",\"en\":\"RUR\",\"ru\":\"руб.\"}]"
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('warehouse_conf').insert({
                            "conf": "ship",
                            "data": "[{\"id\":\"ruspost\",\"weight\":\"0.2\",\"amnt\":\"1\",\"price\":\"200\",\"en\":\"Russian Post\",\"ru\":\"Почта России\"},{\"id\":\"pickup_noaddr\",\"weight\":\"0\",\"amnt\":\"0\",\"price\":\"0\",\"en\":\"Pick up\",\"ru\":\"Самовывоз\"}]"
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('warehouse_conf').insert({
                            "conf": "misc",
                            "data": "[{\"id\":\"weight_units\",\"en\":\"kg\",\"ru\":\"кг\"}]"
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('counters').remove({
                            "_id": "warehouse_orders"
                        }, function() {
                            db.collection('counters').insert({
                                "_id": "warehouse_orders",
                                "seq": 0
                            }, function(err) {
                                if (err) return callback(err);
                                callback();
                            });
                        });
                    },
                    function(callback) {
                        db.collection('search_index').insert({
                            "item_id": "54c0f4d30aa0059c22eb5c1e",
                            "sdesc": "Basic refurbished NES Nintendo System with controller, all hook-ups, and a new 72-pin",
                            "slang": "en",
                            "space": "warehouse",
                            "stitle": "Classic NES console",
                            "surl": "/catalog/item/TDS00006",
                            "swords": "basic refurbished nintendo system with controller hook-ups 72-pin classic console nes"
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('search_index').insert({
                            "item_id": "54c0f4d30aa0059c22eb5c1c",
                            "sdesc": "3.5\" double side, high capacity, formatted",
                            "slang": "en",
                            "space": "warehouse",
                            "stitle": "L-Pro 3.5\" BOX (10 pcs)",
                            "surl": "/catalog/item/TDS00004",
                            "swords": "double side high capacity formatted l-pro"
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('search_index').insert({
                            "item_id": "54c0f4d30aa0059c22eb5c1d",
                            "sdesc": "SDHC 32Gb Class 10 SanDisk Ultra SDSDU-032G-U46",
                            "slang": "en",
                            "space": "warehouse",
                            "stitle": "SDHC 32Gb Class 10 SanDisk Ultra",
                            "surl": "/catalog/item/TDS00005",
                            "swords": "sdhc 32gb class sandisk ultra sdsdu-032g-u46"
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('search_index').insert({
                            "swords": "compact cheap stick smart buycompact robust cobra 8gb",
                            "sdesc": "Compact and cheap USB stick by Smart Buy",
                            "stitle": "8Gb Smart Buy Cobra",
                            "slang": "en",
                            "surl": "/catalog/item/TDS00001",
                            "item_id": "54c0f4d30aa0059c22eb5c19",
                            "space": "warehouse"
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('search_index').insert({
                            "item_id": "54c0f4d30aa0059c22eb5c1b",
                            "sdesc": "32Gb Transcend JetFlash 700, TS32GJF700, USB 3.0, Flash USB",
                            "slang": "en",
                            "space": "warehouse",
                            "stitle": "32Gb Transcend JetFlash 700",
                            "surl": "/catalog/item/TDS00003",
                            "swords": "32gb transcend jetflash ts32gjf700 flash"
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('search_index').insert({
                            "swords": "16gb silicon power i-series sp016gbuf2m01v1k flash black",
                            "sdesc": "16Gb Silicon Power I-Series, SP016GBUF2M01V1K, Flash USB, black",
                            "stitle": "16Gb Silicon Power I-Series",
                            "slang": "en",
                            "surl": "/catalog/item/TDS00002",
                            "item_id": "54c0f4d30aa0059c22eb5c1a",
                            "space": "warehouse"
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
                if (!fs.existsSync('../public/files/warehouse')) {
                    fs.copy('../modules/catalog/files/warehouse', '../public/files/warehouse', function(err) {
                        _callback();
                    });
                } else {
                    _callback();
                }
            },
            uninstall: function(_callback) {
                async.series([
                        function(asc) {
                            var collections = ['warehouse', 'warehouse_categories', 'warehouse_conf', 'warehouse_addr', 'warehouse_orders'];
                            async.eachSeries(collections, function(name, e_callback) {
                                db.collection(name).drop(function(err) {
                                    if (err) return e_callback(err);
                                    e_callback();
                                });

                            }, function(err) {
                                if (err) return asc(err);
                                asc();
                            });
                        },
                        function(asc) {
                            if (fs.existsSync('../public/files/warehouse')) {
                                fs.remove('../public/files/warehouse', function(err) {
                                    if (err) return asc(err);
                                    asc();
                                });
                            } else {
                                asc();
                            }
                        }
                    ],
                    function(err) {
                        if (err) return _callback(err);
                        _callback();
                    });

            }
        };
    return is;
};
