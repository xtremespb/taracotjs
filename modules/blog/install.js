module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'blog',
            version: '0.5.20',
            collections: function(_callback) {
                // Create collections
                console.log("\nCreating collections for module: " + this.name + ' (version ' + this.version + ")\n");
                async.series([
                    function(callback) {
                        console.log("[+] Collection: blog");
                        db.createCollection('blog', function(err, collection) {
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
                        console.log("[+] Collection: blog_comments");
                        db.createCollection('blog_comments', function(err, collection) {
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
                        console.log("[+] Collection: blog");
                        ensure_indexes('blog', ['post_timestamp'], null, null, function() {
                            ensure_indexes('blog', ['post_moderated', 'post_filtered', 'post_draft', 'post_user_id', 'post_keywords', 'post_area', 'post_lang'], null, true, function() {
                                console.log("[*] Success (blog)");
                                callback();
                            });
                        });
                    },
                    function(callback) {
                        console.log("[+] Collection: blog_comments");
                        ensure_indexes('blog_comments', ['post_id', 'comment_timestamp'], null, true, function() {
                            console.log("[*] Success (blog_comments)");
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
