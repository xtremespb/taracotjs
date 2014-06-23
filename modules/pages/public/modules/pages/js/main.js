var current_id = '';
var folders_edit_dlg = $.UIkit.modal("#taracot_pages_folders_edit_dlg");
var folders_select_dlg = $.UIkit.modal("#taracot_pages_folders_select_dlg");
var folders_edit = false;
var jstree_folders;
var jstree_folders_select;
var folders_data;

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
    $('#jstree_folders').addClass('uk-hidden');
    $('#jstree_error').addClass('uk-hidden');
    $('#jstree_loading').removeClass('uk-hidden');
    $('.taracot-tree-save-controls').attr('disabled', true);
    $('.taracot-treectl-button').attr('disabled', true);
    $.ajax({
        type: 'POST',
        url: '/cp/pages/data/folders/load',
        dataType: "json",
        success: function (data) {
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
        error: function () {            
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
});

$('#btn-tree-new').click(function() {
    $('#fname').removeClass('uk-form-danger');
    var sel = jstree_folders.jstree(true).get_selected();
    if (!sel || !sel.length) return;
    $('#taracot_pages_folders_edit_h1').html(_lang_vars.new_folder);
    $('.taracot-folders-edit-control').each(function () {
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
    $('.taracot-folders-edit-control').each(function () {
        $(this).val('');
    });
    for (var i=0; i < locales.length; i++) {
        $('#flang_'+locales[i]).val(jstree_folders.jstree(true).get_node(sel).data.lang[locales[i]]);
    }
    $('#fname').val(jstree_folders.jstree(true).get_node(sel).text)
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
    var fldrs = jstree_folders.jstree(true).get_json(jstree_folders, { flat: true, no_state: true, no_id: false, no_data: false });
    for (var i=0; i<fldrs.length; i++) {
        delete fldrs[i]['li_attr'];
        delete fldrs[i]['a_attr'];
        delete fldrs[i]['icon'];
        delete fldrs[i]['state'];
    }
    console.log(JSON.stringify(fldrs));
    $.ajax({
        type: 'POST',
        url: '/cp/pages/data/folders/save',
        dataType: "json",
        data: {
            json: JSON.stringify(fldrs)
        },
        success: function (data) {
            $('#jstree_folders').removeClass('uk-hidden');
            $('#jstree_error').addClass('uk-hidden');
            $('#jstree_loading').addClass('uk-hidden');
            $('.taracot-tree-save-controls').attr('disabled', false);
            $('.taracot-treectl-button').attr('disabled', false);
            jstree_folders.jstree(true).deselect_all();
            jstree_find_root();
            if (data.status == 1) {  
                folders_data = fldrs;              
                $.UIkit.notify({
                    message: _lang_vars.folders_save_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });       
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
        error: function () {            
            $.UIkit.notify({
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
    for (var i=0; i<sel.length; i++) {
        seltxt += ', ' + jstree_folders.jstree(true).get_node(sel[i]).text;
    }
    if (confirm(_lang_vars.confirm_delete_tree + "\n\n" + seltxt.replace(/,/, ''))) jstree_folders.jstree(true).delete_node(sel);
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
    $('#fname').removeClass('uk-form-danger');
    var sel = jstree_folders.jstree(true).get_selected();       
    if (!sel || !sel.length || sel.length > 1) return;
    if (!check_directory($('#fname').val())) {
        $('#fname').addClass('uk-form-danger');
        $.UIkit.notify({
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
        for (var i=0; i < locales.length; i++) {
            jstree_folders.jstree(true).get_node(sel).data.lang[locales[i]] = $('#flang_'+locales[i]).val();
        }
    } else {
        var cn = jstree_folders.jstree(true).create_node(sel, { text: $('#fname').val(), type: 'folder' });
        if (!cn) {
            $('#fname').addClass('uk-form-danger');
            $.UIkit.notify({
                message: _lang_vars.duplicate_folder,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
        jstree_folders.jstree(true).get_node(cn).data = {};
        jstree_folders.jstree(true).get_node(cn).data.lang = {};
        for (var i=0; i < locales.length; i++) {
            jstree_folders.jstree(true).get_node(cn).data.lang[locales[i]] = $('#flang_'+locales[i]).val();
        }        
        jstree_folders.jstree(true).open_node(sel);
        // jstree_folders.jstree(true).deselect_node(sel);
        // jstree_folders.jstree(true).select_node(cn);
    }    
    folders_edit_dlg.hide();
    // var fldrs = jstree_folders.jstree(true).get_json(jstree_folders, { flat: true, no_state: true, no_id: false, no_data: false });
    // var fldrs_hash = {};
    // for (var i=0; i<fldrs.length; i++) {
    //     delete fldrs[i]['li_attr'];
    //     delete fldrs[i]['a_attr'];
    //     delete fldrs[i]['icon'];
    //     delete fldrs[i]['state'];
    //     delete fldrs[i]['type'];
    //     fldrs_hash[fldrs[i].id] = fldrs[i];
    // }
    // console.log(folders_find_path(fldrs_hash, cn));
    // console.log(JSON.stringify(fldrs));
});

$('#btn_folders_select').click(function() {
    var sel = jstree_folders_select.jstree(true).get_selected();       
    if (!sel || !sel.length || sel.length > 1) return;
    var path = jstree_folders_select.jstree(true).get_path(sel).join('/').replace(/\//, '');
    if (!path) path = '/';
    $('#pfolder').val(path);
    $('#pfolder_id').val(sel);
    folders_select_dlg.hide();
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

var show_pages = function (id) {
    $('#taracot_pages_list').removeClass('uk-hidden');
    $('#taracot_pages_folders').addClass('uk-hidden');    
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

var init_jstree = function(data, root) {
    if (jstree_folders) jstree_folders.jstree(true).destroy();
    jstree_folders = $('#jstree_folders').jstree({ 
        'core' : {
            'check_callback' : true,
            'data' : data
        },
        'plugins' : [ "dnd", "unique", "types" ],
        'types' : {
            "#": {
                "max_children" : 1, 
                "valid_children" : ["root"]
            },
            'root': {
                "valid_children": [ 'folder' ] 
            },
            'folder' : {
                "valid_children": [ 'folder' ]                 
            }
        }
    });    
    jstree_folders.on('loaded.jstree', function (e, data) {
        // if (root) {
        //     jstree_insert_root();
        // }
        jstree_folders.jstree(true).open_all('#');
        jstree_find_root();       
    });
    jstree_folders.on('changed.jstree', function (e, data) {
        jstree_changed_handler(e, data);
        //alert(jstree_folders.jstree(true).get_path(data.instance.get_node(data.selected[0]).id).join('/').replace(/\/\//, '/'));
    });
};

var init_jstree_select = function(data, root) {
    if (jstree_folders_select) jstree_folders_select.jstree(true).destroy();
    jstree_folders_select = $('#jstree_folders_select').jstree({ 
        'core' : {
            'check_callback' : true,
            'data' : folders_data
        },
        'plugins' : [ "dnd", "unique", "types" ],
        'types' : {
            "#": {
                "max_children" : 1, 
                "valid_children" : ["root"]
            },
            'root': {
                "valid_children": [ 'folder' ] 
            },
            'folder' : {
                "valid_children": [ 'folder' ]                 
            }
        }
    });    
    jstree_folders_select.on('loaded.jstree', function (e, data) {
        jstree_folders_select.jstree(true).open_all('#');
    });
    jstree_folders_select.on('changed.jstree', function (e, data) {
        if (!data.selected.length || data.selected.length > 1) {
            $('#btn_folders_select').attr('disabled', true);
        } else {
            $('#btn_folders_select').attr('disabled', false);
        }
    });
};

var jstree_find_root = function() {
    var fldrs = jstree_folders.jstree(true).get_json(jstree_folders, { flat: true, no_state: true, no_id: false, no_data: false });
    for (var i=0; i< fldrs.length; i++) {
        if (fldrs[i].parent == '#') jstree_folders.jstree(true).select_node(fldrs[i].id);
    } 
};

var jstree_changed_handler = function(e, data) {
    if (!data.selected.length) {
        $('.taracot-treectl-button').attr('disabled', true);
    } else {
        $('.taracot-treectl-button').attr('disabled', false);
    }
    for (var i = 0; i<data.selected.length; i++) {
        if (jstree_folders.jstree(true).get_parent(data.selected[i]) == '#') $('.taracot-treectl-button').attr('disabled', true);
        $('#btn-tree-new').attr('disabled', false);
    }
    if (data.selected.length > 1) {
        $('#btn-tree-new').attr('disabled', true);
        $('#btn-tree-edit').attr('disabled', true);
    }        
}

var jstree_insert_root = function() {
    var _rn = jstree_folders.jstree(true).create_node('#', { text: '/', type: 'root' });
    jstree_folders.jstree(true).select_node(_rn);
};

var check_directory = function(fn) {               
    if (!fn || !fn.length || fn.length > 40) return false; // too long or null
    if (fn.match(/^\./)) return false; // starting with a dot
    if (fn.match(/^\\/)) return false; // starting with a slash
    if (fn.match(/ /)) return false; // whitespace
    if (fn.match(/^[\^<>\/\:\"\\\|\?\*\x00-\x1f]+$/)) return false; // invalid characters
    return true;
};

$('#btn-select-folder').click(function() {
    init_jstree_select();
    folders_select_dlg.show();    
    $('#btn_folders_select').attr('disabled', true);
});

$(document).ready(function () {
    $('#taracot_table').medvedTable({
        col_count: 4,
        sort_mode: 1,
        sort_cell: 'oname',
        taracot_table_url: '/cp/pages/data/list',
        process_rows: process_rows
    });
    $('#pcontent').ckeditor();      
    $('#pfolder').attr('readonly', true);
    folders_data = folders_preload;    
});