var edit_modal = new $.UIkit.modal.Modal("#taracot-modal-edit");
var current_id = '';

/* ****************************************************************** */
/* Taracot jQuery Dynamic Table */
/* ****************************************************************** */

/* Configuration */

var col_count = 5; // Number of columns
var sort_mode = 1; // Sorting mode, -1 = DESC, 1 = ASC
var sort_cell = 'username'; // Default sorting column
var taracot_table_url = '/cp/users/data/list';
var process_rows = [ // Handlers for each column
    function(val, id) {
        return '<label><input type="checkbox" class="taracot-table-chbx" id="taracot-table-chbx-' + id + '" rel="taracot-item_' + val + '"></div>&nbsp;' + val + '</label>';
    },
    function(val, id) {
        if (val == null) {
            val = '&mdash;';
        }
        return val;
    },
    function(val, id) {
        return val;
    },
    function(val, id) {
        if (val == 0) {
            val = _lang_vars.status_0;
        }
        if (val == 1) {
            val = _lang_vars.status_1;
        }
        if (val == 2) {
            val = _lang_vars.status_2;
        }        
        return '<div style="text-align:center">' + val + '</div>';
    },
    function(val, id) {
        return '<div style="text-align:center"><button class="uk-icon-button uk-icon-edit taracot-tableitem-edit" id="taracot-btnedt-' + id + '" type="button"></button>&nbsp;<button class="uk-icon-button uk-icon-button-danger uk-icon-trash-o taracot-tableitem-delete" id="taracot-btndel-' + id + '" type="button"></button></div>';
    }
];

/* System variables, do not modify */
var current_page = 1;
var autocomplete_flag = false;
var autocomplete_timer;
var items_per_page = 0;

/* Render the table rows */

var render_table = function(data) {       
    $('#taracot_table > tbody').html('');
    for (var i=0; i < data.length; i++) {
        var table_data = '<tr>';
        var _id = data[i][0]        
        for (var j = 1; j <= col_count; j++) {            
            if (j < data[i].length) {
                table_data += '<td style="vertical-align:middle">' + process_rows[j-1](data[i][j], _id) + '</td>';
            } else {
                table_data += '<td style="vertical-align:middle">' + process_rows[j-1]('', _id) + '</td>';
            }            
        }
        table_data += '</tr>';
        $('#taracot_table > tbody').append(table_data);
        $('.taracot-tableitem-edit').unbind();
        $('.taracot-tableitem-edit').click(function() {
             var id = $(this).attr('id').replace('taracot-btnedt-', '');
             $('#taracot-modal-edit-h1-edit').removeClass('uk-hidden');
             $('#taracot-modal-edit-h1-add').addClass('uk-hidden');
             edit_item(id);
        });
        $('.taracot-tableitem-delete').unbind();
        $('.taracot-tableitem-delete').click(function() {            
            delete_item([$(this).attr('id').replace('taracot-btndel-', '')]);
        });
    }
    if (!data.length) {
        $('#taracot_table > tbody').append('<tr><td colspan="'+col_count+'">' + _lang_vars.no_res + '</td></tr>');
    }
};

/* Render the pagination */

var render_pagination = function(page, total) {
    var pgnt = '';
    $('#taracot_table_pagination').html(pgnt);
    var page = parseInt(page);
    var max_pages = 10;
    var num_pages = Math.ceil(total / items_per_page);
    if (num_pages < 2) {
        return;
    }
    pgnt = '<ul class="uk-pagination uk-float-left" id="taracot-pgnt">';
    if (num_pages > max_pages) {
        if (page > 1) {
            pgnt += '<li id="taracot-pgnt-' + (page-1) + '"><a href="#"><i class="uk-icon-angle-double-left"></i></a></li>';
        }
        if (page > 3) {
            pgnt += '<li id="taracot-pgnt-1"><a href="#">1</i></a></li>';
        }
        var _st = page - 2;        
        if (_st < 1) {
            _st = 1;
        }
        if (_st - 1 > 1) {
            pgnt += '<li>...</li>';
        }
        var _en = page + 2;
        if (_en > num_pages) {
            _en = num_pages;
        }
        for (var i = _st; i <= _en; i++) {
            pgnt += '<li id="taracot-pgnt-' + i + '"><a href="#">' + i + '</a></li>';
        }
        if (_en < num_pages-1) {
            pgnt += '<li><span>...</span></li>';
        }
        if (page <= num_pages-3) {            
            pgnt += '<li id="taracot-pgnt-' + num_pages + '"><a href="#">' + num_pages + '</a></li>';
        }
        if (page < num_pages) {            
            pgnt += '<li id="taracot-pgnt-' + (page + 1) + '"><a href="#"><i class="uk-icon-angle-double-right"></i></a></li>';
        }
    } else {
        for (var i = 1; i <= num_pages; i++) {
            pgnt += '<li id="taracot-pgnt-' + i + '"><a href="#">' + i + '</a></li>';
        }    
    }
    pgnt += '</ul>';    
    $('#taracot_table_pagination').html(pgnt);
    $('#taracot-pgnt-' + page).html('<span>' + page + '</span>');
    $('#taracot-pgnt-' + page).addClass('uk-active');
    $('#taracot-pgnt > li').click(pagination_handler);    
};

