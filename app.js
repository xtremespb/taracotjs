// Taracot JS
// Content management systems written with Node.js and Express.js

// Load libraries

var express = require('express');
var config = require('./config');
var version = require('./version');
var load_modules = require('./load_modules');
config.taracotjs = version.taracotjs;
config.blocks = load_modules.blocks;
config.modules = load_modules.modules;
var path = require('path');
var cookieParser = require('cookie-parser');
var I18n = require('i18n-2');
var app = express();
var redis = require("redis");
var redis_client = redis.createClient(config.redis.port, config.redis.host, {});
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var gaikan = require('gaikan');
var cp = require('./modules/cp/cp')(app);
var auth = require('./core/auth')(app);
var renderer = require('./core/renderer')(app);
var mongoclient = require('mongodb').MongoClient;
var winston = require('winston');
var captcha = require('./core/' + config.captcha);
var multer = require('multer');
var bodyParser = require('body-parser');
var async = require('async');

// Logging

var logger = new(winston.Logger)({
	transports: [
		new(winston.transports.Console)(config.log.console),
		new(winston.transports.File)(config.log.file)
	]
});
logger.exitOnError = false;

// Redis events handler

app.set('redis_connected', false);

redis_client.on("connect", function(err) {
	app.set('redis_connected', true);
});
redis_client.on("error", function(err) {
	app.set('redis_connected', false);
});

// Connect to the database and set the corresponding variable

var _connect_to_mongo_db = function(callback) {
	if (typeof app.get('mongodb') == 'undefined') {
		mongoclient.connect(config.mongo.url, config.mongo.options, function(err, _db) {
			if (!err) {
				_db.on('close', function() {
					app.set('mongodb', undefined);
				});
				app.set('mongodb', _db);
			} else {
				console.log(err);
				app.set('mongodb', undefined);
			}
			if (callback) callback();
		});
	} else {
		if (callback) callback();
	}
};

// Set variables

app.set('config', config);
app.set('express', express);
app.set('cp', cp);
app.set('auth-core', auth);
app.set('captcha', captcha);
app.set('path', path);
app.set('renderer', renderer);
app.set('logger', logger);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.html');
app.engine('html', gaikan);

// Use items

app.use(multer({
	dest: config.dir.tmp + '/',
	rename: function(fieldname, filename) {
		return Date.now() + '_' + filename.replace(/\W+/g, '-').toLowerCase();
	},
	onError: function(error, next) {
		console.log(error);
		next(error);
	}
}));

app.use(cookieParser(config.cookie_secret));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
	store: new RedisStore({
		client: redis_client,
		prefix: config.redis.prefix
	}),
	secret: config.session_secret
}));

// Locales

I18n.expressBind(app, {
	locales: config.locales,
	cookieName: 'taracotjs-locale',
	directory: path.join(__dirname, 'core', 'lang'),
	extension: '.js'
});

// Pre-load functions

app.use(function(req, res, next) {
	_connect_to_mongo_db(function() {
		var err;
		// Check database connection
		if (typeof app.get('mongodb') == 'undefined') {
			err = new Error(req.i18n.__("database_connection_failed"));
			err.status = 500;
			next(err);
			return;
		}
		if (!app.get('redis_connected')) {
			err = new Error(req.i18n.__("redis_connection_failed"));
			err.status = 500;
			next(err);
			return;
		}
		// Load blocks
		load_blocks(req, res);
		// Set locales from query and from cookie
		req.i18n.setLocaleFromQuery();
		req.i18n.setLocaleFromCookie();
		req.i18n.setLocaleFromSubdomain();
		// Logging
		logger.info(req.ip + " " + res.statusCode + " " + req.method + ' ' + req.url, {});
		// Clear auth_redirect if already authorized
		if (req.session.auth) {
			delete req.session.auth_redirect;
		}
		next();
	});
});

// Load settings

var _timestamp_settings_query = Date.now() - 60000;

app.use(function(req, res, next) {
	if (Date.now() - _timestamp_settings_query <= 60000) {
		next();
		return;
	}
	var find_query = {
		$or: [{
			olang: req.i18n.getLocale()
		}, {
			olang: ''
		}]
	};
	app.get('mongodb').collection('settings').find(find_query, {}).toArray(function(err, items) {
		if (typeof items != 'undefined' && !err) {
			var settings = {};
			for (var i = 0; i < items.length; i++) {
				settings[items[i].oname] = items[i].ovalue;
				_timestamp_settings_query = Date.now();
			}
			app.set('settings', settings);
			next();
		}
	});
});

// Load authorization data

app.use(function(req, res, next) {
	if (!req.session.auth_check_timestamp) {
		req.session.auth_check_timestamp = Date.now();
		next();
		return;
	}
	if (Date.now() - req.session.auth_check_timestamp >= 10000) {
		req.session.auth_check_timestamp = Date.now();
		app.get('auth-core').check(req, function(auth) {
			if (!auth) {
				delete req.session.auth;
			} else {
				if (auth != req.session.auth) {
					req.session.auth = auth;
				}
			}
			next();
		});
	} else {
		next();
	}
});

// Load blocks

var load_blocks = function(req, res) {
	if (!app.get('blocks')) {
		var blocks = {
			data: {}
		};
		app.set('blocks', blocks);
	}
	config.blocks.forEach(function(block) {
		async.series([

			function(callback) {
				require('./modules/' + block.name + '/block')(app).data(req, res, function() {
					callback();
				});
			}
		]);
	});
};

// Load modules

config.modules.forEach(function(module) {
	app.use(express.static(path.join(__dirname, 'modules/' + module.name + '/public')));
	app.use(module.prefix, require('./modules/' + module.name + '/module')(app));
	if (module.cp_prefix.length > 0) {
		app.use(module.cp_prefix, require('./modules/' + module.name + '/admin')(app));
	}
});

// Error 404 (not found)

app.use(function(req, res, next) {
	var err = new Error(req.i18n.__("pagenotfound"));
	err.status = 404;
	next(err);
});

// Error handler

app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	var _data = {
		method: req.method,
		url: req.url,
		ip: req.ip,
		ips: req.ips,
		stack: err.stack
	};
	if (!config.log.stack || err.status == 404) {
		delete _data.stack;
	}
	logger.error(req.ip + " " + res.statusCode + " " + req.method + ' ' + req.url + ' ' + err.message, {});
	console.log("\n" + err.stack + "\n");
	res.render('error', {
		message: err.message,
		error: err
	});
});

module.exports = app;
