module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
    	fs = require('fs-extra'),
        is = {
            name: 'catalog',
            version: '0.5.20',
            collections: function(_callback) {
                // Create collections
                console.log("\nCreating collections for module: " + this.name + ' (version ' + this.version + ")\n");
                async.series([
                    function(callback) {
                        console.log("[+] Collection: warehouse");
                        db.createCollection('warehouse', function(err, collection) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] Collection: warehouse_categories");
                        db.createCollection('warehouse_categories', function(err, collection) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] Collection: warehouse_conf");
                        db.createCollection('warehouse_conf', function(err, collection) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] Collection: warehouse_addr");
                        db.createCollection('warehouse_addr', function(err, collection) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] Collection: warehouse_orders");
                        db.createCollection('warehouse_orders', function(err, collection) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    }
                ], function(err) {
                    if (err) {
                        console.log("[!] Installation failed");
                        console.log(err);
                        process.exit(1);
                    }
                    console.log("[*] Finished creating collections");
                    _callback();
                });
            },
            indexes: function(_callback) {
                // Create indexes
                console.log("\nCreating indexes for module: " + this.name + ' (version ' + this.version + ")\n");
                async.series([
                    function(callback) {
                        console.log("[+] Collection: warehouse");
                        ensure_indexes('warehouse', ['pfolder', 'pfilename', 'plang', 'ptitle'], null, null, function() {
                            console.log("[*] Success (warehouse)");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] Collection: warehouse_categories");
                        ensure_indexes('warehouse_categories', ['oname'], null, null, function() {
                            console.log("[*] Success (warehouse_categories)");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] Collection: warehouse_conf");
                        ensure_indexes('warehouse_conf', ['conf'], null, null, function() {
                            console.log("[*] Success (warehouse_conf)");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] Collection: warehouse_addr");
                        ensure_indexes('warehouse_addr', ['user_id'], null, true, function() {
                            console.log("[*] Success (warehouse_addr)");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] Collection: warehouse_orders");
                        ensure_indexes('warehouse_orders', ['order_id', 'order_status', 'order_timestamp', 'user_id'], null, null, function() {
                            console.log("[*] Success (warehouse_orders)");
                            callback();
                        });
                    }
                ], function(err) {
                    if (err) {
                        console.log("[!] Installation failed");
                        console.log(err);
                        process.exit(1);
                    }
                    console.log("[*] Finished creating indexes");
                    _callback();
                });
            },
            defaults: function(_callback) {
                // Create default values
                console.log("\nInserting default values for module: " + this.name + ' (version ' + this.version + ")\n");
                async.series([
                    function(callback) {
                        console.log("[+] warehouse: 1/6");
                        db.collection('warehouse').insert({
                            "ptitle": "8Gb Smart Buy Cobra",
                            "pshortdesc": "Compact and cheap USB stick by Smart Buy",
                            "pfilename": "TDS00001",
                            "pcategory": "/storage/usb_flash",
                            "pcategory_id": "j1_3",
                            "plang": "en",
                            "pkeywords": "",
                            "pdesc": "",
                            "pimages": ["58b8d5b8ced7332f435668b15b6eb48a"],
                            "pchars": [{
                                "id": "capacity_gb",
                                "val": 8
                            }, {
                                "id": "interface",
                                "val": "USB 2.0"
                            }, {
                                "id": "color",
                                "val": "red"
                            }],
                            "pcontent": "<p>Compact and robust USB stick.</p>\n",
                            "pamount": 100,
                            "pamount_unlimited": 0,
                            "pprice": 300,
                            "pweight": 0.02,
                            "pcurs": "rur"
                        }, function(err) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] warehouse: 2/6");
                        db.collection('warehouse').insert({
                            "ptitle": "16Gb Silicon Power I-Series",
                            "pshortdesc": "16Gb Silicon Power I-Series, SP016GBUF2M01V1K, Flash USB, black",
                            "pfilename": "TDS00002",
                            "pcategory": "/storage/usb_flash",
                            "pcategory_id": "j1_3",
                            "plang": "en",
                            "pkeywords": "",
                            "pdesc": "",
                            "pimages": ["139312b8960a51f7a601e01c9eb39c71", "a438ec7015acf1da5c13cb649c1afcf0"],
                            "pamount": 50,
                            "pamount_unlimited": 0,
                            "pprice": 700,
                            "pweight": 0.1,
                            "pcurs": "rur",
                            "pcontent": ""
                        }, function(err) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] warehouse: 3/6");
                        db.collection('warehouse').insert({
                            "ptitle": "32Gb Transcend JetFlash 700",
                            "pshortdesc": "32Gb Transcend JetFlash 700, TS32GJF700, USB 3.0, Flash USB",
                            "pfilename": "TDS00003",
                            "pcategory": "/storage/usb_flash",
                            "pcategory_id": "j1_3",
                            "plang": "en",
                            "pkeywords": "",
                            "pdesc": "",
                            "pimages": ["661e84ae052879073ed77cbf720989ad", "c157983ba9c37cde40edf5021517f223", "527fc0f513bc9505c77e2ae4c6656829"],
                            "pamount": 10,
                            "pamount_unlimited": 0,
                            "pprice": 1220,
                            "pweight": 0.04,
                            "pcurs": "rur",
                            "pcontent": ""
                        }, function(err) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] warehouse: 4/6");
                        db.collection('warehouse').insert({
                            "ptitle": "L-Pro 3.5\" BOX (10 pcs)",
                            "pshortdesc": "3.5\" double side, high capacity, formatted",
                            "pfilename": "TDS00004",
                            "pcategory": "/storage/floppy",
                            "pcategory_id": "j1_4",
                            "plang": "en",
                            "pkeywords": "",
                            "pdesc": "",
                            "pimages": ["e686545d51dc3879f85c2a9c9b856568", "1da71e8209a3713ba4eac9f217316193"],
                            "pchars": [{
                                "id": "capacity_mb",
                                "val": 1.44
                            }, {
                                "id": "floppy_size",
                                "val": "3.5&quot;"
                            }],
                            "pcontent": "",
                            "pamount": 5,
                            "pamount_unlimited": 0,
                            "pprice": 280,
                            "pweight": 0.3,
                            "pcurs": "rur"
                        }, function(err) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] warehouse: 5/6");
                        db.collection('warehouse').insert({
                            "ptitle": "SDHC 32Gb Class 10 SanDisk Ultra",
                            "pshortdesc": "SDHC 32Gb Class 10 SanDisk Ultra SDSDU-032G-U46",
                            "pfilename": "TDS00005",
                            "pcategory": "/storage/memory_cards/sd",
                            "pcategory_id": "j1_8",
                            "plang": "en",
                            "pkeywords": "",
                            "pdesc": "",
                            "pimages": ["f437f67242c5b806e7e09c9b1e8de2fc"],
                            "pamount": 5,
                            "pamount_unlimited": 0,
                            "pprice": 1430,
                            "pweight": 0.2,
                            "pcurs": "rur",
                            "pcontent": ""
                        }, function(err) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] warehouse: 6/6");
                        db.collection('warehouse').insert({
                            "ptitle": "Classic NES console",
                            "pshortdesc": "Basic refurbished NES Nintendo System with controller, all hook-ups, and a new 72-pin",
                            "pfilename": "TDS00006",
                            "pcategory": "/game_console/nes",
                            "pcategory_id": "j1_7",
                            "plang": "en",
                            "pkeywords": "",
                            "pdesc": "",
                            "pimages": ["76cdb7a45539a90a9c28556f1351b958"],
                            "pamount": 0,
                            "pamount_unlimited": 0,
                            "pprice": 3000,
                            "pweight": 1.5,
                            "pcurs": "rur",
                            "pcontent": ""
                        }, function(err) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] warehouse_categories");
                        db.collection('warehouse_categories').insert({
                                "oname": "categories_json",
                                "ovalue": "[{\"id\":\"j1_1\",\"text\":\"/\",\"data\":null,\"parent\":\"#\",\"type\":\"root\"},{\"id\":\"j1_2\",\"text\":\"storage\",\"data\":{\"lang\":{\"en\":\"Storage\",\"ru\":\"Накопители\"}},\"parent\":\"j1_1\",\"type\":\"category\"},{\"id\":\"j1_3\",\"text\":\"usb_flash\",\"data\":{\"lang\":{\"en\":\"USB sticks\",\"ru\":\"Флешки\"}},\"parent\":\"j1_2\",\"type\":\"category\"},{\"id\":\"j1_4\",\"text\":\"floppy\",\"data\":{\"lang\":{\"en\":\"Floppy\",\"ru\":\"Дискеты\"}},\"parent\":\"j1_2\",\"type\":\"category\"},{\"id\":\"j1_5\",\"text\":\"memory_cards\",\"data\":{\"lang\":{\"en\":\"Memory cards\",\"ru\":\"Карты памяти\"}},\"parent\":\"j1_2\",\"type\":\"category\"},{\"id\":\"j1_8\",\"text\":\"sd\",\"data\":{\"lang\":{\"en\":\"SD / SDHC\",\"ru\":\"SD / SDHC\"}},\"parent\":\"j1_5\",\"type\":\"category\"},{\"id\":\"j1_9\",\"text\":\"microsd\",\"data\":{\"lang\":{\"en\":\"MicroSD\",\"ru\":\"MicroSD\"}},\"parent\":\"j1_5\",\"type\":\"category\"},{\"id\":\"j1_6\",\"text\":\"game_console\",\"data\":{\"lang\":{\"en\":\"Game console\",\"ru\":\"Игровые консоли\"}},\"parent\":\"j1_1\",\"type\":\"category\"},{\"id\":\"j1_7\",\"text\":\"nes\",\"data\":{\"lang\":{\"en\":\"NES\",\"ru\":\"NES\"}},\"parent\":\"j1_6\",\"type\":\"category\"}]"
                            },
                            function(err) {
                                if (err) {
                                    console.log("[!] Fail");
                                    console.log(err);
                                    process.exit(1);
                                }
                                console.log("[*] Success");
                                callback();
                            });
                    },
                    function(callback) {
                        console.log("[+] warehouse_conf: 1/5");
                        db.collection('warehouse_conf').insert({
                            "conf": "items",
                            "data": "[{\"id\":\"interface\",\"en\":\"Interface\",\"ru\":\"Интерфейс\"},{\"id\":\"color\",\"en\":\"Color\",\"ru\":\"Цвет\"},{\"id\":\"capacity_gb\",\"en\":\"Capacity (GB)\",\"ru\":\"Объем (Гб)\"},{\"id\":\"floppy_size\",\"en\":\"Floppy size\",\"ru\":\"Размер дискеты\"},{\"id\":\"capacity_mb\",\"en\":\"Capacity (MB)\",\"ru\":\"Объем (Мб)\"}]"
                        }, function(err) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] warehouse_conf: 2/5");
                        db.collection('warehouse_conf').insert({
                            "conf": "collections",
                            "data": "[{\"id\":\"storage\",\"items\":[\"capacity_gb\",\"interface\",\"color\"]},{\"id\":\"storage_floppy\",\"items\":[\"capacity_mb\",\"floppy_size\"]}]"
                        }, function(err) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] warehouse_conf: 3/5");
                        db.collection('warehouse_conf').insert({
                            "conf": "curs",
                            "data": "[{\"id\":\"rur\",\"exr\":\"1\",\"en\":\"RUR\",\"ru\":\"руб.\"}]"
                        }, function(err) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] warehouse_conf: 4/5");
                        db.collection('warehouse_conf').insert({
                            "conf": "ship",
                            "data": "[{\"id\":\"ruspost\",\"weight\":\"0.2\",\"amnt\":\"1\",\"price\":\"200\",\"en\":\"Russian Post\",\"ru\":\"Почта России\"},{\"id\":\"pickup_noaddr\",\"weight\":\"0\",\"amnt\":\"0\",\"price\":\"0\",\"en\":\"Pick up\",\"ru\":\"Самовывоз\"}]"
                        }, function(err) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] warehouse_conf: 5/5");
                        db.collection('warehouse_conf').insert({
                            "conf": "misc",
                            "data": "[{\"id\":\"weight_units\",\"en\":\"kg\",\"ru\":\"кг\"}]"
                        }, function(err) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] counters: warehouse_orders");
                        db.collection('counters').remove({
                            "_id": "warehouse_orders"
                        }, function() {
                            db.collection('counters').insert({
                                "_id": "warehouse_orders",
                                "seq": 0
                            }, function(err) {
                                if (err) {
                                    console.log("[!] Fail");
                                    console.log(err);
                                    process.exit(1);
                                }
                                console.log("[*] Success");
                                callback();
                            });
                        });
                    }
                ], function(err) {
                    if (err) {
                        console.log("[!] Installation failed");
                        console.log(err);
                        process.exit(1);
                    }
                    console.log("[*] Finished inserting default values");
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
            }
        };
    return is;
};
