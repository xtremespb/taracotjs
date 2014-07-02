var current_id = '';
var folders_edit_dlg = $.UIkit.modal("#taracot_pages_folders_edit_dlg");
var folders_select_dlg = $.UIkit.modal("#taracot_pages_folders_select_dlg");
var folders_edit = false;
var jstree_folders;
var jstree_folders_select;
var folders_data;
var root_pages = [];
var current_folder = '';

/*******************************************************************

 Medved Table configuration

********************************************************************/

var process_rows = [ // Handlers for each column
	function(val, id) {
		return '<label id="taracot-table-lbl-' + id + '"><input type="checkbox" class="taracot-table-chbx" id="taracot-table-chbx-' + id + '" rel="taracot-item_' + val + '"></div>&nbsp;' + val + '</label>';
	},
	function(val, id) {
		if (val === null) {
			val = '&mdash;';
		}
		return val;
	},
	function(val, id) {
		return '<div style="text-align:center">' + val + '</div>';
	},
	function(val, id) {
		return '<div style="text-align:center;width:100px"><button class="uk-icon-button uk-icon-edit taracot-tableitem-edit" id="taracot-btnedt-' + id + '" type="button"></button>&nbsp;<button class="uk-icon-button uk-icon-button-danger uk-icon-trash-o taracot-tableitem-delete" id="taracot-btndel-' + id + '" type="button"></button></div>';
	}
];

/*******************************************************************

 Table hanlders

********************************************************************/

$('#btn-select-all').click(function() {
	$('.taracot-table-chbx').prop('checked', true);
});

$('#btn-select-none').click(function() {
	$('.taracot-table-chbx').prop('checked', false);
});

$('#btn-delete-selected').click(function() {
	var ids = [];
	$('.taracot-table-chbx').each(function(i, val) {
		if ($(val).prop('checked')) {
			ids.push($(val).attr('id').replace('taracot-table-chbx-', ''));
		}
	});
	if (ids.length > 0) {
		delete_item(ids);
	}
});

/*******************************************************************

 Functions to show specific module area

********************************************************************/

var show_folders = function(_nps) {
	if (!_nps) History.pushState({ mode: 'folders' }, null, "?mode=folders");
	$('#taracot_pages_list').addClass('uk-hidden');
	$('#taracot_pages_folders').removeClass('uk-hidden');
	$('#taracot_pages_edit').addClass('uk-hidden');
};

var show_pages = function(_nps) {
	if (!_nps) History.pushState({ mode: 'pages' }, null, "?mode=pages");
	$('#taracot_pages_list').removeClass('uk-hidden');
	$('#taracot_pages_folders').addClass('uk-hidden');
	$('#taracot_pages_edit').addClass('uk-hidden');
};

/*******************************************************************

 Pages table button handlers

********************************************************************/

$('#btn-add-item').click(function() {
	History.pushState({ mode: 'add_page' }, null, "?mode=add_page");
	current_id = '';
	root_pages = [];
	current_folder = '';
	$('#taracot_pages_edit_action').html(_lang_vars.action_add);
	$('#taracot_pages_list').addClass('uk-hidden');
	$('#taracot_pages_edit').removeClass('uk-hidden');
	$('.taracot-page-edit-form-control').each(function() {
		$(this).val('');
		$(this).removeClass('uk-form-danger');
	});
	$('#plang').val(locales[0]);
	$('#playout').val(layouts.default);
	$('#pfolder').val('/');
	$('#plangcopy_row').removeClass('uk-hidden');
	$('#plangcopy').attr('checked', false);
	$('#taracot-pagetype-regular > a').click();
	taracot_ajax_progress_indicator('body', true);
	$.ajax({
		type: 'POST',
		url: '/cp/pages/data/rootpages',
		dataType: "json",
		success: function(data) {
			taracot_ajax_progress_indicator('body', false);
			if (data && data.status && data.status == 1) {
				if (data.root_pages) {
					root_pages = data.root_pages;
					$('#pfolder').change();
				}
			}
			$('#ptitle').focus();
		},
		error: function() {
			$('#ptitle').focus();
		}
	});
});

