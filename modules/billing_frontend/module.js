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
        'org': 1,
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
    var billing_api;
    if (config.billing_frontend && config.billing_frontend.hosting_api) billing_api = require('./api/' + config.billing_frontend.hosting_api)(app);
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
            }]
        }).toArray(function(err, db) {
            var hosting = [],
                domains = [],
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
                        misc: JSON.stringify(misc),
                        funds: req.session.auth.billing_funds || 0,
                        profile_data: JSON.stringify(req.session.auth.profile_data || {}),
                        transactions: JSON.stringify(transactions),
                        current_locale: req.session.current_locale,
                        country_list: JSON.stringify(country_list),
                        data: data
                    }, req);
                    data.content = render;
                    app.get('renderer').render(res, undefined, data, req);
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
                if (profile_data.org_r || profile_data.code || profile_data.org || profile_data.kpp) {
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
        bexp_add = bexp_add * 30;
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

            var _bplan;
            for (var hi in hosting)
                if (hosting[hi].id == bplan) _bplan = hosting[hi].id;
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
                async.series([
                    function(callback) {
                        billing_api.user_exists(baccount, function(api_res) {
                            if (api_res == -1) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("ajax_failed");
                                rep.err_field = 'dh_username';
                                return callback(true); // Error
                            }
                            if (api_res == 1) {
                                rep.status = 0;
                                rep.err_msg = i18nm.__("hosting_account_exists");
                                rep.err_field = 'dh_username';
                                return callback(true); // Error
                            }
                            return callback();
                        });
                    }
                ], function(err) {
                    return res.send(JSON.stringify(rep));
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
        if (!bexp_add || bexp_add.isNaN || bexp_add < 0) {
            rep.status = 0;
            rep.err_msg = i18nm.__("form_data_incorrect");
            rep.err_field = 'dh_months';
            return res.send(JSON.stringify(rep));
        }
        bexp_add = bexp_add * 30;
        app.get('mongodb').collection('billing_accounts').find({
            baccount: baccount,
            btype: 'h',
            buser: new ObjectId(req.session.auth._id)
        }).toArray(function(err, accounts) {
            if (err || !accounts || !accounts.length) {
                rep.status = 0;
                rep.err_msg = i18nm.__("hosting_account_doesnt_exists");
                return res.send(JSON.stringify(rep));
            }
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
                return res.send(JSON.stringify(rep));
            });
        });
    });

    return router;
};
