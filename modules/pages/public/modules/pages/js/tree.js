/*******************************************************************

 Tree editor related functions

********************************************************************/

var btn_folders_click_handler = function() {
	$('#jstree_folders').addClass('uk-hidden');
	$('#jstree_error').addClass('uk-hidden');
	$('#jstree_loading').removeClass('uk-hidden');
	$('.taracot-tree-save-controls').attr('disabled', true);
	$('.taracot-treectl-button').attr('disabled', true);
	$.ajax({
		type: 'POST',
		url: '/cp/pages/data/folders/load',
		dataType: "json",
		success: function(data) {
			if (data.status == 1) {
				$('#jstree_folders').removeClass('uk-hidden');
				$('#jstree_error').addClass('uk-hidden');
				$('#jstree_loading').addClass('uk-hidden');
				$('.taracot-tree-save-controls').attr('disabled', false);
				$('#btn-tree-new').attr('disabled', false);
				if (data.folders) {
					init_jstree(jQuery.parseJSON(data.folders));
				}
			} else {
				var _err = _lang_vars.ajax_failed;
				if (data.error) {
					_err = data.error;
				}
				UIkit.notify({
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
			UIkit.notify({
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

$('#btn-folders').click(function() {
	push_state({ mode: 'folders' }, "?mode=folders");
	show_folders();
});

$('#btn-tree-new').click(function() {
	$('#fname').removeClass('uk-form-danger');
	var sel = jstree_folders.jstree(true).get_selected();
	if (!sel || !sel.length) return;
	$('#taracot_pages_folders_edit_h1').html(_lang_vars.new_folder);
	$('.taracot-folders-edit-control').each(function() {
		$(this).val('');
	});
	folders_edit = false;
	folders_edit_dlg.show();
	$('#fname').focus();
});

$('#btn-tree-edit').click(function() {
	$('#fname').removeClass('uk-form-danger');
	var sel = jstree_folders.jstree(true).get_selected();
	if (!sel || !sel.length) return;
	if (jstree_folders.jstree(true).get_parent(sel) == '#') return;
	$('#taracot_pages_folders_edit_h1').html(_lang_vars.edit_folder);
	$('.taracot-folders-edit-control').each(function() {
		$(this).val('');
	});
	for (var i = 0; i < locales.length; i++) {
		$('#flang_' + locales[i]).val(jstree_folders.jstree(true).get_node(sel).data.lang[locales[i]]);
	}
	$('#fname').val(jstree_folders.jstree(true).get_node(sel).text);
	folders_edit = true;
	folders_edit_dlg.show();
	$('#fname').select();
	$('#fname').focus();
});

$('#btn-tree-save').click(function() {
	$('#jstree_folders').addClass('uk-hidden');
	$('#jstree_error').addClass('uk-hidden');
	$('#jstree_loading').removeClass('uk-hidden');
	$('.taracot-tree-save-controls').attr('disabled', true);
	$('.taracot-treectl-button').attr('disabled', true);
	var fldrs = jstree_folders.jstree(true).get_json(jstree_folders, {
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
		url: '/cp/pages/data/folders/save',
		dataType: "json",
		data: {
			json: JSON.stringify(fldrs)
		},
		success: function(data) {
			$('#jstree_folders').removeClass('uk-hidden');
			$('#jstree_error').addClass('uk-hidden');
			$('#jstree_loading').addClass('uk-hidden');
			$('.taracot-tree-save-controls').attr('disabled', false);
			$('.taracot-treectl-button').attr('disabled', false);
			jstree_folders.jstree(true).deselect_all();
			jstree_find_root();
			if (data.status == 1) {
				folders_data = fldrs;
				UIkit.notify({
					message: _lang_vars.folders_save_success,
					status: 'success',
					timeout: 2000,
					pos: 'top-center'
				});
				show_pages();
			} else {
				var _err = _lang_vars.ajax_failed;
				if (data.error) {
					_err = data.error;
				}
				UIkit.notify({
					message: _err,
					status: 'danger',
					timeout: 2000,
					pos: 'top-center'
				});
			}
		},
		error: function() {
			UIkit.notify({
				message: _lang_vars.ajax_failed,
				status: 'danger',
				timeout: 2000,
				pos: 'top-center'
			});
			$('#jstree_folders').removeClass('uk-hidden');
			$('#jstree_error').addClass('uk-hidden');
			$('#jstree_loading').addClass('uk-hidden');
			$('.taracot-tree-save-controls').attr('disabled', false);
			$('#btn-tree-new').attr('disabled', false);
			jstree_folders.jstree(true).deselect_all();
			jstree_find_root();
		}
	});
});

$('#btn-tree-cancel').click(function() {
	if (confirm(_lang_vars.confirm_folders_edit_cancel)) show_pages();
});

$('#btn-tree-clear').click(function() {
	if (confirm(_lang_vars.confirm_folders_edit_clean)) {
		init_jstree([], true);
	}
});

$('#btn-tree-delete').click(function() {
	var sel = jstree_folders.jstree(true).get_selected();
	if (!sel || !sel.length) return;
	var seltxt = '';
	for (var i = 0; i < sel.length; i++) {
		seltxt += ', ' + jstree_folders.jstree(true).get_node(sel[i]).text;
	}
	if (confirm(_lang_vars.confirm_delete_tree + "\n\n" + seltxt.replace(/,/, ''))) jstree_folders.jstree(true).delete_node(sel);
});

$('.taracot-folders-edit-control').bind('keypress', function(e) {
	if (submitOnEnter(e)) {
		$('#btn_folders_edit_save').click();
	}
});

$('#btn_folders_edit_save').click(function() {
	$('#fname').removeClass('uk-form-danger');
	var sel = jstree_folders.jstree(true).get_selected();
	if (!sel || !sel.length || sel.length > 1) return;
	if (!check_directory($('#fname').val())) {
		$('#fname').addClass('uk-form-danger');
		UIkit.notify({
			message: _lang_vars.invalid_folder,
			status: 'danger',
			timeout: 2000,
			pos: 'top-center'
		});
		return;
	}
	if (folders_edit) {
		jstree_folders.jstree(true).rename_node(sel, $('#fname').val());
		jstree_folders.jstree(true).get_node(sel).data = {};
		jstree_folders.jstree(true).get_node(sel).data.lang = {};
		for (var i = 0; i < locales.length; i++) {
			jstree_folders.jstree(true).get_node(sel).data.lang[locales[i]] = $('#flang_' + locales[i]).val();
		}
	} else {
		var cn = jstree_folders.jstree(true).create_node(sel, {
			text: $('#fname').val(),
			type: 'folder'
		});
		if (!cn) {
			$('#fname').addClass('uk-form-danger');
			UIkit.notify({
				message: _lang_vars.duplicate_folder,
				status: 'danger',
				timeout: 2000,
				pos: 'top-center'
			});
		}
		jstree_folders.jstree(true).get_node(cn).data = {};
		jstree_folders.jstree(true).get_node(cn).data.lang = {};
		for (var j = 0; j < locales.length; j++) {
			jstree_folders.jstree(true).get_node(cn).data.lang[locales[j]] = $('#flang_' + locales[j]).val();
		}
		jstree_folders.jstree(true).open_node(sel);
	}
	folders_edit_dlg.hide();
});

var init_jstree = function(data, root) {
	if (jstree_folders) jstree_folders.jstree(true).destroy();
	jstree_folders = $('#jstree_folders').jstree({
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
				"valid_children": ['folder']
			},
			'folder': {
				"valid_children": ['folder']
			}
		}
	});
	jstree_folders.on('loaded.jstree', function(e, data) {
		// if (root) {
		//     jstree_insert_root();
		// }
		jstree_folders.jstree(true).open_all('#');
		jstree_find_root();
	});
	jstree_folders.on('changed.jstree', function(e, data) {
		jstree_changed_handler(e, data);
		//alert(jstree_folders.jstree(true).get_path(data.instance.get_node(data.selected[0]).id).join('/').replace(/\/\//, '/'));
	});
};

var jstree_find_root = function() {
	var fldrs = jstree_folders.jstree(true).get_json(jstree_folders, {
		flat: true,
		no_state: true,
		no_id: false,
		no_data: false
	});
	for (var i = 0; i < fldrs.length; i++) {
		if (fldrs[i].parent == '#') jstree_folders.jstree(true).select_node(fldrs[i].id);
	}
};

var jstree_get_root_id = function() {
	for (var i = 0; i < folders_data.length; i++) {
		if (folders_data[i].parent == '#') return folders_data[i].id;
	}
	return '';
};

var jstree_insert_root = function() {
	var _rn = jstree_folders.jstree(true).create_node('#', {
		text: '/',
		type: 'root'
	});
	jstree_folders.jstree(true).select_node(_rn);
};

/*******************************************************************

 Tree selector related functions

********************************************************************/

var init_jstree_select = function(data, root) {
	if (jstree_folders_select) jstree_folders_select.jstree(true).destroy();
	jstree_folders_select = $('#jstree_folders_select').jstree({
		'core': {
			'check_callback': true,
			'data': folders_data
		},
		'plugins': ["dnd", "unique", "types"],
		'types': {
			"#": {
				"max_children": 1,
				"valid_children": ["root"]
			},
			'root': {
				"valid_children": ['folder']
			},
			'folder': {
				"valid_children": ['folder']
			}
		}
	});
	jstree_folders_select.on('loaded.jstree', function(e, data) {
		jstree_folders_select.jstree(true).open_all('#');
	});
	jstree_folders_select.on('changed.jstree', function(e, data) {
		if (!data.selected.length || data.selected.length > 1) {
			$('#btn_folders_select').attr('disabled', true);
		} else {
			$('#btn_folders_select').attr('disabled', false);
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
		if (jstree_folders.jstree(true).get_parent(data.selected[i]) == '#') $('.taracot-treectl-button').attr('disabled', true);
		$('#btn-tree-new').attr('disabled', false);
	}
	if (data.selected.length > 1) {
		$('#btn-tree-new').attr('disabled', true);
		$('#btn-tree-edit').attr('disabled', true);
	}
};

$('#btn-select-folder').click(function() {
	init_jstree_select();
	folders_select_dlg.show();
	$('#btn_folders_select').attr('disabled', true);
});

$('#btn_folders_select').click(function() {
	var sel = jstree_folders_select.jstree(true).get_selected();
	if (!sel || !sel.length || sel.length > 1) return;
	var path = jstree_folders_select.jstree(true).get_path(sel).join('/').replace(/\//, '');
	if (!path) path = '/';
	$('#pfolder').val(path);
	$('#pfolder_id').val(sel);
	folders_select_dlg.hide();
	$('#pfolder').change();
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
