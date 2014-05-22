// Taracot JS
// Content management systems written with Node.js and Express.js

// Load libraries

var express = require('express');
var config = require('./config');
var path = require('path');
var favicon = require('static-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var I18n = require('i18n-2');
var app = express();
var redis = require("redis");
var redis_client = redis.createClient( config.redis.port, config.redis.host, {} );
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var gaikan = require('gaikan');
var cp = require('./modules/cp/cp')(app);
var auth = require('./core/auth')(app);
var renderer = require('./core/renderer');
var mongoclient = require('mongodb').MongoClient;
var mongodb;
var winston = require('winston');

// Logging

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)( config.log.console ),
    new (winston.transports.File)( config.log.file )
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

var _connect_to_mongo_db = function() {
    mongoclient.connect(config.mongo_url, config.mongo_options, function(err, _db) {
      if (!err) {
        _db.on('close', function() {
          app.set('mongodb', undefined);
        });
        app.set('mongodb', _db);
      } else {
        console.log(err);
        app.set('mongodb', undefined);
      }
    });
}
_connect_to_mongo_db();

// Set variables

app.set('config', config);
app.set('express', express);
app.set('cp', cp);
app.set('auth', auth);
app.set('path', path);
app.set('renderer', renderer);
app.set('logger', logger);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.html');
app.engine('html', gaikan);

// Use items

app.use(favicon(favicon(__dirname + '/public/img/favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser(config.cookie_secret));
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

app.use(function(req, res, next) {
    // Check database connection
    if (typeof app.get('mongodb') == 'undefined') {
        var err = new Error(req.i18n.__("database_connection_failed"));
        err.status = 500;
        next(err);
        _connect_to_mongo_db();
        return;
    }
    if (!app.get('redis_connected')) {
        var err = new Error(req.i18n.__("redis_connection_failed"));
        err.status = 500;
        next(err);
        return;
    }
    // Set locales from query and from cookie
    req.i18n.setLocaleFromQuery();
    req.i18n.setLocaleFromCookie();
    req.i18n.setLocaleFromSubdomain();
    // Logging
    logger.info(req.url, { method: req.method, ip: req.ip, ips: req.ips } );
    // Clear auth_redirect if already authorized
    if (req.session.user_id) {
        delete req.session.auth_redirect;
    }        
    next();
});

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
    var _data = { method: req.method, url: req.url, ip: req.ip, ips: req.ips, stack: err.stack };
    if (!config.log.stack || err.status == 404) {
        delete _data.stack;
    }
    logger.error(err.message, _data);
    res.render('error', {
        message: err.message,
        error: err
    });    
});

module.exports = app;