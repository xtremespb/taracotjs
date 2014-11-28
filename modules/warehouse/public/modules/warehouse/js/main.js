var current_id = '',
    current_timestamp = 0,
    current_timestamp_new = 0,
    categories_edit_dlg = $.UIkit.modal("#taracot_warehouse_categories_edit_dlg"),
    categories_select_dlg = $.UIkit.modal("#taracot_warehouse_categories_select_dlg"),
    outdated_dlg = $.UIkit.modal("#taracot_outdated_dlg"),
    autosave_dlg = $.UIkit.modal("#taracot_autosave_dlg"),
    lock_dlg = $.UIkit.modal("#taracot_lock_dlg"),
    categories_edit = false,
    jstree_categories,
    jstree_categories_select,
    categories_data,
    root_warehouse = [],
    current_category = '',
    ckeditor,
    auto_save_timer,
    uploader;

$.loadingIndicator();

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

var show_categories = function() {
    $('#taracot_warehouse_list').addClass('uk-hidden');
    $('#taracot_warehouse_categories').removeClass('uk-hidden');
    $('#taracot_warehouse_edit').addClass('uk-hidden');
    btn_categories_click_handler();
};

var show_warehouse = function() {
    push_state({
        mode: 'warehouse'
    }, "?mode=warehouse");
    $('#taracot_warehouse_list').removeClass('uk-hidden');
    $('#taracot_warehouse_categories').addClass('uk-hidden');
    $('#taracot_warehouse_edit').addClass('uk-hidden');
};

/*******************************************************************

 Auto-save functions

********************************************************************/

var auto_save_data = function() {
    var ptitle = $.trim($('#ptitle').val());
    var pfilename = $.trim($('#pfilename').val());
    var pcategory = $.trim($('#pcategory').val());
    var pcategory_id = $('#pcategory_id').val();
    if (!pcategory_id) {
        pcategory_id = jstree_get_root_id();
    }
    var plang = $('#plang').val();
    var plangcopy = false;
    if ($('#plangcopy').attr('checked')) {
        plangcopy = true;
    }
    var pkeywords = $.trim($('#pkeywords').val());
    var pdesc = $.trim($('#pdesc').val());
    var data = {
        pid: current_id,
        ptitle: ptitle,
        pfilename: pfilename,
        pcategory: pcategory,
        pcategory_id: pcategory_id,
        plang: plang,
        plangcopy: plangcopy,
        pkeywords: pkeywords,
        pdesc: pdesc,
        current_timestamp: current_timestamp,
        pcontent: $('#pcontent').val()
    };
    $.jStorage.set("_taracot_warehouse_autosave", data);
    auto_save_timer = setTimeout(auto_save_data, 5000);
};

$('#btn_restore_autosave').click(function() {
    var data = $.jStorage.get("_taracot_warehouse_autosave");
    if (data) {
        autosave_dlg.hide();
        push_state({
            mode: 'edit_page',
            current_id: data.pid
        }, "?mode=edit_page");
        current_id = data.pid;
        current_timestamp = data.current_timestamp;
        current_category = '';
        $('#taracot_warehouse_edit_action').html(_lang_vars.action_edit);
        $('#plangcopy_row').addClass('uk-hidden');
        $('.taracot-page-edit-form-control').each(function() {
            $(this).val('');
        });
        var _data = {
            data: data
        };
        edit_item_show(_data);
    }

});

$('#btn_dont_restore_autosave').click(function() {
    $.jStorage.set("_taracot_warehouse_autosave", false);
    autosave_dlg.hide();
});

/*******************************************************************

 warehouse table button handlers

********************************************************************/

var btn_add_item_handler = function() {
    current_id = '';
    root_warehouse = [];
    current_category = '';
    $('#taracot_warehouse_edit_action').html(_lang_vars.action_add);
    $('#taracot_warehouse_list').addClass('uk-hidden');
    $('#taracot_warehouse_edit').removeClass('uk-hidden');
    $('.taracot-page-edit-form-control').each(function() {
        $(this).val('');
        $(this).removeClass('uk-form-danger');
    });
    $('#pcontent').val('');
    $('#plang').val(locales[0]);
    $('#pcategory').val('/');
    $('#plangcopy_row').removeClass('uk-hidden');
    $('#plangcopy').attr('checked', false);
    taracot_ajax_progress_indicator('body', true);
    if (!ckeditor) init_ckeditor();
    auto_save_timer = setTimeout(auto_save_data, 5000);
    $.ajax({
        type: 'POST',
        url: '/cp/warehouse/data/rootcat',
        dataType: "json",
        success: function(data) {
            taracot_ajax_progress_indicator('body', false);
            if (data && data.status && data.status == 1) {
                if (data.root_warehouse) {
                    root_warehouse = data.root_warehouse;
                    $('#pcategory').change();
                }
            }
            $('#ptitle').focus();
        },
        error: function() {
            $('#ptitle').focus();
        }
    });
};

