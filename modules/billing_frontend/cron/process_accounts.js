var path = require('path'),
	async = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'async')),
    mongoclient = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'mongodb')).MongoClient,
    ObjectId = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'mongodb')).ObjectID,
    mongodb,
    gaikan = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'gaikan')),
    config = require(path.join(__dirname, '..', '..', '..', 'config')),
    billing_frontend_config,
    exp_hosting = [],
    exp_domains = [],
    users_hash = {},
    path = require('path'),
    settings = {},
    fs = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'fs-extra')),
    moment = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'moment')),
    winston = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'winston')),
    nodemailer = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'nodemailer')),
    sendmailTransport = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'nodemailer-sendmail-transport')),
    transporter,
    hosting_api,
    Entities = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'html-entities')).AllHtmlEntities,
    entities = new Entities(),
    Entities = require(path.join(__dirname, '..', '..', '..', 'node_modules', 'html-entities')).AllHtmlEntities,
    i18nm = new(require(path.join(__dirname, '..', '..', '..', 'node_modules', 'i18n-2')))({
        locales: config.locales.avail,
        directory: path.join(__dirname, '..', 'lang'),
        extension: '.js',
        devMode: config.locales.dev_mode
    }),
    mail_html = (fs.existsSync(path.join(__dirname, '..', '..', '..', 'views') + '/custom_mail.html')) ? gaikan.compileFromFile(path.join(__dirname, '..', '..', '..', 'views') + '/custom_mail.html') : gaikan.compileFromFile(path.join(__dirname, '..', '..', '..', 'views') + '/mail.html'),
    mail_expiration_notice_html = (fs.existsSync(path.join(__dirname, '..', 'views') + '/custom_mail_expiration_notice_html.html')) ? gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/custom_mail_expiration_notice_html.html') : gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/mail_expiration_notice_html.html'),
    pt_mail_expiration_notice_item_head_html = (fs.existsSync(path.join(__dirname, '..', 'views') + '/custom_parts_mail_expiration_notice_item_head_html.html')) ? gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/custom_parts_mail_expiration_notice_item_head_html.html') : gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/parts_mail_expiration_notice_item_head_html.html'),
    pt_mail_expiration_notice_item_html = (fs.existsSync(path.join(__dirname, '..', 'views') + '/custom_parts_mail_expiration_notice_item_html.html')) ? gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/custom_parts_mail_expiration_notice_item_html.html') : gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/parts_mail_expiration_notice_item_html.html'),
    mail_expiration_notice_txt = (fs.existsSync(path.join(__dirname, '..', 'views') + '/custom_mail_expiration_notice_txt.html')) ? gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/custom_mail_expiration_notice_txt.html') : gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/mail_expiration_notice_txt.html'),
    pt_mail_expiration_notice_item_head_txt = (fs.existsSync(path.join(__dirname, '..', 'views') + '/custom_parts_mail_expiration_notice_item_head_txt.html')) ? gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/custom_parts_mail_expiration_notice_item_head_txt.html') : gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/parts_mail_expiration_notice_item_head_txt.html'),
    pt_mail_expiration_notice_item_txt = (fs.existsSync(path.join(__dirname, '..', 'views') + '/custom_mail_expiration_notice_txt.html')) ? gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/custom_mail_expiration_notice_txt.html') : gaikan.compileFromFile(path.join(__dirname, '..', 'views') + '/mail_expiration_notice_txt.html');

if (fs.existsSync(path.join(__dirname, '..', 'config.js'))) billing_frontend_config = require(path.join(__dirname, '..', 'config'));
if (fs.existsSync(path.join(__dirname, '..', 'dist_config.js'))) billing_frontend_config = require(path.join(__dirname, '..', 'dist_config'));

if (billing_frontend_config)
    for (var attrname in billing_frontend_config)
        config[attrname] = billing_frontend_config[attrname];

hosting_api = require('../api/' + config.billing_frontend.hosting_api)(config);

