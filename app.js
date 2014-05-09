// Taracot JS
// Content management systems written with Node.js and Express.js

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

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.html');
app.engine('html', gaikan);

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
    req.i18n.setLocaleFromQuery();
    req.i18n.setLocaleFromCookie();
    next();
});

// Load modules

config.modules.forEach(function(module) {
    app.use(express.static(path.join(__dirname, 'modules/' + module.name + '/public')));
    app.use(module.prefix, require('./modules/' + module.name + '/module'));
    if (module.cp_prefix.length > 0) {
        app.use(module.cp_prefix, require('./modules/' + module.name + '/admin'));
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