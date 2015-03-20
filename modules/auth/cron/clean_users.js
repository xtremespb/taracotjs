var user_ttl = 604800; // Time before an outdated user gets removed - 7 days by default

var async = require('../../../node_modules/async'),
    mongoclient = require('../../../node_modules/mongodb').MongoClient,
    mongodb,
    config = require('../../../config');

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
    // Remove outdated users (e-mail unverified and status = 0)
    function(callback) {
        mongodb.collection('users').remove({
            regdate: {
                $lt: (Date.now() - user_ttl * 1000)
            },
            act_code: {
                $ne: null
            }
        }, function(err, num) {
        	if (err) return callback('Cannot remove entries from database: ' + err);
        	console.log('Entries removed: ' + num);
        	return callback();
        });
    }
], function(err) {
    if (err) {
        console.log('[ERROR] ' + err);
        return process.exit(1);
    }
    console.log('Script finished');
    process.exit(0);
});
