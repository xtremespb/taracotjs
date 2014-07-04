module.exports = function(app) {
	var i18nm = new(require('i18n-2'))({
		locales: app.get('config').locales,
		directory: app.get('path').join(__dirname, 'lang'),
		extension: '.js'
	});
	var fs = require('fs-extra');
	var itob = require('istextorbinary');
	var mime = require('mime');
	var router = app.get('express').Router();
	var path = app.get('path');
	router.get_module_name = function(req) {
		i18nm.setLocale(req.i18n.getLocale());
		return i18nm.__("module_name");
	};
	router.get('/', function(req, res, next) {
		i18nm.setLocale(req.i18n.getLocale());
		if (!req.session.auth || req.session.auth.status < 2) {
			req.session.auth_redirect = '/cp/textedit';
			res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
			return;
		}
		var fn = req.query.fn;
		if (!fn || fn.match(/\.\./)) {
			return send_error(res);
		}
		var fp = path.resolve(app.get('config').dir.storage + '/' + fn).replace(/\\/g, '/');
		var rx1 = new RegExp('^' + path.resolve(app.get('config').dir.storage).replace(/\\/g, '/'));
		if (!fp.match(rx1) || !fs.existsSync(fp)) {
			return send_error(res);
		}
		var stat = fs.statSync(fp);
		if (!stat.isFile()) {
			return send_error(res, i18nm.__('not_a_file'));
		}
		var sz = app.get('config').max_edit_file_kb * 1024 || 1048576;
		if (stat.size > sz) {
			return send_error(res, i18nm.__('file_too_large'));
		}
		if (!itob.isTextSync(fp)) {
			return send_error(res, i18nm.__('cannot_edit_binary_file'));
		}
		var content = fs.readFileSync(fp, 'utf8');
		var file = {
			name: fn,
			mime: mime.lookup(fp),
			size: stat.size
		};
		var fmime = mime.lookup(fp);
		var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'editor', {
			lang: i18nm,
			content: content,
			file: JSON.stringify(file),
			locales: JSON.stringify(app.get('config').locales)
		});
		res.send(body);
	});
	router.post('/data/save', function(req, res, next) {
		i18nm.setLocale(req.i18n.getLocale());
		if (!req.session.auth || req.session.auth.status < 2) {
			req.session.auth_redirect = '/cp/textedit';
			res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
			return;
		}
		var rep = {
			status: 1
		};
		var fn = req.body.fn;
		if (!fn || fn.match(/\.\./)) {
			rep.status = 0;
			rep.error = i18nm.__("invalid_filename");
			res.send(JSON.stringify(rep));
			return;
		}
		var fp = path.resolve(app.get('config').dir.storage + '/' + fn).replace(/\\/g, '/');
		var rx1 = new RegExp('^' + path.resolve(app.get('config').dir.storage).replace(/\\/g, '/'));
		if (!fp.match(rx1)) {
			rep.status = 0;
			rep.error = i18nm.__("invalid_filename");
			res.send(JSON.stringify(rep));
			return;
		}
		var content = req.body.content;
		var sz = app.get('config').max_edit_file_kb * 1024 || 1048576;
		if (content && content.length > sz) {
			rep.status = 0;
			rep.error = i18nm.__("file_too_large");
			res.send(JSON.stringify(rep));
			return;
		}
		fs.ensureFile(fp, function(err) {
			if (err) {
				rep.status = 0;
				rep.error = i18nm.__("error_while_creating");
				res.send(JSON.stringify(rep));
				return;
			}
			fs.writeFile(fp, content, function(err) {
				if (err) {
					rep.status = 0;
					rep.error = i18nm.__("error_while_creating");
					res.send(JSON.stringify(rep));
					return;
				}
				return res.send(rep);
			});
		});
	});
	var send_error = function(res, msg) {
		var err = i18nm.__('file_loading_error');
		if (msg) err = msg;
		var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'error', {
			lang: i18nm,
			err: err,
			locales: JSON.stringify(app.get('config').locales)
		});
		res.send(body);
	};
	return router;
};