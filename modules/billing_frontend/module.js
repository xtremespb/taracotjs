var countries = ["AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BA", "BW", "BV", "BR", "IO", "BN", "BG", "BF", "BI", "KH", "CM", "CA", "CV", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MK", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "AN", "NC", "NZ", "NI", "NE", "NG", "NU", "NF", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "SO", "ZA", "GS", "ES", "LK", "SD", "SR", "SJ", "SZ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU", "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW"],
    profile_fields = ["n1e", "n2e", "n3e", "country", "city", "state", "postcode", "addr", "birth_date", "private", "phone", "fax", "email", "n1r", "n2r", "n3r", "passport", "addr_ru", "org_r", "org", "code", "kpp"],
    profile_validation = {
        'n1e': new RegExp(/^[A-Za-z\-]{1,30}$/),
        'n2e': new RegExp(/^[A-Za-z\-]{1,30}$/),
        'n3e': new RegExp(/^[A-Z]{1}$/),
        'n1r': new RegExp(/^[А-Яа-я\-]{1,19}$/),
        'n2r': new RegExp(/^[А-Яа-я\-]{1,19}$/),
        'n3r': new RegExp(/^[А-Яа-я\-]{1,24}$/),
        'passport': new RegExp(/^([0-9]{2})(\s)([0-9]{2})(\s)([0-9]{6})(\s)(.*)([0-9]{2})(\.)([0-9]{2})(\.)([0-9]{4})$/),
        'addr_ru': new RegExp(/^([0-9]{6}),(\s)(.*)$/),
        'email': new RegExp(/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/),
        'phone': new RegExp(/^(\+)([0-9]{1,5})(\s)([0-9]{1,6})(\s)([0-9]{1,10})$/),
        'fax': new RegExp(/^(\+)([0-9]{1,5})(\s)([0-9]{1,6})(\s)([0-9]{1,10})$/),
        'postcode': new RegExp(/^([0-9]{5,6})$/),
        'city': new RegExp(/^([A-Za-z\-\. ]{2,64})$/),
        'state': new RegExp(/^([A-Za-z\-\. ]{2,40})$/),
        'addr': new RegExp(/^(.{2,80})$/),
        'org_r': new RegExp(/^(.{1,80})$/),
        'org': new RegExp(/^(.{1,80})$/),
        'code': new RegExp(/^([0-9]{10})$/),
        'kpp': new RegExp(/^([0-9]{9})$/)
    },
    profile_validation_org = {
        'org_r': 1,
        'code': 1,
        'kpp': 1
    },
    profile_validation_ru = {
        'n1r': 1,
        'n2r': 1,
        'n3r': 1,
        'passport': 1,
        'addr_ru': 1
    };

module.exports = function(app) {

    var router = app.get('express').Router(),
        path = require('path'),
        async = require('async'),
        renderer = app.get('renderer'),
        moment = require('moment'),
        mailer = app.get('mailer'),
        logger = app.get('logger'),
        config = app.get('config'),
        ObjectId = require('mongodb').ObjectID,
        i18nm = new(require('i18n-2'))({
            locales: config.locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: config.locales.dev_mode
        });

    // Load configuration and API
    var billing_frontend_config = require('./config');
    if (billing_frontend_config)
        for (var attrname in billing_frontend_config) {
            config[attrname] = billing_frontend_config[attrname];
        }
    var billing_api, whois_api, domain_api;
    if (config.billing_frontend && config.billing_frontend.hosting_api) billing_api = require('./api/' + config.billing_frontend.hosting_api)(config);
    if (config.billing_frontend && config.billing_frontend.domain_api) domain_api = require('./api/' + config.billing_frontend.domain_api)(app);
    whois_api = require('./api/' + config.billing_frontend.whois_api)(app);
    var payment_systems = config.billing_frontend.payment_api.replace(/\s/gm, '').split(/,/);
    for (var ps in payment_systems) {
        var _m = require(path.join(__dirname, 'api', payment_systems[ps]))(app);
        if (_m) app.use('/customer/' + payment_systems[ps] + '/', _m);
    }
    // Routing
    router.get('/', function(req, res) {
        if (!req.session.auth || req.session.auth.status < 1) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/customer';
            res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        i18nm.setLocale(req.session.current_locale);
        app.get('mongodb').collection('billing_conf').find({
            $or: [{
                conf: 'hosting'
            }, {
                conf: 'domains'
            }, {
                conf: 'misc'
            }, {
                conf: 'payment'
            }]
        }).toArray(function(err, db) {
            var hosting = [],
                domains = [],
                payment = [],
                misc = [];
            if (!err && db && db.length) {
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'hosting' && db[i].data)
                        try {
                            hosting = JSON.parse(db[i].data);
                        } catch (ex) {}
                    if (db[i].conf == 'domains' && db[i].data)
                        try {
                            domains = JSON.parse(db[i].data);
                        } catch (ex) {}
                    if (db[i].conf == 'payment' && db[i].data)
                        try {
                            payment = JSON.parse(db[i].data);
                        } catch (ex) {}
                    if (db[i].conf == 'misc' && db[i].data)
                        try {
                            misc = JSON.parse(db[i].data);
                        } catch (ex) {}
                }
            }
            app.get('mongodb').collection('billing_accounts').find({
                buser: new ObjectId(req.session.auth._id)
            }).toArray(function(err, accounts) {
                if (!accounts || !accounts.length) accounts = [];
                app.get('mongodb').collection('billing_transactions').find({
                    user_id: req.session.auth._id
                }).sort({
                    trans_timestamp: -1
                }).limit(50).toArray(function(err, transactions) {
                    if (!transactions || !transactions.length) transactions = [];
                    var country_list = [];
                    for (var c in countries) {
                        var _i = {};
                        _i[countries[c]] = i18nm.__('country_list')[c];
                        country_list.push(_i);
                    }
                    var data = {
                        title: i18nm.__('module_name'),
                        page_title: i18nm.__('module_name'),
                        keywords: '',
                        description: '',
                        extra_css: '<link rel="stylesheet" href="/modules/billing_frontend/css/main.css" type="text/css">'
                    };
                    var render = renderer.render_file(path.join(__dirname, 'views'), 'billing_frontend', {
                        lang: i18nm,
                        hosting: JSON.stringify(hosting),
                        domains: JSON.stringify(domains),
                        accounts: JSON.stringify(accounts),
                        payment: JSON.stringify(payment),
                        misc: JSON.stringify(misc),
                        funds: req.session.auth.billing_funds || 0,
                        profile_data: JSON.stringify(req.session.auth.profile_data || {}),
                        transactions: JSON.stringify(transactions),
                        current_locale: req.session.current_locale,
                        country_list: JSON.stringify(country_list),
                        default_ns0: config.billing_frontend.default_ns0,
                        default_ns1: config.billing_frontend.default_ns1,
                        default_ns0_ip: config.billing_frontend.default_ns0_ip,
                        default_ns1_ip: config.billing_frontend.default_ns1_ip,
                        data: data
                    }, req);
                    data.content = render;
                    app.get('mongodb').collection('users').update({
                        _id: new ObjectId(req.session.auth._id)
                    }, {
                        $set: {
                            locale: req.session.current_locale
                        }
                    }, function() {
                        app.get('renderer').render(res, undefined, data, req);
                    });
                });
            });
        });
    });

    router.post('/ajax/save/profile', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var profile_data = req.body.profile_data,
            profile_update = {};
        if (!profile_data) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_request");
            return res.send(JSON.stringify(rep));
        }
        for (var pf in profile_fields) {
            var fid = profile_fields[pf],
                val = profile_data[profile_fields[pf]],
                _f = 0;
            if (val)
                val = val.replace(/\"/g, '&quot;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace(/\t/g, ' ').replace(/[\n\r]/g, ' ');
            // Validate RU/SU-related fields
            if (profile_validation_ru[fid]) {
                _f = 1;
                if (profile_data.n1r || profile_data.n2r || profile_data.n3r || profile_data.passport || profile_data.addr_ru) {
                    if (val && val.match(profile_validation[fid])) {
                        profile_update[fid] = val;
                    } else {
                        rep.status = 0;
                        rep.err_msg = i18nm.__("form_data_incorrect");
                        rep.err_field = profile_fields[pf];
                        return res.send(JSON.stringify(rep));
                    }
                }
            }
            // Validate organziation (RU/SU-related) fields
            if (profile_validation_org[fid]) {
                _f = 1;
                if (profile_data.org_r || profile_data.code || profile_data.kpp) {
                    if (val && val.match(profile_validation[fid])) {
                        profile_update[fid] = val;
                    } else {
                        rep.status = 0;
                        rep.err_msg = i18nm.__("form_data_incorrect");
                        rep.err_field = profile_fields[pf];
                        return res.send(JSON.stringify(rep));
                    }
                }
            }
            // Convert birth date
            if (fid == 'birth_date') {
                _f = 1;
                val = moment(val, 'DD.MM.YYYY').format('DD.MM.YYYY');
                if (val != 'Invalid date') {
                    profile_update[fid] = val;
                } else {
                    rep.status = 0;
                    rep.err_msg = i18nm.__("form_data_incorrect");
                    rep.err_field = profile_fields[pf];
                    return res.send(JSON.stringify(rep));
                }
            }
            // Organization
            if (fid == 'org') {
                _f = 1;
                if (val || profile_data.org_r)
                    if (val.match(profile_validation[fid])) {
                        profile_update[fid] = val;
                    } else {
                        rep.status = 0;
                        rep.err_msg = i18nm.__("form_data_incorrect");
                        rep.err_field = profile_fields[pf];
                        return res.send(JSON.stringify(rep));
                    }
            }
            // Fax
            if (fid == 'fax') {
                _f = 1;
                if (val)
                    if (val.match(profile_validation[fid])) {
                        profile_update[fid] = val;
                    } else {
                        rep.status = 0;
                        rep.err_msg = i18nm.__("form_data_incorrect");
                        rep.err_field = profile_fields[pf];
                        return res.send(JSON.stringify(rep));
                    }
            }
            // Private
            if (fid == 'private') {
                _f1 = 1;
                profile_update.private = 0;
                if (profile_data.private == '1') profile_update.private = 1;
            }
            // Validate other fields
            if (!_f) {
                if (!val || !val.match(profile_validation[fid])) {
                    rep.status = 0;
                    rep.err_msg = i18nm.__("form_data_incorrect");
                    rep.err_field = profile_fields[pf];
                    return res.send(JSON.stringify(rep));
                } else {
                    profile_update[fid] = val;
                }
            }
        }
        var update = {
            $set: {
                profile_data: profile_update
            }
        };
        app.get('mongodb').collection('users').update({
            _id: new ObjectId(req.session.auth._id)
        }, update, {
            safe: false,
            upsert: true
        }, function(err, result) {
            if (err) {
                rep.status = 0;
                rep.err_msg = i18nm.__("database_error");
                return res.send(JSON.stringify(rep));
            }
            res.send(JSON.stringify(rep));
        });
    });

    router.post('/ajax/create/hosting', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
                status: 1
            },
            baccount = req.body.baccount,
            bplan = req.body.bplan,
            bpwd = req.body.bpwd,
            bexp_add = parseInt(req.body.bexp_add);
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        // Validate fields
        if (!baccount || typeof baccount != 'string' || !baccount.match(/^[A-Za-z0-9_\-]{3,12}$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("form_data_incorrect");
            rep.err_field = 'dh_username';
            return res.send(JSON.stringify(rep));
        }
        baccount = baccount.toLowerCase();
        if (!bpwd || typeof bpwd != 'string' || bpwd.length < 8 || bpwd.length > 80) {
            rep.status = 0;
            rep.err_msg = i18nm.__("form_data_incorrect");
            rep.err_field = 'dh_password';
            return res.send(JSON.stringify(rep));
        }
        if (!bexp_add || bexp_add.isNaN || bexp_add < 0) {
            rep.status = 0;
            rep.err_msg = i18nm.__("form_data_incorrect");
            rep.err_field = 'dh_months';
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('billing_conf').find({
            $or: [{
                conf: 'hosting'
            }]
        }).toArray(function(err, db) {
            var hosting = [];
            if (!err && db && db.length)
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'hosting' && db[i].data)
                        try {
                            hosting = JSON.parse(db[i].data);
                        } catch (ex) {}
                }

            var _bplan, _bcost;
            for (var hi in hosting)
                if (hosting[hi].id == bplan) {
                    _bplan = hosting[hi].id;
                    _bcost = hosting[hi].price;
                }
            if (!_bplan) {
                rep.status = 0;
                rep.err_msg = i18nm.__("form_data_incorrect");
                rep.err_field = 'dh_plan';
                return res.send(JSON.stringify(rep));
            }
            app.get('mongodb').collection('billing_accounts').find({
                baccount: baccount,
                btype: 'h'
            }).toArray(function(err, accounts) {
                if (err || (accounts && accounts.length)) {
                    rep.status = 0;
                    rep.err_msg = i18nm.__("hosting_account_exists");
                    rep.err_field = 'dh_username';
                    return res.send(JSON.stringify(rep));
                }
                // Validation is finished
                var account_data = {
                    funds: 0,
                    account: baccount,
                    plan: bplan,
                    days: bexp_add * 30,
                    cost: -(bexp_add * _bcost)
                };
                async.series([
                    function(callback) {
                        // Check funds
                        app.get('mongodb').collection('users').find({
                            _id: new ObjectId(req.session.auth._id)
                        }).toArray(function(err, users) {
                            if (!users || !users.length || !users[0].billing_funds || users[0].billing_funds < bexp_add * _bcost) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("insufficient_funds");
                                rep.err_field = 'dh_username';
                                return callback(true); // Error
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Checking if user not exists in system
                        billing_api.user_exists(baccount, function(api_res) {
                            if (api_res.status == -1) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("ajax_failed");
                                rep.err_field = 'dh_username';
                                return callback('[BILLING] Request to hosting control panel failed. User ID: ' + req.session.auth._id + ', error: ' + api_res.error + ', response: ' + api_res.body);
                            }
                            if (api_res.status == 1) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("hosting_account_exists");
                                rep.err_field = 'dh_username';
                                return callback(true); // Error
                            }
                            return callback();
                        });
                    },
                    function(callback) {
                        // Trying to create an user in hosting cotnrol panel
                        billing_api.user_create(baccount, bpwd, bplan, function(api_res) {
                            if (api_res.status == -1) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("ajax_failed");
                                rep.err_field = 'dh_username';
                                return callback('[BILLING] Request to hosting control panel failed. User ID: ' + req.session.auth._id + ', error: ' + api_res.error + ', response: ' + api_res.body);
                            }
                            if (api_res.status == 3) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("password_not_allowed");
                                rep.err_field = 'dh_password';
                                return callback(true); // Error
                            }
                            if (api_res.status == 2) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("hosting_manager_failure");
                                rep.err_field = 'dh_username';
                                return callback('[BILLING] Hosting manager failure. User ID: ' + req.session.auth._id + ', error: ' + api_res.error + ', response: ' + api_res.body);
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Creating a record in billing_accounts
                        app.get('mongodb').collection('billing_accounts').insert({
                            btype: 'h',
                            buser: new ObjectId(req.session.auth._id),
                            buser_save: req.session.auth.username,
                            baccount: baccount,
                            bplan: bplan,
                            bexp: account_data.days
                        }, function(err) {
                            if (err) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                return callback('[BILLING] Insert into billing_accounts failed. User ID: ' + req.session.auth._id + ', account: ' + baccount + ', error: ' + err);
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Decreasung funds
                        app.get('mongodb').collection('users').update({
                            _id: new ObjectId(req.session.auth._id)
                        }, {
                            $inc: {
                                billing_funds: -(bexp_add * _bcost)
                            }
                        }, function(err, result) {
                            if (err) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                return callback('[BILLING] Decreasing funds failed. User ID: ' + req.session.auth._id + ', error: ' + err);
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Checking funds after decrease
                        app.get('mongodb').collection('users').find({
                            _id: new ObjectId(req.session.auth._id)
                        }).toArray(function(err, users) {
                            if (!users || !users.length) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                rep.err_field = 'dh_username';
                                return callback('[BILLING] Checking funds failed. User ID: ' + req.session.auth._id + ', error: ' + err);
                            }
                            account_data.funds = users[0].billing_funds;
                            callback();
                        });
                    },
                    function(callback) {
                        // Adding log record
                        app.get('mongodb').collection('billing_transactions').insert({
                            trans_type: 'hosting_reg',
                            trans_obj: baccount,
                            trans_timestamp: Date.now(),
                            trans_sum: -(bexp_add * _bcost),
                            user_id: req.session.auth._id
                        }, function(err) {
                            if (err) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                return callback('[BILLING] Insert into billing_transactions failed: ' + req.session.auth._id + ', error: ' + err);
                            }
                            callback();
                        });
                    }
                ], function(err) {
                    if (err && typeof err == 'string') logger.log('error', err);
                    if (!err) {
                        rep.account = account_data;
                        var mail_data = {
                            lang: i18nm,
                            site_title: app.get('settings').site_title,
                            username: baccount,
                            password: bpwd,
                            panel_url: config.billing_frontend.hosting_panel_url,
                            days: bexp_add * 30,
                            subj: i18nm.__('mail_hosting_add')
                        };
                        mailer.send(req.session.auth.email, mail_data.subj + ' (' + app.get('settings').site_title + ')', path.join(__dirname, 'views'), 'mail_hosting_add_html', 'mail_hosting_add_txt', mail_data, req);
                    }
                    res.send(JSON.stringify(rep));
                    return;
                });
            });
        });
    });

    router.post('/ajax/prolong/hosting', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
                status: 1
            },
            baccount = req.body.baccount,
            bexp_add = parseInt(req.body.bexp_add);
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        // Validate fields
        if (!baccount || typeof baccount != 'string' || !baccount.match(/^[A-Za-z0-9_\-]{3,12}$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("form_data_incorrect");
            rep.err_field = 'dh_username';
            return res.send(JSON.stringify(rep));
        }
        baccount = baccount.toLowerCase();
        if (!bexp_add || bexp_add.isNaN || bexp_add < 0) {
            rep.status = 0;
            rep.err_msg = i18nm.__("form_data_incorrect");
            rep.err_field = 'dh_months';
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('billing_accounts').find({
            baccount: baccount,
            btype: 'h',
            buser: new ObjectId(req.session.auth._id)
        }).toArray(function(err, accounts) {
            if (err || !accounts || !accounts.length || accounts[0].buser != req.session.auth._id) {
                rep.status = 0;
                rep.err_msg = i18nm.__("hosting_account_doesnt_exists");
                return res.send(JSON.stringify(rep));
            }
            var bplan = accounts[0].bplan;
            // Validation is finished
            var account = accounts[0];
            app.get('mongodb').collection('billing_conf').find({
                $or: [{
                    conf: 'hosting'
                }]
            }).toArray(function(err, db) {
                var hosting = [];
                if (!err && db && db.length)
                    for (var i = 0; i < db.length; i++) {
                        if (db[i].conf == 'hosting' && db[i].data)
                            try {
                                hosting = JSON.parse(db[i].data);
                            } catch (ex) {}
                    }
                var _bplan, _bcost;
                for (var hi in hosting)
                    if (hosting[hi].id == bplan) {
                        _bplan = hosting[hi].id;
                        _bcost = hosting[hi].price;
                    }
                if (!_bplan) {
                    rep.status = 0;
                    rep.err_msg = i18nm.__("form_data_incorrect");
                    rep.err_field = 'dh_plan';
                    return res.send(JSON.stringify(rep));
                }
                var account_data = {
                    funds: 0,
                    account: baccount,
                    plan: bplan,
                    days: bexp_add * 30,
                    cost: -(bexp_add * _bcost)
                };
                async.series([
                    function(callback) {
                        // Check funds
                        app.get('mongodb').collection('users').find({
                            _id: new ObjectId(req.session.auth._id)
                        }).toArray(function(err, users) {
                            if (!users || !users.length || !users[0].billing_funds || users[0].billing_funds < bexp_add * _bcost) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("insufficient_funds");
                                rep.err_field = 'dh_username';
                                return callback(true); // Error
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Checking if user exists in system
                        billing_api.user_exists(baccount, function(api_res) {
                            if (api_res.status == -1) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("ajax_failed");
                                rep.err_field = 'dh_username';
                                return callback('[BILLING] Request to hosting control panel failed. User ID: ' + req.session.auth._id + ', error: ' + api_res.error + ', response: ' + api_res.body);
                            }
                            if (api_res.status != 1) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("hosting_account_doesnt_exists");
                                rep.err_field = 'dh_username';
                                return callback(true); // Error
                            }
                            return callback();
                        });
                    },
                    function(callback) {
                        // Trying to turn on the user in hosting cotnrol panel
                        billing_api.user_action(baccount, 'resume', function(api_res) {
                            if (api_res.status == -1) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("ajax_failed");
                                rep.err_field = 'dh_username';
                                return callback('[BILLING] Request to hosting control panel failed. User ID: ' + req.session.auth._id + ', error: ' + api_res.error + ', response: ' + api_res.body);
                            }
                            if (api_res.status == 2) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("hosting_manager_failure");
                                rep.err_field = 'dh_username';
                                return callback('[BILLING] Hosting manager failure. User ID: ' + req.session.auth._id + ', error: ' + api_res.error + ', response: ' + api_res.body);
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Update the record in billing_accounts
                        app.get('mongodb').collection('billing_accounts').update({
                            btype: 'h',
                            baccount: baccount
                        }, {
                            $inc: {
                                bexp: bexp_add * 30
                            }
                        }, function(err) {
                            if (err) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                return callback('[BILLING] Insert into billing_accounts failed. User ID: ' + req.session.auth._id + ', account: ' + baccount + ', error: ' + err);
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Decreasung funds
                        app.get('mongodb').collection('users').update({
                            _id: new ObjectId(req.session.auth._id)
                        }, {
                            $inc: {
                                billing_funds: -(bexp_add * _bcost)
                            }
                        }, function(err, result) {
                            if (err) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                return callback('[BILLING] Decreasing funds failed. User ID: ' + req.session.auth._id + ', error: ' + err);
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Checking funds after decrement
                        app.get('mongodb').collection('users').find({
                            _id: new ObjectId(req.session.auth._id)
                        }).toArray(function(err, users) {
                            if (!users || !users.length) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                rep.err_field = 'dh_username';
                                return callback('[BILLING] Checking funds failed. User ID: ' + req.session.auth._id + ', error: ' + err);
                            }
                            account_data.funds = users[0].billing_funds;
                            callback();
                        });
                    },
                    function(callback) {
                        // Checking days after increment
                        app.get('mongodb').collection('billing_accounts').find({
                            btype: 'h',
                            baccount: baccount
                        }).toArray(function(err, accounts) {
                            if (!accounts || !accounts.length) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                rep.err_field = 'dh_username';
                                return callback('[BILLING] Checking billing account failed. User ID: ' + req.session.auth._id + ', error: ' + err);
                            }
                            account_data.days = accounts[0].bexp;
                            callback();
                        });
                    },
                    function(callback) {
                        // Adding log record
                        app.get('mongodb').collection('billing_transactions').insert({
                            trans_type: 'hosting_up',
                            trans_obj: baccount,
                            trans_timestamp: Date.now(),
                            trans_sum: -(bexp_add * _bcost),
                            user_id: req.session.auth._id
                        }, function(err) {
                            if (err) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                return callback('[BILLING] Insert into billing_transactions failed: ' + req.session.auth._id + ', error: ' + err);
                            }
                            callback();
                        });
                    }
                ], function(err) {
                    if (err && typeof err == 'string') logger.log('error', err);
                    if (!err) {
                        rep.account = account_data;
                        var mail_data = {
                            lang: i18nm,
                            site_title: app.get('settings').site_title,
                            username: baccount,
                            panel_url: config.billing_frontend.hosting_panel_url,
                            days: bexp_add * 30,
                            subj: i18nm.__('mail_hosting_up')
                        };
                        mailer.send(req.session.auth.email, mail_data.subj + ' (' + app.get('settings').site_title + ')', path.join(__dirname, 'views'), 'mail_hosting_up_html', 'mail_hosting_up_txt', mail_data, req);
                    }
                    res.send(JSON.stringify(rep));
                    return;
                });
            });
        });
    });

    router.post('/ajax/create/domain', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
                status: 1
            },
            baccount = req.body.baccount,
            bplan = req.body.bplan,
            bns0 = req.body.bns0 || '',
            bns1 = req.body.bns1 || '',
            bns0_ip = req.body.bns0_ip || '',
            bns1_ip = req.body.bns1_ip || '';
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        // Validate fields
        if (!baccount || typeof baccount != 'string' || !baccount.match(/^[a-z0-9\-]{2,63}$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("form_data_incorrect");
            rep.err_field = 'dd_username';
            return res.send(JSON.stringify(rep));
        }
        baccount = baccount.toLowerCase();
        if (!bns0 || typeof bns0 != 'string' || !bns0.match(/^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_nameserver");
            rep.err_field = 'dd_ns0';
            return res.send(JSON.stringify(rep));
        }
        if (!bns1 || typeof bns1 != 'string' || !bns1.match(/^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_nameserver");
            rep.err_field = 'dd_ns1';
            return res.send(JSON.stringify(rep));
        }
        if (bns0_ip && (typeof bns0_ip != 'string' || !bns0_ip.match(/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/))) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_nameserver_ip");
            rep.err_field = 'dd_ns0_ip';
            return res.send(JSON.stringify(rep));
        }
        if (bns1_ip && (typeof bns1_ip != 'string' || !bns1_ip.match(/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/))) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_nameserver_ip");
            rep.err_field = 'dd_ns0_ip';
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('billing_conf').find({
            $or: [{
                conf: 'domains'
            }]
        }).toArray(function(err, db) {
            var domains = [];
            if (!err && db && db.length)
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'domains' && db[i].data)
                        try {
                            domains = JSON.parse(db[i].data);
                        } catch (ex) {}
                }

            var _bplan, _bcost;
            for (var hi in domains)
                if (domains[hi].id == bplan) {
                    _bplan = domains[hi].id;
                    _bcost = domains[hi].reg;
                }
            if (!_bplan) {
                rep.status = 0;
                rep.err_msg = i18nm.__("form_data_incorrect");
                rep.err_field = 'dd_plan';
                return res.send(JSON.stringify(rep));
            }
            app.get('mongodb').collection('billing_accounts').find({
                baccount: baccount,
                bplan: bplan,
                btype: 'd'
            }).toArray(function(err, accounts) {
                if (err || (accounts && accounts.length)) {
                    rep.status = 0;
                    rep.err_msg = i18nm.__("domain_exists");
                    rep.err_field = 'dd_username';
                    return res.send(JSON.stringify(rep));
                }
                // Validation is finished
                var account_data = {
                        funds: 0,
                        account: baccount,
                        plan: bplan,
                        days: moment().add(1, 'year').unix() * 1000,
                        cost: -_bcost
                    },
                    profile_data = {};
                async.series([
                    function(callback) {
                        // Check funds
                        app.get('mongodb').collection('users').find({
                            _id: new ObjectId(req.session.auth._id)
                        }).toArray(function(err, users) {
                            if (!users || !users.length || !users[0].billing_funds || users[0].billing_funds < _bcost) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("insufficient_funds");
                                rep.err_field = 'dd_username';
                                return callback(true); // Error
                            }
                            if (!users || !users.length || !users[0].profile_data) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("profile_missing");
                                rep.err_field = 'dd_username';
                                return callback(true); // Error
                            }
                            profile_data = users[0].profile_data;
                            if (!profile_data.n1e || ((bplan == 'ru' || bplan == 'su') && !profile_data.n1r)) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("profile_missing");
                                rep.err_field = 'dd_username';
                                return callback(true); // Error
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Checking if domain not registered (via WHOIS API)
                        whois_api.query(baccount + '.' + bplan, function(err, data) {
                            if (data != 1 && !config.billing_frontend.ignore_whois_errors) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("domain_already_registered");
                                rep.err_field = 'dd_username';
                                return callback(true); // Error
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Trying to register domain name at registrator
                        var data = {
                            ns0: bns0,
                            ns1: bns1,
                            ns0_ip: bns0_ip,
                            ns1_ip: bns1_ip,
                            profile: profile_data
                        };
                        domain_api.register_domain(baccount, bplan, data, req, function(api_data) {
                            if (api_data.status != 1) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("domain_registration_error");
                                return callback('[BILLING] Request to domain registration API failed. User ID: ' + req.session.auth._id + ', account: ' + baccount + ', error: ' + JSON.stringify(api_data.body));
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Creating a record in billing_accounts
                        app.get('mongodb').collection('billing_accounts').insert({
                            btype: 'd',
                            buser: new ObjectId(req.session.auth._id),
                            buser_save: req.session.auth.username,
                            baccount: baccount,
                            bplan: bplan,
                            bns0: bns0,
                            bns1: bns1,
                            bns0_ip: bns0_ip,
                            bns1_ip: bns1_ip,
                            bexp: account_data.days,
                            bchanged: Date.now()
                        }, function(err) {
                            if (err) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                return callback('[BILLING] Insert into billing_accounts failed. User ID: ' + req.session.auth._id + ', account: ' + baccount + ', error: ' + err);
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Decreasung funds
                        app.get('mongodb').collection('users').update({
                            _id: new ObjectId(req.session.auth._id)
                        }, {
                            $inc: {
                                billing_funds: -_bcost
                            }
                        }, function(err, result) {
                            if (err) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                return callback('[BILLING] Decreasing funds failed. User ID: ' + req.session.auth._id + ', error: ' + err);
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Checking funds after decrease
                        app.get('mongodb').collection('users').find({
                            _id: new ObjectId(req.session.auth._id)
                        }).toArray(function(err, users) {
                            if (!users || !users.length) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                rep.err_field = 'dd_username';
                                return callback('[BILLING] Checking funds failed. User ID: ' + req.session.auth._id + ', error: ' + err);
                            }
                            account_data.funds = users[0].billing_funds;
                            callback();
                        });
                    },
                    function(callback) {
                        // Adding log record
                        app.get('mongodb').collection('billing_transactions').insert({
                            trans_type: 'domain_reg',
                            trans_obj: baccount + '.' + bplan,
                            trans_timestamp: Date.now(),
                            trans_sum: -_bcost,
                            user_id: req.session.auth._id
                        }, function(err) {
                            if (err) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                return callback('[BILLING] Insert into billing_transactions failed: ' + req.session.auth._id + ', error: ' + err);
                            }
                            callback();
                        });
                    }
                ], function(err) {
                    if (err && typeof err == 'string') logger.log('error', err);
                    rep.account = account_data;
                    if (!err) {
                        var mail_data = {
                            lang: i18nm,
                            site_title: app.get('settings').site_title,
                            domain_name: baccount + '.' + bplan,
                            panel_url: config.billing_frontend.domains_panel_url,
                            subj: i18nm.__('mail_domain_add')
                        };
                        mailer.send(req.session.auth.email, mail_data.subj + ' (' + app.get('settings').site_title + ')', path.join(__dirname, 'views'), 'mail_domain_add_html', 'mail_domain_add_txt', mail_data, req);
                    }
                    return res.send(JSON.stringify(rep));
                });
            });
        });
    });

    router.post('/ajax/prolong/domain', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
                status: 1
            },
            baccount = req.body.baccount,
            bplan = req.body.bplan;
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        // Validate fields
        if (!bplan || !baccount || typeof baccount != 'string' || !baccount.match(/^[a-z0-9\-]{2,63}$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("form_data_incorrect");
            return res.send(JSON.stringify(rep));
        }
        baccount = baccount.toLowerCase();
        app.get('mongodb').collection('billing_conf').find({
            $or: [{
                conf: 'domains'
            }]
        }).toArray(function(err, db) {
            var domains = [];
            if (!err && db && db.length)
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'domains' && db[i].data)
                        try {
                            domains = JSON.parse(db[i].data);
                        } catch (ex) {}
                }
            var _bplan, _bcost;
            for (var hi in domains)
                if (domains[hi].id == bplan) {
                    _bplan = domains[hi].id;
                    _bcost = domains[hi].up;
                }
            if (!_bplan) {
                rep.status = 0;
                rep.err_msg = i18nm.__("form_data_incorrect");
                return res.send(JSON.stringify(rep));
            }
            app.get('mongodb').collection('billing_accounts').find({
                baccount: baccount,
                bplan: bplan,
                btype: 'd',
                buser: new ObjectId(req.session.auth._id)
            }).toArray(function(err, accounts) {
                if (err || !accounts || !accounts.length || accounts[0].buser != req.session.auth._id) {
                    rep.status = 0;
                    rep.err_msg = i18nm.__("domain_account_doesnt_exists");
                    return res.send(JSON.stringify(rep));
                }
                var account = accounts[0],
                    account_data = {
                        funds: 0,
                        account: baccount,
                        plan: bplan,
                        days: 0,
                        cost: -_bcost
                    },
                    tdiff = moment(account.bexp).unix() - moment().unix();
                // Check if domain name expiration date is not less than 30 days and no more than 7
                if (tdiff > 2592000 || tdiff < -604800) {
                    rep.status = 0;
                    rep.err_msg = i18nm.__("form_data_incorrect");
                    return res.send(JSON.stringify(rep));
                }
                // Validation is finished
                async.series([
                    function(callback) {
                        // Check funds
                        app.get('mongodb').collection('users').find({
                            _id: new ObjectId(req.session.auth._id)
                        }).toArray(function(err, users) {
                            if (!users || !users.length || !users[0].billing_funds || users[0].billing_funds < _bcost) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("insufficient_funds");
                                return callback(true); // Error
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Trying to renew domain name at registrator
                        domain_api.renew_domain(baccount, bplan, function(api_data) {
                            if (api_data.status != 1) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("domain_renew_error");
                                return callback('[BILLING] Request to domain renew API failed. User ID: ' + req.session.auth._id + ', account: ' + baccount + ', error: ' + JSON.stringify(api_data.body));
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Update the record in billing_accounts
                        app.get('mongodb').collection('billing_accounts').update({
                            btype: 'd',
                            baccount: baccount,
                            bplan: bplan
                        }, {
                            $inc: {
                                bexp: 31556926000 // 1 year
                            },
                            $set: {
                                bchanged: Date.now()
                            }
                        }, function(err) {
                            if (err) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                return callback('[BILLING] Update of billing_accounts failed. User ID: ' + req.session.auth._id + ', account: ' + baccount + '.' + bplan + ', error: ' + err);
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Decreasung funds
                        app.get('mongodb').collection('users').update({
                            _id: new ObjectId(req.session.auth._id)
                        }, {
                            $inc: {
                                billing_funds: -_bcost
                            }
                        }, function(err, result) {
                            if (err) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                return callback('[BILLING] Decreasing funds failed. User ID: ' + req.session.auth._id + ', error: ' + err);
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Checking funds after decrement
                        app.get('mongodb').collection('users').find({
                            _id: new ObjectId(req.session.auth._id)
                        }).toArray(function(err, users) {
                            if (!users || !users.length) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                return callback('[BILLING] Checking funds failed. User ID: ' + req.session.auth._id + ', error: ' + err);
                            }
                            account_data.funds = users[0].billing_funds;
                            callback();
                        });
                    },
                    function(callback) {
                        // Checking days after increment
                        app.get('mongodb').collection('billing_accounts').find({
                            btype: 'd',
                            baccount: baccount,
                            bplan: bplan
                        }).toArray(function(err, accounts) {
                            if (!accounts || !accounts.length) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                return callback('[BILLING] Checking billing account failed. User ID: ' + req.session.auth._id + ', error: ' + err);
                            }
                            account_data.days = accounts[0].bexp;
                            callback();
                        });
                    },
                    function(callback) {
                        // Adding log record
                        app.get('mongodb').collection('billing_transactions').insert({
                            trans_type: 'domain_up',
                            trans_obj: baccount + '.' + bplan,
                            trans_timestamp: Date.now(),
                            trans_sum: -_bcost,
                            user_id: req.session.auth._id
                        }, function(err) {
                            if (err) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                return callback('[BILLING] Insert into billing_transactions failed: ' + req.session.auth._id + ', error: ' + err);
                            }
                            callback();
                        });
                    }
                ], function(err) {
                    if (err && typeof err == 'string') logger.log('error', err);
                    if (!err) {
                        rep.account = account_data;
                        var mail_data = {
                            lang: i18nm,
                            site_title: app.get('settings').site_title,
                            domain_name: baccount + '.' + bplan,
                            panel_url: config.billing_frontend.hosting_panel_url,
                            subj: i18nm.__('mail_domain_up')
                        };
                        mailer.send(req.session.auth.email, mail_data.subj + ' (' + app.get('settings').site_title + ')', path.join(__dirname, 'views'), 'mail_domain_up_html', 'mail_domain_up_txt', mail_data, req);
                    }
                    res.send(JSON.stringify(rep));
                    return;
                });
            });
        });
    });

    router.post('/ajax/domain/ns', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
                status: 1
            },
            baccount = req.body.baccount,
            bplan = req.body.bplan,
            bns0 = req.body.bns0 || '',
            bns1 = req.body.bns1 || '',
            bns0_ip = req.body.bns0_ip || '',
            bns1_ip = req.body.bns1_ip || '';
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        // Validate fields
        if (!baccount || typeof baccount != 'string' || !baccount.match(/^[a-z0-9\-]{2,63}$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("form_data_incorrect");
            rep.err_field = 'ns_username';
            return res.send(JSON.stringify(rep));
        }
        baccount = baccount.toLowerCase();
        if (!bns0 || typeof bns0 != 'string' || !bns0.match(/^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_nameserver");
            rep.err_field = 'ns_ns0';
            return res.send(JSON.stringify(rep));
        }
        if (!bns1 || typeof bns1 != 'string' || !bns1.match(/^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_nameserver");
            rep.err_field = 'ns_ns1';
            return res.send(JSON.stringify(rep));
        }
        if (bns0_ip && (typeof bns0_ip != 'string' || !bns0_ip.match(/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/))) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_nameserver_ip");
            rep.err_field = 'ns_ns0_ip';
            return res.send(JSON.stringify(rep));
        }
        if (bns1_ip && (typeof bns1_ip != 'string' || !bns1_ip.match(/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/))) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_nameserver_ip");
            rep.err_field = 'ns_ns0_ip';
            return res.send(JSON.stringify(rep));
        }
        // Validate fields
        if (!bplan || typeof bplan != 'string') {
            rep.status = 0;
            rep.err_msg = i18nm.__("form_data_incorrect");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('billing_conf').find({
            $or: [{
                conf: 'domains'
            }]
        }).toArray(function(err, db) {
            var domains = [];
            if (!err && db && db.length)
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'domains' && db[i].data)
                        try {
                            domains = JSON.parse(db[i].data);
                        } catch (ex) {}
                }
            var _bplan, _bcost;
            for (var hi in domains)
                if (domains[hi].id == bplan) {
                    _bplan = domains[hi].id;
                    _bcost = domains[hi].up;
                }
            if (!_bplan) {
                rep.status = 0;
                rep.err_msg = i18nm.__("form_data_incorrect");
                return res.send(JSON.stringify(rep));
            }
            app.get('mongodb').collection('billing_accounts').find({
                baccount: baccount,
                bplan: bplan,
                btype: 'd',
                buser: new ObjectId(req.session.auth._id)
            }).toArray(function(err, accounts) {
                if (err || !accounts || !accounts.length || accounts[0].buser != req.session.auth._id) {
                    rep.status = 0;
                    rep.err_msg = i18nm.__("domain_account_doesnt_exists");
                    return res.send(JSON.stringify(rep));
                }
                var account = accounts[0];
                if (account.bchanged && Date.now() - account.bchanged < 43200000) {
                    rep.status = 0;
                    rep.err_msg = i18nm.__("form_data_incorrect");
                    return res.send(JSON.stringify(rep));
                }
                if (account.bns0 == bns0 && account.bns1 == bns1 && account.bns0_ip == bns0_ip && account.bns1_ip == bns1_ip) {
                    rep.status = 0;
                    rep.err_msg = i18nm.__("ns_unchanged");
                    return res.send(JSON.stringify(rep));
                }
                // Validation is finished
                async.series([
                    function(callback) {
                        // Trying to change domain NS
                        var data = {
                            ns0: bns0,
                            ns1: bns1,
                            ns0_ip: bns0_ip,
                            ns1_ip: bns1_ip
                        };
                        domain_api.change_ns(baccount, bplan, data, function(api_data) {
                            if (api_data.status != 1) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("domain_ns_change_error");
                                return callback('[BILLING] API Request to change domain NS failed. User ID: ' + req.session.auth._id + ', account: ' + baccount + ', error: ' + JSON.stringify(api_data.body));
                            }
                            callback();
                        });
                    },
                    function(callback) {
                        // Update the record in billing_accounts
                        app.get('mongodb').collection('billing_accounts').update({
                            btype: 'd',
                            baccount: baccount,
                            bplan: bplan
                        }, {
                            $set: {
                                bchanged: Date.now(),
                                bns0: bns0,
                                bns1: bns1,
                                bns0_ip: bns0_ip,
                                bns1_ip: bns1_ip
                            }
                        }, function(err) {
                            if (err) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("database_error");
                                return callback('[BILLING] Update of billing_accounts failed. User ID: ' + req.session.auth._id + ', account: ' + baccount + '.' + bplan + ', error: ' + err);
                            }
                            callback();
                        });
                    }
                ], function(err) {
                    if (err && typeof err == 'string') logger.log('error', err);
                    if (!err) {
                        var mail_data = {
                            lang: i18nm,
                            site_title: app.get('settings').site_title,
                            domain_name: baccount + '.' + bplan,
                            ns1: bns0,
                            ns2: bns1,
                            ns1_ip: bns0_ip,
                            ns2_ip: bns1_ip,
                            panel_url: config.billing_frontend.hosting_panel_url,
                            subj: i18nm.__('mail_domain_ns')
                        };
                        mailer.send(req.session.auth.email, mail_data.subj + ' (' + app.get('settings').site_title + ')', path.join(__dirname, 'views'), 'mail_domain_ns_html', 'mail_domain_ns_txt', mail_data, req);
                    }
                    res.send(JSON.stringify(rep));
                    return;
                });
            });
        });
    });

    router.post('/ajax/payment/do', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
                status: 1
            },
            sum = req.body.sum,
            sys = req.body.sys;
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        // Validate fields
        if (!sys || typeof sys != 'string') {
            rep.status = 0;
            rep.err_msg = i18nm.__("form_data_incorrect");
            rep.err_field = 'payment_sys';
            return res.send(JSON.stringify(rep));
        }
        if (typeof sum == 'undefined' || !sum.match(/^[0-9\.]+$/) || parseFloat(sum).isNaN || parseFloat(sum) < 1) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_value");
            rep.err_field = 'payment_sum';
            return res.send(JSON.stringify(rep));
        }
        sum = parseFloat(sum);
        // Get unique order ID
        app.get('mongodb').collection('counters').findAndModify({
            _id: 'billing_payment'
        }, [], {
            $inc: {
                seq: 1
            }
        }, {
            new: true
        }, function(err, counters) {
            var order_id;
            if (err || !counters || !counters.seq) order_id = Date.now();
            if (counters.seq) order_id = counters.seq;
            // Insert a new order into warehouse_orders collection
            app.get('mongodb').collection('billing_payment').insert({
                user_id: req.session.auth._id,
                order_id: order_id,
                order_timestamp: Date.now(),
                order_status: 0,
                order_sum: sum,
                order_email: req.session.auth.email,
                order_locale: req.session.current_locale,
                order_host: req.get('host')
            }, function(err) {
                if (err) {
                    rep.status = 0;
                    rep.err_msg = i18nm.__("database_error");
                    return res.send(JSON.stringify(rep));
                }
                rep.inv = order_id;
                return res.send(JSON.stringify(rep));
            });
        });
    });

    return router;
};