$('#btn-add-item').click(function() {
    push_state({
        mode: 'add_page'
    }, "?mode=add_page");
    btn_add_item_handler();
});

var edit_item_show = function(data) {
    if (!ckeditor) init_ckeditor();
    $('#taracot_warehouse_list').addClass('uk-hidden');
    $('#taracot_warehouse_edit').removeClass('uk-hidden');
    $('#taracot_warehouse_edit').show();
    if (data.root_warehouse) root_warehouse = data.root_warehouse;
    if (data.data) data = data.data;
    if (data.ptitle) $('#ptitle').val(data.ptitle);
    if (data.pcategory) {
        $('#pcategory').val(data.pcategory);
        current_category = data.pcategory;
    }
    if (data.pcategory_id) $('#pcategory_id').val(data.pcategory_id);
    if (data.plang) $('#plang').val(data.plang);
    if (data.pkeywords) $('#pkeywords').val(data.pkeywords);
    if (data.pdesc) $('#pdesc').val(data.pdesc);
    if (data.pcontent) {
        $('#pcontent').val(data.pcontent);
    } else {
        $('#pcontent').val('');
    }
    $('#pcategory').change();
    if (data.last_modified) current_timestamp = data.last_modified;
    auto_save_timer = setTimeout(auto_save_data, 5000);
};

