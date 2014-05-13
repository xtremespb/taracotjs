// Taracot JS
// Content management systems written with Node.js and Express.js

// Load libraries

var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('./config');
var I18n = require('i18n-2');
var app = express();
var redis = require("redis");
var redis_client = redis.createClient();
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var gaikan = require('gaikan');
var cp = require('./modules/cp/cp')(app);
var auth = require('./core/auth');
var renderer = require('./core/renderer');
var mongoclient = require('mongodb').MongoClient;
var mongodb; 

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
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.html');
app.engine('html', gaikan);

// Use items

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser(config.cookie_secret));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ store: new RedisStore( { client: redis_client, prefix: config.session_prefix } ), secret: config.session_secret }))

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
    // Set locales from query and from cookie
    req.i18n.setLocaleFromQuery();
    req.i18n.setLocaleFromCookie();
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
    if (app.get('env') === 'development') {
        res.render('error', {
            message: err.message,
            error: err
        });
    } else {
        res.render('error', {
            message: err.message,
            error: {}
        });
    }
});

module.exports = app;