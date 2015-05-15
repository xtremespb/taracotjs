module.exports = function(app) {
    var path = require('path'),
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales.dev_mode
        }),
        fs = require("fs-extra"),
        router = app.get('express').Router(),
        mime = require('mime'),
        archiver = require('archiver'),
        unzip = require('unzip2'),
        async = require('async'),
        gm = false;
    if (app.get('config').graphicsmagick) {
        gm = require('gm');
    }
    var crypto = require('crypto');
    router.get_module_name = function(req) {
        i18nm.setLocale(req.session.current_locale);
        return i18nm.__("module_name");
    };
    router.get('/', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (!req.session.auth || req.session.auth.status < 2) {
            req.session.auth_redirect_host = req.get('host');
            req.session.auth_redirect = '/cp/files';
            res.redirect(303, "/auth/cp?rnd=" + Math.random().toString().replace('.', ''));
            return;
        }
        var textedit = 'false';
        if (app.get('textedit')) textedit = 'true';
        var body = app.get('renderer').render_file(path.join(__dirname, 'views'), 'files', {
            lang: i18nm,
            textedit: textedit,
            files_url: app.get('config').dir.storage_url,
            locales: JSON.stringify(app.get('config').locales.avail)
        }, req);
        app.get('cp').render(req, res, {
            body: body,
            css: '<link rel="stylesheet" href="/modules/files/css/main.css">'
        }, i18nm, 'files', req.session.auth);
    });
    router.post('/data/load', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {};
        var io = req.body.io || false;
        if (io && io != 'false') io = true;
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var req_dir = req.body.dir;
        if (req_dir && !check_directory(req_dir)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_dir");
            return res.send(JSON.stringify(rep));
        }
        if (req_dir) {
            req_dir = '/' + req_dir;
        } else {
            req_dir = '';
        }
        var dir = app.get('config').dir.storage + req_dir;
        fs.exists(dir, function(dx) {
            if (!dx) {
                rep.status = 0;
                rep.error = i18nm.__("dir_not_exists");
                return res.send(JSON.stringify(rep));
            } else {
                var fa = [],
                    da = [];
                fs.readdir(dir, function(err, browse) {
                    if (!browse) browse = [];
                    async.eachSeries(browse, function(file, callback) {
                        var item = {
                            name: file
                        };
                        fs.stat(dir + '/' + file, function(err, stat) {
                            if (err || !stat) return callback();
                            if (stat.isFile() && !file.match(/^\./) && !file.match(/^___thumb_/)) {
                                var file_mime = mime.lookup(dir + '/' + file),
                                    fn = crypto.createHash('md5').update(file).digest('hex');
                                fs.exists(dir + '/___thumb_' + fn + '.jpg', function(ex) {
                                    if (ex) item.thumb = fn;
                                    item.type = 'f';
                                    item.size = stat.size;
                                    item.mime = file_mime;
                                    if (io) {
                                        if (file_mime.match(/image\//)) fa.push(item);
                                    } else {
                                        fa.push(item);
                                    }
                                    return callback();
                                });
                            } else {
                                if (stat.isDirectory() && !file.match(/^\./)) {
                                    item.type = 'd';
                                    item.size = '0';
                                    item.mime = '';
                                    da.push(item);
                                }
                                return callback();
                            }
                        });
                    }, function(err) {
                        da.sort(function(a, b) {
                            if (!a.name || !b.name) return a.name.localeCompare(b.name);
                            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                        });
                        fa.sort(function(a, b) {
                            if (!a.name || !b.name) return a.name.localeCompare(b.name);
                            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                        });
                        rep.files = da.concat(fa);
                        rep.status = 1;
                        res.send(JSON.stringify(rep));
                    });
                });
            }
        });
    });
    router.post('/data/newdir', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {};
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        var req_dir = req.body.dir;
        if (req_dir && !check_directory(req_dir)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_dir");
            res.send(JSON.stringify(rep));
            return;
        }
        var new_dir = req.body.newdir.replace(/^\s+|\s+$/g, '');
        if (!new_dir || !check_directory(new_dir, true)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_dir_syntax");
            res.send(JSON.stringify(rep));
            return;
        }
        if (req_dir) {
            req_dir = '/' + req_dir;
        } else {
            req_dir = '';
        }
        var dir = app.get('config').dir.storage + req_dir;
        fs.exists(dir, function(ex1) {
            if (!ex1) {
                rep.status = 0;
                rep.error = i18nm.__("dir_not_exists");
                return res.send(JSON.stringify(rep));
            }
            fs.exists(dir + '/' + new_dir, function(ex2) {
                if (ex2) {
                    rep.status = 0;
                    rep.error = i18nm.__("dir_already_exists");
                    return res.send(JSON.stringify(rep));
                }
                fs.mkdir(dir + '/' + new_dir, function(err) {
                    if (err) {
                        rep.status = 0;
                        rep.error = i18nm.__("newdir_error");
                        return res.send(JSON.stringify(rep));
                    }
                    rep.status = 1;
                    return res.send(JSON.stringify(rep));
                });
            });
        });
    });
    router.post('/data/del', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {};
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            return res.send(JSON.stringify(rep));
        }
        var fna = req.body.items;
        if (!fna || !fna.length) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_request") + "1";
            return res.send(JSON.stringify(rep));
        }
        for (var i = 0; i < fna.length; i++) {
            if (!check_filename(fna[i])) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_request");
                return res.send(JSON.stringify(rep));
            }
        }
        var req_dir = req.body.dir;
        if (req_dir && !check_directory(req_dir)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_dir");
            return res.send(JSON.stringify(rep));
        }
        if (req_dir) {
            req_dir = '/' + req_dir;
        } else {
            req_dir = '';
        }
        var dir = app.get('config').dir.storage + req_dir;
        fs.exists(dir, function(ex) {
            if (!ex) {
                rep.status = 0;
                rep.error = i18nm.__("dir_not_exists");
                return res.send(JSON.stringify(rep));
            }
            async.eachSeries(fna, function(fni, callback) {
                var fn = crypto.createHash('md5').update(fni).digest('hex');
                fs.remove(dir + '/' + fni, function(err) {
                    if (err) return callback(true);
                    fs.exists(dir + '/___thumb_' + fn + '.jpg', function(ex) {
                        if (ex) {
                            fs.remove(dir + '/___thumb_' + fn + '.jpg', function(err) {
                                if (err) return callback(true);
                                return callback();
                            });
                        } else {
                            return callback();
                        }
                    });
                });
            }, function(err) {
                if (err) {
                    rep.status = 0;
                    rep.error = i18nm.__("some_files_not_deleted");
                    return res.send(JSON.stringify(rep));
                }
                rep.status = 1;
                res.send(JSON.stringify(rep));
            });
        });
    });
    router.post('/data/rename', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {};
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        var old_filename = req.body.old_filename;
        var new_filename = req.body.new_filename;
        var req_dir = req.body.dir;
        if (req_dir && !check_directory(req_dir)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_dir");
            res.send(JSON.stringify(rep));
            return;
        }
        if (req_dir) {
            req_dir = '/' + req_dir;
        } else {
            req_dir = '';
        }
        var dir = app.get('config').dir.storage + req_dir;
        if (!check_filename(old_filename) || !check_filename(new_filename)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_filename_syntax");
            res.send(JSON.stringify(rep));
            return;
        }
        if (old_filename == new_filename) {
            rep.status = 0;
            rep.error = i18nm.__("cannot_rename_same");
            res.send(JSON.stringify(rep));
            return;
        }
        fs.exists(dir, function(ex1) {
            if (!ex1) {
                rep.status = 0;
                rep.error = i18nm.__("dir_not_exists");
                return res.send(JSON.stringify(rep));
            }
            fs.exists(dir + '/' + old_filename, function(ex2) {
                if (!ex2) {
                    rep.status = 0;
                    rep.error = i18nm.__("file_not_exists");
                    return res.send(JSON.stringify(rep));
                }
                fs.exists(dir + '/' + new_filename, function(ex3) {
                    if (ex3) {
                        rep.status = 0;
                        rep.error = i18nm.__("cannot_rename_same");
                        return res.send(JSON.stringify(rep));
                    }
                    // Go ahead
                    fs.rename(dir + '/' + old_filename, dir + '/' + new_filename, function(cr) {
                        if (cr) {
                            rep.status = 0;
                            rep.error = i18nm.__("rename_error");
                            return res.send(JSON.stringify(rep));
                        }
                        var fn = crypto.createHash('md5').update(old_filename).digest('hex');
                        async.series([
                            function(callback) {
                                fs.exists(dir + '/___thumb_' + fn + '.jpg', function(ex) {
                                    if (ex) {
                                        var nf = crypto.createHash('md5').update(new_filename).digest('hex');
                                        fs.rename(dir + '/___thumb_' + fn + '.jpg', dir + '/___thumb_' + nf + '.jpg', function(err) {
                                            callback();
                                        });
                                    } else {
                                        callback();
                                    }
                                });
                            },
                            function(callback) {
                                rep.status = 1;
                                res.send(JSON.stringify(rep));
                                return callback();
                            }
                        ]);
                    });
                });
            });
        });
    });
    router.post('/data/paste', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {};
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        var clpbrd = req.body.clipboard;
        if (!clpbrd || !clpbrd.files || !clpbrd.files.length || !clpbrd.mode || (clpbrd.mode != 'copy' && clpbrd.mode != 'cut')) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_request");
            res.send(JSON.stringify(rep));
            return;
        }
        for (var i = 0; i < clpbrd.files.length; i++) {
            if (!check_filename(clpbrd.files[i])) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_request");
                res.send(JSON.stringify(rep));
                return;
            }
        }
        var source_dir = clpbrd.dir;
        if (source_dir && !check_directory(source_dir)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_dir");
            res.send(JSON.stringify(rep));
            return;
        }
        var dest_dir = req.body.dest;
        if (dest_dir && !check_directory(dest_dir)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_dir");
            res.send(JSON.stringify(rep));
            return;
        }
        if (source_dir == dest_dir) {
            rep.status = 0;
            rep.error = i18nm.__("cannot_paste_to_source_dir");
            res.send(JSON.stringify(rep));
            return;
        }
        for (var j = 0; j < clpbrd.files.length; j++) {
            var _fn = clpbrd.dir + '/' + clpbrd.files[j];
            if (_fn.match(/^\//)) _fn = _fn.replace(/^\//, '');
            var rex1 = new RegExp('^' + _fn + '\/');
            var rex2 = new RegExp('^' + _fn + '$');
            if (dest_dir.match(rex1) || dest_dir.match(rex2)) {
                rep.status = 0;
                rep.error = i18nm.__("cannot_paste_to_itself");
                res.send(JSON.stringify(rep));
                return;
            }
        }
        if (!source_dir) {
            source_dir = '';
        } else {
            source_dir = '/' + source_dir;
        }
        source_dir = app.get('config').dir.storage + source_dir;
        if (!dest_dir) {
            dest_dir = '';
        } else {
            dest_dir = '/' + dest_dir;
        }
        dest_dir = app.get('config').dir.storage + dest_dir;
        async.series([
            function(callback) {
                fs.exists(source_dir, function(ex) {
                    if (!ex) {
                        rep.status = 0;
                        rep.error = i18nm.__("dir_not_exists");
                        return callback(true);
                    }
                    callback();
                });
            },
            function(callback) {
                fs.exists(dest_dir, function(ex) {
                    if (!ex) {
                        rep.status = 0;
                        rep.error = i18nm.__("dir_not_exists");
                        return callback(true);
                    }
                    callback();
                });
            },
            function(callback) {
                var ure = false;
                source_dir = source_dir.replace(/\/\//g, '/');
                dest_dir = dest_dir.replace(/\/\//g, '/');
                async.eachSeries(clpbrd.files, function(cf, escallback) {
                    var src = source_dir + '/' + cf,
                        dst = dest_dir + '/' + cf;
                    if (src == dst || src == dest_dir) {
                        rep.status = 0;
                        rep.error = i18nm.__("cannot_paste_to_itself");
                        return escallback(true);
                    }
                    fs.exists(src, function(ex1) {
                        if (!ex1) {
                            rep.status = 0;
                            rep.error = i18nm.__("dir_or_file_not_exists");
                            return escallback(true);
                        }
                        fs.stat(src, function(err, stat) {
                            if (err) {
                                rep.status = 0;
                                rep.error = i18nm.__("dir_or_file_not_exists");
                                return escallback(true);
                            }
                            var fn = crypto.createHash('md5').update(cf).digest('hex');
                            if (stat.isFile() || stat.isDirectory()) {
                                if (stat.isFile()) {
                                    if (clpbrd.mode == 'cut') {
                                        fs.rename(src, dst, function(err) {
                                            if (err) return escallback(err);
                                            fs.rename(source_dir + '/___thumb_' + fn + '.jpg', dest_dir + '/___thumb_' + fn + '.jpg', function(err) {
                                                return escallback();
                                            });
                                        });
                                    } else {
                                        fs.copy(src, dst, function(err) {
                                            if (err) return escallback(err);
                                            fs.copy(source_dir + '/___thumb_' + fn + '.jpg', dest_dir + '/___thumb_' + fn + '.jpg', function(err) {
                                                return escallback();
                                            });
                                        });
                                    }
                                } else {
                                    fs.copy(src, dst, function(err) {
                                        if (clpbrd.mode == 'cut') {
                                            fs.remove(src, function(err) {
                                                return escallback();
                                            });
                                        } else {
                                            return escallback();
                                        }
                                    });
                                }
                            } else {
                                return escallback();
                            }
                        });
                    });
                }, function(err) {
                    callback(err);
                });
            }
        ], function() {
            if (rep.status === undefined) rep.status = 1;
            return res.send(JSON.stringify(rep));
        });
    });
    router.post('/data/upload', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {};
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.status = 0;
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
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
        var dir = req.body.dir;
        if (dir && !check_directory(dir)) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_dir");
            res.send(JSON.stringify(rep));
            return;
        }
        if (!dir) {
            dir = '';
        } else {
            dir = '/' + dir;
        }
        dir = app.get('config').dir.storage + dir;

        fs.exists(dir, function(ex1) {
            if (!ex1) {
                rep.status = 0;
                rep.error = i18nm.__("dir_not_exists");
                return res.send(JSON.stringify(rep));
            }
            fs.rename(app.get('config').dir.tmp + '/' + file.name, dir + '/' + file.originalname, function(err) {
                if (err) {
                    rep.status = 0;
                    rep.error = i18nm.__("upload_failed");
                    return res.send(JSON.stringify(rep));
                }
                if (gm && (file.mimetype == 'image/png' || file.mimetype == 'image/jpeg')) {
                    var fn = crypto.createHash('md5').update(file.originalname).digest('hex'),
                        img = gm(dir + '/' + file.originalname);
                    img.autoOrient();
                    img.size(function(err, size) {
                        if (!err) {
                            if (size.width >= size.height) {
                                img.resize(null, 70);
                                img.crop(70, 70, 0, 0);
                            } else {
                                img.resize(70, null);
                                img.crop(70, 70, 0, 0);
                            }
                            img.setFormat('jpeg');
                            img.write(dir + '/___thumb_' + fn + '.jpg', function(err) {
                                rep.status = 1;
                                return res.send(JSON.stringify(rep));
                            });
                        } else {
                            rep.status = 1;
                            return res.send(JSON.stringify(rep));
                        }
                    });
                } else {
                    rep.status = 1;
                    return res.send(JSON.stringify(rep));
                }
            });
        });
    });
    router.post('/data/download', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {};
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        var files = req.body.files;
        if (!files || !files.length) {
            rep.error = i18nm.__("no_file_sent");
            res.send(JSON.stringify(rep));
            return;
        }
        var dir = req.body.dir;
        if (dir && !check_directory(dir)) {
            rep.error = i18nm.__("invalid_dir");
            res.send(JSON.stringify(rep));
            return;
        }
        if (!dir) {
            dir = '';
        } else {
            dir = '/' + dir;
        }
        dir = app.get('config').dir.storage + dir;
        async.series([
            function(callback) {
                fs.exists(dir, function(ex) {
                    if (!ex) {
                        rep.error = i18nm.__("dir_not_exists");
                        res.send(JSON.stringify(rep));
                        return callback(true);
                    }
                    return callback();
                });
            },
            function(callback) {
                async.eachSeries(files, function(file, escallback) {
                    if (!check_filename(files) || file.match(/^\./) || file.match(/^___thumb_/)) {
                        rep.error = i18nm.__("invalid_filename_syntax");
                        res.send(JSON.stringify(rep));
                        return escallback(true);
                    }
                    fs.exists(dir + '/' + file, function(ex) {
                        if (!ex) {
                            rep.error = i18nm.__("file_not_exists");
                            res.send(JSON.stringify(rep));
                            return escallback(true);
                        }
                        return escallback();
                    });
                }, function(err) {
                    return callback(err);
                });
            },
            function(callback) {
                if (files.length == 1) {
                    fs.stat(dir + '/' + files[0], function(err, stat) {
                        if (stat.isFile()) {
                            res.cookie('fileDownload', 'true');
                            res.download(path.resolve(dir + '/' + files[0]));
                            return callback(true);
                        } else {
                            return callback();
                        }
                    });
                } else {
                    return callback();
                }
            },
            function(callback) {
                var tmp = path.resolve(app.get('config').dir.tmp).replace(/\\/, '/') + '/download_' + Date.now() + '.zip',
                    output = fs.createWriteStream(tmp);
                archive = archiver('zip');
                output.on('close', function() {
                    fs.exists(tmp, function(ex) {
                        if (!ex) {
                            rep.error = i18nm.__("download_error");
                            res.send(JSON.stringify(rep));
                            return callback(true);
                        }
                        res.cookie('fileDownload', 'true');
                        res.download(tmp);
                        return callback();
                    });
                });
                archive.on('error', function(err) {
                    rep.error = i18nm.__("download_error");
                    res.send(JSON.stringify(rep));
                    return callback(true);
                });
                archive.pipe(output);
                async.eachSeries(files, function(file, escallback) {
                    fs.stat(dir + '/' + file, function(err, stat) {
                        if (err) return escallback(true);
                        if (stat.isDirectory()) {
                            archive.bulk([{
                                expand: true,
                                cwd: dir + '/' + file,
                                src: ['**'],
                                dest: file
                            }]);
                            return escallback();
                        }
                        if (stat.isFile()) {
                            archive.file(dir + '/' + file, {
                                name: file
                            });
                            return escallback();
                        }
                        return escallback();
                    });
                }, function(err) {
                    archive.finalize();
                    return callback();
                });
            }
        ]);
    });
    router.post('/data/unzip', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var rep = {};
        // Check authorization
        if (!req.session.auth || req.session.auth.status < 2) {
            rep.error = i18nm.__("unauth");
            res.send(JSON.stringify(rep));
            return;
        }
        var file = req.body.file;
        if (!check_filename(file)) {
            rep.error = i18nm.__("no_file_sent");
            res.send(JSON.stringify(rep));
            return;
        }
        var dir = req.body.dir;
        if (dir && !check_directory(dir)) {
            rep.error = i18nm.__("invalid_dir");
            res.send(JSON.stringify(rep));
            return;
        }
        if (!dir) {
            dir = '';
        } else {
            dir = '/' + dir;
        }
        dir = app.get('config').dir.storage + dir;
        async.series([
            function(callback) {
                fs.exists(dir, function(ex) {
                    if (!ex) {
                        rep.error = i18nm.__("dir_not_exists");
                        res.send(JSON.stringify(rep));
                        return callback(true);
                    }
                    return callback();
                });
            },
            function(callback) {
                fs.exists(dir + '/' + file, function(ex) {
                    if (!ex) {
                        rep.error = i18nm.__("file_not_exists");
                        res.send(JSON.stringify(rep));
                        return callback(true);
                    }
                    return callback();
                });
            },
            function(callback) {
                var file_mime = mime.lookup(dir + '/' + file);
                if (file_mime != 'application/zip') {
                    rep.error = i18nm.__("not_a_zip_archive");
                    res.send(JSON.stringify(rep));
                    return callback(true);
                }
                var rs = fs.createReadStream(dir + '/' + file);
                var p = rs.pipe(unzip.Extract({
                    path: dir
                }));
                p.on('close', function() {
                    rep.status = 1;
                    res.send(JSON.stringify(rep));
                    return callback();
                });
            }
        ]);
    });
    // Helper functions (regexp)
    var check_filename = function(_fn) {
        if (!_fn) return false; // don't allow null
        var fn = String(_fn).replace(/^\s+|\s+$/g, '');
        if (!fn || fn.length > 80) return false; // null or too long
        if (fn.match(/^\./)) return false; // starting with a dot
        if (fn.match(/^[\^<>\:\"\/\\\|\?\*\x00-\x1f]+$/)) return false; // invalid characters
        return true;
    };
    var check_directory = function(_fn) {
        if (!_fn) return true; // allow null
        var fn = String(_fn).replace(/^\s+|\s+$/g, '');
        if (fn.length > 40) return false; // too long
        if (fn.match(/^\./)) return false; // starting with a dot
        if (fn.match(/^\\/)) return false; // starting with a slash
        if (fn.match(/^[\^<>\:\"\\\|\?\*\x00-\x1f]+$/)) return false; // invalid characters
        return true;
    };
    return router;
};
