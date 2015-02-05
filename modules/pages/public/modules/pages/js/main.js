var ckeditor,
    jstree_folders,
    jstree_folders_select,
    root_pages = [],
    pages_data = {},
    current_folder,
    _lang_change_no_action,
    _history_handler_disable = false,
    auto_save_timer,
    auto_save_interval_ms = 30000;

var folders_edit_dlg = UIkit.modal("#taracot_pages_folders_edit_dlg"),
    folders_select_dlg = UIkit.modal("#taracot_pages_folders_select_dlg"),
    dlg_lock = UIkit.modal("#dlg_lock"),
    dlg_unsaved = UIkit.modal("#dlg_unsaved");

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
        if (val === null) {
            val = '&mdash;';
        }
        return val;
    },
    function(val, id) {
        return '<div style="text-align:center;width:100px"><button class="uk-icon-button uk-icon-edit taracot-tableitem-edit" id="taracot-btnedt-' + id + '" type="button"></button>&nbsp;<button class="uk-icon-button uk-icon-button-danger uk-icon-trash-o taracot-tableitem-delete" id="taracot-btndel-' + id + '" type="button"></button></div>';
    }
];

/*******************************************************************

 Table hanlders

********************************************************************/

$('#btn_select_all').click(function() {
    $('.taracot-table-chbx').prop('checked', true);
});

$('#btn_select_none').click(function() {
    $('.taracot-table-chbx').prop('checked', false);
});

$('#btn_delete_selected').click(function() {
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

var show_folders = function() {
    $('#taracot_pages_list').addClass('uk-hidden');
    $('#taracot_pages_folders').removeClass('uk-hidden');
    $('#taracot_pages_edit').addClass('uk-hidden');
    btn_folders_click_handler();
};

var show_pages = function() {
    push_state({
        mode: 'list'
    }, "?mode=list");
    $('#taracot_pages_list').removeClass('uk-hidden');
    $('#taracot_pages_folders').addClass('uk-hidden');
    $('#taracot_pages_edit').addClass('uk-hidden');
};

/*******************************************************************

 Form-related functions

********************************************************************/

var get_current_form_data = function() {
    return {
        ptitle: $.trim($('#ptitle').val()),
        playout: $('#playout').val(),
        pkeywords: $.trim($('#pkeywords').val()),
        pdesc: $.trim($('#pdesc').val()),
        pcontent: $('#pcontent').val()
    };
};

var get_current_form_data_core = function() {
    return {
        pfilename: $.trim($('#pfilename').val()),
        pfolder: $.trim($('#pfolder').val()),
        pfolder_id: $('#pfolder_id').val() || jstree_get_root_id()
    };
};

var field_cleanup = function() {
    $(this).val('');
    $(this).removeClass('uk-form-danger');
};

var field_cleanup_danger = function() {
    $(this).removeClass('uk-form-danger');
};

var set_defaults = function() {
    $('.taracot-page-edit-form-control').each(field_cleanup);
    $('.taracot-page-edit-form-control-core').each(field_cleanup);
    $('#plang').val(locales[0]);
    $('#playout').val(layouts.default);
    $('#pfolder').val('/');
    pages_data._id = undefined;
    pages_data.pfilename = '';
    pages_data.pfolder = '/';
    pages_data.pfolder_id = jstree_get_root_id();
    pages_data.pdata = {};
    for (var l in locales)
        pages_data.pdata[locales[l]] = {};
};

/*******************************************************************
Auto-save functions
********************************************************************/

var auto_save_data = function() {
    generate_pages_data();
    $.jStorage.set("_taracot_pages_autosave", pages_data);
    $.jStorage.set("_taracot_root_pages_autosave", root_pages);
    auto_save_timer = setTimeout(auto_save_data, 5000);
};

var clear_autosave = function() {
    if (auto_save_timer) window.clearTimeout(auto_save_timer);
    $.jStorage.set("_taracot_pages_autosave", false);
    $.jStorage.set("_taracot_root_pages_autosave", false);
};

/*******************************************************************

 Pages table button handlers

********************************************************************/

$('#btn_add_item').click(function() {
    push_state({
        mode: 'new'
    }, "?mode=new");
    $('#taracot_pages_list').addClass('uk-hidden');
    $('#taracot_pages_edit').removeClass('uk-hidden');
    set_defaults();
    _lang_change_no_action = true;
    $('#taracot_pages_lang_' + locales[0] + ' > a').click();
    $('#pcontent').val('');
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/pages/data/rootpages',
        dataType: "json",
        success: function(data) {
            if (data && data.status && data.status == 1) {
                if (data.root_pages) {
                    current_folder = '';
                    root_pages = data.root_pages;
                    $('#pfolder').change();
                }
            }
            $('#ptitle').focus();
            auto_save_timer = setTimeout(auto_save_data, 5000);
        },
        error: function() {
            $('#ptitle').focus();
        },
        complete: function() {
            $.loadingIndicator('hide');
        }
    });
});

