// Sort order hash
var sort_cells = {
        username: 1,
        billing_funds: 1
    },
    sort_cell_default = 'username',
    sort_cell_default_mode = 1;

// Set items per page for this module
var items_per_page = 30;

// Contry list
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
        ObjectId = require('mongodb').ObjectID,
        async = require('async'),
        moment = require('moment'),
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales.dev_mode
        });
    router.get_module_name = function(req) {
        i18nm.setLocale(req.session.current_locale);
        return i18nm.__("module_name_cp");
    };
    router.get('/', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (!req.session.auth || req.session.auth.status < 2) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/cp/billing_conf';
            res.redirect(303, "/auth/cp?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        app.get('mongodb').collection('billing_conf').find({
            $or: [{
                conf: 'misc'
            }]
        }).toArray(function(err, db) {
            var hosting = [],
                domains = [],
                misc = [];
            if (!err && db && db.length) {
                for (var i = 0; i < db.length; i++) {
                    if (db[i].conf == 'misc' && db[i].data)
                        try {
                            misc = JSON.parse(db[i].data);
                        } catch (ex) {}
                }
            }
            var country_list = [];
            for (var c in countries) {
                var _i = {};
                _i[countries[c]] = i18nm.__('country_list')[c];
                country_list.push(_i);
            }
            var body = app.get('renderer').render_file(path.join(__dirname, 'views'), 'billing_profiles_cp', {
                lang: i18nm,
                auth: req.session.auth,
                misc: JSON.stringify(misc),
                country_list: JSON.stringify(country_list),
                current_locale: req.session.current_locale,
                current_user: req.session.auth.username,
                locales: JSON.stringify(app.get('config').locales.avail)
            }, req);
            app.get('cp').render(req, res, {
                body: body,
                css: '<link rel="stylesheet" href="/modules/billing_profiles/css/main.css">'
            }, i18nm, 'billing_conf_cp', req.session.auth);
        });
    });

    router.post('/data/list', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            ipp: items_per_page
        };
        var skip = req.body.skip;
        var query = req.body.query;
        var sort_mode = req.body.sort_mode;
        var sort_cell = req.body.sort_cell;
        if (typeof skip != 'undefined')
            if (!skip.match(/^[0-9]{1,10}$/)) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
                return res.send(JSON.stringify(rep));
            }
        if (typeof query != 'undefined')
            if (!query.match(/^[\w\sА-Яа-я0-9_\-\.]{3,40}$/)) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
                return res.send(JSON.stringify(rep));
            }
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var sort = {};
        sort[sort_cell_default] = sort_cell_default_mode;
        if (sort_cells && sort_cells[sort_cell]) {
            sort = {};
            sort[sort_cell] = 1;
            if (typeof sort_mode != 'undefined' && sort_mode == -1) {
                sort[sort_cell] = -1;
            }
        }
        rep.items = [];
        var find_query = {};
        if (query) {
            find_query = {
                $or: [{
                    username: new RegExp(query, 'i')
                }]
            };
            var tsq = {};
            tsq["pdata." + req.session.current_locale + '.ptitle'] = new RegExp(query, 'i');
            find_query.$or.push(tsq);
        }
        app.get('mongodb').collection('users').find(find_query).count(function(err, items_count) {
            if (!err && items_count > 0) {
                rep.total = items_count;
                app.get('mongodb').collection('users').find(find_query, {
                    skip: skip,
                    limit: items_per_page
                }).sort(sort).toArray(function(err, items) {
                    if (!err && items && items.length) {
                        for (var i = 0; i < items.length; i++) {
                            var arr = [];
                            arr.push(items[i]._id);
                            arr.push(items[i].username);
                            arr.push(items[i].billing_funds);
                            rep.items.push(arr);
                        }
                    }
                    // Return results
                    rep.status = 1;
                    res.send(JSON.stringify(rep));
                }); // data
            } else { // Error or count = 0
                rep.status = 1;
                rep.total = '0';
                res.send(JSON.stringify(rep));
            }
        }); // count
    });

    router.post('/data/delete', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var ids = req.body.ids;
        if (typeof ids != 'object' || ids.length < 1) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            return res.send(JSON.stringify(rep));
        }
        for (var i = 0; i < ids.length; i++) {
            if (ids[i].match(/^[a-f0-9]{24}$/)) {
                app.get('mongodb').collection('billing_profiles').remove({
                    _id: new ObjectId(ids[i])
                }, dummy);
            }
        }
        res.send(JSON.stringify(rep));
    });

    router.post('/data/save', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var bfunds = req.body.bfunds,
            id = req.body.id,
            profile_data = req.body.profile_data,
            profile_update = {};
        // Validate
        if (!id || typeof id != 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_id");
            return res.send(JSON.stringify(rep));
        }
        if (typeof bfunds == 'undefined' || parseFloat(bfunds).isNaN) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_funds");
            rep.err_field = 'bfunds';
            return res.send(JSON.stringify(rep));
        }
        bfunds = parseFloat(bfunds);
        if (profile_data) {
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
        }
        var update = {
            $set: {
                billing_funds: bfunds
            }
        };
        if (profile_update.n1e) update.$set.profile_data = profile_update;
        app.get('mongodb').collection('users').update({
            _id: new ObjectId(id)
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

    router.post('/data/load', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var id = req.body.id;
        // Validate
        if (!id || typeof id != 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_id");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('users').find({
            _id: new ObjectId(id)
        }).toArray(function(err, users) {
            if (err || !users || !users.length) {
                rep.status = 0;
                rep.err_msg = i18nm.__("ajax_failed");
                return res.send(JSON.stringify(rep));
            }
            rep.account = users[0];
            rep.account.password = undefined;
            rep.account.transactions = [];
            app.get('mongodb').collection('billing_transactions').find({
                user_id: id
            }).count(function(err, trans_count) {
                if (!trans_count) return res.send(JSON.stringify(rep));
                app.get('mongodb').collection('billing_transactions').find({
                    user_id: id
                }).sort({
                    trans_timestamp: -1
                }).limit(50).toArray(function(err, transactions) {
                    if (transactions && transactions.length)
                        rep.account.transactions = transactions;
                    res.send(JSON.stringify(rep));
                });
            });
        });
    });

    router.post('/data/list_transactions', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var id = req.body.id;
        // Validate
        if (!id || typeof id != 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_id");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('billing_transactions').find({
            user_id: id
        }).count(function(err, trans_count) {
            if (!trans_count) return res.send(JSON.stringify(rep));
            app.get('mongodb').collection('billing_transactions').find({
                user_id: id
            }).sort({
                trans_timestamp: -1
            }).limit(50).toArray(function(err, transactions) {
                if (transactions && transactions.length)
                    rep.transactions = transactions;
                res.send(JSON.stringify(rep));
            });
        });
    });

    router.post('/data/load_transaction', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var id = req.body.id;
        // Validate
        if (!id || typeof id != 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_id");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('billing_transactions').find({
            _id: new ObjectId(id)
        }).toArray(function(err, transactions) {
            if (transactions && transactions.length) {
                rep.transaction = transactions[0];
            } else {
                rep.status = 0;
                rep.err_msg = i18nm.__("unknown_transaction");
                return res.send(JSON.stringify(rep));
            }
            res.send(JSON.stringify(rep));
        });
    });

    router.post('/data/save_transaction', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var trans_type = req.body.trans_type,
            trans_obj = req.body.trans_obj || '',
            trans_timestamp = req.body.trans_timestamp,
            trans_sum = req.body.trans_sum,
            id = req.body.id,
            user_id = req.body.user_id;
        // Validate
        if (id)
            if (typeof id != 'string' || !id.match(/^[a-f0-9]{24}$/)) {
                rep.status = 0;
                rep.err_msg = i18nm.__("invalid_id");
                return res.send(JSON.stringify(rep));
            }
        if (trans_obj && (typeof user_id != 'string' || trans_obj.length > 80)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_trans_obj");
            return res.send(JSON.stringify(rep));
        }
        if (!user_id || typeof user_id != 'string' || !user_id.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_user_id");
            return res.send(JSON.stringify(rep));
        }
        if (!trans_type || (trans_type != 'domain_reg' && trans_type != 'domain_up' && trans_type != 'hosting_reg' && trans_type != 'hosting_up' && trans_type != 'funds_replenishment' && trans_type != 'other')) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_transaction");
            rep.err_field = 'trans_type';
            return res.send(JSON.stringify(rep));
        }
        if (typeof trans_sum == 'undefined' || parseFloat(trans_sum).isNaN) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_sum");
            rep.err_field = 'trans_sum';
            return res.send(JSON.stringify(rep));
        }
        if (!trans_timestamp || parseInt(trans_sum).isNaN) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_timestamp");
            rep.err_field = 'trans_date';
            return res.send(JSON.stringify(rep));
        }
        trans_sum = parseFloat(trans_sum);
        trans_timestamp = parseInt(trans_timestamp);
        trans_obj = trans_obj.replace(/\"/g, '&quot;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace(/\t/g, ' ').replace(/[\n\r]/g, ' ');
        var update = {
            trans_type: trans_type,
            trans_obj: trans_obj,
            trans_timestamp: trans_timestamp,
            trans_sum: trans_sum,
            user_id: user_id
        };
        var query = {};
        if (id) {
            query._id = new ObjectId(id);
        } else {
            query.trans_type = trans_type;
            query.trans_obj = trans_obj;
        }
        app.get('mongodb').collection('billing_transactions').update(query, update, {
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

    router.post('/data/delete_transaction', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            status: 1
        };
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var id = req.body.id;
        // Validate
        if (!id || typeof id != 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            rep.status = 0;
            rep.err_msg = i18nm.__("invalid_id");
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('billing_transactions').remove({
            _id: new ObjectId(id)
        }, function(err) {
            if (err) {
                rep.status = 0;
                rep.err_msg = i18nm.__("unknown_transaction");
                return res.send(JSON.stringify(rep));
            }
            res.send(JSON.stringify(rep));
        });
    });

    var dummy = function() {};

    function isInt(n) {
        return Number(n) === n && n % 1 === 0;
    }

    return router;
};
