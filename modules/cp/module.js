module.exports = function(app) {

    var updates_url = 'https://taracot.org/source/taracotjs/update_info.json',
        modules_url = 'https://taracot.org/source/taracotjs',
        proxy_url = 'http://10.206.247.66:8080',
        request = require("request"), // Set undefined if no proxy
        router = app.get('express').Router(),
        os = require('os'),
        fs = require('fs-extra'),
        async = require('async'),
        unzip = require('unzip2'),
        gaikan = require('gaikan'),
        checksum = require('checksum'),
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales.avail,
            directory: app.get('path').join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales.dev_mode
        }),
        pt_updates_table = gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/parts_updates_table.html'),
        pt_updates_tr = gaikan.compileFromFile(app.get('path').join(__dirname, 'views') + '/parts_updates_tr.html');

    router.get('/', function(req, res) {
        if (typeof req.session.auth == 'undefined' || req.session.auth === false || req.session.auth.status < 2) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/cp';
            res.redirect(303, "/auth/cp?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        i18nm.setLocale(req.session.current_locale);
        var update_timestamp, update_last, total_updates_avail = 0;
        async.series([
            function(callback) {
                app.get('mongodb').collection('updates').find().toArray(function(err, up_data) {
                    if (!err && up_data && up_data.length)
                        for (var ud in up_data) {
                            if (up_data[ud].update_timestamp) update_timestamp = up_data[ud].update_timestamp;
                            if (up_data[ud].update_last) update_last = up_data[ud].update_last;
                        }
                    if (!update_timestamp || Date.now() - update_timestamp > 108) { // 10800000 = 3 hours
                        request({
                            url: updates_url,
                            proxy: proxy_url,
                            json: true
                        }, function(error, response, body) {
                            if (!error && response.statusCode === 200) {
                                app.get('mongodb').collection('updates').update({}, {
                                    update_timestamp: Date.now(),
                                    update_last: body
                                }, {
                                    upsert: true,
                                    safe: false
                                }, function(err) {
                                    update_timestamp = Date.now();
                                    update_last = body;
                                    callback();
                                });
                            } else {
                                callback();
                            }
                        });
                    } else {
                        callback();
                    }
                });
            },
            function(callback) {
                var loadavg = os.loadavg();
                if (loadavg[0] === 0 && loadavg[1] === 0 && loadavg[2] === 0) {
                    loadavg = i18nm.__("not_available");
                } else {
                    loadavg = loadavg[0] + ", " + loadavg[1] + ", " + loadavg[2];
                }
                var os_data = {
                    hostname: os.hostname(),
                    os_type: os.type(),
                    os_platform: os.platform(),
                    cpu_arch: os.arch(),
                    os_release: os.release(),
                    totalmem: parseInt(os.totalmem() / 1024 / 1024) + ' ' + i18nm.__('MB'),
                    freemem: parseInt(os.freemem() / 1024 / 1024) + ' ' + i18nm.__('MB'),
                    loadavg: loadavg
                };
                var start = parseInt((Date.now() - 2592000000) / 1000);
                app.get('mongodb').collection('statistics').find({
                    day: {
                        $gte: start
                    }
                }, {
                    limit: 30
                }).sort({
                    day: 1
                }).toArray(function(err, items) {
                    var days = [];
                    var months = [];
                    var visitors = [];
                    var hits = [];
                    if (!err && items && items.length) {
                        var _cm;
                        for (var i = 0; i < items.length; i++) {
                            var dt = new Date(items[i].day * 1000);
                            var month = dt.getMonth() + 1;
                            var year = dt.getFullYear();
                            if (_cm != month) {
                                _cm = month;
                                months.push({
                                    month: i18nm.__('month_' + month),
                                    year: year
                                });
                            }
                            days.push(dt.getDate());
                            if (items[i].visitors && items[i].hits) {
                                visitors.push(items[i].visitors);
                                hits.push(items[i].hits);
                            }
                        }
                    }
                    var updates_table = i18nm.__('no_update_info_available');
                    if (update_timestamp && update_last) {
                        var version_info = app.get('version_info'),
                            data = '';
                        for (var key in version_info) {
                            var sv = '';
                            if (update_last[key] && update_last[key].version) sv = update_last[key].version;
                            var status = 'actual';
                            if (sv)
                                if (parseFloat(sv.replace(/\./g, '')) > parseFloat(version_info[key].replace(/\./g, ''))) {
                                    status = 'outdated';
                                    total_updates_avail++;
                                }
                            data += pt_updates_tr(gaikan, {
                                module_name: key,
                                local_version: version_info[key],
                                server_version: sv,
                                status: status
                            }, undefined);
                        }
                        updates_table = pt_updates_table(gaikan, {
                            lang: i18nm,
                            data: data
                        }, undefined);
                    }
                    var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'dashboard', {
                        lang: i18nm,
                        os: os_data,
                        days: JSON.stringify(days),
                        months: JSON.stringify(months),
                        visitors: JSON.stringify(visitors),
                        hits: JSON.stringify(hits),
                        config: app.get('config'),
                        updates_table: updates_table,
                        total_updates_avail: total_updates_avail
                    }, req);

                    app.get('cp').render(req, res, {
                        body: body
                    }, i18nm, 'dashboard', req.session.auth);

                    callback();

                });
            }
        ], function(err) {

        });
    });

    router.post('/_update/start', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (typeof req.session.auth == 'undefined' || req.session.auth === false || req.session.auth.status < 2)
            return res.send(JSON.stringify({
                status: 0,
                error: i18nm.__('unauth')
            }));
        app.get('mongodb').collection('updates').find().toArray(function(err, up_data) {
            if (err || !up_data || !up_data.length)
                return res.send(JSON.stringify({
                    status: 0,
                    error: i18nm.__('no_update')
                }));
            var outdated_modules = [],
                version_info = app.get('version_info'),
                update_timestamp,
                update_last;
            for (var ud in up_data) {
                if (up_data[ud].update_timestamp) update_timestamp = up_data[ud].update_timestamp;
                if (up_data[ud].update_last) update_last = up_data[ud].update_last;
            }
            for (var key in version_info) {
                var sv = '';
                if (update_last[key] && update_last[key].version) sv = update_last[key].version;
                if (sv)
                    if (parseFloat(sv.replace(/\./g, '')) > parseFloat(version_info[key].replace(/\./g, '')))
                        outdated_modules.push(key);
            }
            if (!outdated_modules.length)
                return res.send(JSON.stringify({
                    status: 0,
                    error: i18nm.__('no_update')
                }));
            cp_updater_messages = [];
            app.set('_cp_updater_messages', cp_updater_messages);
            app.set('_cp_updater_complete', undefined);
            app.set('_cp_updater_fail', undefined);
            setTimeout(function() {
                async.eachSeries(outdated_modules, function(module, callback) {
                    cp_updater_messages.push(i18nm.__('downloading_module') + ": " + module);
                    app.set('_cp_updater_messages', cp_updater_messages);
                    var dest = app.get('path').join(__dirname, '..', app.get('config').dir.tmp, 'taracot_' + module + '.zip'),
                        file = fs.createWriteStream(dest);
                    request({
                        method: 'GET',
                        url: modules_url + '/taracot_' + module + '.zip',
                        proxy: proxy_url,
                        encoding: null
                    }, function(error, response, body) {
                        if (error || response.statusCode !== 200) return callback(i18nm.__('cannot_download') + ' ' + 'taracot_' + module + '.zip');
                        cp_updater_messages.push(i18nm.__('saving_module') + ": " + module);
                        app.set('_cp_updater_messages', cp_updater_messages);
                        fs.writeFile(dest, body, function(err) {
                            if (err) return callback(err);
                            cp_updater_messages.push(i18nm.__('validating_checksum') + ": " + module);
                            app.set('_cp_updater_messages', cp_updater_messages);
                            checksum.file(dest, function(err, module_sum) {
                                if (err) return callback(err);
                                if (module_sum != update_last[module].checksum) return callback(i18nm.__('invalid_checksum') + ": " + module);
                                cp_updater_messages.push(i18nm.__('extracting_module') + ": " + module);
                                app.set('_cp_updater_messages', cp_updater_messages);
                                var extract_path = app.get('path').join(__dirname, '..');
                                if (module == 'core') extract_path = app.get('path').join(__dirname, '..', '..');
                                var p;
                                try {
                                    p = fs.createReadStream(dest).pipe(unzip.Extract({
                                        path: extract_path
                                    }));
                                } catch (ex) {
                                    return callback(ex);
                                }
                                p.on('error', function(err) {
                                    callback(err);
                                });
                                p.on('close', function() {
                                    if (module == 'core') return callback();
                                    // Run installation scripts
                                    cp_updater_messages.push(i18nm.__('installing_module') + ": " + module);
                                    try {
                                        var installer = require('../' + module + '/install')(app.get('mongodb'), ensure_indexes, app.get('config'));
                                        installer.collections(function(err) {
                                            if (err) {
                                                cp_updater_messages.push(err + ": " + module);
                                                app.set('_cp_updater_messages', cp_updater_messages);
                                            }
                                            installer.indexes(function(err) {
                                                if (err) {
                                                    cp_updater_messages.push(err + ": " + module);
                                                    app.set('_cp_updater_messages', cp_updater_messages);
                                                }
                                                installer.misc(function(err) {
                                                    if (err) {
                                                        cp_updater_messages.push(err + ": " + module);
                                                        app.set('_cp_updater_messages', cp_updater_messages);
                                                    }
                                                    return callback();
                                                });
                                            });
                                        });
                                    } catch (ex) {
                                        return callback(ex.message);
                                    }
                                });
                            });
                        });
                    });
                }, function(err) {
                    if (err) {
                        cp_updater_messages.push(JSON.stringify(err));
                        app.set('_cp_updater_messages', cp_updater_messages);
                        app.set('_cp_updater_fail', true);
                    }
                    app.set('_cp_updater_complete', true);
                });
            }, 100);
            return res.send(JSON.stringify({
                status: 1
            }));
        });
    });

    router.post('/_update/status', function(req, res) {
        if (typeof req.session.auth == 'undefined' || req.session.auth === false || req.session.auth.status < 2)
            return res.send(JSON.stringify({
                messages: [i18nm.__('unauth')]
            }));
        var msg = app.get('_cp_updater_messages') || [],
            cf = app.get('_cp_updater_complete') || undefined,
            ff = app.get('_cp_updater_fail') || undefined;
        return res.send(JSON.stringify({
            messages: msg,
            complete: cf,
            failed: ff
        }));
    });

    function ensure_indexes(col, ia, _opt, ow, callback) {
        var opt = {
            unique: false,
            background: true,
            dropDups: false,
            w: 1
        };
        if (_opt) opt = _opt;
        var _fns = [];
        for (var i = 0; i < ia.length; i++) {
            var i1 = {};
            i1[ia[i]] = 1;
            _fns.push({
                col: col,
                ix: i1
            });
            if (!ow) {
                var i2 = {};
                i2[ia[i]] = -1;
                _fns.push({
                    col: col,
                    ix: i2
                });
            }
        }
        async.every(_fns, function(fns, _callback) {
            db.collection(fns.col).ensureIndex(fns.ix, function() {
                _callback(true);
            });
        }, function(result) {
            callback();
        });
    }

    return router;
};
