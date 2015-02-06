var ckeditor,
    jstree_categories,
    jstree_categories_select,
    warehouse_data = {},
    current_folder,
    _lang_change_no_action,
    _history_handler_disable = false,
    auto_save_timer,
    auto_save_interval_ms = 30000,
    uploader;

var categories_edit_dlg = UIkit.modal("#taracot_warehouse_categories_edit_dlg"),
    categories_select_dlg = UIkit.modal("#taracot_warehouse_categories_select_dlg"),
    warehouse_item_dlg = UIkit.modal("#warehouse_item_dlg"),
    warehouse_coll_dlg = UIkit.modal("#warehouse_coll_dlg"),
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

var show_categories = function() {
    $('#taracot_warehouse_list').addClass('uk-hidden');
    $('#taracot_warehouse_categories').removeClass('uk-hidden');
    $('#taracot_warehouse_edit').addClass('uk-hidden');
    btn_categories_click_handler();
};

var show_pages = function() {
    push_state({
        mode: 'list'
    }, "?mode=list");
    $('#taracot_warehouse_list').removeClass('uk-hidden');
    $('#taracot_warehouse_categories').addClass('uk-hidden');
    $('#taracot_warehouse_edit').addClass('uk-hidden');
};

/*******************************************************************

 Form-related functions

********************************************************************/

var get_current_form_data = function() {
    var pchars = [];
    $('.taracot-chars-item').each(function() {
        pchars.push({
            id: $(this).attr('rel'),
            val: $(this).val()
        });
    });
    return {
        ptitle: $.trim($('#ptitle').val()),
        pshortdesc: $.trim($('#pshortdesc').val()),
        pkeywords: $.trim($('#pkeywords').val()),
        pdesc: $.trim($('#pdesc').val()),
        pcontent: $('#pcontent').val(),
        pchars: pchars
    };
};

var get_current_form_data_core = function() {
    var data = {
        pfilename: $.trim($('#pfilename').val()),
        pcategory: $.trim($('#pcategory').val()),
        pcategory_id: $('#pcategory_id').val() || jstree_get_root_id(),
        pamount: $.trim($('#pamount').val()),
        pamount_unlimited: 0,
        pcurs: $('#pcurs').val(),
        pprice: $.trim($('#pprice').val()),
        pweight: $.trim($('#pweight').val()),
        pimages: []
    };
    if ($('#pamount_unlimited').is(':checked')) data.pamount_unlimited = 1;
    $('#files_grid').children().each(function() {
        data.pimages.push($(this).attr('id').replace(/^_twi_/, ''));
    });
    return data;
};

var field_cleanup = function() {
    $(this).val('');
    $('#pamount_unlimited').prop('checked', false);
    $(this).removeClass('uk-form-danger');
};

var field_cleanup_danger = function() {
    $(this).removeClass('uk-form-danger');
};

var set_defaults = function() {
    $('.taracot-page-edit-form-control').each(field_cleanup);
    $('.taracot-page-edit-form-control-core').each(field_cleanup);
    $('#pcurs').val(whcurs[0].id);
    $('#pcategory').val('/');
    $('#pamount_unlimited').prop('checked', false);
    $('#files_grid').empty();
    $('#warehouse_chars').empty();
    warehouse_data._id = undefined;
    warehouse_data.pfilename = '';
    warehouse_data.pcategory = '/';
    warehouse_data.pcategory_id = jstree_get_root_id();
    warehouse_data.pdata = {};
    for (var l in locales)
        warehouse_data.pdata[locales[l]] = {};
};

/*******************************************************************
Auto-save functions
********************************************************************/

var auto_save_data = function() {
    generate_warehouse_data();
    $.jStorage.set("_taracot_warehouse_autosave", warehouse_data);
    auto_save_timer = setTimeout(auto_save_data, 5000);
};

var clear_autosave = function() {
    if (auto_save_timer) window.clearTimeout(auto_save_timer);
    $.jStorage.set("_taracot_warehouse_autosave", false);
};

