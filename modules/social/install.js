module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'social',
            version: '0.5.20',
            collections: function(_callback) {
                // Create collections
                console.log("\nCreating collections for module: " + this.name + ' (version ' + this.version + ")\n");
                async.series([
                    function(callback) {
                        console.log("[+] Collection: social_friends");
                        db.createCollection('social_friends', function(err, collection) {
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
                        console.log("[+] Collection: social_conversations");
                        db.createCollection('social_conversations', function(err, collection) {
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
                        console.log("[+] Collection: social_messages");
                        db.createCollection('social_messages', function(err, collection) {
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
                        console.log("[+] Collection: social_friends");
                        ensure_indexes('social_friends', ['u1', 'u2', 'friends'], null, true, function() {
                            console.log("[*] Success (social_friends)");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] Collection: social_conversations");
                        ensure_indexes('social_conversations', ['u1', 'u2'], null, true, function() {
                            console.log("[*] Success (social_conversations)");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] Collection: social_messages");
                        ensure_indexes('social_messages', ['last_tstamp'], null, null, function() {
                            console.log("[*] Success (social_messages)");
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
                _callback();
            },
            misc: function(_callback) {
                // Other things to do
                _callback();
            }
        };
    return is;
};
