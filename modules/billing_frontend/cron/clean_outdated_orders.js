var async = require('../../../node_modules/async'),
    mongoclient = require('../../../node_modules/mongodb').MongoClient,
    mongodb,
    config = require('../../../config'),
    billing_frontend_config = require('../config');
if (billing_frontend_config)
    for (var attrname in billing_frontend_config)
        config[attrname] = billing_frontend_config[attrname];
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
    // Remove outdated orders
    function(callback) {
        mongodb.collection('billing_payment').remove({
            order_timestamp: {
                $lt: (Date.now() - config.billing_frontend.order_ttl * 1000)
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