/*******************************************************************

 Pages table button handlers

********************************************************************/

$('#btn_add_item').click(function() {
    push_state({
        mode: 'new'
    }, "?mode=new");
    $('#taracot_warehouse_list').addClass('uk-hidden');
    $('#taracot_warehouse_edit').removeClass('uk-hidden');
    set_defaults();
    _lang_change_no_action = true;
    $('#taracot_warehouse_lang_' + locales[0] + ' > a').click();
    $('#pcontent').val('');
    $('#ptitle').focus();
    if (!uploader) init_uploader();
    auto_save_timer = setTimeout(auto_save_data, 5000);
});

var show_data = function(data) {
    $('.taracot-page-edit-form-control').each(field_cleanup);
    if (data.ptitle) $('#ptitle').val(data.ptitle);
    if (data.pshortdesc) $('#pshortdesc').val(data.pshortdesc);
    if (data.pkeywords) $('#pkeywords').val(data.pkeywords);
    if (data.pdesc) $('#pdesc').val(data.pdesc);
    $('#warehouse_chars').empty();
    if (data.pchars) {
        var items_lng = {};
        for (var w = 0; w < whitems.length; w++) items_lng[whitems[w].id] = whitems[w][current_lng];
        for (var pc = 0; pc < data.pchars.length; pc++) {
            var item = '<div><table style="width:100%"><tr><td style="width:120px">' + (items_lng[data.pchars[pc].id] || data.pchars[pc].id) + '</td><td><input type="text" class="taracot-chars-item uk-width-1-1" rel="' + data.pchars[pc].id + '" value="' + data.pchars[pc].val + '"></td><td style="width:100px"><button class="uk-button uk-button-small uk-button-danger taracot-btn-chars-del"><i class="uk-icon uk-icon-trash-o"></i></button>&nbsp;<button class="uk-button uk-button-small taracot-btn-chars-sort"><i class="uk-icon uk-icon-unsorted"></i></button></td></tr></table></div>';
            $('#warehouse_chars').append(item);
        }
        UIkit.sortable($('#warehouse_chars'), {
            handleClass: 'taracot-btn-chars-sort'
        });
        $('.taracot-btn-chars-del').unbind();
        $('.taracot-btn-chars-del').click(taracot_btn_chars_del_handler);
    }
    if (data.pcontent) {
        $('#pcontent').val(data.pcontent);
    } else {
        $('#pcontent').val('');
    }
};

var show_data_core = function(data) {
    $('.taracot-page-edit-form-control-core').each(field_cleanup);
    if (data.pfilename) $('#pfilename').val(data.pfilename);
    if (data.pcategory) $('#pcategory').val(data.pcategory);
    if (data.pcategory_id) $('#pcategory_id').val(data.pcategory_id);
    if (data.pamount) $('#pamount').val(data.pamount);
    if (data.pprice) $('#pprice').val(data.pprice);
    if (data.pweight) $('#pweight').val(data.pweight);
    if (data.pcurs) $('#pcurs').val(data.pcurs);
    $('#pamount_unlimited').prop('checked', false);
    if (data.pamount_unlimited) $('#pamount_unlimited').prop('checked', true);
    if (data.pimages) {
        for (var i = 0; i < data.pimages.length; i++) {
            $('#files_grid').append('<img class="uk-thumbnail taracot-warehouse-image-thumbnail" id="_twi_' + data.pimages[i] + '" src="/files/warehouse/tn_' + data.pimages[i] + '.jpg">');
            new DragObject(document.getElementById('_twi_' + data.pimages[i]));
            var _do = new DropTarget(document.getElementById('_twi_' + data.pimages[i]));
            _do.onLeave = function() {
                var ns = $('.taracot-warehouse-image-thumbnail').getSelected('taracot-warehouse-image-thumbnail-selected');
                for (var i = 0; i < ns.length; i++) $('#' + this.toString()).before($('#' + ns[i]));
            };
        }
        $('.taracot-warehouse-image-thumbnail').shifty({
            className: 'taracot-warehouse-image-thumbnail-selected',
            select: function(el) {
                shifty_select_handler();
            },
            unselect: function(el) {
                shifty_unselect_handler();
            }
        });
    }
};

