var file_ids = {};
var file_types = {};
var current_dir = '';
var up_dir = [];
var clpbrd = { mode: null, dir: null, files: [] };
var taracot_dlg_edit = new $.UIkit.modal.Modal("#taracot_dlg_edit");

var load_files_data = function(dir) {
    $('#files_grid').empty();
    $('#files_grid').html('<img src="/modules/files/images/loading_36x36.gif">');
    $('.taracot-files-panel').addClass('uk-hidden');
    $('#btn_delete').attr('disabled', true);
    $('#btn_copy').attr('disabled', true);
    $('#btn_cut').attr('disabled', true);
    if (clpbrd.mode != null) {
        $('#btn_paste').attr('disabled', false);
    } else {
        $('#btn_paste').attr('disabled', true);
    }
    file_ids = {};
    file_types = {};
    $.ajax({
        type: 'POST',
        url: '/cp/files/data/load',
        data: {
            dir: dir
        },
        dataType: "json",
        success: function (data) {
            $('#files_grid').empty();
            if (data && data.status == 1) {
                $('.taracot-files-panel').removeClass('uk-hidden');
                if (dir) {
                    $('#btn_up').attr('disabled', false);
                } else {
                    $('#btn_up').attr('disabled', true);
                }
                // uikit tooltip bug workaround
                $('#btn_dummy').mouseover();
                for (var i = 0; i < data.files.length; i++) {
                    var tp = 'folder';
                    if (data.files[i].type == 'f') {
                        tp = 'file';
                        if (data.files[i].mime.match(/^image_/)) tp = 'image';
                        if (data.files[i].mime.match(/excel/) || data.files[i].mime.match(/csv/) || data.files[i].mime.match(/spreadsheet/)) tp = 'excel';
                        if (data.files[i].mime.match(/msword/) || data.files[i].mime.match(/rtf/)) tp = 'word';
                        if (data.files[i].mime.match(/text_plain/)) tp = 'txt';
                        if (data.files[i].mime.match(/video/)) tp = 'video';
                        if (data.files[i].mime.match(/pdf/)) tp = 'pdf';
                        if (data.files[i].mime.match(/photoshop/)) tp = 'psd';
                        if (data.files[i].mime.match(/zip/) || data.files[i].mime.match(/rar/)) tp = 'archive';
                    }
                    file_ids[i] = data.files[i].name;
                    file_types[i] = data.files[i].type;
                    $('#files_grid').append('<li class="uk-thumbnail taracot-files-item" id="taracot_file_' + i + '"><div class="uk-badge uk-badge-notification uk-badge-success" style="position:absolute;display:none">0</div><img src="/modules/files/images/' + tp + '.png" style="width:70px"><div class="uk-thumbnail-caption taracot-thumbnail-caption"><div class="taracot-fade taracot-fade-elipsis" id="taracot_el_' + i + '">' + data.files[i].name + '</div></div></li>');
                    if (data.files[i].type == 'd') {
                        var drop_target_btn_delete = new DropTarget(document.getElementById('taracot_file_' + i));
                        drop_target_btn_delete.onLeave = function() {
                            alert("OOK");
                        };
                    }
                }
                $('.taracot-files-item').shifty({
                    className: 'taracot-files-item-selected',
                    select: function (el) { 
                        $('.taracot-fade').addClass('taracot-fade-elipsis');
                        var ns = $('.taracot-files-item').getSelected('taracot-files-item-selected');
                        for (var i=0; i<ns.length; i++) {
                            var id = ns[i].replace('taracot_file_', '');
                            $('#taracot_el_' + id).removeClass('taracot-fade-elipsis');
                        }
                        if (ns.length) {
                            $('#btn_delete').attr('disabled', false);
                            $('#btn_copy').attr('disabled', false);
                            $('#btn_cut').attr('disabled', false);
                        } else {
                            $('#btn_delete').attr('disabled', true);
                            $('#btn_copy').attr('disabled', true);
                            $('#btn_cut').attr('disabled', true);
                        }
                    },
                    unselect: function (el) {                        
                    }
                });
                var dragObjects = $('.taracot-files-item');
                for(var i=0; i < dragObjects.length; i++) {
                    new DragObject(dragObjects[i]);
                } 
                $('.taracot-files-item').bind('dblclick', dblclick_handler);
                $('#taracot_total_files').html(data.files.length);
                if (!data.files.length) $('#files_grid').html(_lang_vars.no_files);
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
                $('#taracot_total_files').html('0');
            }
        },
        error: function () {
            $('#files_grid').empty();
            $.UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
            $('#taracot_total_files').html('0');
        }
    });
};

