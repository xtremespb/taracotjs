var taracot_dlg_menu_edit = new UIkit.modal("#taracot_dlg_menu_edit"),
    edit_id,
    jstree_menu,
    edit_lng;


$('#btn_item_edit').click(function() {
    var sel = jstree_menu.jstree(true).get_selected();
    if (!sel || !sel.length || sel.length > 1) return;
    if (jstree_menu.jstree(true).get_parent(sel) == '#') return;
    var name = jstree_menu.jstree(true).get_node(sel).text,
        url = '';
    if (jstree_menu.jstree(true).get_node(sel).data && jstree_menu.jstree(true).get_node(sel).data.url)
        url = jstree_menu.jstree(true).get_node(sel).data.url;
    edit_id = sel;
    $('#taracot_dlg_menu_edit_text').val(name);
    $('#taracot_dlg_menu_edit_url').val(url);
    $('#taracot_dlg_menu_edit_page').val('');
    taracot_dlg_menu_edit.show();
    $('.taracot_dlg_menu_edit_field').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    $('#taracot_dlg_menu_edit_text').focus();
});

$('#btn_item_add').click(function() {
    var sel = jstree_menu.jstree(true).get_selected();
    if (!sel || !sel.length || sel.length > 1 || jstree_menu.jstree(true).get_path(sel).length > 2) return;
    taracot_dlg_menu_edit.show();
    $('.taracot_dlg_menu_edit_field').each(function() {
        $(this).val('');
        $(this).removeClass('uk-form-danger');
    });
    $('#taracot_dlg_menu_edit_text').focus();
    edit_id = undefined;
});

$('#btn_item_del').click(function() {
    var tree = jstree_menu.jstree(true),
        sel = tree.get_selected();
    if (!sel || !sel.length) return;
    var seltxt = '';
    for (var i = 0; i < sel.length; i++) {
        seltxt += ', ' + tree.get_node(sel[i]).text;
    }
    if (confirm(_lang_vars.confirm_menu_delete + "\n\n" + seltxt.replace(/,/, '')))
        tree.delete_node(sel[0]);
});

$('.taracot_dlg_menu_edit_field').bind('keypress', function(e) {
    if (submitOnEnter(e))
        $('#taracot_dlg_menu_edit_btn_save').click();
});

$('#btn_item_delall').click(function() {
    if (confirm(_lang_vars.confirm_menu_deleteall))
        init_jstree([], true);
});

$('#btn_menu_save_cancel').click(function() {
    if (confirm(_lang_vars.confirm_menu_cancel)) {
        $('#menu_editor').addClass('uk-hidden');
        $('#btn_load_menu').attr('disabled', false);
    }
});

