/*******************************************************************

 Tree editor related functions

********************************************************************/

var btn_categories_click_handler = function() {
	$('#jstree_categories').addClass('uk-hidden');
	$('#jstree_error').addClass('uk-hidden');
	$('#jstree_loading').removeClass('uk-hidden');
	$('.taracot-tree-save-controls').attr('disabled', true);
	$('.taracot-treectl-button').attr('disabled', true);
	$.ajax({
		type: 'POST',
		url: '/cp/warehouse/data/categories/load',
		dataType: "json",
		success: function(data) {
			if (data.status == 1) {
				$('#jstree_categories').removeClass('uk-hidden');
				$('#jstree_error').addClass('uk-hidden');
				$('#jstree_loading').addClass('uk-hidden');
				$('.taracot-tree-save-controls').attr('disabled', false);
				$('#btn-tree-new').attr('disabled', false);
				if (data.categories) {
					init_jstree(jQuery.parseJSON(data.categories));
				}
			} else {
				var _err = _lang_vars.ajax_failed;
				if (data.error) {
					_err = data.error;
				}
				$.UIkit.notify({
					message: _err,
					status: 'danger',
					timeout: 2000,
					pos: 'top-center'
				});
				$('#btn-tree-cancel').attr('disabled', false);
				$('#jstree_loading').addClass('uk-hidden');
				$('#jstree_error').html(_err);
				$('#jstree_error').removeClass('uk-hidden');
			}
		},
		error: function() {
			$.UIkit.notify({
				message: _lang_vars.ajax_failed,
				status: 'danger',
				timeout: 2000,
				pos: 'top-center'
			});
			$('#btn-tree-cancel').attr('disabled', false);
			$('#jstree_loading').addClass('uk-hidden');
			$('#jstree_error').html(_lang_vars.ajax_failed);
			$('#jstree_error').removeClass('uk-hidden');
		}
	});
};

$('#btn-categories').click(function() {
	push_state({ mode: 'categories' }, "?mode=categories");
	show_categories();
});

$('#btn-tree-new').click(function() {
	$('#fname').removeClass('uk-form-danger');
	var sel = jstree_categories.jstree(true).get_selected();
	if (!sel || !sel.length) return;
	$('#taracot_warehouse_categories_edit_h1').html(_lang_vars.new_category);
	$('.taracot-categories-edit-control').each(function() {
		$(this).val('');
	});
	categories_edit = false;
	categories_edit_dlg.show();
	$('#fname').focus();
});

$('#btn-tree-edit').click(function() {
	$('#fname').removeClass('uk-form-danger');
	var sel = jstree_categories.jstree(true).get_selected();
	if (!sel || !sel.length) return;
	if (jstree_categories.jstree(true).get_parent(sel) == '#') return;
	$('#taracot_warehouse_categories_edit_h1').html(_lang_vars.edit_category);
	$('.taracot-categories-edit-control').each(function() {
		$(this).val('');
	});
	for (var i = 0; i < locales.length; i++) {
		$('#flang_' + locales[i]).val(jstree_categories.jstree(true).get_node(sel).data.lang[locales[i]]);
	}
	$('#fname').val(jstree_categories.jstree(true).get_node(sel).text);
	categories_edit = true;
	categories_edit_dlg.show();
	$('#fname').select();
	$('#fname').focus();
});

