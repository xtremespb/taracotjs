$.loadingIndicator();
var current_id_hosting, current_id_domains, _history_handler_disable, dlg_lock = UIkit.modal("#dlg_lock", {
    bgclose: false,
    keyboard: false
});

/*******************************************************************

 Medved Table configuration

********************************************************************/

var process_rows = [
    function(val, id, data) {
        var icon = 'cube';
        if (data[5] == 'd') {
            icon = 'globe';
            val = val + '.' + data[3];
        }
        return '<label id="taracot-table-lbl-' + id + '"><input type="checkbox" class="taracot-table-chbx" id="taracot-table-chbx-' + id + '" rel="taracot-item_' + val + '"></div>&nbsp;<i class="uk-icon-' + icon + '"></i>&nbsp;' + val + '</label>';
    },
    function(val, id) {
        return val;
    },
    function(val, id) {
        return val;
    },
    function(val, id, data) {
        if (data[5] == 'd') val = moment(parseInt(val)).format('L');
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

var delete_item = function(ids) {
    var users = [];
    for (var i = 0; i < ids.length; i++) {
        users.push($('#taracot-table-chbx-' + ids[i]).attr('rel').replace('taracot-item_', ''));
    }
    if (confirm(_lang_vars.del_confirm + "\n\n" + users.join(', '))) {
        $('#taracot_table').medvedTable('loading_indicator_show');
        $.ajax({
            type: 'POST',
            url: '/cp/billing_accounts/data/delete',
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

var btn_add_hosting_handler = function() {
    push_state({
        mode: 'add_hosting_account'
    }, "?mode=add_hosting_account");
    current_id_hosting = undefined;
    $('.taracot-area').hide();
    $('#billing_area_hosting').show();
    $('.taracot-form-hosting-control').each(function() {
        $(this).val('');
        $(this).prop("selectedIndex", 0);
        $(this).removeClass('uk-form-danger');
    });
    $('#hosting_error').hide();
    $('#billing_h1_hosting').html(_lang_vars.new_hosting_account);
    $('#haccount').focus();
};

var btn_hosting_save_handler = function() {
    $('.taracot-form-hosting-control').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    $('#hosting_error').hide();
    // Validation
    var errors = [],
        baccount = $.trim($('#haccount').val()),
        buser = $.trim($('#huser').val()),
        bplan = $.trim($('#hplan').val()),
        bexp = $.trim($('#hexp').val());
    if (!baccount.match(/^[A-Za-z0-9_\-]{3,20}$/)) errors.push('#haccount');
    if (!buser.match(/^[A-Za-z0-9_\-]{3,20}$/)) errors.push('#huser');
    if (!bplan) errors.push('#hplan');
    if (!bexp || !isInt(parseInt(bexp))) errors.push('#hexp');
    if (errors.length) {
        $(errors[0]).focus();
        var err_msg = _lang_vars.form_contains_errors + ' (',
            err_labels = [];
        for (var error in errors) {
            $(errors[error]).addClass('uk-form-danger');
            err_labels.push('"' + $(errors[error]).parent().parent().find('label').html() + '"');
        }
        err_msg += err_labels.join(', ') + ')';
        $('#hosting_error').html(err_msg);
        $('#hosting_error').show();
        return;
    }
    // Save hosting account
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/billing_accounts/data/save',
        data: {
            btype: 'h',
            baccount: baccount,
            buser: buser,
            bplan: bplan,
            bexp: bexp,
            id: current_id_hosting
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                show_list();
                $('#taracot_table').medvedTable('update');
                UIkit.notify({
                    message: _lang_vars.hosting_save_success,
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
                $('#hosting_error').html(msg);
                $('#hosting_error').show();
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

var btn_hosting_cancel_handler = function() {
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/billing_accounts/data/unlock',
        data: {
            id: current_id_hosting
        },
        dataType: "json",
        complete: function() {
            $.loadingIndicator('hide');
            show_list();
        }
    });
};

var btn_add_domain_handler = function() {
    push_state({
        mode: 'add_domain'
    }, "?mode=add_domain");
    current_id_domains = undefined;
    $('.taracot-area').hide();
    $('#billing_area_domains').show();
    $('.taracot-form-domains-control').each(function() {
        $(this).val('');
        $(this).prop("selectedIndex", 0);
        $(this).removeClass('uk-form-danger');
    });
    $('#domains_error').hide();
    $('#billing_h1_domains').html(_lang_vars.new_domain);
    $('#daccount').focus();
};

var btn_domain_cancel_handler = function() {
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/billing_accounts/data/unlock',
        data: {
            id: current_id_domains
        },
        dataType: "json",
        complete: function() {
            $.loadingIndicator('hide');
            show_list();
        }
    });
};

var btn_domain_save_handler = function() {
    $('.taracot-form-domains-control').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    $('#domains_error').hide();
    // Validation
    var errors = [],
        daccount = $.trim($('#daccount').val()),
        duser = $.trim($('#duser').val()),
        dplan = $.trim($('#dplan').val()),
        dexp = $.trim($('#dexp').val());
    if (!daccount.match(/^[A-Za-zА-Яа-я0-9\-]{3,20}$/)) errors.push('#daccount');
    if (!duser.match(/^[A-Za-z0-9_\-]{3,20}$/)) errors.push('#duser');
    if (!dplan) errors.push('#dplan');
    if (!dexp) errors.push('#dexp');
    dexp = moment(dexp, billing_date_format).unix() * 1000;
    if (dexp < 0) errors.push('#dexp');
    if (errors.length) {
        $(errors[0]).focus();
        var err_msg = _lang_vars.form_contains_errors + ' (',
            err_labels = [];
        for (var error in errors) {
            $(errors[error]).addClass('uk-form-danger');
            err_labels.push('"' + $(errors[error]).parent().parent().find('label').html() + '"');
        }
        err_msg += err_labels.join(', ') + ')';
        $('#domains_error').html(err_msg);
        $('#domains_error').show();
        // return;
    }
    // Save domains account
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/billing_accounts/data/save',
        data: {
            btype: 'd',
            baccount: daccount,
            buser: duser,
            bplan: dplan,
            bexp: dexp,
            id: current_id_domains
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                show_list();
                $('#taracot_table').medvedTable('update');
                UIkit.notify({
                    message: _lang_vars.domains_save_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
            } else {
                var msg = _lang_vars.ajax_failed;
                if (data.err_msg) msg = data.err_msg;
                if (data.err_field) {
                    $('#d' + data.err_field).addClass('uk-form-danger');
                    $('#d' + data.err_field).focus();
                }
                $('#domains_error').html(msg);
                $('#domains_error').show();
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

var edit_item = function(id) {
    push_state({
        mode: 'edit',
        id: id
    }, "?mode=edit&id=" + id);
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/billing_accounts/data/load',
        data: {
            id: id
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                if (data.account && data.account.btype) {
                    if (data.account.btype == 'h') {
                        current_id_hosting = data.account._id;
                        current_id_domains = undefined;
                        $('.taracot-area').hide();
                        $('#billing_area_hosting').show();
                        $('.taracot-form-hosting-control').each(function() {
                            $(this).val('');
                            $(this).prop("selectedIndex", 0);
                            $(this).removeClass('uk-form-danger');
                        });
                        $('#hosting_error').hide();
                        $('#billing_h1_hosting').html(_lang_vars.edit_hosting_account);
                        $('#haccount').val(data.account.baccount);
                        $('#huser').val(data.account.buser_save);
                        $('#hplan').val(data.account.bplan);
                        $('#hexp').val(data.account.bexp);
                        $('#haccount').focus();
                    }
                    if (data.account.btype == 'd') {
                        current_id_hosting = undefined;
                        current_id_domains = data.account._id;
                        $('.taracot-area').hide();
                        $('#billing_area_domains').show();
                        $('.taracot-form-domains-control').each(function() {
                            $(this).val('');
                            $(this).prop("selectedIndex", 0);
                            $(this).removeClass('uk-form-danger');
                        });
                        $('#domains_error').hide();
                        $('#billing_h1_domains').html(_lang_vars.edit_domain);
                        $('#daccount').val(data.account.baccount);
                        $('#duser').val(data.account.buser_save);
                        $('#dplan').val(data.account.bplan);
                        $('#dexp').val(moment(parseInt(data.account.bexp)).format(billing_date_format));
                        $('#daccount').focus();
                    }
                    if (data.account.block && data.account.block != current_user) {
                        $('#document_locked_by').html(data.account.block);
                        dlg_lock.show();
                    }
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

var btn_unlock_handler = function() {
    dlg_lock.hide();
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/billing_accounts/data/unlock',
        data: {
            id: current_id_hosting
        },
        dataType: "json",
        complete: function() {
            $.loadingIndicator('hide');
        }
    });
};

var btn_dont_unlock_handler = function() {
    dlg_lock.hide();
    show_list();
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
            case 'add_hosting_account':
                $('#btn_add_hosting').click();
                break;
            case 'add_domain':
                $('#btn_add_domain').click();
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
        col_count: 5,
        sort_mode: 1,
        sort_cell: 'baccount',
        taracot_table_url: '/cp/billing_accounts/data/list',
        process_rows: process_rows,
        error_message: _lang_vars.ajax_failed
    });
    for (var hi = 0; hi < init_hosting.length; hi++)
        $('#hplan').append('<option value="' + init_hosting[hi].id + '">' + init_hosting[hi][current_locale] + '</option>');
    for (var di = 0; di < init_domains.length; di++)
        $('#dplan').append('<option value="' + init_domains[di].id + '">' + init_domains[di].id + '</option>');
    // Bind handlers
    $('#btn_add_hosting').click(btn_add_hosting_handler);
    $('#btn_add_domain').click(btn_add_domain_handler);
    $('#btn_hosting_cancel').click(btn_hosting_cancel_handler);
    $('#btn_domain_cancel').click(btn_domain_cancel_handler);
    $('#btn_hosting_save').click(btn_hosting_save_handler);
    $('#btn_domain_save').click(btn_domain_save_handler);
    $('#btn_unlock').click(btn_unlock_handler);
    $('#btn_dont_unlock').click(btn_dont_unlock_handler);
    // Bind Enter key
    $('.taracot-form-hosting-control').bind('keypress', function(e) {
        if (submitOnEnter(e)) $('#btn_hosting_save').click();
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
