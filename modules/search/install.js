module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'search',
            version: '0.5.20',
            collections: function(_callback) {
                // Create collections
                console.log("\nCreating collections for module: " + this.name + ' (version ' + this.version + ")\n");
                async.series([
                    function(callback) {
                        console.log("[+] Collection: search_index");
                        db.createCollection('search_index', function(err, collection) {
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
                        console.log("[+] Collection: search_index");
                        ensure_indexes('blog', ['post_timestamp'], null, null, function() {
                            ensure_indexes('search_index', ['swords', 'space', 'item_id'], null, true, function() {
                                console.log("[*] Success (search_index)");
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
                    console.log("[*] Finished creating indexes");
                    _callback();
                });
            },
            defaults: function(_callback) {
                // Create default values
                console.log("\nInserting default values for module: " + this.name + ' (version ' + this.version + ")\n");
                async.series([
                    function(callback) {
                        console.log("[+] settings: blog_mode");
                        db.collection('settings').insert({
                            oname: 'blog_mode',
                            ovalue: 'moderation',
                            olang: ''
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
                        console.log("[+] settings: blog_areas");
                        db.collection('settings').insert({
                            oname: 'blog_areas',
                            ovalue: '[{"id":"test","en":"Test blog area","ru":"Тестовый раздел"}]',
                            olang: ''
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