$('#btn-tree-save').click(function() {
	$('#jstree_categories').addClass('uk-hidden');
	$('#jstree_error').addClass('uk-hidden');
	$('#jstree_loading').removeClass('uk-hidden');
	$('.taracot-tree-save-controls').attr('disabled', true);
	$('.taracot-treectl-button').attr('disabled', true);
	var fldrs = jstree_categories.jstree(true).get_json(jstree_categories, {
		flat: true,
		no_state: true,
		no_id: false,
		no_data: false
	});
	for (var i = 0; i < fldrs.length; i++) {
		delete fldrs[i].li_attr;
		delete fldrs[i].a_attr;
		delete fldrs[i].icon;
		delete fldrs[i].state;
	}
	$.ajax({
		type: 'POST',
		url: '/cp/warehouse/data/categories/save',
		dataType: "json",
		data: {
			json: JSON.stringify(fldrs)
		},
		success: function(data) {
			$('#jstree_categories').removeClass('uk-hidden');
			$('#jstree_error').addClass('uk-hidden');
			$('#jstree_loading').addClass('uk-hidden');
			$('.taracot-tree-save-controls').attr('disabled', false);
			$('.taracot-treectl-button').attr('disabled', false);
			jstree_categories.jstree(true).deselect_all();
			jstree_find_root();
			if (data.status == 1) {
				categories_data = fldrs;
				$.UIkit.notify({
					message: _lang_vars.categories_save_success,
					status: 'success',
					timeout: 2000,
					pos: 'top-center'
				});
				show_warehouse();
			} else {
				var _err = _lang_vars.ajax_failed;
				if (data.error) {
					_err = data.error;
				}
				$.UIkit.notify({
					message: _err,
					status: 'danger',
					timeout: 2000,
					pos: 'top-center'
				});
			}
		},
		error: function() {
			$.UIkit.notify({
				message: _lang_vars.ajax_failed,
				status: 'danger',
				timeout: 2000,
				pos: 'top-center'
			});
			$('#jstree_categories').removeClass('uk-hidden');
			$('#jstree_error').addClass('uk-hidden');
			$('#jstree_loading').addClass('uk-hidden');
			$('.taracot-tree-save-controls').attr('disabled', false);
			$('#btn-tree-new').attr('disabled', false);
			jstree_categories.jstree(true).deselect_all();
			jstree_find_root();
		}
	});
});

$('#btn-tree-cancel').click(function() {
	if (confirm(_lang_vars.confirm_categories_edit_cancel)) show_warehouse();
});

$('#btn-tree-clear').click(function() {
	if (confirm(_lang_vars.confirm_categories_edit_clean)) {
		init_jstree([], true);
	}
});

$('#btn-tree-delete').click(function() {
	var sel = jstree_categories.jstree(true).get_selected();
	if (!sel || !sel.length) return;
	var seltxt = '';
	for (var i = 0; i < sel.length; i++) {
		seltxt += ', ' + jstree_categories.jstree(true).get_node(sel[i]).text;
	}
	if (confirm(_lang_vars.confirm_delete_tree + "\n\n" + seltxt.replace(/,/, ''))) jstree_categories.jstree(true).delete_node(sel);
});

$('.taracot-categories-edit-control').bind('keypress', function(e) {
	if (submitOnEnter(e)) {
		$('#btn_categories_edit_save').click();
	}
});

$('#btn_categories_edit_save').click(function() {
	$('#fname').removeClass('uk-form-danger');
	var sel = jstree_categories.jstree(true).get_selected();
	if (!sel || !sel.length || sel.length > 1) return;
	if (!check_directory($('#fname').val())) {
		$('#fname').addClass('uk-form-danger');
		$.UIkit.notify({
			message: _lang_vars.invalid_category,
			status: 'danger',
			timeout: 2000,
			pos: 'top-center'
		});
		return;
	}
	if (categories_edit) {
		jstree_categories.jstree(true).rename_node(sel, $('#fname').val());
		jstree_categories.jstree(true).get_node(sel).data = {};
		jstree_categories.jstree(true).get_node(sel).data.lang = {};
		for (var i = 0; i < locales.length; i++) {
			jstree_categories.jstree(true).get_node(sel).data.lang[locales[i]] = $('#flang_' + locales[i]).val();
		}
	} else {
		var cn = jstree_categories.jstree(true).create_node(sel, {
			text: $('#fname').val(),
			type: 'category'
		});
		if (!cn) {
			$('#fname').addClass('uk-form-danger');
			$.UIkit.notify({
				message: _lang_vars.duplicate_category,
				status: 'danger',
				timeout: 2000,
				pos: 'top-center'
			});
		}
		jstree_categories.jstree(true).get_node(cn).data = {};
		jstree_categories.jstree(true).get_node(cn).data.lang = {};
		for (var j = 0; j < locales.length; j++) {
			jstree_categories.jstree(true).get_node(cn).data.lang[locales[j]] = $('#flang_' + locales[j]).val();
		}
		jstree_categories.jstree(true).open_node(sel);
	}
	categories_edit_dlg.hide();
});

