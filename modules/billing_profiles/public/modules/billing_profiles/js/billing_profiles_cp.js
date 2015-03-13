$.loadingIndicator();
var current_id_profile, current_id_transaction, _history_handler_disable, dlg_trans = new UIkit.modal("#dlg_trans");

var profile_validation = {
        'n1e': new RegExp(/^[A-Za-z\-]{1,30}$/),
        'n2e': new RegExp(/^[A-Za-z\-]{1,30}$/),
        'n3e': new RegExp(/^[A-Z]{1}$/),
        'n1r': new RegExp(/^[А-Яа-я\-]{1,19}$/),
        'n2r': new RegExp(/^[А-Яа-я\-]{1,19}$/),
        'n3r': new RegExp(/^[А-Яа-я\-]{1,24}$/),
        'passport': new RegExp(/^([0-9]{2})(\s)([0-9]{2})(\s)([0-9]{6})(\s)(.*)([0-9]{2})(\.)([0-9]{2})(\.)([0-9]{4})$/),
        'addr_ru': new RegExp(/^([0-9]{6}),(\s)(.*)$/),
        'email': new RegExp(/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/),
        'phone': new RegExp(/^(\+)([0-9]{1,5})(\s)([0-9]{1,6})(\s)([0-9]{1,10})$/),
        'fax': new RegExp(/^(\+)([0-9]{1,5})(\s)([0-9]{1,6})(\s)([0-9]{1,10})$/),
        'postcode': new RegExp(/^([0-9]{5,6})$/),
        'city': new RegExp(/^([A-Za-z\-\. ]{2,64})$/),
        'state': new RegExp(/^([A-Za-z\-\. ]{2,40})$/),
        'addr': new RegExp(/^(.{2,80})$/),
        'org_r': new RegExp(/^(.{1,80})$/),
        'org': new RegExp(/^(.{1,80})$/),
        'code': new RegExp(/^([0-9]{10})$/),
        'kpp': new RegExp(/^([0-9]{9})$/)
    },
    profile_validation_org = {
        'org_r': 1,
        'org': 1,
        'code': 1,
        'kpp': 1
    },
    profile_validation_ru = {
        'n1r': 1,
        'n2r': 1,
        'n3r': 1,
        'passport': 1,
        'addr_ru': 1
    };

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
        bfunds = $.trim($('#bfunds').val()),
        profile_data = {};
    if (typeof bfunds == 'undefined' || parseFloat(bfunds).isNaN || !bfunds.match(/^[0-9\.]+$/)) errors.push('#bfunds');
    if ($('#toggle_profile_edit').parent().hasClass('uk-active')) {
        $('.taracot-dp-field').each(function() {
            var id = $(this).attr('id'),
                val = $.trim($(this).val()),
                _f;
            // Validate RU/SU-related fields
            if (profile_validation_ru[id]) {
                _f = 1;
                if ($.trim($('#n1r').val()) || $.trim($('#n2r').val()) || $.trim($('#n3r').val()) || $.trim($('#passport').val()) || $.trim($('#addr_ru').val())) {
                    if (val && val.match(profile_validation[id])) {
                        profile_data[id] = val;
                    } else {
                        errors.push('#' + id);
                    }
                }
            }
            // Validate organziation (RU/SU-related) fields
            if (profile_validation_org[id]) {
                _f = 1;
                if ($.trim($('#org_r').val()) || $.trim($('#org').val()) || $.trim($('#code').val()) || $.trim($('#kpp').val()))
                    if (val && val.match(profile_validation[id])) {
                        profile_data[id] = val;
                    } else {
                        errors.push('#' + id);
                    }
            }
            // Convert birth date
            if (id == 'birth_date') {
                _f = 1;
                val = moment(val, billing_date_format).format('DD.MM.YYYY');
                if (val != 'Invalid date') {
                    profile_data[id] = val;
                } else {
                    errors.push('#' + id);
                }
            }
            // Fax
            if (id == 'fax') {
                _f = 1;
                if (val)
                    if (val.match(profile_validation[id])) {
                        profile_data[id] = val;
                    } else {
                        errors.push('#' + id);
                    }
            }
            // Validate other fields
            if (!_f)
                if (val && val.match(profile_validation[id])) {
                    profile_data[id] = val;
                } else {
                    errors.push('#' + id);
                }
        });
    } else {
        profile_data = undefined;
    }
    if (errors.length) {
        $(errors[0]).focus();
        var err_msg = _lang_vars.form_contains_errors + ' (',
            err_labels = [];
        for (var error in errors) {
            $(errors[error]).addClass('uk-form-danger');
            err_labels.push('"' + $(errors[error]).parent().parent().find('label').text().replace(/\*/, '').trim() + '"');
        }
        err_msg += err_labels.join(', ') + ')';
        $('#profile_error').html(err_msg);
        $('#profile_error').show();
        $('html,body').animate({
                scrollTop: $("#profile_error").offset().top - 20
            },
            'slow');
        return;
    }
    // Save profile account
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/billing_profiles/data/save',
        data: {
            bfunds: bfunds,
            profile_data: profile_data,
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
                    $('#' + data.err_field).addClass('uk-form-danger');
                    $('#' + data.err_field).focus();
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
    $('.taracot-form-profile-control').each(function() {
        $(this).val('');
        $(this).prop("selectedIndex", 0);
        $(this).removeClass('uk-form-danger');
    });
    if (navigator.language) {
        var _country = navigator.language;
        if (navigator.language.length > 2) _country = navigator.language.slice(-2);
        $('#country').val(_country);
    }
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
                    $('#toggle_profile_dontedit').click();
                    $('#profile_error').hide();
                    $('#profile_edit_username').html(data.account.username);
                    $('#bfunds').val(data.account.billing_funds || '0');
                    if (data.account.profile_data)
                        $('.taracot-dp-field').each(function() {
                            var id = $(this).attr('id');
                            if (data.account.profile_data[id]) $('#' + id).val(data.account.profile_data[id]);
                        });
                    render_transactions(data.account.transactions);
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

var btn_add_transaction_handler = function() {
    current_id_transaction = undefined;
    $('#h1_trans').html(_lang_vars.new_transaction);
    $('.taracot-form-trans-control').each(function() {
        $(this).val('');
        $(this).prop("selectedIndex", 0);
        $(this).removeClass('uk-form-danger');
    });
    $('#trans_error').hide();
    dlg_trans.show();
    $('#trans_type').focus();
};

var btn_trans_edit_handler = function() {
    var id = $(this).attr('id').replace(/btn_trans_edit_/, '');
    $('#h1_trans').html(_lang_vars.edit_transaction);
    $('.taracot-form-trans-control').each(function() {
        $(this).val('');
        $(this).prop("selectedIndex", 0);
        $(this).removeClass('uk-form-danger');
    });
    $('#trans_error').hide();
    $.loadingIndicator('show');
     $.ajax({
        type: 'POST',
        url: '/cp/billing_profiles/data/load_transaction',
        data: {
            id: id
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1 && data.transaction) {
                if (data.transaction.trans_type) $('#trans_type').val(data.transaction.trans_type);
                if (data.transaction.trans_obj) $('#trans_obj').val(data.transaction.trans_obj);
                if (data.transaction.trans_timestamp) {
                    $('#trans_date').val(moment(data.transaction.trans_timestamp).format(billing_date_format));
                    $('#trans_time').val(moment(data.transaction.trans_timestamp).format(billing_time_format));
                }
                if (data.transaction.trans_sum) $('#trans_sum').val(data.transaction.trans_sum);
                dlg_trans.show();
                $('#trans_type').focus();
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

var btn_trans_del_handler = function() {
    var id = $(this).attr('id').replace(/btn_trans_del_/, '');
    if (!confirm(_lang_vars.trans_delete_confirm + "\n\n" + $(this).parent().parent().children('td').eq(1).html())) return;
    $.loadingIndicator('show');
     $.ajax({
        type: 'POST',
        url: '/cp/billing_profiles/data/delete_transaction',
        data: {
            id: id
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                update_transactions();
                UIkit.notify({
                    message: _lang_vars.trans_delete_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
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

var render_transactions = function(data) {
    $('#table_transactions > tbody').empty();
    if (data && data.length) {
        for (var ti in data) {
            var badge = '<div class="uk-badge uk-badge-notification uk-badge-success billing-trans-badge"><i class="uk-icon-plus"></i></div>',
                trans = transactions_i18n[transactions_i18n[data[ti].trans_type]];
            if (data[ti].trans_sum <= 0) badge = '<div class="uk-badge uk-badge-notification uk-badge-danger billing-trans-badge"><i class="uk-icon-minus"></i></div>';
            if (data[ti].trans_obj) trans += ' (' + data[ti].trans_obj + ')';
            $('#table_transactions > tbody').append('<tr><td>' + moment(data[ti].trans_timestamp).format(billing_date_format + ' ' + billing_time_format) + '</td><td>' + trans + '</td><td>' + badge + '&nbsp;' + data[ti].trans_sum + ' ' + current_currency + '</td><td style="text-align:center"><button class="uk-button uk-button-mini taracot-btn-trans-edit" id="btn_trans_edit_' + data[ti]._id + '"><i class="uk-icon-pencil"></i></button>&nbsp;<button class="uk-button uk-button-mini uk-button-danger taracot-btn-trans-del" id="btn_trans_del_' + data[ti]._id + '"><i class="uk-icon-remove"></i></button></td></tr>');
        }
        $('.taracot-btn-trans-edit').click(btn_trans_edit_handler);
        $('.taracot-btn-trans-del').click(btn_trans_del_handler);
    } else {
        $('#table_transactions > tbody').append('<tr><td colspan="4">' + _lang_vars.no_transaction_records + '</td></tr>');
    }
};

var update_transactions = function() {
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/billing_profiles/data/list_transactions',
        data: {
            id: current_id_profile
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                render_transactions(data.transactions);
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

var btn_transaction_save_handler = function() {
    $('#trans_error').hide();
    $('.taracot-form-trans-control').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    var errors = [],
        trans_sum = $.trim($('#trans_sum').val()),
        trans_date = $.trim($('#trans_date').val()),
        trans_time = $.trim($('#trans_time').val()),
        trans_type = $('#trans_type').val(),
        trans_obj = $.trim($('#trans_obj').val()),
        profile_data = {};
    trans_date = moment(trans_date, billing_date_format).format('DD.MM.YYYY');
    if (trans_date == 'Invalid date') errors.push('#trans_date');
    trans_time = moment(trans_time, billing_time_format).format('HH:mm');
    if (trans_time == 'Invalid time') errors.push('#trans_time');
    if (typeof trans_sum == 'undefined' || parseFloat(bfunds).isNaN || !trans_sum.match(/^[\-0-9\.]+$/)) errors.push('#trans_sum');
    if (trans_obj && trans_obj.length > 80) errors.push('#trans_obj');
    if (errors.length) {
        $(errors[0]).focus();
        var err_msg = _lang_vars.form_contains_errors + ' (',
            err_labels = [];
        for (var error in errors) {
            $(errors[error]).addClass('uk-form-danger');
            err_labels.push('"' + $(errors[error]).parent().parent().find('label').text().replace(/\*/, '').trim() + '"');
        }
        err_msg += err_labels.join(', ') + ')';
        $('#trans_error').html(err_msg);
        $('#trans_error').show();
        return;
    }
    var timestamp = moment(trans_date + ' ' + trans_time, 'DD.MM.YYYY HH:mm').unix() * 1000;
    $('#btn_transaction_save_loading').show();
    $('#btn_transaction_save').attr('disabled', true);
    $.ajax({
        type: 'POST',
        url: '/cp/billing_profiles/data/save_transaction',
        data: {
            trans_type: trans_type,
            trans_obj: trans_obj,
            trans_timestamp: timestamp,
            trans_sum: trans_sum,
            id: current_id_transaction,
            user_id: current_id_profile
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                dlg_trans.hide();
                update_transactions();
                UIkit.notify({
                    message: _lang_vars.trans_save_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
            } else {
                var msg = _lang_vars.ajax_failed;
                if (data.err_msg) msg = data.err_msg;
                if (data.err_field) {
                    $('#' + data.err_field).addClass('uk-form-danger');
                    $('#' + data.err_field).focus();
                }
                $('#trans_error').html(msg);
                $('#trans_error').show();
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
            $('#btn_transaction_save_loading').hide();
            $('#btn_transaction_save').attr('disabled', false);
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
    $('#btn_add_transaction').click(btn_add_transaction_handler);
    $('#btn_transaction_save').click(btn_transaction_save_handler);
    // Bind Enter key
    $('.taracot-form-profile-control').bind('keypress', function(e) {
        if (submitOnEnter(e)) $('#btn_profile_save').click();
    });
    $('.taracot-form-domains-control').bind('keypress', function(e) {
        if (submitOnEnter(e)) $('#btn_domain_save').click();
    });
    $('.taracot-form-trans-control').bind('keypress', function(e) {
        if (submitOnEnter(e)) $('#btn_transaction_save').click();
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
    return n === +n && n !== (n | 0);
}
