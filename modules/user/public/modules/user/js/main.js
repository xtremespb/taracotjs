var edit_modal = new $.UIkit.modal.Modal("#taracot-modal-edit");
var current_id = '';

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
        return val;
    },
    function (val, id) {
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
    function (val, id) {
        return '<div style="text-align:center"><button class="uk-icon-button uk-icon-edit taracot-tableitem-edit" id="taracot-btnedt-' + id + '" type="button"></button>&nbsp;<button class="uk-icon-button uk-icon-button-danger uk-icon-trash-o taracot-tableitem-delete" id="taracot-btndel-' + id + '" type="button"></button></div>';
    }
];

$('#taracot_table').medvedTable({
    col_count: 5,
    sort_mode: 1,
    sort_cell: 'username',
    taracot_table_url: '/cp/users/data/list',
    process_rows: process_rows
});

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
    $('#taracot-modal-edit-h1-edit').addClass('uk-hidden');
    $('#taracot-modal-edit-h1-add').removeClass('uk-hidden');
    add_item();
});

var load_edit_data = function (id) {
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
                if (typeof data.user != undefined) {
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

var edit_item = function (id) {
    current_id = id;
    edit_modal.show();
    $('#taracot-modal-edit-wrap > form.uk-form > fieldset > div.uk-form-row > input').removeClass('uk-form-danger');
    $('#taracot-modal-edit-wrap > form.uk-form > fieldset > div.uk-form-row > input').val('');
    $('#taracot-modal-edit-wrap').addClass('uk-hidden');
    $('#taracot-modal-edit-loading').removeClass('uk-hidden');
    $('#taracot-modal-edit-loading-error').addClass('uk-hidden');
    load_edit_data(id);
}

var add_item = function (id) {
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

$('#taracot-edit-btn-save').click(function () {
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
            errors = true;
        }
    } else {
        if (!$('#password').val().match(/^.{5,20}$/) || $('#password').val() != $('#password-repeat').val()) {
            $('#password').addClass('uk-form-danger');
            $('#password-repeat').addClass('uk-form-danger');
            errors = true;
        }
    }
    if (errors) {
        $.UIkit.notify({
            message: _lang_vars.form_err_msg,
            status: 'danger',
            timeout: 2000,
            pos: 'top-center'
        });
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
                $('#taracot_table').medvedTable('update');
                edit_modal.hide();
                $.UIkit.notify({
                    message: _lang_vars.save_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
            } else {
                $('#taracot-modal-edit-wrap').removeClass('uk-hidden');
                var _errmsg = _lang_vars.form_err_msg;
                if (data.error) {
                    _errmsg = data.error;
                }
                if (data.err_fields && data.err_fields.length) {
                    var _focus = false;
                    for (var i = 0; i < data.err_fields.length; i++) {
                        $('#' + data.err_fields[i]).addClass('uk-form-danger');
                        if (!_focus) {
                            $('#' + data.err_fields[i]).focus();
                            _focus = true;
                        }
                    }
                }
                $.UIkit.notify({
                    message: _errmsg,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function () {
            $('#taracot-modal-edit-loading').addClass('uk-hidden');
            $('#taracot-modal-edit-wrap').removeClass('uk-hidden');
            $.UIkit.notify({
                message: _lang_vars.form_err_msg,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
});

var delete_item = function (ids) {
    var users = [];
    for (var i = 0; i < ids.length; i++) {
        users.push($('#taracot-table-chbx-' + ids[i]).attr('rel').replace('taracot-item_', ''));
    }
    if (confirm(_lang_vars.del_confirm + "\n\n" + users + "\n\n")) {
        $('#taracot_table').medvedTable('loading_indicator_show');
        $.ajax({
            type: 'POST',
            url: '/cp/users/data/delete',
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

$('.taracot-edit-form > fieldset > .uk-form-row > input, .taracot-edit-form > fieldset > .uk-form-row > select').bind('keypress', function (e) {
    if (submitOnEnter(e)) {
        $('#taracot-edit-btn-save').click();
    }
});