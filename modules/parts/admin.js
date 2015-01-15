module.exports = function(app) {
	// Sort order hash
	var sort_cells = {
		pname: 1,
		lang: 1
	};
	var sort_cell_default = 'pname';
	var sort_cell_default_mode = 1;
	// Set items per page for this module
	var items_per_page = 30;
	//
	var router = app.get('express').Router();
	var ObjectId = require('mongodb').ObjectID;
	var i18nm = new(require('i18n-2'))({
		locales: app.get('config').locales,
		directory: app.get('path').join(__dirname, 'lang'),
		extension: '.js',
    	devMode: app.get('config').locales_dev_mode
	});
	router.get_module_name = function(req) {
		i18nm.setLocale(req.session.current_locale);
		return i18nm.__("module_name");
	};
	router.get('/', function(req, res) {
		i18nm.setLocale(req.session.current_locale);
		if (!req.session.auth || req.session.auth.status < 2) {
			req.session.auth_redirect_host = req.get('host');
			req.session.auth_redirect = '/cp/parts';
			res.redirect(303, "/auth/cp?rnd=" + Math.random().toString().replace('.', ''));
			return;
		}
		var body = app.get('renderer').render_file(app.get('path').join(__dirname, 'views'), 'parts_control', {
			lang: i18nm,
			locales: JSON.stringify(app.get('config').locales)
		}, req);
		res.send(body);
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
		// Get parts from MongoDB
		rep.items = [];
		var find_query = {};
		if (query) {
			find_query = {
				pname: new RegExp(query, 'i')
			};
		}
		app.get('mongodb').collection('parts').find(find_query).count(function(err, items_count) {
			if (!err && items_count > 0) {
				rep.total = items_count;
				app.get('mongodb').collection('parts').find(find_query, {
					skip: skip,
					limit: items_per_page
				}).sort(sort).toArray(function(err, items) {
					if (typeof items != 'undefined' && !err) {
						// Generate array
						for (var i = 0; i < items.length; i++) {
							var arr = [];
							arr.push(items[i]._id);
							arr.push(items[i].pname);
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
	router.post('/data/load', function(req, res) {
		i18nm.setLocale(req.session.current_locale);
		var rep = {};
		var user_id = req.body.id;
		if (typeof user_id == 'undefined' || !user_id.match(/^[a-f0-9]{24}$/)) {
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
		// Get parts from MongoDB
		rep.data = {};
		app.get('mongodb').collection('parts').find({
			_id: new ObjectId(user_id)
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
	router.post('/data/save', function(req, res) {
		i18nm.setLocale(req.session.current_locale);
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
		var pname = req.body.pname,
			pvalue = req.body.pvalue,
			plang = req.body.plang,
			id = req.body.id;
		if (typeof id != 'undefined' && id) {
			if (!id.match(/^[a-f0-9]{24}$/)) {
				rep.status = 0;
				rep.error = i18nm.__("invalid_query");
				res.send(JSON.stringify(rep));
				return;
			}
		}
		if (!pname.match(/^[A-Za-z0-9_\-]{1,40}$/)) {
			rep.status = 0;
			rep.err_fields.push('pname');
		}
		pname = pname.toLowerCase();
		if (pvalue.length > 2097152) { // 2MB
			rep.status = 0;
			rep.err_fields.push('pvalue');
		}
		var _plang = app.get('config').locales[0];
		for (var i = 0; i < app.get('config').locales.length; i++) {
			if (plang == app.get('config').locales[i]) {
				_plang = app.get('config').locales[i];
			}
		}
		plang = _plang;
		if (rep.status === 0) {
			res.send(JSON.stringify(rep));
			return;
		}
		if (id) {
			app.get('mongodb').collection('parts').find({
				pname: pname,
				plang: plang,
				_id: {
					$ne: new ObjectId(id)
				}
			}, {
				limit: 1
			}).toArray(function(err, items) {
				if ((typeof items != 'undefined' && items.length > 0) || err) {
					rep.status = 0;
					rep.error = i18nm.__("option_exists");
					rep.err_fields.push('pname');
					res.send(JSON.stringify(rep));
					return;
				}
				app.get('mongodb').collection('parts').find({
					_id: new ObjectId(id)
				}, {
					limit: 1
				}).toArray(function(err, items) {
					if (typeof items != 'undefined' && !err) {
						if (items.length > 0) {
							var update = {
								pname: pname,
								pvalue: pvalue,
								plang: plang
							};
							app.get('mongodb').collection('parts').update({
								_id: new ObjectId(id)
							}, update, function() {
								rep.status = 1;
								res.send(JSON.stringify(rep));
							});
							return;
						}
					} else {
						rep.status = 0;
						rep.error = i18nm.__("id_not_found");
						res.send(JSON.stringify(rep));
					}
				});
			});
		} else {
			var data1 = app.get('mongodb').collection('parts').find({
				pname: pname,
				plang: plang
			}, {
				limit: 1
			}).toArray(function(err, items) {
				if ((typeof items != 'undefined' && items.length > 0) || err) {
					rep.status = 0;
					rep.error = i18nm.__("option_exists");
					rep.err_fields.push('pname');
					res.send(JSON.stringify(rep));
					return;
				}
				app.get('mongodb').collection('parts').insert({
					pname: pname,
					pvalue: pvalue,
					plang: plang
				}, function() {
					rep.status = 1;
					res.send(JSON.stringify(rep));
				});
			});
		}
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
				app.get('mongodb').collection('parts').remove({
					_id: new ObjectId(ids[i])
				}, dummy);
			}
		}
		res.send(JSON.stringify(rep));
	});

	var dummy = function() {};

	return router;
};