var show_data = function(data) {
    $('.taracot-page-edit-form-control').each(field_cleanup);
    if (data.ptitle) $('#ptitle').val(data.ptitle);
    if (data.playout) $('#playout').val(data.playout);
    if (!$('#playout').val()) $('#playout').val(layouts.default);
    if (data.pkeywords) $('#pkeywords').val(data.pkeywords);
    if (data.pdesc) $('#pdesc').val(data.pdesc);
    if (data.pcontent) {
        $('#pcontent').val(data.pcontent);
    } else {
        $('#pcontent').val('');
    }
};

var show_data_core = function(data) {
    $('.taracot-page-edit-form-control-core').each(field_cleanup);
    if (data.pfilename) $('#pfilename').val(data.pfilename);
    if (data.pfolder) $('#pfolder').val(data.pfolder);
    if (data.pfolder_id) $('#pfolder_id').val(data.pfolder_id);
};

var edit_item = function(id, unlock) {
    _lang_change_no_action = true;
    $('#taracot_pages_lang_' + locales[0] + ' > a').click();
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/pages/data/load',
        dataType: "json",
        data: {
            pid: id,
            unlock: unlock
        },
        success: function(data) {
            if (data && data.status == 1) {
                push_state({
                    mode: 'edit',
                    id: id
                }, "?mode=edit&id=" + id);
                if (data.pages_data && data.pages_data._id && data.pages_data.plock && data.pages_data.plock != current_username) {
                    pages_data._id = data.pages_data._id;
                    $('#document_locked_by').html(data.pages_data.plock);
                    return dlg_lock.show();
                }
                var current_lang = $('#taracot_form_lang_tabs > li.uk-active > a').html() || locales[0];
                $('#taracot_pages_list').addClass('uk-hidden');
                $('#taracot_pages_edit').removeClass('uk-hidden');
                set_defaults();
                if (data.pages_data) pages_data = data.pages_data;
                show_data(data.pages_data.pdata[current_lang]);
                show_data_core(data.pages_data);
                current_folder = data.pages_data.pfolder || '';
                if (data.root_pages) root_pages = data.root_pages;
                $('#pfolder').change();
                auto_save_timer = setTimeout(auto_save_data, auto_save_interval_ms);
            } else {
                if (!data) data = {};
                UIkit.notify({
                    message: data.error || _lang_vars.ajax_failed,
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
        },
        complete: function() {
            $.loadingIndicator('hide');
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
                    UIkit.notify({
                        message: _lang_vars.delete_err_msg,
                        status: 'danger',
                        timeout: 2000,
                        pos: 'top-center'
                    });
                }
            },
            error: function() {
                $('#taracot_table').medvedTable('loading_indicator_hide');
                UIkit.notify({
                    message: _lang_vars.delete_err_msg,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        });
    }
};

var generate_pages_data = function() {
    var core_fields = get_current_form_data_core(),
        current_lang = $('#taracot_form_lang_tabs > li.uk-active > a').html() || locales[0],
        current_data = get_current_form_data();
    pages_data.pdata[current_lang] = current_data;
    pages_data.pfilename = core_fields.pfilename;
    pages_data.pfolder = core_fields.pfolder;
    pages_data.pfolder_id = core_fields.pfolder_id;
    var form_errors = [],
        form_error_lang, form_error_focus;
    if ($('#taracot-pagetype-root').hasClass('uk-active')) {
        pages_data.pfilename = '';
    } else {
        if (!pages_data.pfilename || !pages_data.pfilename.match(/^[A-Za-z0-9_\-\.]{1,80}$/)) {
            form_errors.push('#pfilename');
            if (!form_error_focus) form_error_focus = '#pfilename';
        }
    }
    for (var lang in pages_data.pdata) {
        if (!pages_data.pdata[lang].ptitle || pages_data.pdata[lang].ptitle.length > 100) {
            if (current_lang != lang) form_error_lang = lang;
            form_errors.push('#ptitle');
            if (!form_error_focus) form_error_focus = '#ptitle';
            break;
        }
    }
    return {
        errors: form_errors,
        lang: form_error_lang,
        focus: form_error_focus
    };
};

$('#btn_edit_save').click(function() {
    $('.taracot-page-edit-form-control').each(field_cleanup_danger);
    $('.taracot-page-edit-form-control-core').each(field_cleanup_danger);
    var gpd = generate_pages_data();
    if (gpd.errors.length) {
        if (gpd.lang) $('#taracot_pages_lang_' + gpd.lang + ' > a').click();
        for (var e in gpd.errors)
            $(gpd.errors[e]).addClass('uk-form-danger');
        if (gpd.focus) $(gpd.focus).focus();
        return UIkit.notify({
            message: _lang_vars.form_contain_errors,
            status: 'danger',
            timeout: 2000,
            pos: 'top-center'
        });
    }
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/pages/data/save',
        dataType: "json",
        data: {
            save_data: pages_data
        },
        success: function(data) {
            if (data && data.status == 1) {
                clear_autosave();
                UIkit.notify({
                    message: _lang_vars.page_save_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
                show_pages();
                $('#taracot_table').medvedTable('update');
            } else {
                if (!data) data = {};
                UIkit.notify({
                    message: data.error || _lang_vars.ajax_failed,
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
        },
        complete: function() {
            $.loadingIndicator('hide');
        }
    });
});

$('.taracot-page-edit-form-control').bind('keypress', function(e) {
    if (submitOnEnter(e)) {
        $('#btn_edit_save').click();
    }
});

$('.taracot-page-edit-form-control-core').bind('keypress', function(e) {
    if (submitOnEnter(e)) {
        $('#btn_edit_save').click();
    }
});

$('#btn_edit_cancel').click(function() {
    clear_autosave();
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/pages/data/unlock',
        dataType: "json",
        data: {
            pid: pages_data._id
        },
        complete: function() {
            $.loadingIndicator('hide');
            show_pages();
            $('#taracot_table').medvedTable('update');
        }
    });
});

$('#pfolder').change(function() {
    $('#taracot-pagetype-root').removeClass('uk-hidden');
    for (var i = 0; i < root_pages.length; i++) {
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

var taracot_form_lang_tabs_li_click_handler = function() {
    if (_lang_change_no_action) {
        _lang_change_no_action = undefined;
        return;
    }
    var current_lang = $('#taracot_form_lang_tabs > li.uk-active > a').html() || locales[0],
        current_data = get_current_form_data(),
        new_lang = $(this).attr('rel');
    if (current_lang && new_lang && current_lang != new_lang) {
        pages_data.pdata[current_lang] = current_data;
        show_data(pages_data.pdata[new_lang]);
    }
};

$('#btn_unlock').click(function() {
    dlg_lock.hide();
    edit_item(pages_data._id, true);
});

$('#btn_restore').click(function() {
    pages_data = $.jStorage.get("_taracot_pages_autosave") || {};
    root_pages = $.jStorage.get("_taracot_root_pages_autosave") || [];
    clear_autosave();
    $('#taracot_pages_list').addClass('uk-hidden');
    $('#taracot_pages_edit').removeClass('uk-hidden');
    $('#taracot_pages_lang_' + locales[0] + ' > a').click();
    var current_lang = locales[0];
    $('.taracot-page-edit-form-control').each(field_cleanup);
    $('.taracot-page-edit-form-control-core').each(field_cleanup);
    $('#plang').val(locales[0]);
    $('#playout').val(layouts.default);
    $('#pfolder').val('');
    show_data(pages_data.pdata[current_lang]);
    show_data_core(pages_data);
    current_folder = pages_data.pfolder || '';
    if (pages_data.root_pages) root_pages = pages_data.root_pages;
    $('#pfolder').change();
    auto_save_timer = setTimeout(auto_save_data, auto_save_interval_ms);
    dlg_unsaved.hide();
});

$('#btn_dont_restore').click(function() {
    clear_autosave();
    dlg_unsaved.hide();
});

/*******************************************************************

 document.ready

********************************************************************/

$(document).ready(function() {
    for (var l in locales) $('#taracot_form_lang_tabs').append('<li id="taracot_pages_lang_' + locales[l] + '"><a href="" rel="' + locales[l] + '">' + locales[l] + '</a></li>');
    $('#taracot_form_lang_tabs').children().eq(3).addClass('uk-active');
    $('#taracot_form_lang_tabs').children().eq(1).remove();
    $('#taracot_form_lang_tabs > li > a').click(taracot_form_lang_tabs_li_click_handler);
    $('#taracot_table').medvedTable({
        col_count: 4,
        sort_mode: 1,
        sort_cell: 'pfolder',
        taracot_table_url: '/cp/pages/data/list',
        process_rows: process_rows,
        error_message: _lang_vars.ajax_failed
    });
    $('#pfolder').attr('readonly', true);
    folders_data = folders_preload;
    init_ckeditor();
    if ($.jStorage.get("_taracot_pages_autosave")) {
        $('#document_unsaved_title').html('&mdash;');
        if ($.jStorage.get("_taracot_pages_autosave").pdata[current_locale]) $('#document_unsaved_title').html($.jStorage.get("_taracot_pages_autosave").pdata[current_locale].ptitle || '&mdash;');
        return dlg_unsaved.show();
    }
    // History handler
    bind_history();
    history_handler();
});

/*

 History API handler

*/

var bind_history = function() {
    History.Adapter.bind(window, 'statechange', function() {
        history_handler();
    });
};

var history_handler = function() {
    if (_history_handler_disable) return;
    var state = History.getState();
    if (state.data.mode) {
        switch (state.data.mode) {
            case 'list':
                show_pages();
                break;
            case 'folders':
                $('#btn_folders').click();
                break;
            case 'new':
                $('#btn_add_item').click();
                break;
            case 'edit':
                if (state.data.id)
                    edit_item(state.data.id);
                break;
        }
    }
};

var push_state = function(p1, p2) {
    _history_handler_disable = true;
    History.pushState(p1, save_title, p2);
    _history_handler_disable = false;
};

/*******************************************************************

 Helper functions

********************************************************************/

var init_ckeditor = function() {
    window.setTimeout(function() {
        ckeditor = $('#pcontent').ckeditor({
            filebrowserBrowseUrl: '/cp/browse',
            filebrowserImageBrowseUrl: '/cp/browse?io=1',
            filebrowserWindowWidth: 800,
            filebrowserWindowHeight: 500,
            allowedContent: true
        }).editor;
    }, 0);
};
