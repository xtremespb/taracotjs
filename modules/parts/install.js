module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'parts',
            version: '0.5.20',
            collections: function(_callback) {
                // Create collections
                console.log("\nCreating collections for module: " + this.name + ' (version ' + this.version + ")\n");
                async.series([
                    function(callback) {
                        console.log("[+] Collection: parts");
                        db.createCollection('parts', function(err, collection) {
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
                        console.log("[+] Collection: parts");
                        ensure_indexes('parts', ['pname', 'plang'], null, true, function() {
                            console.log("[*] Success (parts)");
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
                        console.log("[+] parts (en)");
                        db.collection('parts').insert({
                            pname: 'test',
                            plang: 'en',
                            pvalue: 'Just a test example'
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
                        console.log("[+] parts (ru)");
                        db.collection('parts').insert({
                            pname: 'test',
                            plang: 'ru',
                            pvalue: 'Тестовый элемент'
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
