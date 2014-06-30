module.exports = function(app) {
	var router = app.get('express').Router();
	var i18nm = new(require('i18n-2'))({
		locales: app.get('config').locales,
		directory: app.get('path').join(__dirname, 'lang'),
		extension: '.js'
	});
	router.get(/(.*)/, function(req, res, next) {
		i18nm.setLocale(req.i18n.getLocale());
		var url_parts = req.params[0].split('/');
		url_parts.forEach(function(fn) {
			if (fn.match(/ /)) return next(); // whitespace
			if (fn.match(/^[\^<>\/\:\"\\\|\?\*\x00-\x1f]+$/)) return next(); // invalid characters
		});
		var fd1 = url_parts.join('/');
		var fn1 = '';
		var fd2 = req.params[0].split('/').slice(0, -1).join('/') || '/';
		var fn2 = url_parts[url_parts.length - 1];
		var find_query = {
			plang: req.i18n.getLocale(),
			$or: [{
				pfolder: fd1,
				pfilename: fn1
			}, {
				pfolder: fd2,
				pfilename: fn2
			}]
		};

		var data = app.get('mongodb').collection('pages_folders').find({
			oname: 'folders_json'
		}, {
			limit: 1
		}).toArray(function(err, items) {
			var folders;
			if (!items || !items.length || !items[0].ovalue) {
				folders = [{
					"id": "j1_1",
					"text": "/",
					"data": null,
					"parent": "#",
					"type": "root"
				}];
			} else {
				folders = JSON.parse(items[0].ovalue);
			}
			app.get('mongodb').collection('pages').find(find_query, {
				limit: 1
			}).toArray(function(err, items) {
				if (!err && typeof items != 'undefined' && items && items.length && !err) {
					var pfolder_id = items[0].pfolder_id || 'j1_1';
					var bread = folders_find_path(folders_make_hash(folders), pfolder_id).reverse();
					var bread_html = '<li><a href="/">' + app.get('settings').site_title + '</a></li>';
					var bread_path = '';
					for (var i = 0; i < bread.length; i++) {
						bread_path += '/' + bread[i].name;
						var ln = bread[i][req.i18n.getLocale()] || bread[i].name;
						bread_html += '<li><a href="' + bread_path + '">' + ln + '</a></li>';
					}
					var data = {
						title: items[0].ptitle,
						content: items[0].pcontent,
						keywords: items[0].keywords,
						description: items[0].desc,
						bread: bread,
						bread_html: bread_html
					};
					var layout = items[0].playout || undefined;
					app.get('renderer').render(res, layout, data);
				} else {
					return next();
				}
			});
		});
	});

	var folders_make_hash = function(fldrs) {
		var fh = {};
		for (var i = 0; i < fldrs.length; i++) {
			fh[fldrs[i].id] = fldrs[i];
			delete fh[fldrs[i].id].id;
		}
		return fh;
	};

	var folders_find_path = function(fldrs_hash, id, _path) {
		var path = _path || [];
		if (fldrs_hash && id && fldrs_hash[id] && fldrs_hash[id].parent && fldrs_hash[id].parent != '#') {
			var pi = {
				name: fldrs_hash[id].text
			};
			var locales = app.get('config').locales;
			if (fldrs_hash[id].data && fldrs_hash[id].data.lang) {
				for (var i = 0; i < locales.length; i++) {
					pi[locales[i]] = fldrs_hash[id].data.lang[locales[i]];
				}
			}
			path.push(pi);
			folders_find_path(fldrs_hash, fldrs_hash[id].parent, path);
		}
		return path;
	};

	return router;
};
