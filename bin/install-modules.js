#!/usr/bin/env node

var program = require('commander'),
    async = require('async'),
    config = require('../config'),
    mongoclient = require('mongodb').MongoClient,
    fs = require('fs'),
    modules = ['settings', 'auth', 'cp', 'pages', 'parts', 'user'],
    db;

program
    .version(config.taracotjs)
    .option('-s, --silent', 'Don\'t ask anything (perform silently)')
    .option('-u, --update', 'Update mode (no default values are created)')
    .option('-m, --module [module]', 'Install specified module only')
    .parse(process.argv);

var mongo_url = config.mongo.url,
    finst = function() {
        mongoclient.connect(mongo_url, config.mongo_options, function(err, _db) {
            if (err) {
                console.log("\nCould not connect to the MongoDB. Please check config.js");
                console.log(err);
                process.exit(1);
            }
            console.log("\nConnected to MongoDB");
            db = _db;
            if (program.module) {
                if (!fs.existsSync('../modules/' + program.module) || !fs.lstatSync('../modules/' + program.module).isDirectory()) {
                    console.log("\nModule not found: " + program.module);
                    process.exit(1);
                }
                var installer = require('../modules/' + program.module + '/install')(db, ensure_indexes, config);
                console.log("[*] Installing module: " + installer.name + ' (' + installer.version + ')');
                installer.collections(function(err) {
                    if (err) {
                        console.log("\n[!] Fail: " + err);
                        process.exit(code = 1);
                    }
                    installer.indexes(function(err) {
                        if (err) {
                            console.log("\n[!] Fail: " + err);
                            process.exit(code = 1);
                        }
                        installer.misc(function(err) {
                            if (err) {
                                console.log("\n[!] Fail: " + err);
                                process.exit(code = 1);
                            }
                            if (program.update) {
                                console.log("\nInstallation complete.");
                                process.exit(code = 0);
                            } else {
                                installer.defaults(function(err) {
                                    if (err) {
                                        console.log("\n[!] Fail: " + err);
                                        process.exit(code = 1);
                                    }
                                    console.log("\nInstallation complete.");
                                    process.exit(code = 0);
                                });
                            }
                        });
                    });
                });
            } else {
                fs.readdir('../modules', function(err, files) {
                    if (err) {
                        console.log("\nCould not get modules list");
                        console.log(err);
                        process.exit(1);
                    }
                    var modules_hash = {},
                        inst_arr = [];
                    for (var m in modules) modules_hash[modules[m]] = true;
                    for (var f in files)
                        if (fs.lstatSync('../modules/' + files[f]).isDirectory() && !modules_hash[files[f]]) modules.push(files[f]);
                    for (var md in modules) {
                        var install = require('../modules/' + modules[md] + '/install')(db, ensure_indexes, config);
                        if (install) inst_arr.push(install);
                    }
                    async.eachSeries(inst_arr, function(installer, ase_callback) {
                        console.log("[*] Installing module: " + installer.name + ' (' + installer.version + ')');
                        installer.collections(function(err) {
                            if (err) {
                                console.log("\n[!] Fail: " + err);
                                process.exit(code = 1);
                            }
                            installer.indexes(function(err) {
                                if (err) {
                                    console.log("\n[!] Fail: " + err);
                                    process.exit(code = 1);
                                }
                                installer.misc(function(err) {
                                    if (err) {
                                        console.log("\n[!] Fail: " + err);
                                        process.exit(code = 1);
                                    }
                                    if (program.update) {
                                        ase_callback();
                                    } else {
                                        installer.defaults(function(err) {
                                            if (err) {
                                                console.log("\n[!] Fail: " + err);
                                                process.exit(code = 1);
                                            }
                                            ase_callback();
                                        });
                                    }
                                });
                            });
                        });
                    }, function(err) {
                        console.log("\nInstallation complete.");
                        process.exit(code = 0);
                    });
                });
            }
        });
    };

console.log(" _____                         _     ___ _____ \n" + "|_   _|                       | |   |_  /  ___|\n" + "  | | __ _ _ __ __ _  ___ ___ | |_    | \\ `--. \n" + "  | |/ _` | '__/ _` |/ __/ _ \\| __|   | |`--. \\\n" + "  | | (_| | | | (_| | (_| (_) | |_/\\__/ /\\__/ /\n" + "  \\_/\\__,_|_|  \\__,_|\\___\\___/ \\__\\____/\\____/ \n");
console.log("This script will install modules to your TaracotJS installation.\n");
console.log("A working MongoDB connection is required.");
console.log("Current MongoDB URL: " + mongo_url + "\n");
console.log("Note: you should have been running install-system script before you continue.\n");
if (program.silent) {
    finst();
} else {
    program.confirm('Do you wish to continue? ', function(ok) {
        if (ok) {
            finst();
        } else {
            console.log("\nAborted");
            process.exit(code = 0);
        }
    });
}

/*

 Helper functions

*/

var dummy = function() {};

function generateId(lngth) {
    if (!lngth) {
        lngth = 16;
    }
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < lngth; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function ensure_indexes(col, ia, _opt, ow, callback) {
    var opt = {
        unique: false,
        background: true,
        dropDups: false,
        w: 1
    };
    if (_opt) opt = _opt;
    var _fns = [];
    for (var i = 0; i < ia.length; i++) {
        var i1 = {};
        i1[ia[i]] = 1;
        _fns.push({
            col: col,
            ix: i1
        });
        if (!ow) {
            var i2 = {};
            i2[ia[i]] = -1;
            _fns.push({
                col: col,
                ix: i2
            });
        }
    }
    async.every(_fns, function(fns, _callback) {
        db.collection(fns.col).ensureIndex(fns.ix, function() {
            _callback(true);
        });
    }, function(result) {
        callback();
    });
}
