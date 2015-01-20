module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'pages',
            version: '0.5.20',
            collections: function(_callback) {
                // Create collections
                console.log("\nCreating collections for module: " + this.name + ' (version ' + this.version + ")\n");
                async.series([
                    function(callback) {
                        console.log("[+] Collection: pages");
                        db.createCollection('pages', function(err, collection) {
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
                        console.log("[+] Collection: page_folders");
                        db.createCollection('page_folders', function(err, collection) {
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
                        console.log("[+] Collection: pages");
                        ensure_indexes('pages', ['pfolder', 'pfilename', 'plang', 'ptitle'], null, null, function() {
                            console.log("[*] Success (pages)");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] Collection: pages_folders");
                        ensure_indexes('pages_folders', ['oname'], null, null, function() {
                            console.log("[*] Success (page_folders)");
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
                        console.log("[+] Default page: en");
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
                        console.log("[+] Default page: ru");
                        db.collection('warehouse').insert({
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
                        console.log("[+] page_folders");
                        db.collection('page_folders').insert({
                            oname: 'folders_json',
                            ovalue: '[{"id":"j1_1","text":"/","data":null,"parent":"#","type":"root"}]'
                        }, function(err) {
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
                    console.log("[*] Finished inserting default values");
                    _callback();
                });
            },
            misc: function(_callback) {
                // Other things to do
                _callback();
            }
        };
    return is;
};
