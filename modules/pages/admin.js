module.exports = function(app) {
	// Sort order hash
	var sort_cells = {
		pfolder: 1,
		pfilename: 1,
		ptitle: 1,
		plang: 1
	};
	var sort_cell_default = 'pfolder';
	var sort_cell_default_mode = 1;
	// Set items per page for this module
	var items_per_page = 30;
	//
	var router = app.get('express').Router();
	var ObjectId = require('mongodb').ObjectID;
	var i18nm = new(require('i18n-2'))({
		locales: app.get('config').locales,
		directory: app.get('path').join(__dirname, 'lang'),
		extension: '.js'
	});
	router.get_module_name = function(req) {
		i18nm.setLocale(req.i18n.getLocale());
		return i18nm.__("module_name");
	};
	router.get('/', function(req, res) {
		i18nm.setLocale(req.i18n.getLocale());
		if (!req.session.auth || req.session.auth.status < 2) {
			req.session.auth_redirect = '/cp/pages';
			res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
			return;
		}

		var data = app.get('mongodb').collection('pages_folders').find({
			oname: 'folders_json'
		}, {
			limit: 1
		}).toArray(function(err, items) {
			var folders;
			if (!items || !items.length || !items[0].ovalue) {
				folders = '[{"id":"j1_1","text":"/","data":null,"parent":"#","type":"root"}]';
			} else {
				folders = items[0].ovalue;
			}
			var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'pages_control', {
				lang: i18nm,
				folders: folders,
				locales: JSON.stringify(app.get('config').locales),
				layouts: JSON.stringify(app.get('config').layouts)
			});
			app.get('cp').render(req, res, {
				body: body,
				css: '<link rel="stylesheet" href="/modules/pages/css/main.css">' + "\n\t\t" + '<link rel="stylesheet" href="/js/jstree/theme/style.min.css">' + "\n\t\t"
			}, i18nm, 'pages', req.session.auth);
		});
	});

	/*

	Pages

	*/

	router.post('/data/list', function(req, res) {
		i18nm.setLocale(req.i18n.getLocale());
		var rep = {
			ipp: items_per_page
		};
		var skip = req.body.skip;
		var query = req.body.query;
		var sort_mode = req.body.sort_mode;
		var sort_cell = req.body.sort_cell;
		if (typeof skip != 'undefined') {
			if (!skip.match(/^[0-9]{1,10}$/)) {
				rep.status = 0;
				rep.error = i18nm.__("invalid_query");
				res.send(JSON.stringify(rep));
				return;
			}
		}
		if (typeof query != 'undefined') {
			if (!query.match(/^[\w\sА-Яа-я0-9_\-\.]{3,40}$/)) {
				rep.status = 0;
				rep.error = i18nm.__("invalid_query");
				res.send(JSON.stringify(rep));
				return;
			}
		}
		// Check authorization
		if (!req.session.auth || req.session.auth.status < 2) {
			rep.status = 0;
			rep.error = i18nm.__("unauth");
			res.send(JSON.stringify(rep));
			return;
		}
		var sort = {};
		sort[sort_cell_default] = sort_cell_default_mode;
		if (typeof sort_cell != 'undefined') {
			if (typeof sort_cells[sort_cell] != 'undefined') {
				sort = {};
				sort[sort_cell] = 1;
				if (typeof sort_mode != 'undefined' && sort_mode == -1) {
					sort[sort_cell] = -1;
				}
			}
		}
		// Get pages from MongoDB
		rep.items = [];
		var find_query = {};
		if (query) {
			find_query = {
				$or: [{
					pfilename: new RegExp(query, 'i')
				}, {
					ptitle: new RegExp(query, 'i')
				}, {
					pfolder: new RegExp(query, 'i')
				}]
			};
		}
		var data = app.get('mongodb').collection('pages').find(find_query).count(function(err, items_count) {
			if (!err && items_count > 0) {
				rep.total = items_count;
				var data = app.get('mongodb').collection('pages').find(find_query, {
					skip: skip,
					limit: items_per_page
				}).sort(sort).toArray(function(err, items) {
					if (typeof items != 'undefined' && !err) {
						// Generate array
						for (var i = 0; i < items.length; i++) {
							var arr = [];
							arr.push(items[i]._id);
							if (items[i].pfolder != '/') {
								items[i].pfilename = '/' + items[i].pfilename;
								items[i].pfilename = items[i].pfilename.replace(/\/$/, '');
							}
							arr.push(items[i].pfolder + items[i].pfilename);
							arr.push(items[i].ptitle);
							arr.push(items[i].plang);
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

	router.post('/data/rootpages', function(req, res) {
		i18nm.setLocale(req.i18n.getLocale());
		var rep = {};
		// Check authorization
		if (!req.session.auth || req.session.auth.status < 2) {
			rep.status = 0;
			rep.error = i18nm.__("unauth");
			res.send(JSON.stringify(rep));
			return;
		}
		// Get pages from MongoDB
		app.get('mongodb').collection('pages').find({
			pfilename: ''
		}, {
			limit: 100
		} ).toArray(function(err, items) {
			rep.root_pages = [];
			if (!err && typeof items != 'undefined') {
				for (var i=0; i<items.length; i++) rep.root_pages.push(items[i].pfolder);
			}
			rep.status = 1;
			res.send(JSON.stringify(rep));
		});
	});

	router.post('/data/load', function(req, res) {
		i18nm.setLocale(req.i18n.getLocale());
		var rep = {};
		var id = req.body.pid;
		if (id && !id.match(/^[a-f0-9]{24}$/)) {
			rep.status = 0;
			rep.error = i18nm.__("invalid_query");
			res.send(JSON.stringify(rep));
			return;
		}
		// Check authorization
		if (!req.session.auth || req.session.auth.status < 2) {
			rep.status = 0;
			rep.error = i18nm.__("unauth");
			res.send(JSON.stringify(rep));
			return;
		}
		// Get pages from MongoDB
		rep.data = {};

		app.get('mongodb').collection('pages').find({
			pfilename: ''
		}, {
			limit: 100
		} ).toArray(function(err, items) {
			rep.root_pages = [];
			if (!err && typeof items != 'undefined') {
				for (var i=0; i<items.length; i++) rep.root_pages.push(items[i].pfolder);
			}
			app.get('mongodb').collection('pages').find({
				_id: new ObjectId(id)
			}, {
				limit: 1
			}).toArray(function(err, items) {
				if (typeof items != 'undefined' && !err) {
					if (items.length > 0) {
						rep.data = items[0];
					}
				}
				// Return results
				rep.status = 1;
				res.send(JSON.stringify(rep));
			});
		});
	});

	router.post('/data/save', function(req, res) {
		i18nm.setLocale(req.i18n.getLocale());
		var rep = {
			err_fields: [],
			status: 1
		};
		// Check authorization
		if (!req.session.auth || req.session.auth.status < 2) {
			rep.status = 0;
			rep.error = i18nm.__("unauth");
			res.send(JSON.stringify(rep));
			return;
		}
		var ptitle = req.body.ptitle,
			pfilename = req.body.pfilename,
			pfolder = req.body.pfolder,
			pfolder_id = req.body.pfolder_id,
			plang = req.body.plang,
			plangcopy = req.body.plangcopy,
			playout = req.body.playout,
			pkeywords = req.body.pkeywords,
			pdesc = req.body.pdesc,
			pcontent = req.body.pcontent,
			id = req.body.pid;
		if (typeof id != 'undefined' && id) {
			if (!id.match(/^[a-f0-9]{24}$/)) {
				rep.status = 0;
				rep.error = i18nm.__("invalid_query");
				res.send(JSON.stringify(rep));
				return;
			}
		}
		var _plang = app.get('config').locales[0];
		for (var i = 0; i < app.get('config').locales.length; i++) {
			if (plang == app.get('config').locales[i]) {
				_plang = app.get('config').locales[i];
			}
		}
		plang = _plang;
		var _playout = app.get('config').layouts.default;
		for (var j = 0; j < app.get('config').layouts.avail.length; j++) {
			if (playout == app.get('config').layouts.avail[j]) {
				_playout = app.get('config').layouts.avail[j];
			}
		}
		playout = _playout;
		// Check form fields
		if (!ptitle || !ptitle.length || ptitle.length > 100) {
			rep.status = 0;
			rep.error = i18nm.__("invalid_ptitle");
			res.send(JSON.stringify(rep));
			return;
		}
		if (!pfolder_id.match(/^[A-Za-z0-9_\-\.]{1,20}$/)) {
			rep.status = 0;
			rep.error = i18nm.__("invalid_folder");
			res.send(JSON.stringify(rep));
			return;
		}
		if (!pfilename.match(/^[A-Za-z0-9_\-\.]{0,80}$/)) {
			rep.status = 0;
			rep.error = i18nm.__("invalid_pfilename");
			res.send(JSON.stringify(rep));
			return;
		}
		// Save

		app.get('mongodb').collection('menu').find({
			lang: plang
		}, {
			limit: 1
		}).toArray(function(err, items) {

		if (id) {
			app.get('mongodb').collection('menu').find({
				lang: plang
			}, {
				limit: 1
			}).toArray(function(err, items) {
				var menu_source, menu_uikit, menu_raw, menu_id;
				if (!err && items && items.length && items[0].menu_source && items[0].menu_raw && items[0].menu_uikit) {
					menu_source = items[0].menu_source;
					menu_raw = items[0].menu_raw;
					menu_uikit = items[0].menu_uikit;
				}
				var data = app.get('mongodb').collection('pages').find({
					pfilename: pfilename,
					pfolder: pfolder,
					plang: plang,
					_id: {
						$ne: new ObjectId(id)
					}
				}, {
					limit: 1
				}).toArray(function(err, items) {
					if ((typeof items != 'undefined' && items.length > 0) || err) {
						rep.status = 0;
						rep.error = i18nm.__("page_exists");
						rep.err_fields.push('pfilename');
						res.send(JSON.stringify(rep));
						return;
					}
					var data = app.get('mongodb').collection('pages').find({
						_id: new ObjectId(id)
					}, {
						limit: 1
					}).toArray(function(err, items) {
						if (typeof items != 'undefined' && !err) {
							if (items.length > 0) {
								var update = {
									ptitle: ptitle,
									pfilename: pfilename,
									pfolder: pfolder,
									pfolder_id: pfolder_id,
									plang: plang,
									playout: playout,
									pkeywords: pkeywords,
									pdesc: pdesc,
									pcontent: pcontent
								};
								app.get('mongodb').collection('pages').update({
									_id: new ObjectId(id)
								}, update, function() {
									rep.status = 1;
									res.send(JSON.stringify(rep));
								});
								if (menu_source) {
									var url_old = items[0].pfolder;
									if (url_old != '/') url_old += '/';
									url_old += items[0].pfilename;
									if (items[0].pfolder != '/') {
										url_old = url_old.replace(/\/$/, '');
									}
									var url_new = pfolder;
									if (url_new != '/') url_new += '/';
									url_new += pfilename;
									if (pfolder != '/') {
										url_new = url_new.replace(/\/$/, '');
									}
									var rx1 = new RegExp('href=\"' + url_old + '\"');
									var rx2 = new RegExp('>' + url_old + '<');
									menu_source = menu_source.replace(rx1, 'href="' + url_new + '"').replace(rx2, '>' + url_new + '<');
									menu_raw = menu_raw.replace(rx1, 'href="' + url_new + '"');
									menu_uikit = menu_uikit.replace(rx1, 'href="' + url_new + '"');
									var data = {
										lang: plang,
										menu_source: menu_source,
										menu_raw: menu_raw,
										menu_uikit: menu_uikit
									};
									app.get('mongodb').collection('menu').update({
										lang: plang
									}, data, function() {});
								}
								return;
							}
						} else {
							rep.status = 0;
							rep.error = i18nm.__("id_not_found");
							res.send(JSON.stringify(rep));
						}
					});
				});
			});
		} else {
			var data1 = app.get('mongodb').collection('pages').find({
				pfilename: pfilename,
				pfolder: pfolder,
				plang: plang,
			}, {
				limit: 1
			}).toArray(function(err, items) {
				if ((typeof items != 'undefined' && items.length > 0) || err) {
					rep.status = 0;
					rep.error = i18nm.__("page_exists");
					rep.err_fields.push('pfilename');
					res.send(JSON.stringify(rep));
					return;
				}
				app.get('mongodb').collection('pages').insert({
					ptitle: ptitle,
					pfilename: pfilename,
					pfolder: pfolder,
					pfolder_id: pfolder_id,
					plang: plang,
					playout: playout,
					pkeywords: pkeywords,
					pdesc: pdesc,
					pcontent: pcontent
				}, function() {
					rep.status = 1;
					res.send(JSON.stringify(rep));
				});
			});
		}

		});
	});

	router.post('/data/delete', function(req, res) {
		i18nm.setLocale(req.i18n.getLocale());
		var rep = {
			status: 1
		};
		// Check authorization
		if (!req.session.auth || req.session.auth.status < 2) {
			rep.status = 0;
			rep.error = i18nm.__("unauth");
			res.send(JSON.stringify(rep));
			return;
		}
		var ids = req.body.ids;
		if (typeof ids != 'object' || ids.length < 1) {
			rep.status = 0;
			rep.error = i18nm.__("invalid_query");
			res.send(JSON.stringify(rep));
			return;
		}
		for (var i = 0; i < ids.length; i++) {
			if (ids[i].match(/^[a-f0-9]{24}$/)) {
				app.get('mongodb').collection('pages').remove({
					_id: new ObjectId(ids[i])
				}, dummy);
			}
		}
		res.send(JSON.stringify(rep));
	});

	var dummy = function() {};

	/*

	Folders

	*/

	router.post('/data/folders/load', function(req, res) {
		i18nm.setLocale(req.i18n.getLocale());
		var rep = {
			status: 1
		};
		// Check authorization
		if (!req.session.auth || req.session.auth.status < 2) {
			rep.status = 0;
			rep.error = i18nm.__("unauth");
			res.send(JSON.stringify(rep));
			return;
		}
		var data = app.get('mongodb').collection('pages_folders').find({
			oname: 'folders_json'
		}, {
			limit: 1
		}).toArray(function(err, items) {
			if (err) {
				rep.status = 0;
				rep.error = i18nm.__("cannot_load_db_data");
				res.send(JSON.stringify(rep));
				return;
			}
			if (!items || !items.length || !items[0].ovalue) {
				rep.folders = '[{"id":"j1_1","text":"/","data":null,"parent":"#","type":"root"}]';
				res.send(JSON.stringify(rep));
				return;
			}
			rep.folders = items[0].ovalue;
			res.send(JSON.stringify(rep));
		});
	});

	router.post('/data/folders/save', function(req, res) {
		i18nm.setLocale(req.i18n.getLocale());
		var rep = {
			status: 1
		};
		// Check authorization
		if (!req.session.auth || req.session.auth.status < 2) {
			rep.status = 0;
			rep.error = i18nm.__("unauth");
			res.send(JSON.stringify(rep));
			return;
		}
		var json = req.body.json;
		try {
			JSON.parse(json);
		} catch (e) {
			rep.status = 0;
			rep.error = i18nm.__("cannot_parse_json");
			res.send(JSON.stringify(rep));
			return;
		}
		app.get('mongodb').collection('pages_folders').remove(function(err) {
			if (!err) {
				app.get('mongodb').collection('pages_folders').insert({
					oname: 'folders_json',
					ovalue: json
				}, function(err) {
					if (err) {
						rep.status = 0;
						rep.error = i18nm.__("cannot_save_db_data");
						res.send(JSON.stringify(rep));
						return;
					}
					res.send(JSON.stringify(rep));
				});
			}
		});
	});
	return router;
};