/* Turn on or off the loading indicator */

var taracot_table_loading_indicator = function(show) {
    if (show) {
        var destination = $('#taracot_table').offset();
        $('.taracot-loading').css({top: destination.top, left: destination.left, width: $('#taracot_table').width(), height: $('#taracot_table').height() });
        $('.taracot-loading').removeClass('uk-hidden');
        $('#taracot_table_pagination').hide();
    } else {
        $('.taracot-loading').addClass('uk-hidden');
        $('#taracot_table_pagination').show();
    }
};

/* Load AJAX data from server */

var load_data = function(page) {
    var skip = (page-1) * items_per_page;
    var query;
    if (autocomplete_flag) {
        query = $("#taracot-table-filter").val().replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' '); // trim
    }
    taracot_table_loading_indicator(true);
    $.ajax({
        type: 'POST',
        url: taracot_table_url,
        data: {
            skip: skip,
            query: query,
            sort_mode: sort_mode,
            sort_cell: sort_cell
        },
        dataType: "json",
        success: function (data) {
            $('#taracot-table-filter').prop('disabled', false);
            taracot_table_loading_indicator(false);
            if (data.status == 1) {
                if (typeof data.users != undefined) {
                    items_per_page = data.ipp;
                    render_table(data.users);
                    render_pagination(page, data.total);
                    current_page = page;
                }
            }
        },
        error: function () {
            taracot_table_loading_indicator(false);
            $('#taracot-table-filter').prop('disabled', false);
        }
    });
};

/* Handle pagination clicks */

var pagination_handler = function() {
    if ($(this).hasClass('uk-active')) {
        return;
    }
    var page = $(this).attr('id').replace('taracot-pgnt-', '');    
    load_data(page);
}

/* ****************************************************************** */

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
            ids.push($(val).attr('id').replace('taracot-table-chbx-', ''))        
        }
    });
    if (ids.length > 0) {
        delete_item(ids);
    }
});

$('#taracot-table-filter').on('input', function() {
    var val = $("#taracot-table-filter").val();
    val = val.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' '); // trim
    if (val.length < 3) {
        clearTimeout(autocomplete_timer);
        if (autocomplete_flag) {
            autocomplete_flag = false;
            load_data(1);
        }
        return;
    }
    if (!val.match(/^[\w\sА-Яа-я0-9_\-\.]{3,40}$/)) {
        return;
    }
    clearTimeout(autocomplete_timer);
    autocomplete_timer = setTimeout(function() {
        autocomplete_flag = true;
        $('#taracot-table-filter').prop('disabled', true);
        load_data(1);
    }, 300);    
});

$('.taracot-table-sortable').click(function() {
    var item = $(this).attr('rel').replace('taracot-table-sortable_', '');
    if (item == sort_cell) {
        sort_mode = sort_mode * -1;
    } else {
        sort_mode = 1;
        sort_cell = item;
    }
    $('.taracot-sort-marker').remove();
    var _sm = 'asc';
    if (sort_mode == -1) {
        _sm = 'desc';
    }
    $('.taracot-table-sortable[rel="taracot-table-sortable_' + sort_cell  + '"]').append('<span class="taracot-sort-marker">&nbsp;<i class="uk-icon-sort-' + _sm + '"></i></span>');
    $('#taracot-table-filter').val('');
    load_data(1);
});

$('#btn-add-item').click(function() {    
    $('#taracot-modal-edit-h1-edit').addClass('uk-hidden');
    $('#taracot-modal-edit-h1-add').removeClass('uk-hidden');
    add_item();
});

