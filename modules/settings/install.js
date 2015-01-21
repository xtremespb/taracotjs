module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'settings',
            version: '0.5.20',
            collections: function(_callback) {
                // Create collections
                console.log("\nCreating collections for module: " + this.name + ' (version ' + this.version + ")\n");
                async.series([
                    function(callback) {
                        console.log("[+] Collection: settings");
                        db.createCollection('settings', function(err, collection) {
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
                        console.log("[+] Collection: counters");
                        db.createCollection('counters', function(err, collection) {
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
                        console.log("[+] Collection: statistics");
                        db.createCollection('statistics', function(err, collection) {
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
                        console.log("[+] Collection: settings");
                        ensure_indexes('settings', ['oname', 'olang'], null, null, function() {
                            console.log("[*] Success (settings)");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] Collection: statistics");
                        ensure_indexes('statistics', ['day'], null, true, function() {
                            console.log("[*] Success (settings)");
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
                        console.log("[+] site_title (en)");
                        db.collection('settings').insert({
                            oname: 'site_title',
                            ovalue: 'Taracot JS',
                            olang: 'en'
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
                        console.log("[+] site_title (ru)");
                        db.collection('settings').insert({
                            oname: 'site_title',
                            ovalue: 'Taracot JS',
                            olang: 'ru'
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
                        console.log("[+] site_keywords (en)");
                        db.collection('settings').insert({
                            oname: 'site_keywords',
                            ovalue: 'taracot, taracotjs, node.js, mongodb, redis, cms, content management system',
                            olang: 'en'
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
                        console.log("[+] site_keywords (ru)");
                        db.collection('settings').insert({
                            oname: 'site_keywords',
                            ovalue: 'taracot, taracotjs, node.js, mongodb, redis, cms, система управления сайтами',
                            olang: 'ru'
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
                        console.log("[+] site_description (en)");
                        db.collection('settings').insert({
                            oname: 'site_description',
                            ovalue: 'TaracotJS is a simple content management system (CMS) written in JavaScript on both client and server sides (using Node). It\'s free, open source and is running on multiple platrforms including Linux, MacOS and Windows. All modern browsers are supported.',
                            olang: 'en'
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
                        console.log("[+] site_description (ru)");
                        db.collection('settings').insert({
                            oname: 'site_description',
                            ovalue: 'TaracotJS - простая система управления сайтами (CMS), написанная на JavaScript и построенная на технологиях Node.JS, MongoDB и Redis.',
                            olang: 'ru'
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