var edit_item = function(id) {
	History.pushState({ mode: 'edit_page', current_id: id }, null, "?mode=edit_page");
	current_id = id;
	current_folder = '';
	$('#taracot_pages_edit_action').html(_lang_vars.action_edit);
	$('#plangcopy_row').addClass('uk-hidden');
	$('#playout').val(layouts.default);
	taracot_ajax_progress_indicator('body', true);
	$.ajax({
		type: 'POST',
		url: '/cp/pages/data/load',
		dataType: "json",
		data: {
			pid: current_id
		},
		success: function(data) {
			taracot_ajax_progress_indicator('body', false);
			if (data.status == 1) {
				$('.taracot-page-edit-form-control').each(function() {
					$(this).val('');
				});
				$('#taracot_pages_list').addClass('uk-hidden');
				$('#taracot_pages_edit').removeClass('uk-hidden');
				if (data.root_pages) root_pages = data.root_pages;
				if (data.data) data = data.data;
				if (data.ptitle) $('#ptitle').val(data.ptitle);
				if (data.pfilename && data.pfilename.length) {
					$('#pfilename').val(data.pfilename);
					$('#taracot-pagetype-regular > a').click();
				} else {
					$('#taracot-pagetype-root > a').click();
				}
				if (data.pfolder) {
					$('#pfolder').val(data.pfolder);
					current_folder = data.pfolder;
				}
				if (data.pfolder_id) $('#pfolder_id').val(data.pfolder_id);
				if (data.plang) $('#plang').val(data.plang);
				if (data.playout) $('#playout').val(data.playout);
				if (data.pkeywords) $('#pkeywords').val(data.pkeywords);
				if (data.pdesc) $('#pdesc').val(data.pdesc);
				if (data.pcontent) $('#pcontent').val(data.pcontent);
				$('#pfolder').change();
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
			taracot_ajax_progress_indicator('body', false);
			$.UIkit.notify({
				message: _lang_vars.ajax_failed,
				status: 'danger',
				timeout: 2000,
				pos: 'top-center'
			});
		}
	});
};

var delete_item = function(ids) {
	var users = [];
	for (var i = 0; i < ids.length; i++) {
		users.push($('#taracot-table-chbx-' + ids[i]).attr('rel').replace('taracot-item_', ''));
	}
	if (confirm(_lang_vars.del_confirm + "\n\n" + users.join(', '))) {
		$('#taracot_table').medvedTable('loading_indicator_show');
		$.ajax({
			type: 'POST',
			url: '/cp/pages/data/delete',
			data: {
				ids: ids
			},
			dataType: "json",
			success: function(data) {
				$('#taracot_table').medvedTable('loading_indicator_hide');
				if (data.status == 1) {
					$('#taracot_table').medvedTable('update');
				} else {
					$.UIkit.notify({
						message: _lang_vars.delete_err_msg,
						status: 'danger',
						timeout: 2000,
						pos: 'top-center'
					});
				}
			},
			error: function() {
				$('#taracot_table').medvedTable('loading_indicator_hide');
				$.UIkit.notify({
					message: _lang_vars.delete_err_msg,
					status: 'danger',
					timeout: 2000,
					pos: 'top-center'
				});
			}
		});
	}
};

$('#btn_edit_save').click(function() {
	$('.taracot-page-edit-form-control').each(function() {
		$(this).removeClass('uk-form-danger');
	});
	// Get form values
	var ptitle = $.trim($('#ptitle').val());
	var pfilename = $.trim($('#pfilename').val());
	var pfolder = $.trim($('#pfolder').val());
	var pfolder_id = $('#pfolder_id').val();
	if (!pfolder_id) {
		pfolder_id = jstree_get_root_id();
	}
	var plang = $('#plang').val();
	var playout = $('#playout').val();
	var plangcopy = false;
	if ($('#plangcopy').attr('checked')) {
		plangcopy = true;
	}
	var pkeywords = $.trim($('#pkeywords').val());
	var pdesc = $.trim($('#pdesc').val());
	// Check form for errors
	var form_errors = false;
	var error_focus;
	if (!ptitle || !ptitle.length || ptitle.length > 100) {
		$('#ptitle').addClass('uk-form-danger');
		form_errors = true;
		if (!error_focus) error_focus = '#ptitle';
	}
	if ($('#taracot-pagetype-root').hasClass('uk-active')) {
		pfilename = '';
	} else {
		if (!pfilename.match(/^[A-Za-z0-9_\-\.]{1,80}$/)) {
			$('#pfilename').addClass('uk-form-danger');
			form_errors = true;
			if (!error_focus) error_focus = '#pfilename';
		}
	}
	if (form_errors) {
		$.UIkit.notify({
			message: _lang_vars.form_contain_errors,
			status: 'danger',
			timeout: 2000,
			pos: 'top-center'
		});
		if (error_focus) $(error_focus).focus();
		return;
	}
	taracot_ajax_progress_indicator('body', true);
	// Save data
	$.ajax({
		type: 'POST',
		url: '/cp/pages/data/save',
		dataType: "json",
		data: {
			pid: current_id,
			ptitle: ptitle,
			pfilename: pfilename,
			pfolder: pfolder,
			pfolder_id: pfolder_id,
			plang: plang,
			plangcopy: plangcopy,
			playout: playout,
			pkeywords: pkeywords,
			pdesc: pdesc,
			pcontent: $('#pcontent').val()
		},
		success: function(data) {
			taracot_ajax_progress_indicator('body', false);
			if (data.status == 1) {
				$.UIkit.notify({
					message: _lang_vars.page_save_success,
					status: 'success',
					timeout: 2000,
					pos: 'top-center'
				});
				show_pages();
				$('#taracot_table').medvedTable('update');
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
			taracot_ajax_progress_indicator('body', false);
			$.UIkit.notify({
				message: _lang_vars.ajax_failed,
				status: 'danger',
				timeout: 2000,
				pos: 'top-center'
			});
		}
	});
});

$('.taracot-page-edit-form-control').bind('keypress', function(e) {
	if (submitOnEnter(e)) {
		$('#btn_edit_save').click();
	}
});

$('#btn_edit_cancel').click(function() {
	if (confirm(_lang_vars.confirm_page_edit_cancel)) show_pages();
});

$('#pfolder').change(function() {
	$('#taracot-pagetype-root').removeClass('uk-hidden');
	for (var i=0; i<root_pages.length; i++) {
		if ($('#pfolder').val() == root_pages[i] && $('#pfilename').val() !== '') {
			$('#taracot-pagetype-regular > a').click();
			$('#taracot-pagetype-root').addClass('uk-hidden');
		}
		if ($('#pfolder').val() == current_folder) {
			if (!$('#pfilename').val().length) {
				$('#taracot-pagetype-root > a').click();
			}
		}
		if (current_folder === '') {
			if ($('#pfolder').val() == root_pages[i]) {
				$('#taracot-pagetype-regular > a').click();
				$('#taracot-pagetype-root').addClass('uk-hidden');
			}
		}
	}
});

/*******************************************************************

 document.ready

********************************************************************/

$(document).ready(function() {
	$('#taracot_table').medvedTable({
		col_count: 4,
		sort_mode: 1,
		sort_cell: 'pfolder',
		taracot_table_url: '/cp/pages/data/list',
		process_rows: process_rows
	});
	$('#pcontent').ckeditor({
	    filebrowserBrowseUrl : '/cp/browse',
	    filebrowserImageBrowseUrl : '/cp/browse?io=1',
	    filebrowserWindowWidth  : 800,
	    filebrowserWindowHeight : 500
	});
	$('#pfolder').attr('readonly', true);
	folders_data = folders_preload;
	history_handler();
});

/*******************************************************************

 History API handler

********************************************************************/

var history_handler = function() {
	var state = History.getState(); // Note: We are using History.getState() instead of event.state
    if (state.data.mode)
    	switch (state.data.mode) {
    		case 'pages':
    			show_pages(true);
    			break;
    		case 'folders':
    			$('#btn-folders').click();
    			break;
    		case 'add_page':
    			$('#btn-add-item').click();
    			break;
    		case 'edit_page':
    			edit_item(state.data.current_id);
    			break;
    	}
};


History.Adapter.bind(window, 'statechange',function(){ // Note: We are using statechange instead of popstate
	history_handler();
});

/*******************************************************************

 Helper functions

********************************************************************/

var taracot_ajax_progress_indicator = function(sel, show) {
	if (show) {
		var destination = $(sel).offset();
		$('.taracot-progress').css({
			top: destination.top,
			left: destination.left,
			width: $(sel).width(),
			height: $(sel).height()
		});
		$('.taracot-progress').removeClass('uk-hidden');
	} else {
		$('.taracot-progress').addClass('uk-hidden');
	}
};