var dblclick_handler = function() {
    var id = $(this).attr('id').replace('taracot_file_', '');
    if (file_types[id] != 'd') return;
    up_dir.push(current_dir);
    current_dir += '/' + file_ids[id];
    current_dir = current_dir.replace(/^\//, '');    
    $('#taracot-files-current-dir').html('/' + current_dir);
    load_files_data(current_dir);
};

var btnup_handler = function() {
    if (up_dir.length) {
        current_dir = up_dir[up_dir.length - 1];
        delete up_dir[up_dir.length - 1];
    } else {
        current_dir = '';
    }
    if (typeof current_dir == 'undefined') current_dir = '';
    $('#taracot-files-current-dir').html('/' + current_dir);
    load_files_data(current_dir);
};

var btndelete_handler = function(dnd) {
    if (typeof dnd == 'undefined') dnd = false;
    var ns = $('.taracot-files-item').getSelected('taracot-files-item-selected');
    var fna = [];
    for (var i=0; i<ns.length; i++) {
        var id = ns[i].replace('taracot_file_', '')
        fna.push(file_ids[id]);
    }
    if (!confirm(_lang_vars.delete_confirm + "\n\n" + fna)) {
        return;
    }
    $('#files_grid').empty();
    $('#files_grid').html('<img src="/modules/files/images/loading_36x36.gif">');
    $.ajax({
        type: 'POST',
        url: '/cp/files/data/del',
        data: {
            dir: current_dir,
            items: fna
        },
        dataType: "json",
        success: function (data) {
            // uikit tooltip bug workaround
            $('#btn_dummy').mouseover();
            load_files_data(current_dir);
            if (data && data.status == 1) {                
                $.UIkit.notify({
                    message: _lang_vars.delete_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
            } else {
                load_files_data(current_dir);
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
            load_files_data(current_dir);        
            $.UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
};

$('#taracot_dlg_edit_value').bind('keypress', function (e) {
    if (submitOnEnter(e)) {
        $('#taracot_dlg_edit_btn_save').click();
    }
});

var btnnewfolder_handler = function() {
    $('#taracot-dlg-edit-h1').html(_lang_vars.new_folder)
    taracot_dlg_edit.show();
    $('#taracot_dlg_edit_value').val('');
    $('#taracot_dlg_edit_btn_save').unbind();
    $('#taracot_dlg_edit_btn_save').click(create_new_dir);
    $('#taracot_dlg_edit_value').focus();
};

var create_new_dir = function() { 
    $('#taracot_dlg_edit_value').removeClass('uk-form-danger');
    if (!$('#taracot_dlg_edit_value').val().match(/^[A-Za-z0-9_\-]{1,40}$/)) {
        $('#taracot_dlg_edit_value').addClass('uk-form-danger');
        $.UIkit.notify({
            message: _lang_vars.invalid_dir_syntax,
            status: 'danger',
            timeout: 2000,
            pos: 'top-center'
        });
        return;
    }
    $.ajax({
        type: 'POST',
        url: '/cp/files/data/newdir',
        data: {
            dir: current_dir,
            newdir: $('#taracot_dlg_edit_value').val()
        },
        dataType: "json",
        success: function (data) {
            if (data && data.status == 1) {                
                taracot_dlg_edit.hide();   
                load_files_data(current_dir);
                $.UIkit.notify({
                    message: _lang_vars.newdir_success,
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
        }
    });    
};

var cutcopy = function(mode) {
    clpbrd = { mode: null, dir: null, files: [] };
    var ns = $('.taracot-files-item').getSelected('taracot-files-item-selected');
    for (var i=0; i<ns.length; i++) {
        var id = ns[i].replace('taracot_file_', '');
        clpbrd.files.push(file_ids[id]);
    }
    clpbrd.dir = current_dir;
    clpbrd.mode = mode;
    $('#taracot-files-clipboard').html(clpbrd.files.length);
    $('#btn_paste').attr('disabled', false);
};

var btncopy_handler = function() {
    cutcopy('copy');    
    $.UIkit.notify({
        message: _lang_vars.clipboard_copy_success,
        status: 'success',
        timeout: 2000,
        pos: 'top-center'
    });
};

var btncut_handler = function() {
    cutcopy('cut');    
    $.UIkit.notify({
        message: _lang_vars.clipboard_cut_success,
        status: 'success',
        timeout: 2000,
        pos: 'top-center'
    });
};

var btnpaste_handler = function() {
    if (clpbrd.mode == null) {
        return;
    }
    if (clpbrd.dir == current_dir) {
        $.UIkit.notify({
            message: _lang_vars.cannot_paste_to_source_dir,
            status: 'danger',
            timeout: 2000,
            pos: 'top-center'
        });  
        return; 
    }
    var rex1 = new RegExp('^' + current_dir + '\/');
    var rex2 = new RegExp('^' + current_dir + '$');
    for (var i=0; i<clpbrd.files.length; i++) {
        if (clpbrd.files[i].match(rex1) || clpbrd.files[i].match(rex2)) {
            $.UIkit.notify({
                message: _lang_vars.cannot_paste_to_itself,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });  
            // return;    
        }
    }
    $.ajax({
        type: 'POST',
        url: '/cp/files/data/paste',
        data: {
            clipboard: clpbrd,
            dest: current_dir
        },
        dataType: "json",
        success: function (data) {
            if (data && data.status == 1) {                
                load_files_data(current_dir);
                $.UIkit.notify({
                    message: _lang_vars.paste_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                }); 
            } else {
                var _err = _lang_vars.paste_error;
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
        }
    });
};

$('#btn_new_folder').click(btnnewfolder_handler);
$('#btn_up').click(btnup_handler);
$('#btn_delete').click(btndelete_handler);
$('#btn_copy').click(btncopy_handler);
$('#btn_cut').click(btncut_handler);
$('#btn_paste').click(btnpaste_handler);

$(document).ready(function () {    
    load_files_data();
    var drop_target_btn_delete = new DropTarget(document.getElementById('btn_delete'));
    drop_target_btn_delete.onLeave = function() {
        btndelete_handler(true);
        var dragObjects = $('.taracot-files-item');        
        console.log(dragObjects);
    };
    $('#files_grid').click(function(e) {
        if (e.target.id === "files_grid") {
            $('.taracot-files-item').removeClass('taracot-files-item-selected');
            $('.taracot-fade').addClass('taracot-fade-elipsis');
        }
    });
});