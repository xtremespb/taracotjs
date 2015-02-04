var program = require('commander'),
    async = require('async'),
    crypto = require('crypto'),
    config = require('../config'),
    mongoclient = require('mongodb').MongoClient,
    fs = require('fs'),
    db;

program
    .version(config.taracotjs)
    .option('-m, --mongo [url]', 'Specify MongoDB connect URL')
    .option('-r, --redishost [host]', 'Specify Redis host')
    .option('-j, --redisport [port]', 'Specify Redis port')
    .option('-p, --port [port]', 'Specify TaracotJS server port')
    .option('-i, --uid [uid]', 'Set user ID')
    .option('-g, --gid [gid]', 'Set group ID')
    .option('-s, --silent', 'Don\'t ask anything (perform silently)')
    .parse(process.argv);

var mongo_url = program.mongo || config.mongo.url,
    redis_host = program.redishost || config.redis.host,
    redis_port = program.redisport || config.redis.port,
    port = program.port || config.port,
    uid = program.uid || config.uid,
    gid = program.gid || config.gid;

async.series([
        function(callback) {
            console.log("This script will guide you with TaracotJS basic installation steps.\n");
            console.log("A working MongoDB connection is required.");
            console.log("Current MongoDB URL: " + mongo_url + "\n");
            if (program.silent || program.mongo) return callback();
            program.confirm('Do you wish to specify MongoDB connection parameters? ', function(ok) {
                if (ok) {
                    var mongo_host = 'localhost',
                        mongo_user = '',
                        mongo_pass = '',
                        mongo_db = 'taracotjs';
                    program.prompt('\nHost [localhost]: ', function(_mongo_host) {
                        if (_mongo_host) mongo_host = _mongo_host;
                        program.prompt('\nUsername [none]: ', function(_mongo_user) {
                            if (_mongo_user) mongo_user = _mongo_user;
                            program.prompt('\nPassword [none]: ', function(_mongo_pass) {
                                if (_mongo_pass) mongo_pass = _mongo_pass;
                                program.prompt('\nDatabase [taracotjs]: ', function(_mongo_db) {
                                    if (_mongo_db) mongo_db = _mongo_db;
                                    mongo_url = 'mongodb://';
                                    if (mongo_user) mongo_url += mongo_user;
                                    if (mongo_user && mongo_pass) mongo_url += ':' + mongo_pass;
                                    if (mongo_user) mongo_url += '@';
                                    if (mongo_host) mongo_url += mongo_host;
                                    if (mongo_db) mongo_url += '/' + mongo_db;
                                    console.log("\nMongoDB URL is now: " + mongo_url + "\n");
                                    return callback();
                                });
                            });
                        });
                    });
                } else {
                    callback();
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
                console.log("\nSuccessfully connected to MongoDB!\n");
                db = _db;
                callback();
            });
        },
        function(callback) {
            if (program.silent || program.redishost || program.redisport) return callback();
            program.confirm('Do you wish to specify Redis host and port? ', function(ok) {
                if (ok) {
                    var set_redis_host = 'localhost',
                        set_redis_port = '6379';
                    program.prompt('\nHost [localhost]: ', function(_redis_host) {
                        if (_redis_host) set_redis_host = _redis_host;
                        program.prompt('\nPort [6379]: ', function(_redis_port) {
                            if (_redis_port) set_redis_port = _redis_port;
                            redis_host = set_redis_host;
                            redis_port = set_redis_port;
                            console.log("\nRedis host is now: " + redis_host + ", Redis port is now: " + redis_port + "\n");
                            return callback();
                        });
                    });
                } else {
                    callback();
                }
            });
        },
        function(callback) {
            if (program.silent || program.port) return callback();
            program.confirm('Do you wish to specify TaracotJS internal server port? ', function(ok) {
                if (ok) {
                    var set_port = '3000';
                    program.prompt('\nPort [3000]: ', function(_port) {
                        if (_port) set_port = _port;
                        port = set_port;
                        console.log("\nTaracotJS internal server port is now: " + port + "\n");
                        return callback();
                    });
                } else {
                    callback();
                }
            });
        },
        function(callback) {
            if (program.silent || program.uid || program.gid) return callback();
            program.confirm('Do you wish to specify UID and GID? ', function(ok) {
                if (ok) {
                    var set_uid = '',
                        set_gid = '';
                    program.prompt('\nUID [none]: ', function(_uid) {
                        if (_uid) set_uid = _uid;
                        program.prompt('\nGID [none]: ', function(_gid) {
                            if (_gid) set_gid = _gid;
                            uid = set_uid;
                            gid = set_gid;
                            console.log("\nUID/GID are now set: " + uid + "/" + gid + "\n");
                            return callback();
                        });
                    });
                } else {
                    callback();
                }
            });
        },
        function(callback) {
            if (mongo_url != config.mongo.url || redis_host != config.redis.host || redis_port != config.redis.port || port != config.port || gid != config.gid || uid != config.uid) {
                config.mongo.url = mongo_url;
                config.redis.host = redis_host;
                config.redis.port = redis_port;
                config.port = port;
                config.uid = uid;
                config.gid = gid;
                console.log("Saving changes to config.js file\n");
                fs.writeFile('../config.js', 'var config = ' + JSON.stringify(config, null, "\t") + ";\n\nmodule.exports = config;", function(err) {
                    if (err) {
                        console.log("\nCould not save config.js file. Check your permissions");
                        console.log(err);
                        process.exit(1);
                    }
                    console.log("... success\n");
                    callback();
                });
            } else {
                callback();
            }
        },
        function(callback) {
            if (program.silent) return callback();
            program.confirm('Installation script can generate random secrets and salt. Continue? ', function(ok) {
                if (ok) {
                    config.cookie.secret = generateId(32);
                    config.session.secret = generateId(32);
                    config.salt = generateId(64);
                    fs.writeFile('../config.js', 'var config = ' + JSON.stringify(config, null, "\t") + ";\n\nmodule.exports = config;", function(err) {
                        if (err) {
                            console.log("\nCould not save config.js file. Check your permissions");
                            console.log(err);
                            process.exit(1);
                        }
                        console.log("... success");
                        callback();
                    });
                } else {
                    console.log("\nNote: it's important to set your own secrets for security purposes!");
                    callback();
                }
            });
        }
    ],
    function(err) {
        if (err) {
            console.log("\nInstallation failed");
            console.log(err);
            process.exit(1);
        }
        console.log("\nFinished");
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
