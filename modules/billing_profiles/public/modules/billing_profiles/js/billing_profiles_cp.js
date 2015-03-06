$.loadingIndicator();
var current_id_profile, _history_handler_disable;

/*******************************************************************

 Medved Table configuration

********************************************************************/

var process_rows = [
    function(val, id, data) {
        return '<label id="taracot-table-lbl-' + id + '"><input type="checkbox" class="taracot-table-chbx" id="taracot-table-chbx-' + id + '" rel="taracot-item_' + val + '"></div>&nbsp;' + val + '</label>';
    },
    function(val, id) {
        if (!val) val = 0;
        return val + ' ' + current_currency;
    },
    function(val, id) {
        return '<div style="text-align:center;width:100px"><button class="uk-icon-button uk-icon-edit taracot-tableitem-edit" id="taracot-btnedt-' + id + '" type="button"></button></div>';
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

var delete_item = function(ids) {
    var users = [];
    for (var i = 0; i < ids.length; i++) {
        users.push($('#taracot-table-chbx-' + ids[i]).attr('rel').replace('taracot-item_', ''));
    }
    if (confirm(_lang_vars.del_confirm + "\n\n" + users.join(', '))) {
        $('#taracot_table').medvedTable('loading_indicator_show');
        $.ajax({
            type: 'POST',
            url: '/cp/billing_profiles/data/delete',
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

/*******************************************************************

 Button/UI hanlders

********************************************************************/

var show_list = function() {
    $('.taracot-area').hide();
    $('#billing_area_list').show();
    push_state({
        mode: 'list'
    }, "?mode=list");
};

var btn_profile_save_handler = function() {
    $('.taracot-form-profile-control').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    $('#profile_error').hide();
    // Validation
    var errors = [],
        bfunds = $.trim($('#bfunds').val());
    if (typeof bfunds == 'undefined' || parseFloat(bfunds).isNaN || !bfunds.match(/^[0-9\.]+$/)) errors.push('#bfunds');
    $('.taracot-dp-field').each(function() {
        var id = $(this).attr('id');
    });
    if (errors.length) {
        $(errors[0]).focus();
        var err_msg = _lang_vars.form_contains_errors + ' (',
            err_labels = [];
        for (var error in errors) {
            $(errors[error]).addClass('uk-form-danger');
            err_labels.push('"' + $(errors[error]).parent().parent().find('label').html() + '"');
        }
        err_msg += err_labels.join(', ') + ')';
        $('#profile_error').html(err_msg);
        $('#profile_error').show();
        return;
    }
    // Save profile account
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/billing_profiles/data/save',
        data: {
            bfunds: bfunds,
            id: current_id_profile
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                show_list();
                $('#taracot_table').medvedTable('update');
                UIkit.notify({
                    message: _lang_vars.profile_save_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
            } else {
                var msg = _lang_vars.ajax_failed;
                if (data.err_msg) msg = data.err_msg;
                if (data.err_field) {
                    $('#h' + data.err_field).addClass('uk-form-danger');
                    $('#h' + data.err_field).focus();
                }
                $('#profile_error').html(msg);
                $('#profile_error').show();
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

var btn_profile_cancel_handler = function() {
    show_list();
};

var edit_item = function(id) {
    push_state({
        mode: 'edit',
        id: id
    }, "?mode=edit&id=" + id);
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/billing_profiles/data/load',
        data: {
            id: id
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                if (data.account) {
                    current_id_profile = data.account._id;
                    $('.taracot-area').hide();
                    $('#billing_area_profile').show();
                    $('.taracot-form-profile-control').each(function() {
                        $(this).val('');
                        $(this).prop("selectedIndex", 0);
                        $(this).removeClass('uk-form-danger');
                    });
                    $('#profile_error').hide();
                    $('#profile_edit_username').html(data.account.username);
                    $('#bfunds').val(data.account.billing_funds || '0');
                    $('#bfunds').focus();
                }
            } else {
                var msg = _lang_vars.ajax_failed;
                if (data.err_msg) msg = data.err_msg;
                UIkit.notify({
                    message: msg,
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

/*******************************************************************

 History API hanlder

********************************************************************/

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
                show_list();
                break;
            case 'edit':
                if (state.data.id) edit_item(state.data.id);
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

 document.ready

********************************************************************/

$(document).ready(function() {
    moment.lang(current_locale);
    $('#taracot_table').medvedTable({
        col_count: 3,
        sort_mode: 1,
        sort_cell: 'username',
        taracot_table_url: '/cp/billing_profiles/data/list',
        process_rows: process_rows,
        error_message: _lang_vars.ajax_failed
    });
    // Bind handlers
    $('#btn_profile_cancel').click(btn_profile_cancel_handler);
    $('#btn_profile_save').click(btn_profile_save_handler);
    // Bind Enter key
    $('.taracot-form-profile-control').bind('keypress', function(e) {
        if (submitOnEnter(e)) $('#btn_profile_save').click();
    });
    $('.taracot-form-domains-control').bind('keypress', function(e) {
        if (submitOnEnter(e)) $('#btn_domain_save').click();
    });
    // History handler
    bind_history();
    if (!History.getState().data || !History.getState().data.mode) {
        if ($.queryString.mode) {
            push_state({
                mode: $.queryString.mode,
                id: $.queryString.id || ''
            }, "?mode=" + $.queryString.mode + "&id=" + $.queryString.id || '');
        } else {
            show_list();
        }
    }
    history_handler();
});

/*******************************************************************

 Helpers

********************************************************************/

function isInt(n) {
    return Number(n) === n && n % 1 === 0;
}

function isFloat(n) {
    return n === +n && n !== (n|0);
}
