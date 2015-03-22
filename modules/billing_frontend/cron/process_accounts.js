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
    settings,
    fs = require('fs'),
    moment = require('../../../node_modules/moment'),
    mailer = require('../../../core/mailer'),
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
                    email: db[di].email,
                    locale: db[di].locale || config.locales.avail[0]
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
    },
    // Retrieve site settings
    function(callback) {
        mongodb.collection('settings').find().toArray(function(err, items) {
            if (!err && items && items.length) {
                for (var i in items) {
                    if (!settings[items[i].olng]) settings[items[i].olng] = {};
                    settings[items[i].olng][items[i].oname] = items[i].ovalue;
                }
            }
            callback();
        });
    },
    // Send expiration mails
    function(callback) {
        var mail_expiration_notice_html = (fs.existsSync(path.join(__dirname, '..', 'views') + '/custom_mail_expiration_notice_html.html')) ? gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/custom_mail_expiration_notice_html.html') : gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/mail_expiration_notice_html.html'),
            pt_mail_expiration_notice_item_head_html = (fs.existsSync(path.join(__dirname, '..', 'views') + '/custom_parts_mail_expiration_notice_item_head_html.html')) ? gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/custom_parts_mail_expiration_notice_item_head_html.html') : gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/parts_mail_expiration_notice_item_head_html.html'),
            pt_mail_expiration_notice_item_html = (fs.existsSync(path.join(__dirname, '..', 'views') + '/custom_parts_mail_expiration_notice_html.html')) ? gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/custom_parts_mail_expiration_notice_html.html') : gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/parts_mail_expiration_notice_html.html');
        var domain_items = '',
            hosting_items = '';
        for (var uh in users_hash) {
            var user = users_hash[uh];
            i18nm.setLocale(user.locale);
            moment.locale(user.locale);
            for (var hi in user.hosting)
                hosting_items += pt_mail_expiration_notice_item_html(gaikan, {
                    lang: i18nm,
                    item: user.hosting[hi].account,
                    value: user.hosting[hi].exp
                });
            for (var di in user.domains)
                domain_items += pt_mail_expiration_notice_item_html(gaikan, {
                    lang: i18nm,
                    item: user.hosting[hi].account,
                    value: moment(user.hosting[hi].exp).format('L')
                });
            if (hosting_items)
                hosting_items = pt_mail_expiration_notice_item_head_html(gaikan, {
                    lang: i18nm,
                    items: hosting_items,
                    col1: i18nm.__('mail_hosting_account'),
                    col2: i18nm.__('mail_days_remain'),
                    item_type_text: i18nm.__('mail_hosting_accounts')
                });
            if (domain_items)
                domain_items = pt_mail_expiration_notice_item_head_html(gaikan, {
                    lang: i18nm,
                    items: domain_items,
                    col1: i18nm.__('mail_domain_name'),
                    col2: i18nm.__('expiration_date'),
                    item_type_text: i18nm.__('mail_domain_names')
                });
            var site_title = '';
            if (settings[user.locale]) site_title = settings[user.locale].site_title;
            var subj = i18nm.__('mail_expiration_notification'),
                mail_body = mail_expiration_notice_html(gaikan, {
                    lang: i18nm,
                    subj: subj,
                    hosting_items: hosting_items,
                    domain_items: domain_items,
                    panel_url: config.billing_frontend.customer_panel_url[user.locale]
                });
            mailer.send(user.email, subj, path.join(__dirname, 'views'), 'mail_hosting_add_html', 'mail_hosting_add_txt', mail_data, req);
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