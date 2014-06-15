module.exports = function (app) {
	var i18nm = new(require('i18n-2'))({
		locales: app.get('config').locales,
		directory: app.get('path').join(__dirname, 'lang'),
		extension: '.js'
	});
	var fs = require("fs-extra");
	var router = app.get('express').Router();
	var mime = require('mime');
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
		if (req_dir && !req_dir.match(/^[A-Za-z0-9_\-\/]{0,40}$/)) {
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
		//var dir = app.get('path').dirname(require.main.filename).replace(/\\/g, '/').replace('/bin', '') + app.get('config').storage_dir + req_dir;
		var dir = app.get('config').storage_dir + req_dir;
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
			if (stat.isFile() && !file.match(/^\./)) {
				item.type = 'f';
				item.size = stat['size'];
				item.mime = mime.lookup(dir + '/' + file).replace('/', '_');
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
		if (req_dir && !req_dir.match(/^[A-Za-z0-9_\-\/]{0,40}$/)) {
			rep.status = 0;
			rep.error = i18nm.__("invalid_dir");
			res.send(JSON.stringify(rep));
			return;
		}
		var new_dir = req.body.newdir;
		if (!new_dir.match(/^[A-Za-z0-9_\-]{0,40}$/)) {
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
		//var dir = app.get('path').dirname(require.main.filename).replace(/\\/g, '/').replace('/bin', '') + app.get('config').storage_dir + req_dir;
		var dir = app.get('config').storage_dir + req_dir;
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
			rep.error = i18nm.__("invalid_request");
			res.send(JSON.stringify(rep));
			return;	
		}
		for (var i=0; i<fna.length; i++) {
			if (!fna[i].match(/^[A-Za-z0-9_\-\.]{1,80}$/)) {
				rep.status = 0;
				rep.error = i18nm.__("invalid_request");
				res.send(JSON.stringify(rep));
				return;		
			}
		}
		var req_dir = req.body.dir;
		if (req_dir && !req_dir.match(/^[A-Za-z0-9_\-\/]{0,40}$/)) {
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
		var dir = app.get('config').storage_dir + req_dir;
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
			if (!clpbrd.files[i].match(/^[A-Za-z0-9_\-\.]{1,80}$/)) {
				rep.status = 0;
				rep.error = i18nm.__("invalid_request");
				res.send(JSON.stringify(rep));
				return;		
			}
		}
		var source_dir = clpbrd.dir;
		if (source_dir && !source_dir.match(/^[A-Za-z0-9_\-\/]{0,40}$/)) {
			rep.status = 0;
			rep.error = i18nm.__("invalid_dir");
			res.send(JSON.stringify(rep));
			return;
		}		
		var dest_dir = req.body.dest;
		if (dest_dir && !dest_dir.match(/^[A-Za-z0-9_\-\/]{0,40}$/)) {
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
		source_dir = app.get('config').storage_dir + source_dir;
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
		dest_dir = app.get('config').storage_dir + dest_dir;
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
				var _ur = fs.copySync(src, dst);
				ur = _ur;
				if (clpbrd.mode == 'cut' && !_ur) {
					fs.removeSync(src);
				}
			}			
			if (ur) ure = true;
		}
		rep.status = 1;
		res.send(JSON.stringify(rep));
		return;
		
	});
	return router;
}