var program = require('commander');
var async = require('async');
var crypto = require('crypto');
var config = require('../config');
var mongoclient = require('mongodb').MongoClient;
var db;

program
  .version(config.taracotjs)
  .option('-m, --mongo [url]', 'Specify MongoDB connect URL')
  .parse(process.argv);

var mongo_url = program.mongo || config.mongo.url;

async.series([
		function (callback) {
			console.log(" _____                         _     ___ _____ \n" + "|_   _|                       | |   |_  /  ___|\n" + "  | | __ _ _ __ __ _  ___ ___ | |_    | \\ `--. \n" + "  | |/ _` | '__/ _` |/ __/ _ \\| __|   | |`--. \\\n" + "  | | (_| | | | (_| | (_| (_) | |_/\\__/ /\\__/ /\n" + "  \\_/\\__,_|_|  \\__,_|\\___\\___/ \\__\\____/\\____/ \n");
			console.log("This script will create a rescue account for your system.\n");
			console.log("Database connection is required.");
			console.log("Current MongoDB URL: " + mongo_url + "\n");
			program.confirm('Continue? ', function(ok){
				if (ok) {
					callback();
				} else {
					console.log("\n\nAborted");
					process.exit(code = 0);
				}
			});
		},
		function (callback) {
			mongoclient.connect(mongo_url, config.mongo_options, function (err, _db) {
				if (err) {
					console.log("\nCould not connect to the MongoDB. Please check config.js");
					console.log(err);
					process.exit(1);
				}
				console.log("\nConnected to MongoDB");
				db = _db;
				callback();
			});
		},
		function (callback) {
			db.collection('users').remove( { username : 'rescue' }, function () {
				callback();
			});
		},
		function (callback) {
			console.log("\nCreating rescue account\n");
			var md5 = crypto.createHash('md5');
			var password_md5 = md5.update(config.salt + '.rescue').digest('hex');
			db.collection('users').insert({
					username: 'rescue',
					username_auth: 'rescue',
					email: 'rescue@taracot.org',
					realname: 'System Rescue',
					status: 2,
					password: password_md5
				}, function (err) {
					if (err) {
						console.log("... failed");
						console.log(err);
						process.exit(1);
					}
					console.log("... success");
					callback();
				});
		}
	],
	function (err) {
		if (err) {
			console.log("\nRescue script failed");
			console.log(err);
			process.exit(1);
		}
		console.log("\nFinished");
		process.exit(code = 0);
	}
);