if (config.mailer.transport == 'smtp') transporter = nodemailer.createTransport(config.mailer.smtp);
if (config.mailer.transport == 'sendmail') transporter = nodemailer.createTransport(sendmailTransport(config.mailer.sendmail));

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)(config.billing_frontend.log.console),
        new(winston.transports.File)(config.billing_frontend.log.file)
    ]
});

logger.exitOnError = false;

logger.info("Starting...");

async.series([
        // Connect to the database
        function(callback) {
            logger.info("Connecting to the database...");
            mongoclient.connect(config.mongo.url, config.mongo.options, function(err, _db) {
                if (!err && _db) {
                    mongodb = _db;
                    return callback();
                } else {
                    return callback('Could not connect to database');
                }
            });
        },
        // Disable user accounts
        function(callback) {
            logger.info("Disabling outdated user accounts...");
            mongodb.collection('billing_accounts').find({
                bexp: 1,
                btype: 'h'
            }).toArray(function(err, db) {
                if (err) return callback('Cannot get hosting account list to disable: ' + err);
                if (db && db.length) {
                    async.eachSeries(db, function(dbi, ae_callback) {
                        logger.info("Disabling " + dbi.baccount);
                        hosting_api.user_action(dbi.baccount, 'suspend', function(res) {
                            if (res.status != 1) {
                                logger.error("Cannot disable " + dbi.baccount + ", status=" + res.status + ", body=" + res.body);
                            }
                            ae_callback();
                        });
                    }, function(err) {
                        return callback();
                    });
                } else {
                    return callback();
                }
            });
        },
        // Decrement days for hosting accounts
        function(callback) {
            logger.info("Decrementing days hosting accounts in billing_accounts...");
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
                logger.info('Hosting accounts updated: ' + num);
                return callback();
            });
        },
        // Get hosting accounts list, where days <= 7
        function(callback) {
            logger.info("Getting list of hosting accounts, where remaining days is less than 7...");
            mongodb.collection('billing_accounts').find({
                btype: 'h',
                bexp: {
                    $lt: 8
                }
            }).toArray(function(err, db) {
                if (err) return callback('Cannot get expiring hosting accounts: ' + err);
                if (!db || !db.length) return callback();
                logger.info("Got records: " + db.length);
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
            logger.info("Getting list of domains, where remaining days is less than 7...");
            mongodb.collection('billing_accounts').find({
                btype: 'd',
                bexp: {
                    $lt: Date.now() + 604800000
                }
            }).toArray(function(err, db) {
                if (err) return callback('Cannot get expiring domain accounts: ' + err);
                if (!db || !db.length) return callback();
                logger.info("Got records: " + db.length);
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
            logger.info("Generating users list...");
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
            logger.info("Generating hash table, adding hosting accounts...");
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
            logger.info("Generating hash table, adding domains...");
            for (var di in exp_domains) {
                if (!users_hash[exp_domains[di].user_id].domains) users_hash[exp_domains[di].user_id].domains = [];
                users_hash[exp_domains[di].user_id].domains.push({
                    account: exp_domains[di].id,
                    exp: exp_domains[di].exp
                });
            }
            callback();
        },
        // Retrieve site settings
        function(callback) {
            logger.info("Retrieving site settings...");
            mongodb.collection('settings').find().toArray(function(err, items) {
                if (!err && items && items.length) {
                    for (var i in items) {
                        if (!settings[items[i].olang]) settings[items[i].olang] = {};
                        settings[items[i].olang][items[i].oname] = items[i].ovalue;
                    }
                }
                callback();
            });
        },
        // Send expiration mails
        function(callback) {
            logger.info("Sending e-mails...");
            async.eachSeries(Object.keys(users_hash), function(uh, ae_callback) {
                var domain_items = '',
                    hosting_items = '',
                    domain_items_txt = '',
                    hosting_items_txt = '';
                var user = users_hash[uh];
                i18nm.setLocale(user.locale);
                moment.locale(user.locale);
                for (var hi in user.hosting) {
                    hosting_items += pt_mail_expiration_notice_item_html(gaikan, {
                        lang: i18nm,
                        item: user.hosting[hi].account,
                        amount: user.hosting[hi].exp
                    });
                    hosting_items_txt += pt_mail_expiration_notice_item_txt(gaikan, {
                        lang: i18nm,
                        item: user.hosting[hi].account,
                        amount: user.hosting[hi].exp
                    });
                }
                for (var di in user.domains) {
                    domain_items += pt_mail_expiration_notice_item_html(gaikan, {
                        lang: i18nm,
                        item: user.domains[di].account,
                        amount: moment(user.domains[di].exp).format('L')
                    });
                    domain_items_txt += pt_mail_expiration_notice_item_txt(gaikan, {
                        lang: i18nm,
                        item: user.domains[di].account,
                        amount: moment(user.domains[di].exp).format('L')
                    });
                }
                if (hosting_items) {
                    hosting_items = pt_mail_expiration_notice_item_head_html(gaikan, {
                        lang: i18nm,
                        items: hosting_items,
                        col1: i18nm.__('mail_hosting_account'),
                        col2: i18nm.__('mail_days_remain'),
                        item_type_text: i18nm.__('mail_hosting_accounts')
                    });
                    hosting_items_txt = pt_mail_expiration_notice_item_head_txt(gaikan, {
                        lang: i18nm,
                        items: hosting_items,
                        col1: i18nm.__('mail_hosting_account'),
                        col2: i18nm.__('mail_days_remain'),
                        item_type_text: i18nm.__('mail_hosting_accounts')
                    });
                }
                if (domain_items) {
                    domain_items = pt_mail_expiration_notice_item_head_html(gaikan, {
                        lang: i18nm,
                        items: domain_items,
                        col1: i18nm.__('mail_domain_name'),
                        col2: i18nm.__('expiration_date'),
                        item_type_text: i18nm.__('mail_domain_names')
                    });
                    domain_items_txt = pt_mail_expiration_notice_item_head_txt(gaikan, {
                        lang: i18nm,
                        items: domain_items,
                        col1: i18nm.__('mail_domain_name'),
                        col2: i18nm.__('expiration_date'),
                        item_type_text: i18nm.__('mail_domain_names')
                    });
                }
                var site_title = '';
                if (settings[user.locale]) site_title = settings[user.locale].site_title;
                var subj = i18nm.__('mail_expiration_notification'),
                    mail_data = {
                        lang: i18nm,
                        subj: subj,
                        hosting_items: hosting_items,
                        domain_items: domain_items,
                        panel_url: config.billing_frontend.customer_panel_url[user.locale],
                        site_title: site_title
                    },
                    mail_data_txt = {
                        lang: i18nm,
                        subj: subj,
                        hosting_items: hosting_items_txt,
                        domain_items: domain_items_txt,
                        panel_url: config.billing_frontend.customer_panel_url[user.locale],
                        site_title: site_title
                    },
                    mail_body_html = mail_expiration_notice_html(gaikan, mail_data),
                    mail_body_text = mail_expiration_notice_txt(gaikan, mail_data),
                    mail_tpl_data = {
                        title: subj,
                        site_url: config.billing_frontend.site_url,
                        message: mail_body_html
                    },
                    mail_composed_html = mail_html(gaikan, mail_tpl_data),
                    mailOptions = {
                        from: config.mailer.sender,
                        to: user.email,
                        subject: subj + ' (' + site_title + ')',
                        text: mail_body_text,
                        html: entities.encodeNonASCII(mail_composed_html)
                    };
                if (transporter) {
                    transporter.sendMail(mailOptions, function(error, info) {
                        if (error) return ae_callback(error);
                        logger.info("Sent mail to: " + user.email);
                        return ae_callback();
                    });
                } else {
                    return ae_callback('No mail transporter defined');
                }
            }, function(err) {
                return callback(err);
            });
        }
    ],
    function(err, callback) {
        if (err) {
            logger.error('[ERROR] ' + err);
            return process.exit(1);
        }
        logger.info('Script finished');
        return process.exit(0);
    });
