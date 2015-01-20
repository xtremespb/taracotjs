#!/usr/bin/env node

var program = require('commander'),
    async = require('async'),
    config = require('../config'),
    mongoclient = require('mongodb').MongoClient,
    db;

program
    .version(config.taracotjs)
    .option('-s, --silent', 'Don\'t ask anything (perform silently)')
    .parse(process.argv);

var mongo_url = config.mongo.url;

async.series([
        function(callback) {
            console.log(" _____                         _     ___ _____ \n" + "|_   _|                       | |   |_  /  ___|\n" + "  | | __ _ _ __ __ _  ___ ___ | |_    | \\ `--. \n" + "  | |/ _` | '__/ _` |/ __/ _ \\| __|   | |`--. \\\n" + "  | | (_| | | | (_| | (_| (_) | |_/\\__/ /\\__/ /\n" + "  \\_/\\__,_|_|  \\__,_|\\___\\___/ \\__\\____/\\____/ \n");
            console.log("This script will install modules to your TaracotJS installation.\n");
            console.log("A working MongoDB connection is required.");
            console.log("Current MongoDB URL: " + mongo_url + "\n");
            console.log("Note: you should have been running install-system script before you continue.\n");
            if (program.silent || program.mongo) return callback();
            program.confirm('Do you wish to continue? ', function(ok) {
                if (ok) {
                    callback();
                } else {
                    console.log("\nAborted");
                    process.exit(code = 0);
                }
            });
        },
        function(callback) {
            mongoclient.connect(mongo_url, config.mongo_options, function(err, _db) {
                if (err) {
                    console.log("\nCould not connect to the MongoDB. Please check config.js");
                    console.log(err);
                    process.exit(1);
                }
                console.log("\nConnected to MongoDB\n");
                db = _db;
                callback();
            });
        },
        function(callback) {
            var test = require('../modules/catalog/install')(db, ensure_indexes, config);
            test.collections(function() {
                test.indexes(function() {
                    test.defaults(function() {
                        callback();
                    });
                });
            });
        }
    ],
    function(err) {
        if (err) {
            console.log("\nInstallation failed");
            console.log(err);
            process.exit(1);
        }
        console.log("\nAll done!");
        process.exit(code = 0);
    }
);

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
