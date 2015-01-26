/*

    Taracot JS
    Content management systems written with Node.js and Express.js
    (c) 2014-2015 Michael A. Matveev
    https://taracot.org

*/

/* Load libraries */

var express = require('express');
var cookieParser = require('cookie-parser');
var config = require('./config');
var fs = require('fs');
var config_auth = require('./config_auth');
var version = require('./version');
config.taracotjs = version.taracotjs;
var path = require('path');
var crypto = require('crypto');
var I18n = require('i18n-2');
var app = express();
var session = require('express-session');
var mongoclient = require('mongodb').MongoClient;
var redis, redis_client, RedisStore, MongoStore;
if (config.redis.active) {
    redis = require("redis");
    redis_client = redis.createClient(config.redis.port, config.redis.host, {
        return_buffers: false
    });
    RedisStore = require('connect-redis')(session);
} else {
    MongoStore = require('connect-mongo')(session);
}
var gaikan = require('gaikan');
var cp = require('./modules/cp/cp')(app);
var auth = require('./core/auth')(app);
var parser = require('./core/parser')(app);
var renderer = require('./core/renderer')(app);
var winston = require('winston');
var captcha = require('./core/' + config.captcha);
var multer = require('multer');
var bodyParser = require('body-parser');
var mailer = require('./core/mailer')(app);

/* Enable trusted proxy */

app.enable('trust proxy');

/* Logging */

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)(config.log.console),
        new(winston.transports.File)(config.log.file)
    ]
});
logger.exitOnError = false;

/* Redis events handler */

app.set('redis_connected', false);

if (redis_client) {
    redis_client.on("connect", function(err) {
        app.set('redis_connected', true);
    });
    redis_client.on("error", function(err) {
        app.set('redis_connected', false);
    });
}

/* Set variables */

app.set('config', config);
app.set('config_auth', config_auth);
app.set('redis_client', redis_client);
app.set('express', express);
app.set('cp', cp);
app.set('auth-core', auth);
app.set('captcha', captcha);
app.set('path', path);
app.set('renderer', renderer);
app.set('logger', logger);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.html');
app.set('mailer', mailer);
app.set('parser', parser);
app.set('session', session);
app.engine('html', gaikan);

/* Use items */

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

app.use(cookieParser(config.cookie.secret));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

/* Load static */

app.use(express.static(path.join(__dirname, 'public')));

if (!app.get('blocks')) {
    app.set('blocks', {});
    app.set('blocks_sync', {});
}

/* Get modules list */

var modules = fs.readdirSync(path.join(__dirname, 'modules/'));
for (var mt in modules)
    if (!fs.lstatSync(path.join(__dirname, 'modules', modules[mt])).isDirectory()) modules.splice(mt);
app.set('modules', modules);

/* Set static */

for (var md in modules) app.use(express.static(path.join(__dirname, 'modules/' + modules[md] + '/public')));

/* Locales */

I18n.expressBind(app, {
    locales: config.locales.avail,
    cookieName: config.cookie.prefix,
    directory: path.join(__dirname, 'core', 'lang'),
    extension: '.js',
    devMode: app.get('config').locales.dev_mode
});

/* Connect Redis or fallback to Mongo */

var _store = new RedisStore({
    client: redis_client,
    prefix: config.redis.prefix
});

if (!redis) _store = new MongoStore({
    url: config.mongo.url,
    auto_reconnect: false
});

app.use(session({
    store: _store,
    httpOnly: false,
    secret: config.session.secret,
    cookie: {
        domain: config.cookie.domain,
        path: config.cookie.path,
        secure: config.cookie.secure,
        maxAge: config.cookie.maxAge
    },
    rolling: config.session.rolling,
    resave: config.session.resave,
    proxy: config.session.proxy,
    saveUninitialized: config.session.saveUninitialized,
    unset: config.session.unset
}));

/* Pre-load functions */

app.use(function(req, res, next) {
    if (typeof app.get('mongodb') == 'undefined' || !app.get('mongodb')) {
        mongoclient.connect(config.mongo.url, config.mongo.options, function(err, _db) {
            if (!err) {
                _db.on('close', function() {
                    app.set('mongodb', false);
                });
                app.set('mongodb', _db);
            } else {
                console.log(err);
                app.set('mongodb', false);
            }
            next();
        });
    } else {
        next();
    }
});

app.use(function(req, res, next) {
    var err;
    /* Check database connection */
    if (typeof app.get('mongodb') == 'undefined' || !app.get('mongodb')) {
        err = new Error(req.i18n.__("database_connection_failed"));
        err.status = 500;
        next(err);
        return;
    }
    if (redis && !app.get('redis_connected')) {
        err = new Error(req.i18n.__("redis_connection_failed"));
        err.status = 500;
        next(err);
        return;
    }
    /* Set locales from query and from cookie */
    if (app.get('config').locales.detect_from_cookie) req.i18n.setLocaleFromCookie();
    if (app.get('config').locales.detect_from_subdomain) req.i18n.setLocaleFromSubdomain();
    if (app.get('config').locales.detect_from_query) req.i18n.setLocaleFromQuery();
    /* Logging */
    logger.info(req.ip + " " + res.statusCode + " " + req.method + ' ' + req.url, {});
    /* Clear auth_redirect if already authorized */
    if (req.session && req.session.auth) {
        delete req.session.auth_redirect;
    }
    next();
});

/* Load settings */

var _timestamp_settings_query = {};

