module.exports = function (app) {
	var i18nm = new(require('i18n-2'))({
		locales: app.get('config').locales,
		directory: app.get('path').join(__dirname, 'lang'),
		extension: '.js'
	});	
	var fs = require("fs-extra");
	var router = app.get('express').Router();
	var mime = require('mime');
	var archiver = require('archiver');
	var unzip = require('unzip');
	var gm = false;
	if (app.get('config').graphicsmagick) {
		gm = require('gm');
	}
	var crypto = require('crypto');
	router.get_module_name = function (req) {
		i18nm.setLocale(req.i18n.getLocale());
		return i18nm.__("module_name");
	};
	router.get('/', function (req, res) {
		i18nm.setLocale(req.i18n.getLocale());
		if (!req.session.auth || req.session.auth.status < 2) {
			req.session.auth_redirect = '/cp/files';
			res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
			return;
		}
		var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'files', {
			lang: i18nm,
			locales: JSON.stringify(app.get('config').locales)
		});
		app.get('cp').render(req, res, {
			body: body,
			css: '<link rel="stylesheet" href="/modules/files/css/main.css">' + "\n\t\t"
		}, i18nm, 'files', req.session.auth);
	});
	router.post('/data/load', function (req, res) {
		i18nm.setLocale(req.i18n.getLocale());
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
		if (req_dir) {
			req_dir = '/' + req_dir;
		} else {
			req_dir = '';
		}
		var dir = app.get('config').dir.storage + req_dir;
		if (!fs.existsSync(dir)) {
			rep.status = 0;
			rep.error = i18nm.__("dir_not_exists");
			res.send(JSON.stringify(rep));
			return;	
		}
		var files = fs.readdirSync(dir);
		var fa = [];
		var da = [];
		files.forEach(function (file) {
			var item = { name: file };
			var stat = fs.statSync(dir + '/' + file);
			if (stat.isFile() && !file.match(/^\./) && !file.match(/^___thumb_/)) {
				var file_mime = mime.lookup(dir + '/' + file);
				if (file_mime == 'image/png' || file_mime == 'image/jpeg') {
					var md5 = crypto.createHash('md5');
					var fn = md5.update(file).digest('hex');
					if (fs.existsSync(dir + '/___thumb_' + fn + '.jpg')) {
						item.thumb = fn;
					}
				}
				item.type = 'f';
				item.size = stat['size'];
				item.mime = file_mime;
				fa.push(item);
			}
			if (stat.isDirectory() && !file.match(/^\./)) {
				item.type = 'd';
				item.size = '0';
				item.mime = '';
				da.push(item);
			}
		});
		da.sort(function(a, b) { if (!a.name || !b.name) return a.name.localeCompare(b.name); return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); } );
		fa.sort(function(a, b) { if (!a.name || !b.name) return a.name.localeCompare(b.name); return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); } );
		rep.files = da.concat(fa);
		rep.status = 1;
		res.send(JSON.stringify(rep));
	});
	router.post('/data/newdir', function (req, res) {
		i18nm.setLocale(req.i18n.getLocale());
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
		var new_dir = req.body.newdir.replace(/^\s+|\s+$/g,'');
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
		//var dir = app.get('path').dirname(require.main.filename).replace(/\\/g, '/').replace('/bin', '') + app.get('config').dir.storage + req_dir;
		var dir = app.get('config').dir.storage + req_dir;
		if (!fs.existsSync(dir)) {
			rep.status = 0;
			rep.error = i18nm.__("dir_not_exists");
			res.send(JSON.stringify(rep));
			return;	
		}
		if (fs.existsSync(dir + '/' + new_dir)) {
			rep.status = 0;
			rep.error = i18nm.__("dir_already_exists");
			res.send(JSON.stringify(rep));
			return;
		}
		var fsres = fs.mkdirSync(dir + '/' + new_dir);
		if (fsres) {
			rep.status = 0;
			rep.error = i18nm.__("newdir_error");
			res.send(JSON.stringify(rep));
			return;		
		}
		rep.status = 1;
		res.send(JSON.stringify(rep));
	});
	router.post('/data/del', function (req, res) {
		i18nm.setLocale(req.i18n.getLocale());
		var rep = {};		
		// Check authorization
		if (!req.session.auth || req.session.auth.status < 2) {
			rep.status = 0;
			rep.error = i18nm.__("unauth");
			res.send(JSON.stringify(rep));
			return;
		}
		var fna = req.body.items;
		if (!fna || !fna.length) {
			rep.status = 0;
			rep.error = i18nm.__("invalid_request") + "1";
			res.send(JSON.stringify(rep));
			return;	
		}
		for (var i=0; i<fna.length; i++) {
			if (!check_filename(fna[i])) {
				rep.status = 0;
				rep.error = i18nm.__("invalid_request");
				res.send(JSON.stringify(rep));
				return;		
			}
		}
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
		if (!fs.existsSync(dir)) {
			rep.status = 0;
			rep.error = i18nm.__("dir_not_exists");
			res.send(JSON.stringify(rep));
			return;	
		}
		var ure = false;
		for (var i=0; i<fna.length; i++) {
			var stat = fs.statSync(dir + '/' + fna[i]);
			var ur = undefined;
			if (stat.isFile()) {
				ur = fs.unlinkSync(dir + '/' + fna[i]);
			} else {
				ur = fs.removeSync(dir + '/' + fna[i]);
			}			
			var md5 = crypto.createHash('md5');
			var fn = md5.update(fna[i]).digest('hex');
			if (fs.existsSync(dir + '/___thumb_' + fn + '.jpg')) {
				fs.unlinkSync(dir + '/___thumb_' + fn + '.jpg');
			}
			if (ur) ure = true;
		}
		if (ure) {
			rep.status = 0;
			rep.error = i18nm.__("some_files_not_deleted");
			res.send(JSON.stringify(rep));
			return;	
		}
		rep.status = 1;
		res.send(JSON.stringify(rep));
	});
	router.post('/data/rename', function (req, res) {
		i18nm.setLocale(req.i18n.getLocale());
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
		if (!fs.existsSync(dir)) {
			rep.status = 0;
			rep.error = i18nm.__("dir_not_exists");
			res.send(JSON.stringify(rep));
			return;	
		}
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
		if (!fs.existsSync(dir + '/' + old_filename)) {
			rep.status = 0;
			rep.error = i18nm.__("file_not_exists");
			res.send(JSON.stringify(rep));
			return;	
		}
		if (fs.existsSync(dir + '/' + new_filename)) {
			rep.status = 0;
			rep.error = i18nm.__("cannot_rename_same");
			res.send(JSON.stringify(rep));
			return;	
		}
		var cr = fs.renameSync(dir + '/' + old_filename, dir + '/' + new_filename);
		var fn = crypto.createHash('md5').update(old_filename).digest('hex');
		if (fs.existsSync(dir + '/___thumb_' + fn + '.jpg')) {
			var nf = crypto.createHash('md5').update(new_filename).digest('hex');
			fs.renameSync(dir + '/___thumb_' + fn + '.jpg', dir + '/___thumb_' + nf + '.jpg');
		}
		if (cr) {
			rep.status = 0;
			rep.error = i18nm.__("rename_error");
			res.send(JSON.stringify(rep));
			return;	
		}
		rep.status = 1;
		res.send(JSON.stringify(rep));
	});
	router.post('/data/paste', function (req, res) {
		i18nm.setLocale(req.i18n.getLocale());
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
		for (var i=0; i<clpbrd.files.length; i++) {
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
	    for (var i=0; i<clpbrd.files.length; i++) {
	    	var _fn = clpbrd.dir + '/' + clpbrd.files[i]; 
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
		if (!fs.existsSync(source_dir)) {
			rep.status = 0;
			rep.error = i18nm.__("dir_not_exists");
			res.send(JSON.stringify(rep));
			return;	
		}
		if (!dest_dir) {
			dest_dir = '';
		} else {
			dest_dir = '/' + dest_dir;
		}
		dest_dir = app.get('config').dir.storage + dest_dir;
		if (!fs.existsSync(dest_dir)) {
			rep.status = 0;
			rep.error = i18nm.__("dir_not_exists");
			res.send(JSON.stringify(rep));
			return;	
		}
		var ure = false;
		source_dir = source_dir.replace(/\/\//g, '/');
		dest_dir = dest_dir.replace(/\/\//g, '/');
		for (var i=0; i<clpbrd.files.length; i++) {			
			var src = source_dir + '/' + clpbrd.files[i];
			if (!fs.existsSync(src)) {
				rep.status = 0;
				rep.error = i18nm.__("dir_or_file_not_exists");
				res.send(JSON.stringify(rep));
				return;	
			}
			var dst = dest_dir + '/' + clpbrd.files[i];			
			if (src == dst || src == dest_dir) {
				rep.status = 0;
				rep.error = i18nm.__("cannot_paste_to_itself");
				res.send(JSON.stringify(rep));  
	            return;
			}			
			var stat = fs.statSync(src);
			var ur = undefined;
			if (stat.isFile() || stat.isDirectory()) {
				if (stat.isFile()) {
					var _ur;
					if (clpbrd.mode == 'cut') {
						_ur = fs.renameSync(src, dst);
					} else {
						_ur = fs.copySync(src, dst);
					}
					ur = _ur;
				} else {
					var _ur = fs.copySync(src, dst);
					ur = _ur;
					if (clpbrd.mode == 'cut' && !_ur) {
						fs.removeSync(src);
					}
				}
			}
			var fn = crypto.createHash('md5').update(clpbrd.files[i]).digest('hex');
			if (fs.existsSync(source_dir + '/___thumb_' + fn + '.jpg')) {
				if (clpbrd.mode == 'cut') {
					fs.renameSync(source_dir + '/___thumb_' + fn + '.jpg', dest_dir  + '/___thumb_' + fn + '.jpg');
				} else {
					fs.copySync(source_dir + '/___thumb_' + fn + '.jpg', dest_dir  + '/___thumb_' + fn + '.jpg');
				}
			}
			if (ur) ure = true;
		}
		rep.status = 1;
		res.send(JSON.stringify(rep));
		return;		
	});
	router.post('/data/upload', function (req, res) {
		i18nm.setLocale(req.i18n.getLocale());
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
		if (!fs.existsSync(dir)) {
			rep.status = 0;
			rep.error = i18nm.__("dir_not_exists");
			res.send(JSON.stringify(rep));
			return;	
		}		
		var cr = fs.renameSync(app.get('config').dir.tmp + '/' + file.name, dir + '/' + file.originalname);
		if (cr) {
			rep.status = 0;
			rep.error = i18nm.__("upload_failed");
			res.send(JSON.stringify(rep));
			return;		
		}
		// Create thumbnail if GM is available
		if (gm && (file.mimetype == 'image/png' || file.mimetype == 'image/jpeg')) {
			var md5 = crypto.createHash('md5');
			var fn = md5.update(file.originalname).digest('hex');
			var img = gm(dir + '/' + file.originalname);
			img.autoOrient();
			img.size(function (err, size) {
				if (!err) {
				  	if (size.width >= size.height) {
				  		img.resize(null, 70);
				  		img.crop(70,70, 0, 0);
				  	} else {
				  		img.resize(70, null);
				  		img.crop(70,70, 0, 0);
				  	}			  	
					img.setFormat('jpeg');
					img.write(dir + '/___thumb_' + fn + '.jpg', function(err) {
						// OK, we don't care
					});
				}
			});				
		}
		rep.status = 1;
		res.send(JSON.stringify(rep));
		return;	
	});
	router.post('/data/download', function (req, res) {
		i18nm.setLocale(req.i18n.getLocale());
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
		if (!fs.existsSync(dir)) {
			rep.error = i18nm.__("dir_not_exists");
			res.send(JSON.stringify(rep));
			return;	
		}
		for (var i=0; i<files.length; i++) {
			if (!check_filename(files[i])) {
				rep.error = i18nm.__("invalid_filename_syntax");
				res.send(JSON.stringify(rep));
				return;	
			}
			if (!fs.existsSync(dir + '/' + files[i]) || files[i].match(/^\./) || files[i].match(/^___thumb_/)) {
				rep.error = i18nm.__("file_not_exists");
				res.send(JSON.stringify(rep));
				return;	
			}		
		}
		if (files.length == 1) {
			var stat = fs.statSync(dir + '/' + files[0]);
			if (stat.isFile()) {
				res.cookie('fileDownload', 'true');
				res.download(app.get('path').resolve(dir + '/' + files[0]));
				return;
			}
		}
		var tmp = app.get('path').resolve(app.get('config').dir.tmp).replace(/\\/, '/') + '/download_' + Date.now() + '.zip';
		var output = fs.createWriteStream(tmp);
		var archive = archiver('zip');
		output.on('close', function () {
			if (!fs.existsSync(tmp)) {
				rep.error = i18nm.__("download_error");
				res.send(JSON.stringify(rep));
				return;	
			}
			res.cookie('fileDownload', 'true');
			res.download(tmp)
			return;
		});
		archive.on('error', function(err){
		    rep.error = i18nm.__("download_error");
			res.send(JSON.stringify(rep));
			return;	
		});
		archive.pipe(output);
		for (var i=0; i<files.length; i++) {
			var stat = fs.statSync(dir + '/' + files[i]);
			if (stat.isDirectory()) {
				archive.bulk([
				    { expand: true, cwd: dir + '/' + files[i], src: ['**'], dest: files[i]}
				]);
			}
			if (stat.isFile()) {
				archive.file(dir + '/' + files[i], { name: files[i] });
			}
		}		
		archive.finalize();		
	});
	router.post('/data/unzip', function (req, res) {
		i18nm.setLocale(req.i18n.getLocale());
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
		if (!fs.existsSync(dir)) {
			rep.error = i18nm.__("dir_not_exists");
			res.send(JSON.stringify(rep));
			return;	
		}
		if (!fs.existsSync(dir + '/' + file)) {
			rep.error = i18nm.__("file_not_exists");
			res.send(JSON.stringify(rep));
			return;	
		}
		var file_mime = mime.lookup(dir + '/' + file);
		if (file_mime != 'application/zip') {
			rep.error = i18nm.__("not_a_zip_archive");
			res.send(JSON.stringify(rep));
			return;		
		}
		var rs = fs.createReadStream(dir + '/' + file);
		var p = rs.pipe(unzip.Extract({ path: dir }));
		p.on('close', function() {
			rep.status = 1;
			res.send(JSON.stringify(rep));
			return;	
		});		
	});
	// Helper functions (regexp)
	var check_filename = function(_fn) {
		if (!_fn) return false; // don't allow null
		var fn = _fn.replace(/^\s+|\s+$/g,'');
		if (!fn || fn.length > 80) return false; // null or too long
		if (fn.match(/^\./)) return false; // starting with a dot
		if (fn.match(/^[\^<>\:\"\/\\\|\?\*\x00-\x1f]+$/)) return false; // invalid characters
		return true;
	};
	var check_directory = function(_fn) {
		if (!_fn) return true; // allow null
		var fn = _fn.replace(/^\s+|\s+$/g,'');
		if (fn.length > 40) return false; // too long
		if (fn.match(/^\./)) return false; // starting with a dot
    	if (fn.match(/^\\/)) return false; // starting with a slash
		if (fn.match(/^[\^<>\:\"\\\|\?\*\x00-\x1f]+$/)) return false; // invalid characters
		return true;
	};
	return router;
}