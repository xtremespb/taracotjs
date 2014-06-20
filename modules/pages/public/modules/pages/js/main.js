var current_id = '';
var folders_edit_dlg = $.UIkit.modal("#taracot_pages_folders_edit_dlg");
var folders_edit = false;
var jstree_folders;

/* Configuration */

var process_rows = [ // Handlers for each column
    function (val, id) {
        return '<label><input type="checkbox" class="taracot-table-chbx" id="taracot-table-chbx-' + id + '" rel="taracot-item_' + val + '"></div>&nbsp;' + val + '</label>';
    },
    function (val, id) {
        if (val == null) {
            val = '&mdash;';
        }
        return val;
    },
    function (val, id) {
        return '<div style="text-align:center">' + val + '</div>';
    },
    function (val, id) {
        return '<div style="text-align:center"><button class="uk-icon-button uk-icon-edit taracot-tableitem-edit" id="taracot-btnedt-' + id + '" type="button"></button>&nbsp;<button class="uk-icon-button uk-icon-button-danger uk-icon-trash-o taracot-tableitem-delete" id="taracot-btndel-' + id + '" type="button"></button></div>';
    }
];

$('#btn-select-all').click(function () {
    $('.taracot-table-chbx').prop('checked', true);
});


$('#btn-select-none').click(function () {
    $('.taracot-table-chbx').prop('checked', false);
});

$('#btn-delete-selected').click(function () {
    var ids = [];
    $('.taracot-table-chbx').each(function (i, val) {
        if ($(val).prop('checked')) {
            ids.push($(val).attr('id').replace('taracot-table-chbx-', ''))
        }
    });
    if (ids.length > 0) {
        delete_item(ids);
    }
});

$('#btn-add-item').click(function () {
    add_item();
});

$('#btn-folders').click(function () {
    show_folders();
});

$('#btn-tree-new').click(function() {
    $('#taracot_pages_folders_edit_h1').html(_lang_vars.new_folder);
    $('.taracot-folders-edit-control').each(function () {
        $(this).val('');
    });    
    folders_edit = false;
    folders_edit_dlg.show();
    $('#fname').focus();
});

$('.taracot-folders-edit-control').bind('keypress', function (e) {
    if (submitOnEnter(e)) {
        $('#btn_folders_edit_save').click();
    }
});

var folders_find_path = function(fldrs_hash, id, _path) {
    var path = _path || [ ];
    if (fldrs_hash[id].parent && fldrs_hash[id].parent != '#') {
        path.push(fldrs_hash[id].text);
        folders_find_path(fldrs_hash, fldrs_hash[id].parent, path);
    }    
    return path;
};

$('#btn_folders_edit_save').click(function() {        
    var sel = jstree_folders.jstree(true).get_selected();
    if (!sel || !sel.length) return;    
    var cn = jstree_folders.jstree(true).create_node(sel, { text: $('#fname').val(), type: 'folder' });
    jstree_folders.jstree(true).get_node(cn).data = [];
    for (var i=0; i < locales.length; i++) {
        var item = {};
        item[locales[i]] = $('#flang_'+locales[i]).val();
        jstree_folders.jstree(true).get_node(cn).data.push(item);
    }
    jstree_folders.jstree(true).open_node(sel);
    jstree_folders.jstree(true).deselect_node(sel);
    jstree_folders.jstree(true).select_node(cn);
    folders_edit_dlg.hide();
    var fldrs = jstree_folders.jstree(true).get_json(jstree_folders, { flat: true, no_state: true, no_id: false, no_data: false });
    var fldrs_hash = {};
    for (var i=0; i<fldrs.length; i++) {
        delete fldrs[i]['li_attr'];
        delete fldrs[i]['a_attr'];
        delete fldrs[i]['icon'];
        delete fldrs[i]['state'];
        delete fldrs[i]['type'];
        fldrs_hash[fldrs[i].id] = fldrs[i];
    }
    console.log(folders_find_path(fldrs_hash, cn));
    console.log(JSON.stringify(fldrs));
});

var load_edit_data = function (id) {
    $.ajax({
        type: 'POST',
        url: '/cp/pages/data/load',
        data: {
            id: id
        },
        dataType: "json",
        success: function (data) {
            $('#taracot-modal-edit-loading').addClass('uk-hidden');
            if (data.status == 1) {
                $('#taracot-modal-edit-wrap').removeClass('uk-hidden');
                if (typeof data.data != undefined) {
                    if (typeof data.data.oname != undefined) {
                        $('#oname').val(data.data.oname);
                    }
                    if (typeof data.data.ovalue != undefined) {
                        $('#ovalue').val(data.data.ovalue);
                    }
                    if (typeof data.data.olang != undefined) {
                        $('#olang').val(data.data.olang);
                    }
                }
                $('#oname').focus();
            } else {
                $('#taracot-modal-edit-loading-error').removeClass('uk-hidden');
            }
        },
        error: function () {
            $('#taracot-modal-edit-loading').addClass('uk-hidden');
            $('#taracot-modal-edit-loading-error').removeClass('uk-hidden');
        }
    });
};

var edit_item = function (id) {
    current_id = id;
    $('#taracot_pages_edit_action').html(_lang_vars.action_edit);
    $('#taracot_pages_list').addClass('uk-hidden');
    $('#taracot_pages_edit').removeClass('uk-hidden');
}

var add_item = function () {
    current_id = '';    
    $('#taracot_pages_edit_action').html(_lang_vars.action_add);
    $('#taracot_pages_list').addClass('uk-hidden');
    $('#taracot_pages_edit').removeClass('uk-hidden');
}

var show_folders = function (id) {
    $('#taracot_pages_list').addClass('uk-hidden');
    $('#taracot_pages_folders').removeClass('uk-hidden');    
}

var delete_item = function (ids) {
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
            success: function (data) {
                $('#taracot_table').medvedTable('loading_indicator_hide');
                if (data.status == 1) {
                    // load_data(current_page);
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
            error: function () {
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

$(document).ready(function () {
    $('#taracot_table').medvedTable({
        col_count: 4,
        sort_mode: 1,
        sort_cell: 'oname',
        taracot_table_url: '/cp/pages/data/list',
        process_rows: process_rows
    });
    $('#pcontent').ckeditor();
    jstree_folders = $('#jstree_folders').jstree({ 
        'core' : {
            'check_callback' : true            
        },
        'plugins' : [ "dnd", "unique", "types" ],
        'types' : {
            '#': {
                "max_children"  : 1,
                "valid_children": [ 'root' ]
            }
        }
    });
    jstree_folders.on('changed.jstree', function (e, data) {
        if (!data.selected.length || data.selected.length > 1) return;
        //alert(jstree_folders.jstree(true).get_path(data.instance.get_node(data.selected[0]).id).join('/').replace(/\/\//, '/'));
    });
    jstree_folders.jstree(true).create_node('#', { text: '/', type: 'root' });
});