app.use(function(req, res, next) {
    var _lng = req.i18n.getLocale();
    req.session.current_locale = _lng;
    if (_timestamp_settings_query._lng && Date.now() - _timestamp_settings_query._lng <= 60000) {
        next();
        return;
    }
    var find_query = {
        $or: [{
            olang: _lng
        }, {
            olang: ''
        }]
    };
    app.get('mongodb').collection('settings').find(find_query, {}).toArray(function(err, items) {
        if (typeof items != 'undefined' && !err) {
            var settings = {};
            for (var i = 0; i < items.length; i++) {
                settings[items[i].oname] = items[i].ovalue;
                _timestamp_settings_query._lng = Date.now();
            }
            app.set('settings', settings);
            next();
        }
    });
});

/* Get public folders list (to not include into site statistics) */

var public_folder = fs.readdirSync('../public');
var public_folder_dirs = ['/modules/', '/cp/'];
public_folder.forEach(function(file) {
    var stat = fs.statSync('../public/' + file);
    if (stat.isDirectory()) {
        public_folder_dirs.push('/' + file + '/');
    }
});
var public_folders_rx = new RegExp('^(' + public_folder_dirs.join('|') + ')');

/* Update site statistics */

app.use(function(req, res, next) {
    if (req.method == 'GET' && req.url !== '/cp' && !req.url.match(public_folders_rx) && req.url !== '/auth/captcha') {
        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime() / 1000;
        var update = {
            $inc: {
                hits: 1
            }
        };
        if (!req.session || !req.session.statistics_saved || req.session.statistics_saved != today) {
            update.$inc.visitors = 1;
            if (req.session) req.session.statistics_saved = today;
        }
        app.get('mongodb').collection('statistics').update({
            day: today
        }, update, {
            upsert: true
        }, function(err) {
            next();
        });
    } else {
        next();
    }
});

/* Load authorization data */

app.use(function(req, res, next) {
    app.get('auth-core').check(req, function(auth) {
        req.session.auth = auth;
        var __local = false;
        if (app.get('settings') && app.get('settings').site_auth && app.get('settings').site_auth == 'mnd') {
            if (req.method == 'GET' && (!auth || (auth.status && auth.status < 1))) {
                if (req.url.match(/^\/auth/)) __local = true;
                for (var r = 0; r < public_folder_dirs.length; r++) {
                    var _rx = new RegExp('^' + public_folder_dirs[r].replace(/\/$/, ''));
                    if (req.url.match(_rx)) __local = true;
                }
                if (!__local) return res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            }
        }
        __local = false;
        if (app.get('settings') && app.get('settings').site_mode && app.get('settings').site_mode == 'maintenance') {
            if (req.method == 'GET' && (!auth || (auth.status && auth.status < 2))) {
                if (req.url.match(/^\/auth\/cp/)) __local = true;
                if (req.url.match(/^\/maintenance/)) __local = true;
                for (var j = 0; j < public_folder_dirs.length; j++) {
                    var _rx2 = new RegExp('^' + public_folder_dirs[j].replace(/\/$/, ''));
                    if (req.url.match(_rx2)) __local = true;
                }
                if (!__local) return res.redirect(303, "/maintenance");
            }
        }
        return next();
    });
});

/* Load avatar */

app.use(function(req, res, next) {
    if (req.session && req.session.auth) {
        req.session.auth.avatar = '/images/avatars/default.png';
        var afn = crypto.createHash('md5').update(config.salt + '.' + req.session.auth._id).digest('hex');
        if (fs.existsSync(path.join(__dirname, 'public', 'images', 'avatars', afn + '.jpg'))) req.session.auth.avatar = '/images/avatars/' + afn + '.jpg';
    }
    next();
});

/* Load modules and blocks */

for (var mb in modules) {
    var _b, _m, _a, _r = {
            prefix: ''
        },
        _mp = path.join(__dirname, 'modules', modules[mb], '/');
    if (fs.existsSync(_mp + 'routing.js')) _r = require(_mp + 'routing');
    app.set(modules[mb] + '_routing', _r);
    if (fs.existsSync(_mp + 'block.js')) _b = require(_mp + 'block')(app);
    if (_b && _b.data) app.get('blocks')[modules[mb]] = _b.data;
    if (_b && _b.data_sync) app.get('blocks_sync')[modules[mb]] = _b.data_sync;
    if (fs.existsSync(_mp + 'module.js')) _m = require(_mp + 'module')(app);
    if (fs.existsSync(_mp + 'admin.js')) _a = require(_mp + 'admin')(app);
    if (_m && _r.prefix !== undefined) app.use(_r.prefix, _m);
    if (_r.cp_prefix && _a) app.use(_r.cp_prefix, _a);
}

/* Error 404 (not found) */

app.use(function(req, res, next) {
    var err = new Error(req.i18n.__("pagenotfound"));
    err.status = 404;
    next(err);
});

/* Error handler */

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    var _data = {
        method: req.method,
        url: req.url,
        ip: req.ip,
        stack: err.stack,
        statusCode: res.statusCode
    };
    if (!config.log.stack || err.status == 404) delete _data.stack;
    if (!err.message) err.message = "Internal server error";
    if (!err.status) err.status = 500;
    logger.error(err.message, _data);
    if (res.statusCode != 404) console.log("\n" + err.stack + "\n");
    var site_title = 'TaracotJS';
    if (app.get('settings') && app.get('settings').site_title) site_title = app.get('settings').site_title;
    res.render('error', {
        site_title: site_title,
        data: _data,
        err: err
    });
});

module.exports = app;
