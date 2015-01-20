var crypto = require('crypto');

module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'auth',
            version: '0.5.20',
            collections: function(_callback) {
                // Create collections
                console.log("\nCreating collections for module: " + this.name + ' (version ' + this.version + ")\n");
                async.series([
                    function(callback) {
                        console.log("[+] Collection: users");
                        db.createCollection('users', function(err, collection) {
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
                ensure_indexes('users', ['username', 'email', 'realname', 'status'], null, null, function() {
                    ensure_indexes('users', ['act_code', 'res_code', 'username_auth', 'password', 'username_vk_uid'], null, true, function() {
                        console.log("[*] Success");
                        _callback();
                    });
                });
            },
            defaults: function(_callback) {
                // Create default values
                console.log("\nInserting default value for module: " + this.name + ' (version ' + this.version + ")\n");
                db.collection('users').remove({
                    username: 'admin'
                }, function() {
                    var password_md5 = crypto.createHash('md5').update(config.salt + '.admin').digest('hex');
                    db.collection('users').insert({
                        username: 'admin',
                        username_auth: 'admin',
                        email: 'default@taracot.org',
                        realname: 'Website Administrator',
                        status: 2,
                        regdate: Date.now(),
                        password: password_md5
                    }, function(err) {
                        if (err) {
                            console.log("[!] Failed");
                            console.log(err);
                            process.exit(1);
                        }
                        console.log("[*] Success");
                        _callback();
                    });
                });
            },
            misc: function(_callback) {
                // Other things to do
                _callback();
            }
        };
    return is;
};
