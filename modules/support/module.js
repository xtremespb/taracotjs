var sort_cells = {
        ticket_id: 1,
        ticket_subj: 1,
        ticket_status: 1,
        ticket_prio: 1,
        ticket_date: 1
    },
    sort_cell_default = 'ticket_date',
    sort_cell_default_mode = -1;

// Set items per page for this module
var items_per_page = 30;

module.exports = function(app) {

    var router = app.get('express').Router(),
        path = require('path'),
        async = require('async'),
        renderer = app.get('renderer'),
        moment = require('moment'),
        mailer = app.get('mailer'),
        config = app.get('config'),
        fs = require('fs'),
        ObjectId = require('mongodb').ObjectID,
        i18nm = new(require('i18n-2'))({
            locales: config.locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: config.locales.dev_mode
        });

    router.get('/', function(req, res) {
        if (!req.session.auth || req.session.auth.status < 1) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/customer';
            res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        i18nm.setLocale(req.session.current_locale);
        var data = {
                title: i18nm.__('module_name'),
                page_title: i18nm.__('module_name'),
                keywords: '',
                description: '',
                extra_css: '<link rel="stylesheet" href="/modules/support/css/frontend.css" type="text/css">'
            },
            render = renderer.render_file(path.join(__dirname, 'views'), 'support_frontend', {
                lang: i18nm,
                data: data
            }, req);
        data.content = render;
        app.get('renderer').render(res, undefined, data, req);
    });

    router.post('/ajax/list', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {
            ipp: items_per_page
        };
        var skip = req.body.skip;
        var sort_mode = req.body.sort_mode;
        var sort_cell = req.body.sort_cell;
        if (typeof skip != 'undefined')
            if (!skip.match(/^[0-9]{1,10}$/)) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
                return res.send(JSON.stringify(rep));
            }
        if (!req.session.auth || req.session.auth.status < 1) {
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
        app.get('mongodb').collection('support').find({
            user_id: req.session.auth._id
        }).count(function(err, items_count) {
            if (!err && items_count > 0) {
                rep.total = items_count;
                app.get('mongodb').collection('support').find({
                    user_id: req.session.auth._id
                }, {
                    skip: skip,
                    limit: items_per_page
                }).sort(sort).toArray(function(err, items) {
                    if (!err && items && items.length) {
                        for (var i = 0; i < items.length; i++) {
                            var arr = [];
                            arr.push(items[i]._id);
                            arr.push(items[i].ticket_id);
                            arr.push(items[i].ticket_subj);
                            arr.push(items[i].ticket_status);
                            arr.push(items[i].ticket_prio);
                            arr.push(items[i].ticket_date);
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

    router.post('/ajax/ticket/create', function(req, res) {
        var rep = {
            status: 1
        };
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        i18nm.setLocale(req.session.current_locale);
        var ticket_subj = req.body.ticket_subj,
            ticket_prio = parseInt(req.body.ticket_prio),
            ticket_msg = req.body.ticket_msg;
        if (!ticket_subj || ticket_subj.length > 100) {
            rep.status = 0;
            rep.err_msg = i18nm.__("form_data_incorrect");
            rep.err_field = 'ticket_subj';
            return res.send(JSON.stringify(rep));
        }
        if (!ticket_prio || ticket_prio < 1 || ticket_prio > 3) {
            rep.status = 0;
            rep.err_msg = i18nm.__("form_data_incorrect");
            rep.err_field = 'ticket_prio';
            return res.send(JSON.stringify(rep));
        }
        if (!ticket_msg || ticket_msg.length > 4096) {
            rep.status = 0;
            rep.err_msg = i18nm.__("form_data_incorrect");
            rep.err_field = 'ticket_msg';
            return res.send(JSON.stringify(rep));
        }
        app.get('mongodb').collection('counters').findAndModify({
            _id: 'support'
        }, [], {
            $inc: {
                seq: 1
            }
        }, {
            new: true
        }, function(err, counters) {
            var ticket_id;
            if (err || !counters || !counters.seq) ticket_id = Date.now();
            if (counters.seq) ticket_id = counters.seq;
            app.get('mongodb').collection('support').insert({
                user_id: req.session.auth._id,
                ticket_id: ticket_id,
                ticket_date: Date.now(),
                ticket_status: 1,
                ticket_subj: ticket_subj,
                ticket_prio: ticket_prio,
                ticket_msg: ticket_msg
            }, function(err) {
                if (err) {
                    rep.status = 0;
                    rep.err_msg = i18nm.__("database_error");
                    return res.send(JSON.stringify(rep));
                }
                rep.ticket_id = ticket_id;
                return res.send(JSON.stringify(rep));
            });
        });
    });

    router.post('/ajax/ticket/load', function(req, res) {
        var rep = {
            status: 1
        };
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        i18nm.setLocale(req.session.current_locale);
        var id = req.body.id;
        if (!id || !id.match(/^[a-f0-9]{24}$/))
            return res.send({
                status: 0,
                error: i18nm.__("invalid_query")
            });
        app.get('mongodb').collection('support').find({
            _id: new ObjectId(id),
            user_id: req.session.auth._id
        }).toArray(function(err, items) {
            if (err || !items || items.length != 1)
                return res.send({
                    status: 0,
                    error: i18nm.__("invalid_ticket")
                });
            rep.ticket = items[0];
            return res.send(JSON.stringify(rep));
        });
    });

	router.post('/ajax/upload', function(req, res) {
        var rep = {
            status: 1
        };
        if (!req.session.auth || req.session.auth.status < 1) {
            rep.status = 0;
            rep.err_msg = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        i18nm.setLocale(req.session.current_locale);
        var id = parseInt(req.body.ticket_id);
        if (!id || id.isNaN || id < 1)
            return res.send({
                status: 0,
                error: i18nm.__("invalid_query")
            });
        if (!req.files || !req.files.file) {
            rep.status = 0;
            rep.error = i18nm.__("no_file_sent");
            res.send(JSON.stringify(rep));
            return;
        }
        var file = req.files.file;
        if (file.size > app.get('config').max_upload_file_mb * 1048576) {
            rep.status = 0;
            rep.error = i18nm.__("file_too_big");
            res.send(JSON.stringify(rep));
            return;
        }
        if (!check_filename(file.originalname)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_filename_syntax");
            res.send(JSON.stringify(rep));
            return;
        }
        app.get('mongodb').collection('support').find({
            ticket_id: id,
            user_id: req.session.auth._id
        }).toArray(function(err, items) {
            if (err || !items || items.length != 1)
                return res.send({
                    status: 0,
                    error: i18nm.__("invalid_ticket")
                });

            return res.send(JSON.stringify(rep));
        });
    });

	// Helper functions

	var check_filename = function(_fn) {
        if (!_fn) return false; // don't allow null
        var fn = _fn.replace(/^\s+|\s+$/g, '');
        if (!fn || fn.length > 80) return false; // null or too long
        if (fn.match(/^\./)) return false; // starting with a dot
        if (fn.match(/^[\^<>\:\"\/\\\|\?\*\x00-\x1f]+$/)) return false; // invalid characters
        return true;
    };

    return router;
};