var init_jstree = function(data, root) {
	if (jstree_categories) jstree_categories.jstree(true).destroy();
	jstree_categories = $('#jstree_categories').jstree({
		'core': {
			'check_callback': true,
			'data': data
		},
		'plugins': ["dnd", "unique", "types"],
		'types': {
			"#": {
				"max_children": 1,
				"valid_children": ["root"]
			},
			'root': {
				"valid_children": ['category']
			},
			'category': {
				"valid_children": ['category']
			}
		}
	});
	jstree_categories.on('loaded.jstree', function(e, data) {
		// if (root) {
		//     jstree_insert_root();
		// }
		jstree_categories.jstree(true).open_all('#');
		jstree_find_root();
	});
	jstree_categories.on('changed.jstree', function(e, data) {
		jstree_changed_handler(e, data);
		//alert(jstree_categories.jstree(true).get_path(data.instance.get_node(data.selected[0]).id).join('/').replace(/\/\//, '/'));
	});
};

var jstree_find_root = function() {
	var fldrs = jstree_categories.jstree(true).get_json(jstree_categories, {
		flat: true,
		no_state: true,
		no_id: false,
		no_data: false
	});
	for (var i = 0; i < fldrs.length; i++) {
		if (fldrs[i].parent == '#') jstree_categories.jstree(true).select_node(fldrs[i].id);
	}
};

var jstree_get_root_id = function() {
	for (var i = 0; i < categories_data.length; i++) {
		if (categories_data[i].parent == '#') return categories_data[i].id;
	}
	return '';
};

var jstree_insert_root = function() {
	var _rn = jstree_categories.jstree(true).create_node('#', {
		text: '/',
		type: 'root'
	});
	jstree_categories.jstree(true).select_node(_rn);
};

/*******************************************************************

 Tree selector related functions

********************************************************************/

var init_jstree_select = function(data, root) {
	if (jstree_categories_select) jstree_categories_select.jstree(true).destroy();
	jstree_categories_select = $('#jstree_categories_select').jstree({
		'core': {
			'check_callback': true,
			'data': categories_data
		},
		'plugins': ["dnd", "unique", "types"],
		'types': {
			"#": {
				"max_children": 1,
				"valid_children": ["root"]
			},
			'root': {
				"valid_children": ['category']
			},
			'category': {
				"valid_children": ['category']
			}
		}
	});
	jstree_categories_select.on('loaded.jstree', function(e, data) {
		jstree_categories_select.jstree(true).open_all('#');
	});
	jstree_categories_select.on('changed.jstree', function(e, data) {
		if (!data.selected.length || data.selected.length > 1) {
			$('#btn_categories_select').attr('disabled', true);
		} else {
			$('#btn_categories_select').attr('disabled', false);
		}
	});
};

var jstree_changed_handler = function(e, data) {
	if (!data.selected.length) {
		$('.taracot-treectl-button').attr('disabled', true);
	} else {
		$('.taracot-treectl-button').attr('disabled', false);
	}
	for (var i = 0; i < data.selected.length; i++) {
		if (jstree_categories.jstree(true).get_parent(data.selected[i]) == '#') $('.taracot-treectl-button').attr('disabled', true);
		$('#btn-tree-new').attr('disabled', false);
	}
	if (data.selected.length > 1) {
		$('#btn-tree-new').attr('disabled', true);
		$('#btn-tree-edit').attr('disabled', true);
	}
};

$('#btn-select-category').click(function() {
	init_jstree_select();
	categories_select_dlg.show();
	$('#btn_categories_select').attr('disabled', true);
});

$('#btn_categories_select').click(function() {
	var sel = jstree_categories_select.jstree(true).get_selected();
	if (!sel || !sel.length || sel.length > 1) return;
	var path = jstree_categories_select.jstree(true).get_path(sel).join('/').replace(/\//, '');
	if (!path) path = '/';
	$('#pcategory').val(path);
	$('#pcategory_id').val(sel);
	categories_select_dlg.hide();
	$('#pcategory').change();
});

/*******************************************************************

 Helper functions

********************************************************************/

var check_directory = function(fn) {
	if (!fn || !fn.length || fn.length > 40) return false; // too long or null
	if (fn.match(/^\./)) return false; // starting with a dot
	if (fn.match(/^\\/)) return false; // starting with a slash
	if (fn.match(/ /)) return false; // whitespace
	if (fn.match(/^[\^<>\/\:\"\\\|\?\*\x00-\x1f]+$/)) return false; // invalid characters
	return true;
};