$('#btn_load_menu').click(function() {
    $('#load_menu_loading').removeClass('uk-hidden');
    $('#btn_load_menu').attr('disabled', true);
    edit_lng = $('#menu_lang').val();
    $.ajax({
        type: 'POST',
        url: '/cp/menu/data/load',
        dataType: "json",
        data: {
            lng: edit_lng
        },
        success: function(data) {
            $('#load_menu_loading').addClass('uk-hidden');
            if (data.status == 1) {
                if (data.menu_source) {
                    init_jstree(jQuery.parseJSON(data.menu_source));
                }
                if (!jstree_menu.jstree(true).get_container().find('li').length)
                    jstree_insert_root();
                $('#menu_editor').removeClass('uk-hidden');
                $('#menu_edit_lang').html(edit_lng);
            } else {
                $('#btn_load_menu').attr('disabled', false);
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
            $('#load_menu_loading').addClass('uk-hidden');
            $('#btn_load_menu').attr('disabled', false);
            UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
});

$('#btn_menu_save').click(function() {
    var menu_data = jstree_menu.jstree(true).get_json(jstree_menu, {
        flat: true,
        no_state: true,
        no_id: false,
        no_data: false
    });
    for (var i = 0; i < menu_data.length; i++) {
        delete menu_data[i].li_attr;
        delete menu_data[i].a_attr;
        delete menu_data[i].icon;
        delete menu_data[i].state;
    }
    $.ajax({
        type: 'POST',
        url: '/cp/menu/data/save',
        dataType: "json",
        data: {
            lng: edit_lng,
            menu_source: JSON.stringify(menu_data)
        },
        success: function(data) {
            taracot_ajax_progress_indicator('body', false);
            if (data.status == 1) {
                $('#menu_editor').addClass('uk-hidden');
                $('#btn_load_menu').attr('disabled', false);
                UIkit.notify({
                    message: _lang_vars.save_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
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
            taracot_ajax_progress_indicator('body', false);
            UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
});

$('#taracot_dlg_menu_edit_btn_save').click(function() {
    $('.taracot_dlg_menu_edit_field').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    var sel = jstree_menu.jstree(true).get_selected();
    if (!sel || !sel.length || sel.length > 1) return;
    var errors = false;
    if (!$('#taracot_dlg_menu_edit_text').val()) {
        $('#taracot_dlg_menu_edit_text').addClass('uk-form-danger');
        $('#taracot_dlg_menu_edit_text').select();
        $('#taracot_dlg_menu_edit_text').focus();
        errors = true;
    }
    if (!$('#taracot_dlg_menu_edit_url').val()) {
        $('#taracot_dlg_menu_edit_url').addClass('uk-form-danger');
        if (!errors) {
            $('#taracot_dlg_menu_edit_text').select();
            $('#taracot_dlg_menu_edit_text').focus();
        }
        errors = true;
    }
    if (errors) {
        UIkit.notify({
            message: _lang_vars.form_contains_errors,
            status: 'danger',
            timeout: 2000,
            pos: 'top-center'
        });
        return;
    }
    taracot_dlg_menu_edit.hide();
    if (edit_id) {
        jstree_menu.jstree(true).rename_node(sel, $('#taracot_dlg_menu_edit_text').val());
        if (!jstree_menu.jstree(true).get_node(sel).data) jstree_menu.jstree(true).get_node(sel).data = {};
        jstree_menu.jstree(true).get_node(sel).data.url = $('#taracot_dlg_menu_edit_url').val();
    } else {
        var cn = jstree_menu.jstree(true).create_node(sel, {
            text: $('#taracot_dlg_menu_edit_text').val(),
            type: 'folder'
        });
        if (!jstree_menu.jstree(true).get_node(cn).data) jstree_menu.jstree(true).get_node(cn).data = {};
        jstree_menu.jstree(true).get_node(cn).data.url = $('#taracot_dlg_menu_edit_url').val();
        jstree_find_root();
        jstree_menu.jstree(true).open_all('#');
    }
});

/*******************************************************************

 document.ready

********************************************************************/

$(document).ready(function() {
    $('#menu_lang').val(locales[0]);
    $('#btn_load_menu').attr('disabled', false);
    $('#taracot_dlg_menu_edit_page').change(function() {
        $('#taracot_dlg_menu_edit_text').val($('#' + this.id + ' option:selected').text().replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' '));
        $('#taracot_dlg_menu_edit_url').val($(this).val());
    });
    init_jstree();
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

var init_jstree = function(data, root) {
    if (jstree_menu) jstree_menu.jstree(true).destroy();
    jstree_menu = $('#jstree_menu').jstree({
        'core': {
            'check_callback': true,
            'data': data
        },
        'plugins': ["dnd", "types"],
        'types': {
            "#": {
                "max_children": 1,
                "max_depth": 3,
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
    jstree_menu.on('loaded.jstree', function(e, data) {
        if (root) jstree_insert_root();
        jstree_menu.jstree(true).open_all('#');
        jstree_find_root();
    });
    jstree_menu.on('changed.jstree', function(e, data) {
        jstree_changed_handler(e, data);
    });
};

var jstree_find_root = function() {
    var fldrs = jstree_menu.jstree(true).get_json(jstree_menu, {
        flat: true,
        no_state: true,
        no_id: false,
        no_data: false
    });
    for (var i = 0; i < fldrs.length; i++)
        if (fldrs[i].parent == '#') jstree_menu.jstree(true).select_node(fldrs[i].id);
};

var jstree_changed_handler = function(e, data) {
    $('.taracot-treectl-button').attr('disabled', false);
    if (!data.selected.length || data.selected.length > 1)
        $('.taracot-treectl-button').attr('disabled', true);
    if (jstree_menu.jstree(true).get_parent(data.selected[0]) == '#') {
        $('#btn_item_del').attr('disabled', true);
        $('#btn_item_edit').attr('disabled', true);
    }
    if (data.selected.length)
        if (jstree_menu.jstree(true).get_path(data.selected[0]).length > 2)
            $('#btn_item_add').attr('disabled', true);
};

var jstree_insert_root = function() {
    var _rn = jstree_menu.jstree(true).create_node('#', {
        text: '/',
        type: 'root'
    });
    jstree_menu.jstree(true).select_node(_rn);
};