var edit_item = function(id, unlock) {
    _lang_change_no_action = true;
    $('#taracot_warehouse_lang_' + locales[0] + ' > a').click();
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/warehouse/data/load',
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
                if (data.warehouse_data && data.warehouse_data._id && data.warehouse_data.plock && data.warehouse_data.plock != current_username) {
                    warehouse_data._id = data.warehouse_data._id;
                    $('#document_locked_by').html(data.warehouse_data.plock);
                    return dlg_lock.show();
                }
                var current_lang = $('#taracot_form_lang_tabs > li.uk-active > a').html() || locales[0];
                $('#taracot_warehouse_list').addClass('uk-hidden');
                $('#taracot_warehouse_edit').removeClass('uk-hidden');
                set_defaults();
                if (data.warehouse_data) warehouse_data = data.warehouse_data;
                show_data(data.warehouse_data.pdata[current_lang]);
                show_data_core(data.warehouse_data);
                current_folder = data.warehouse_data.pcategory || '';
                $('#pcategory').change();
                if (!uploader) init_uploader();
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

var generate_warehouse_data = function() {
    var core_fields = get_current_form_data_core(),
        current_lang = $('#taracot_form_lang_tabs > li.uk-active > a').html() || locales[0],
        current_data = get_current_form_data();
    warehouse_data.pdata[current_lang] = current_data;
    warehouse_data.pfilename = core_fields.pfilename;
    warehouse_data.pcategory = core_fields.pcategory;
    warehouse_data.pcategory_id = core_fields.pcategory_id;
    warehouse_data.pimages = core_fields.pimages || [];
    warehouse_data.pamount = core_fields.pamount || 0;
    warehouse_data.pamount_unlimited = core_fields.pamount_unlimited || 0;
    warehouse_data.pprice = core_fields.pprice || 0;
    warehouse_data.pweight = core_fields.pweight || 0;
    warehouse_data.pcurs = core_fields.pcurs;
    var form_errors = [],
        form_error_lang, form_error_focus;
    if (!warehouse_data.pfilename || !warehouse_data.pfilename.match(/^[A-Za-z0-9_\-\.]{1,80}$/)) {
        form_errors.push('#pfilename');
        if (!form_error_focus) form_error_focus = '#pfilename';
    }
    if (!warehouse_data.pamount || parseInt(warehouse_data.pamount) != warehouse_data.pamount || warehouse_data.pamount < 0) {
        form_errors.push('#pamount');
        if (!form_error_focus) form_error_focus = '#pamount';
    }
    if (!warehouse_data.pprice || parseFloat(warehouse_data.pprice) != warehouse_data.pprice || warehouse_data.pprice < 0) {
        form_errors.push('#pprice');
        if (!form_error_focus) form_error_focus = '#pprice';
    }
    if (!warehouse_data.pweight || parseFloat(warehouse_data.pweight) != warehouse_data.pweight || warehouse_data.pweight < 0) {
        form_errors.push('#pweight');
        if (!form_error_focus) form_error_focus = '#pweight';
    }
    if (!warehouse_data.pcurs || !warehouse_data.pcurs.match(/^[a-z0-9]{1,20}$/i)) {
        form_errors.push('#pcurs');
        if (!form_error_focus) form_error_focus = '#pcurs';
    }
    for (var lang in warehouse_data.pdata) {
        if (!warehouse_data.pdata[lang].ptitle || warehouse_data.pdata[lang].ptitle.length > 100) {
            if (current_lang != lang) form_error_lang = lang;
            form_errors.push('#ptitle');
            if (!form_error_focus) form_error_focus = '#ptitle';
            break;
        }
        if (!warehouse_data.pdata[lang].pshortdesc || warehouse_data.pdata[lang].pshortdesc.length > 100) {
            if (current_lang != lang) form_error_lang = lang;
            form_errors.push('#pshortdesc');
            if (!form_error_focus) form_error_focus = '#pshortdesc';
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
    var gpd = generate_warehouse_data();
    if (gpd.errors.length) {
        if (gpd.lang) $('#taracot_warehouse_lang_' + gpd.lang + ' > a').click();
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
        url: '/cp/warehouse/data/save',
        dataType: "json",
        data: {
            save_data: warehouse_data
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
        url: '/cp/warehouse/data/unlock',
        dataType: "json",
        data: {
            pid: warehouse_data._id
        },
        complete: function() {
            $.loadingIndicator('hide');
            show_pages();
            $('#taracot_table').medvedTable('update');
        }
    });
});

$('#pcategory').change(function() {});

var taracot_form_lang_tabs_li_click_handler = function() {
    if (_lang_change_no_action) {
        _lang_change_no_action = undefined;
        return;
    }
    var current_lang = $('#taracot_form_lang_tabs > li.uk-active > a').html() || locales[0],
        current_data = get_current_form_data(),
        new_lang = $(this).attr('rel');
    if (current_lang && new_lang && current_lang != new_lang) {
        warehouse_data.pdata[current_lang] = current_data;
        show_data(warehouse_data.pdata[new_lang]);
    }
};

$('#btn_unlock').click(function() {
    dlg_lock.hide();
    edit_item(warehouse_data._id, true);
});

$('#btn_restore').click(function() {
    warehouse_data = $.jStorage.get("_taracot_warehouse_autosave") || {};
    clear_autosave();
    $('#taracot_warehouse_list').addClass('uk-hidden');
    $('#taracot_warehouse_edit').removeClass('uk-hidden');
    $('#taracot_warehouse_lang_' + locales[0] + ' > a').click();
    var current_lang = locales[0];
    $('.taracot-page-edit-form-control').each(field_cleanup);
    $('.taracot-page-edit-form-control-core').each(field_cleanup);
    $('#pcurs').val(whcurs[0].id);
    $('#pcategory').val('');
    show_data(warehouse_data.pdata[current_lang]);
    show_data_core(warehouse_data);
    current_folder = warehouse_data.pcategory || '';
    $('#pcategory').change();
    if (!uploader) init_uploader();
    auto_save_timer = setTimeout(auto_save_data, auto_save_interval_ms);
    dlg_unsaved.hide();
});

$('#btn_dont_restore').click(function() {
    clear_autosave();
    dlg_unsaved.hide();
});

$('#btn_add_chars').click(function() {
    var descitems = whitems,
        select_html = '';

    var descitems_arr = [];
    for (var key in descitems) descitems_arr.push([descitems[key].id, descitems[key][current_lng]]);
    descitems_arr.sort(function(a, b) {
        a = a[1];
        b = b[1];
        return a < b ? -1 : (a > b ? 1 : 0);
    });
    for (var i = 0; i < descitems_arr.length; i++) {
        var k = descitems_arr[i][0],
            v = descitems_arr[i][1];
        var label = v || k;
        select_html += '<div class="taracot-dlg-item" id="_di_' + k + '">' + label + '</div>';
    }
    $('#warehouse_items').html(select_html);
    $('.taracot-dlg-item').unbind();
    $('.taracot-dlg-item').click(taracot_dlg_item_click_hanlder);
    warehouse_item_dlg.show();
});

$('#btn_add_coll').click(function() {
    var select_html = '';
    var whcolls_arr = [];
    for (var key in whcollections) whcolls_arr.push(whcollections[key].id);
    whcolls_arr.sort();
    for (var i = 0; i < whcolls_arr.length; i++) {
        select_html += '<div class="taracot-dlg-coll" id="_dc_' + whcolls_arr[i] + '">' + whcolls_arr[i] + '</div>';
    }
    $('#warehouse_colls').html(select_html);
    $('.taracot-dlg-coll').unbind();
    $('.taracot-dlg-coll').click(taracot_dlg_coll_click_hanlder);
    warehouse_coll_dlg.show();
});

var taracot_dlg_item_click_hanlder = function() {
    warehouse_item_dlg.hide();
    var item = '<div><table style="width:100%"><tr><td style="width:120px">' + $(this).html() + '</td><td><input type="text" class="taracot-chars-item uk-width-1-1" rel="' + $(this).attr('id').replace(/^_di_/, '') + '"></td><td style="width:100px"><button class="uk-button uk-button-small uk-button-danger taracot-btn-chars-del"><i class="uk-icon uk-icon-trash-o"></i></button>&nbsp;<button class="uk-button uk-button-small taracot-btn-chars-sort"><i class="uk-icon uk-icon-unsorted"></i></button></td></tr></table></div>';
    $('#warehouse_chars').append(item);
    UIkit.sortable($('#warehouse_chars'), {
        handleClass: 'taracot-btn-chars-sort'
    });
    $('.taracot-btn-chars-del').unbind();
    $('.taracot-btn-chars-del').click(taracot_btn_chars_del_handler);
};

var taracot_dlg_coll_click_hanlder = function() {
    warehouse_coll_dlg.hide();
    var coll = $(this).attr('id').replace(/^_dc_/, ''),
        items = [],
        items_lng = {},
        items_html = '';
    for (var key in whcollections)
        if (whcollections[key].id == coll) items = whcollections[key].items;
    for (var i = 0; i < whitems.length; i++) items_lng[whitems[i].id] = whitems[i][current_lng];
    for (var ci = 0; ci < items.length; ci++) items_html += '<div><table style="width:100%"><tr><td style="width:120px">' + (items_lng[items[ci]] || items[ci]) + '</td><td><input type="text" class="taracot-chars-item uk-width-1-1" rel="' + items[ci] + '"></td><td style="width:100px"><button class="uk-button uk-button-small uk-button-danger taracot-btn-chars-del"><i class="uk-icon uk-icon-trash-o"></i></button>&nbsp;<button class="uk-button uk-button-small taracot-btn-chars-sort"><i class="uk-icon uk-icon-unsorted"></i></button></td></tr></table></div>';
    $('#warehouse_chars').append(items_html);
    UIkit.sortable($('#warehouse_chars'), {
        handleClass: 'taracot-btn-chars-sort'
    });
    $('.taracot-btn-chars-del').unbind();
    $('.taracot-btn-chars-del').click(taracot_btn_chars_del_handler);
};

var taracot_btn_chars_del_handler = function() {
    $(this).parent().parent().remove();
};

$('#btn_images_delete').click(function() {
    var ns = $('.taracot-warehouse-image-thumbnail').getSelected('taracot-warehouse-image-thumbnail-selected');
    if (!ns.length) return;
    $('#btn_images_delete').attr('disabled', true);
    var arr = [];
    for (var i = 0; i < ns.length; i++) arr.push(ns[i].replace(/^_twi_/, ''));
    $.ajax({
        type: 'POST',
        url: '/cp/warehouse/data/upload/delete',
        data: {
            pimages: arr
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == '1') {
                for (var i = 0; i < ns.length; i++) $('#' + ns[i]).remove();
            } else {
                if (data.error) {
                    UIkit.notify({
                        message: data.error,
                        status: 'danger',
                        timeout: 2000,
                        pos: 'top-center'
                    });
                }
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
            $('#btn_images_delete').attr('disabled', false);
        }
    });
});

/*******************************************************************

 document.ready

********************************************************************/

$(document).ready(function() {
    for (var l in locales) $('#taracot_form_lang_tabs').append('<li id="taracot_warehouse_lang_' + locales[l] + '"><a href="" rel="' + locales[l] + '">' + locales[l] + '</a></li>');
    $('#taracot_form_lang_tabs').children().eq(3).addClass('uk-active');
    $('#taracot_form_lang_tabs').children().eq(1).remove();
    $('#taracot_form_lang_tabs > li > a').click(taracot_form_lang_tabs_li_click_handler);
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
    init_files_grid();
    if ($.jStorage.get("_taracot_warehouse_autosave")) {
        $('#document_unsaved_title').html('&mdash;');
        if ($.jStorage.get("_taracot_warehouse_autosave").pdata[current_lng]) $('#document_unsaved_title').html($.jStorage.get("_taracot_warehouse_autosave").pdata[current_lng].ptitle || '&mdash;');
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
            case 'categories':
                $('#btn_categories').click();
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

var init_uploader = function() {
    uploader = new plupload.Uploader({
        runtimes: 'html5,flash,silverlight,html4',
        browse_button: 'btn_images_upload',
        url: '/cp/warehouse/data/upload',
        flash_swf_url: '/js/plupload/moxie.swf',
        silverlight_xap_url: '/js/plupload/moxie.xap',
        filters: {
            max_file_size: '100mb',
            mime_types: [{
                title: "Image files",
                extensions: "jpg,jpeg,png"
            }]
        }
    });
    uploader.init();
    uploader.bind('FilesAdded', function(up, files) {
        if (!uploader.files.length) return;
        $('#images_upload_progress').show();
        $('#btn_images_upload').attr('disabled', true);
        uploader.start();
    });
    uploader.bind('Error', function(up, err) {
        UIkit.notify({
            message: err.file.name + ': ' + err.message,
            status: 'danger',
            timeout: 2000,
            pos: 'top-center'
        });
    });
    uploader.bind('UploadProgress', function(up, file) {
        $('#images_upload_progress_bar').css('width', uploader.total.percent + '%');
        $('#images_upload_progress_bar').html(uploader.total.percent + '%');
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
                    UIkit.notify({
                        message: data.error,
                        status: 'danger',
                        timeout: 2000,
                        pos: 'top-center'
                    });
                }
            }
            if (data.status == 1 && data.id) {
                $('#files_grid').append('<img class="uk-thumbnail taracot-warehouse-image-thumbnail" id="_twi_' + data.id + '" src="/files/warehouse/tn_' + data.id + '.jpg">');
                new DragObject(document.getElementById('_twi_' + data.id));
                var _do = new DropTarget(document.getElementById('_twi_' + data.id));
                _do.onLeave = function() {
                    var ns = $('.taracot-warehouse-image-thumbnail').getSelected('taracot-warehouse-image-thumbnail-selected');
                    for (var i = 0; i < ns.length; i++) $('#' + _do.toString()).before($('#' + ns[i]));
                };
            }
        }
    });
    uploader.bind('UploadComplete', function() {
        $('.taracot-warehouse-image-thumbnail').shifty({
            className: 'taracot-warehouse-image-thumbnail-selected',
            select: function(el) {
                shifty_select_handler();
            },
            unselect: function(el) {
                shifty_unselect_handler();
            }
        });
        $('#btn_images_upload').attr('disabled', false);
    });
};

var init_files_grid = function() {
    var _do = new DropTarget(document.getElementById('files_grid'));
    _do.onLeave = function() {
        var ns = $('.taracot-warehouse-image-thumbnail').getSelected('taracot-warehouse-image-thumbnail-selected');
        for (var i = 0; i < ns.length; i++) $('#files_grid').children().last().after($('#' + ns[i]));
    };
    $('#files_grid').click(function(e) {
        if (e.target.id === "files_grid") {
            $('.taracot-warehouse-image-thumbnail').removeClass('taracot-warehouse-image-thumbnail-selected');
            shifty_handler();
        }
    });

};

var shifty_select_handler = function() {
    var ns = $('.taracot-files-item').getSelected('taracot-warehouse-image-thumbnail-selected');
};

var shifty_unselect_handler = function() {
    var ns = $('.taracot-files-item').getSelected('taracot-warehouse-image-thumbnail-selected');
};

var shifty_handler = function() {
    shifty_select_handler();
    shifty_unselect_handler();
};