var edit_item = function(id) {
    push_state({
        mode: 'edit_page',
        current_id: id
    }, "?mode=edit_page");
    current_id = id;
    current_category = '';
    $('#taracot_warehouse_edit_action').html(_lang_vars.action_edit);
    $('#plangcopy_row').addClass('uk-hidden');
    $('.taracot-page-edit-form-control').each(function() {
        $(this).val('');
    });
    taracot_ajax_progress_indicator('body', true);
    $.ajax({
        type: 'POST',
        url: '/cp/warehouse/data/load',
        dataType: "json",
        data: {
            pid: current_id
        },
        success: function(data) {
            taracot_ajax_progress_indicator('body', false);
            if (data.status == 1) {
                if (data.data.lock_username && data.data.lock_username != current_username) {
                    $('#document_lock_username').html(data.data.lock_username);
                    $('#document_lock_timestamp').html('&mdash;');
                    if (data.data.lock_timestamp) $('#document_lock_timestamp').html(moment(data.data.lock_timestamp).fromNow());
                    return lock_dlg.show();
                }
                edit_item_show(data);
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
            url: '/cp/warehouse/data/delete',
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

$('#btn_steal_lock').click(function() {
    lock_dlg.hide();
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/warehouse/data/lock',
        data: {
            pid: current_id,
            username: current_username
        },
        dataType: "json",
        success: function(data) {
            $.loadingIndicator('hide');
            if (data.status == 1) {
                $.UIkit.notify({
                    message: _lang_vars.lock_removed,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
            } else {
                $.UIkit.notify({
                    message: _lang_vars.lock_remove_error,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
            $.loadingIndicator('hide');
            $.UIkit.notify({
                message: _lang_vars.lock_remove_error,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
});

$('#btn_force_save_outdated').click(function() {
    outdated_dlg.hide();
    current_timestamp = current_timestamp_new;
    $('#btn_edit_save').click();
});

$('#btn_edit_save').click(function() {
    $('.taracot-page-edit-form-control').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    // Get form values
    var ptitle = $.trim($('#ptitle').val());
    var pfilename = $.trim($('#pfilename').val());
    var pcategory = $.trim($('#pcategory').val());
    var pcategory_id = $('#pcategory_id').val();
    if (!pcategory_id) {
        pcategory_id = jstree_get_root_id();
    }
    var plang = $('#plang').val();
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
    if (!pfilename.match(/^[A-Za-z0-9_\-\.]{1,80}$/)) {
        $('#pfilename').addClass('uk-form-danger');
        form_errors = true;
        if (!error_focus) error_focus = '#pfilename';
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
        url: '/cp/warehouse/data/save',
        dataType: "json",
        data: {
            pid: current_id,
            ptitle: ptitle,
            pfilename: pfilename,
            pcategory: pcategory,
            pcategory_id: pcategory_id,
            plang: plang,
            plangcopy: plangcopy,
            pkeywords: pkeywords,
            pdesc: pdesc,
            current_timestamp: current_timestamp,
            pcontent: $('#pcontent').val()
        },
        success: function(data) {
            taracot_ajax_progress_indicator('body', false);
            if (data.status == 1) {
                if (auto_save_timer) window.clearTimeout(auto_save_timer);
                $.jStorage.set("_taracot_warehouse_autosave", false);
                $.UIkit.notify({
                    message: _lang_vars.page_save_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
                show_warehouse();
                $('#taracot_table').medvedTable('update');
            } else {
                if (data.locked) {
                    $('#document_lock_username').html(data.lock_username);
                    $('#document_lock_timestamp').html('&mdash;');
                    if (data.lock_timestamp) $('#document_lock_timestamp').html(moment(data.lock_timestamp).fromNow());
                    return lock_dlg.show();
                }
                if (data.outdated) {
                    if (data.current_timestamp) current_timestamp_new = data.current_timestamp;
                    return outdated_dlg.show();
                }
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
    if (confirm(_lang_vars.confirm_page_edit_cancel)) {
        if (auto_save_timer) window.clearTimeout(auto_save_timer);
        $.jStorage.set("_taracot_warehouse_autosave", false);
        $.loadingIndicator('show');
        $.ajax({
            type: 'POST',
            url: '/cp/warehouse/data/lock',
            data: {
                pid: current_id,
                username: ''
            },
            dataType: "json",
            complete: function() {
                $.loadingIndicator('hide');
                show_warehouse();
            }
        });
    }
});


/*******************************************************************

 document.ready

********************************************************************/

$(document).ready(function() {
    var autosave = $.jStorage.get("_taracot_warehouse_autosave");
    $('#taracot_table').medvedTable({
        col_count: 4,
        sort_mode: 1,
        sort_cell: 'pcategory',
        taracot_table_url: '/cp/warehouse/data/list',
        process_rows: process_rows,
        error_message: _lang_vars.ajax_failed
    });
    $('#pcategory').attr('readonly', true);
    categories_data = categories_preload;
    init_ckeditor();
    if (autosave) {
        $('#autosave_title').html('&mdash;');
        if (autosave.ptitle) $('#autosave_title').html(autosave.ptitle);
        return autosave_dlg.show();
    }
    bind_history();
    history_handler();
});

/*******************************************************************

 History API handler

********************************************************************/

var bind_history = function() {
    History.Adapter.bind(window, 'statechange', function() {
        history_handler();
    });
};

var _history_handler_disable = false;

var history_handler = function() {
    if (_history_handler_disable) return;
    var state = History.getState();
    if (state.data.mode) {
        switch (state.data.mode) {
            case 'warehouse':
                show_warehouse();
                break;
            case 'categories':
                show_categories();
                break;
            case 'add_page':
                btn_add_item_handler();
                break;
            case 'edit_page':
                edit_item(state.data.current_id);
                break;
        }
    } else {
        push_state({
            mode: 'warehouse'
        }, "?mode=warehouse");
    }
};

var push_state = function(p1, p2) {
    _history_handler_disable = true;
    History.pushState(p1, _lang_vars.control_panel, p2);
    _history_handler_disable = false;
};

/*******************************************************************

 Helper functions

********************************************************************/

var init_ckeditor = function() {
    ckeditor = $('#pcontent').ckeditor({
        filebrowserBrowseUrl: '/cp/browse',
        filebrowserImageBrowseUrl: '/cp/browse?io=1',
        filebrowserWindowWidth: 800,
        filebrowserWindowHeight: 500,
        allowedContent: true
    }).editor;
};

var init_uploader = function() {
	uploader = new plupload.Uploader({
		runtimes: 'html5,flash,silverlight,html4',
		browse_button: 'taracot_dlg_upload_btn_add',
		drop_element: "taracot_upload_box",
		url: '/cp/warehouse/data/upload',
		flash_swf_url: '/js/plupload/moxie.swf',
		silverlight_xap_url: '/js/plupload/moxie.xap',
		filters: {
			max_file_size: '100mb',
		}
	});
	uploader.init();
	uploader.bind('FilesAdded', function(up, files) {
		if (uploader.files.length) {
			// Do something here
		}
		// dlguploadbtnupload_handler();
	});
	uploader.bind('Error', function(up, err) {
		$.UIkit.notify({
			message: err.file.name + ': ' + err.message,
			status: 'danger',
			timeout: 2000,
			pos: 'top-center'
		});
	});
	uploader.bind('UploadProgress', function(up, file) {
		// Prorgess
	});
	uploader.bind('FileUploaded', function(upldr, file, object) {
		var data;
		try {
			data = eval(object.response);
		} catch (err) {
			data = eval('(' + object.response + ')');
		}
		if (data) {
			if (data.status === 0) {
				if (data.error) {
					$.UIkit.notify({
						message: data.error,
						status: 'danger',
						timeout: 2000,
						pos: 'top-center'
					});
				}
			}
			if (data.status == 1) {
				// Success
			}
		}
	});
	uploader.bind('UploadComplete', function() {
		$('#taracot_dlg_upload_btn_add').attr('disabled', false);
		$('#taracot_dlg_upload_btn_clear').attr('disabled', false);
		$('#taracot_dlg_upload_btn_cancel').attr('disabled', false);
	});
};

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