var load_edit_data = function(id) {    
    $.ajax({
        type: 'POST',
        url: '/cp/users/data/load',
        data: {
            id: id
        },
        dataType: "json",
        success: function (data) {
            $('#taracot-modal-edit-loading').addClass('uk-hidden');
            if (data.status == 1) {
                $('#taracot-modal-edit-wrap').removeClass('uk-hidden');
                if (typeof data.user != undefined ) {
                    if (typeof data.user.username != undefined) {
                        $('#username').val('data.user.username');
                    }
                    if (typeof data.user.username != undefined) {
                        $('#username').val(data.user.username);
                    }
                    if (typeof data.user.realname != undefined) {
                        $('#realname').val(data.user.realname);
                    }
                    if (typeof data.user.email != undefined) {
                        $('#email').val(data.user.email);
                    }
                    if (typeof data.user.status != undefined) {
                        $('#status').val(data.user.status);
                    }
                }
                $('#username').focus();
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

var edit_item = function(id) {
    current_id = id;
    edit_modal.show();
    $('#taracot-modal-edit-wrap > form.uk-form > fieldset > div.uk-form-row > input').removeClass('uk-form-danger');
    $('#taracot-modal-edit-wrap > form.uk-form > fieldset > div.uk-form-row > input').val('');
    $('#taracot-modal-edit-wrap').addClass('uk-hidden');
    $('#taracot-modal-edit-loading').removeClass('uk-hidden');
    $('#taracot-modal-edit-loading-error').addClass('uk-hidden');
    load_edit_data(id);
}

var add_item = function(id) {
    current_id = '';
    edit_modal.show();
    $('#taracot-modal-edit-wrap').removeClass('uk-hidden');
    $('#taracot-modal-edit-loading').addClass('uk-hidden');
    $('#taracot-modal-edit-loading-error').addClass('uk-hidden');
    $('#taracot-modal-edit-wrap > form.uk-form > fieldset > div.uk-form-row > input').removeClass('uk-form-danger');
    $('#taracot-modal-edit-wrap > form.uk-form > fieldset > div.uk-form-row > input').val('');
    $('#status').val('1');
    $('#username').focus();
}

$('#taracot-edit-btn-save').click(function() {
    $('#taracot-modal-edit-wrap > form.uk-form > fieldset > div.uk-form-row > input').removeClass('uk-form-danger');    
    var errors = false;
    if (!$('#username').val().match(/^[A-Za-z0-9_\-]{3,20}$/)) {
        $('#username').addClass('uk-form-danger');
        errors = true;
    }
    if (!$('#realname').val().match(/^(([\wА-Яа-я])+([\wА-Яа-я\-\']{0,1})([\wА-Яа-я])\s([\wА-Яа-я])+([\wА-Яа-я\-\']{0,1})([\wА-Яа-я])+){0,40}$/)) {
        $('#realname').addClass('uk-form-danger');
        errors = true;
    }
    if (!$('#email').val().match(/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/)) {
        $('#email').addClass('uk-form-danger');
        errors = true;
    }
    if (current_id.length > 0) {
        if ($('#password').val().length > 0 && (!$('#password').val().match(/^.{5,20}$/) || $('#password').val() != $('#password-repeat').val())) {
            $('#password').addClass('uk-form-danger');
            $('#password-repeat').addClass('uk-form-danger');
        }
    } else {
        if (!$('#password').val().match(/^[.]{5,20}$/) || $('#password').val() != $('#password-repeat').val()) {
            $('#password').addClass('uk-form-danger');
            $('#password-repeat').addClass('uk-form-danger');
        }
    }
    if (errors) {
        $.UIkit.notify( { message : _lang_vars.form_err_msg, status  : 'danger', timeout : 5000, pos : 'top-center' });
        return;
    }
    $('#taracot-modal-edit-wrap').addClass('uk-hidden');
    $('#taracot-modal-edit-loading').removeClass('uk-hidden');
    $('#taracot-modal-edit-loading-error').addClass('uk-hidden');
    $.ajax({
        type: 'POST',
        url: '/cp/users/data/save',
        data: {
            username: $('#username').val(),
            realname: $('#realname').val(),
            email: $('#email').val(),
            status: $('#status').val(),
            password: $('#password').val(),
            id: current_id
        },
        dataType: "json",
        success: function (data) {
            $('#taracot-modal-edit-loading').addClass('uk-hidden');
            if (data.status == 1) {
                load_data(current_page);
                edit_modal.hide();                                
            } else {
                $('#taracot-modal-edit-wrap > form.uk-form > fieldset > div.uk-form-row > input').removeClass('uk-form-danger');
                $('#taracot-modal-edit-wrap > form.uk-form > fieldset > div.uk-form-row > input').val('');
                $('#taracot-modal-edit-wrap').removeClass('uk-hidden');
                $.UIkit.notify( { message : _lang_vars.form_err_msg, status  : 'danger', timeout : 5000, pos : 'top-center' });
            }
        },
        error: function () {
            $('#taracot-modal-edit-loading').addClass('uk-hidden');
            $('#taracot-modal-edit-wrap').removeClass('uk-hidden');
            $.UIkit.notify( { message : _lang_vars.form_err_msg, status  : 'danger', timeout : 5000, pos : 'top-center' });
        }
    });
});

var delete_item = function(ids) {
    var users = [];
    for (var i=0; i<ids.length; i++) {
        users.push( $('#taracot-table-chbx-' + ids[i]).attr('rel').replace('taracot-item_','') );
    }
    if (confirm(_lang_vars.del_confirm + "\n\n" + users + "\n\n")) {
        taracot_table_loading_indicator(true);
        $.ajax({
            type: 'POST',
            url: '/cp/users/data/delete',
            data: {                
                ids: ids
            },
            dataType: "json",
            success: function (data) {
                taracot_table_loading_indicator(false);
                if (data.status == 1) {
                    load_data(current_page);
                } else {
                    $.UIkit.notify( { message : _lang_vars.delete_err_msg, status  : 'danger', timeout : 5000, pos : 'top-center' });
                }
            },
            error: function () {
                taracot_table_loading_indicator(false);
                $.UIkit.notify( { message : _lang_vars.delete_err_msg, status  : 'danger', timeout : 5000, pos : 'top-center' });
            }
        });    
    }
};

$('.taracot-edit-form > fieldset > .uk-form-row > input, .taracot-edit-form > fieldset > .uk-form-row > select').bind('keypress', function (e) {
    if (submitOnEnter(e)) {
        $('#taracot-edit-btn-save').click();
    }
});


load_data(1);