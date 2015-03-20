var async = require('../../../node_modules/async'),
    mongoclient = require('../../../node_modules/mongodb').MongoClient,
    ObjectId = require('../../../node_modules/mongodb').ObjectID,
    mongodb,
    gaikan = require('../../../node_modules/gaikan'),
    config = require('../../../config'),
    billing_frontend_config = require('../config'),
    exp_hosting = [],
    exp_domains = [],
    users_hash = {},
    path = require('path'),
    nodemailer = require('../../../node_modules/nodemailer'),
    sendmailTransport = require('../../../node_modules/nodemailer-sendmail-transport'),
    Entities = require('../../../node_modules/html-entities').AllHtmlEntities,
    i18nm = new(require('../../../node_modules/i18n-2'))({
        locales: config.locales.avail,
        directory: path.join(__dirname, '..', 'lang'),
        extension: '.js',
        devMode: config.locales.dev_mode
    });

if (billing_frontend_config)
    for (var attrname in billing_frontend_config)
        config[attrname] = billing_frontend_config[attrname];

if (config.mailer.transport == 'smtp') transporter = nodemailer.createTransport(config.mailer.smtp);
if (config.mailer.transport == 'sendmail') transporter = nodemailer.createTransport(sendmailTransport(config.mailer.sendmail));

async.series([
    // Connect to the database
    function(callback) {
        mongoclient.connect(config.mongo.url, config.mongo.options, function(err, _db) {
            if (!err && _db) {
                mongodb = _db;
                return callback();
            } else {
                return callback('Could not connect to database');
            }
        });
    },
    // Decrement days for hosting accounts
    function(callback) {
        mongodb.collection('billing_accounts').update({
            btype: 'h',
            bexp: {
                $gt: 0
            }
        }, {
            $inc: {
                bexp: -1
            }
        }, {
            multi: true
        }, function(err, num) {
            if (err) return callback('Cannot decrement hosting account days: ' + err);
            console.log('Hosting accounts updated: ' + num);
            return callback();
        });
    },
    // Get hosting accounts list, where days <= 7
    function(callback) {
        mongodb.collection('billing_accounts').find({
            btype: 'h',
            bexp: {
                $lt: 8
            }
        }).toArray(function(err, db) {
            if (err) return callback('Cannot get expiring hosting accounts: ' + err);
            if (!db || !db.length) return callback();
            for (var di in db)
                if (db[di].bexp > 0)
                    exp_hosting.push({
                        id: db[di].baccount,
                        exp: db[di].bexp,
                        user_id: db[di].buser
                    });
            return callback();
        });
    },
    // Get domain accounts list, where days <= 7
    function(callback) {
        mongodb.collection('billing_accounts').find({
            btype: 'd',
            bexp: {
                $lt: Date.now() + 604800000
            }
        }).toArray(function(err, db) {
            if (err) return callback('Cannot get expiring domain accounts: ' + err);
            if (!db || !db.length) return callback();
            for (var di in db)
                if (db[di].bexp - Date.now() > -604800000)
                    exp_domains.push({
                        id: db[di].baccount + '.' + db[di].bplan,
                        exp: db[di].bexp,
                        user_id: db[di].buser
                    });
            return callback();
        });
    },
    // Generate affected users list
    function(callback) {
        var query_arr = [];
        for (var hi in exp_hosting)
            if (!users_hash[exp_hosting[hi].user_id])
                users_hash[exp_hosting[hi].user_id] = 1;
        for (var di in exp_domains)
            if (!users_hash[exp_domains[di].user_id])
                users_hash[exp_domains[di].user_id] = 1;
        for (var key in users_hash)
            query_arr.push({
                _id: new ObjectId(key),
                status: {
                    $nin: ['0', 0]
                }
            });
        if (!query_arr.length) return callback();
        mongodb.collection('users').find({
            $or: query_arr
        }).toArray(function(err, db) {
            if (err) return callback('Cannot get user accounts list: ' + err);
            if (!db || !db.length) return callback();
            for (var di in db)
                users_hash[db[di]._id.toHexString()] = {
                    username: db[di].username,
                    email: db[di].email
                };
            callback();
        });
    },
    // Add hosting accounts to corresponding user_hash item
    function(callback) {
        for (var hi in exp_hosting) {
            if (!users_hash[exp_hosting[hi].user_id].hosting) users_hash[exp_hosting[hi].user_id].hosting = [];
            users_hash[exp_hosting[hi].user_id].hosting.push({
                account: exp_hosting[hi].id,
                exp: exp_hosting[hi].exp
            });
        }
        callback();
    },
    // Add domains to corresponding user_hash item
    function(callback) {
        for (var hi in exp_domains) {
            if (!users_hash[exp_domains[hi].user_id].domains) users_hash[exp_domains[hi].user_id].domains = [];
            users_hash[exp_domains[hi].user_id].domains.push({
                account: exp_domains[hi].id,
                exp: exp_domains[hi].exp
            });
        }
        callback();
    }
], function(err) {
    if (err) {
        console.log('[ERROR] ' + err);
        return process.exit(1);
    }
    console.log('Script finished');
    process.exit(0);
});
