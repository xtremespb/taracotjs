module.exports = function (app) {
	var i18nm = new(require('i18n-2'))({
		locales: app.get('config').locales,
		directory: app.get('path').join(__dirname, 'lang'),
		extension: '.js'
	});
	var fs = require("fs");
	var router = app.get('express').Router();
	var mime = require('mime');
	var wrench = require('wrench');
	router.get_module_name = function (req) {
		i18nm.setLocale(req.i18n.getLocale());
		return i18nm.__("module_name");
	};
	router.get('/', function (req, res) {
		i18nm.setLocale(req.i18n.getLocale());
		if (!req.session.auth || req.session.auth.status < 2) {
			req.session.auth_redirect = '/cp/settings';
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
			var ur = wrench.rmdirSyncRecursive(dir + '/' + fna[i], true)
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
	return router;
}