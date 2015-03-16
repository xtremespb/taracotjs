var hosting_plan_hash = {},
    dlg_hosting_add = new UIkit.modal("#dlg_hosting_add", {
        bgclose: false,
        keyboard: false
    }),
    dlg_hosting_up = new UIkit.modal("#dlg_hosting_up", {
        bgclose: false,
        keyboard: false
    }),
    dlg_domain_add = new UIkit.modal("#dlg_domain_add", {
        bgclose: false,
        keyboard: false
    }),
    current_hosting_up_plan,
    current_hosting_up_account,
    init_domains_count = 0,
    init_hosting_count = 0,
    profile_validation = {
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

 Hanlders

********************************************************************/

var btn_hosting_add_handler = function() {
    $('.taracot-hosting-add-control').each(function() {
        $(this).val('');
        $(this).prop("selectedIndex", 0);
        $(this).removeClass('uk-form-danger');
    });
    $('#hosting_add_error').hide();
    dlg_hosting_add.show();
    dh_plan_months_change();
    $('#dh_username').focus();
};

var get_hosting_add_total = function() {
    var plan_id = $('#dh_plan').val(),
        months = $('#dh_months').val(),
        total = 0;
    for (var hi in init_hosting)
        if (init_hosting[hi].id == plan_id)
            total = init_hosting[hi].price * months;
    return total;
};

var dh_plan_months_change = function() {
    $('#dlg_hosting_add_cost').html(get_hosting_add_total() + ' ' + init_misc_hash.currency);
};

var get_hosting_up_total = function() {
    var months = $('#dhp_months').val(),
        total = 0;
    for (var hi in init_hosting)
        if (init_hosting[hi].id == current_hosting_up_plan)
            total = init_hosting[hi].price * months;
    return total;
};

var dhp_months_change = function() {
    $('#dlg_hosting_up_cost').html(get_hosting_up_total() + ' ' + init_misc_hash.currency);
};

var get_domain_add_total = function() {
    var plan_id = $('#dd_plan').val(),
        total = 0;
    for (var hi in init_domains)
        if (init_domains[hi].id == plan_id)
            total = init_domains[hi].reg;
    return total;
};

var dd_plan_change = function() {
    $('#dd_username_zone').html('.' + $('#dd_plan').val().toUpperCase());
    $('#dlg_domain_add_cost').html(get_domain_add_total() + ' ' + init_misc_hash.currency);
};

var btn_billing_profile_save_handler = function() {
    $('.taracot-form-profile-control').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    $('#profile_error').hide();
    // Validation
    var errors = [],
        profile_data = {};
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
        $('#profile_error').fadeIn(500);
        $('html,body').animate({
                scrollTop: $("#profile_error").offset().top - 20
            },
            'slow');
        return;
    }
    $('#btn_billing_profile_save').attr('disabled', true);
    $('#btn_billing_profile_save_loading').show();
    $.ajax({
        type: 'POST',
        url: '/customer/ajax/save/profile',
        data: {
            profile_data: profile_data
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                UIkit.notify({
                    message: _lang_vars.profile_save_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
                init_profile_data = profile_data;
            } else {
                var msg = _lang_vars.ajax_failed;
                if (data.err_msg) msg = data.err_msg;
                if (data.err_field) {
                    $('#' + data.err_field).addClass('uk-form-danger');
                    $('#' + data.err_field).focus();
                }
                $('#profile_error').html(msg);
                $('#profile_error').fadeIn(500);
                $('html,body').animate({
                        scrollTop: $("#profile_error").offset().top - 20
                    },
                    'fast');
            }
        },
        error: function() {
            $('#profile_error').html(_lang_vars.ajax_failed);
            $('#profile_error').fadeIn(500);
            $('html,body').animate({
                    scrollTop: $("#profile_error").offset().top - 20
                },
                'slow');
        },
        complete: function() {
            $('#btn_billing_profile_save').attr('disabled', false);
            $('#btn_billing_profile_save_loading').hide();
        }
    });
};

var btn_hosting_account_create_handler = function() {
    $('.taracot-hosting-add-control').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    $('#hosting_add_error').hide();
    // Validation
    var errors = [],
        hosting_data = {
            baccount: $.trim($('#dh_username').val()),
            bplan: $('#dh_plan').val(),
            bpwd: $.trim($('#dh_password').val()),
            bexp_add: parseInt($('#dh_months').val())
        };
    if (!hosting_data.baccount || !hosting_data.baccount.match(/^[A-Za-z0-9_\-]{3,12}$/)) errors.push('#dh_username');
    if (!hosting_data.bpwd || hosting_data.bpwd != $.trim($('#dh_password_repeat').val()) || hosting_data.bpwd.length < 8) errors.push('#dh_password');
    if (errors.length) {
        $(errors[0]).focus();
        var err_msg = _lang_vars.form_contains_errors + ' (',
            err_labels = [];
        for (var error in errors) {
            $(errors[error]).addClass('uk-form-danger');
            if (errors[error] == '#dh_password') $('#dh_password_repeat').addClass('uk-form-danger');
            err_labels.push('"' + $(errors[error]).parent().parent().find('label').text().replace(/\*/, '').trim() + '"');
        }
        err_msg += err_labels.join(', ') + ')';
        $('#hosting_add_error').html(err_msg);
        $('#hosting_add_error').fadeIn(500);
        return;
    }
    $('.taracot-hosting-add-btn').attr('disabled', true);
    $('#btn_hosting_account_create_loading').show();
    $.ajax({
        type: 'POST',
        url: '/customer/ajax/create/hosting',
        data: hosting_data,
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                var btn_host_up = '<button class="uk-button uk-button-mini uk-button-success taracot-btn-hosting-up" id="_ha_' + data.account.account + '_' + data.account.plan + '"><i class="uk-icon-plus"></i></button>';
                $('#taracot_billing_table_hosting > tbody').append('<tr><td>' + data.account.account + '</td><td style="text-align:center">' + hosting_plan_hash[data.account.plan] + '</td><td style="text-align:center" id="billing_days_' + data.account.account + '">' + data.account.days + '</td><td>' + btn_host_up + '</td></tr>');
                $('.taracot-btn-hosting-up').unbind();
                $('.taracot-btn-hosting-up').click(taracot_btn_hosting_up_handler);
                var trans_type = transactions_i18n.hosting_reg + ' (' + data.account.account + ')',
                    trans_badge = '<div class="uk-badge uk-badge-notification uk-badge-danger billing-trans-badge"><i class="uk-icon-minus"></i></div>';
                $('#taracot_billing_table_transactions > tbody').prepend('<tr><td>' + moment(Date.now()).format('L LT') + '</td><td>' + trans_type + '</td><td>' + trans_badge + '&nbsp;' + data.account.cost + ' ' + init_misc_hash.currency + '</td></tr>');
                $('.taracot-billing-funds').html(data.account.funds);
                dlg_hosting_add.hide();
                UIkit.notify({
                    message: _lang_vars.hosting_add_success,
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
                $('#hosting_add_error').html(msg);
                $('#hosting_add_error').fadeIn(500);
            }
        },
        error: function() {
            $('#hosting_add_error').html(_lang_vars.ajax_failed);
            $('#hosting_add_error').fadeIn(500);
        },
        complete: function() {
            $('.taracot-hosting-add-btn').attr('disabled', false);
            $('#btn_hosting_account_create_loading').hide();
        }
    });
};

var taracot_btn_hosting_up_handler = function() {
    var id = $(this).attr('id').replace(/_ha_/, '');
    current_hosting_up_account = id.split(/_/)[0];
    current_hosting_up_plan = id.split(/_/)[1];
    $('.taracot-hosting-up-control').each(function() {
        $(this).val('');
        $(this).prop("selectedIndex", 0);
        $(this).removeClass('uk-form-danger');
    });
    $('#hosting_up_error').hide();
    dlg_hosting_up.show();
    $('#current_hosting_up_account').html(current_hosting_up_account);
    for (var sp in init_hosting)
        if (init_hosting[sp].id == current_hosting_up_plan)
            $('#current_hosting_up_plan').html(init_hosting[sp][current_locale] + ' (' + init_hosting[sp].price + ' ' + init_misc_hash.currency + ' ' + _lang_vars.per_month + ')');
    dhp_months_change();
    $('#dhp_months').focus();
};

var btn_hosting_account_update_handler = function() {
    $('.taracot-hosting-up-btn').attr('disabled', true);
    $('#btn_hosting_account_update_loading').show();
    $.ajax({
        type: 'POST',
        url: '/customer/ajax/prolong/hosting',
        data: {
            baccount: current_hosting_up_account,
            bexp_add: parseInt($('#dhp_months').val())
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                $('#billing_days_' + data.account.account).html(data.account.days);
                var trans_type = transactions_i18n.hosting_up + ' (' + data.account.account + ')',
                    trans_badge = '<div class="uk-badge uk-badge-notification uk-badge-danger billing-trans-badge"><i class="uk-icon-minus"></i></div>';
                $('#taracot_billing_table_transactions > tbody').prepend('<tr><td>' + moment(Date.now()).format('L LT') + '</td><td>' + trans_type + '</td><td>' + trans_badge + '&nbsp;' + data.account.cost + ' ' + init_misc_hash.currency + '</td></tr>');
                $('.taracot-billing-funds').html(data.account.funds);
                dlg_hosting_up.hide();
                UIkit.notify({
                    message: _lang_vars.hosting_prolong_success,
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
                $('#hosting_up_error').html(msg);
                $('#hosting_up_error').fadeIn(500);
            }
        },
        error: function() {
            $('#hosting_up_error').html(_lang_vars.ajax_failed);
            $('#hosting_up_error').fadeIn(500);
        },
        complete: function() {
            $('.taracot-hosting-up-btn').attr('disabled', false);
            $('#btn_hosting_account_update_loading').hide();
        }
    });
};

var btn_domain_add_handler = function() {
    $('.taracot-domain-add-control').each(function() {
        $(this).val('');
        $(this).prop("selectedIndex", 0);
        $(this).removeClass('uk-form-danger');
    });
    $('#domain_add_error').hide();
    $('#dd_ns0').val(init_ns0);
    $('#dd_ns1').val(init_ns1);
    $('#dd_ns0_ip').val(init_ns0_ip);
    $('#dd_ns1_ip').val(init_ns1_ip);
    dlg_domain_add.show();
    dd_plan_change();
    $('#dd_username').focus();
};

var btn_domain_create_handler = function() {
    $('.taracot-domain-add-control').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    $('#domain_add_error').hide();
    // Validation
    var errors = [],
        domain_data = {
            baccount: $.trim($('#dd_username').val().toLowerCase()),
            bplan: $('#dd_plan').val(),
            bns0: $.trim($('#dd_ns0').val()),
            bns0_ip: $.trim($('#dd_ns0_ip').val()),
            bns1: $.trim($('#dd_ns1').val()),
            bns1_ip: $.trim($('#dd_ns1_ip').val()),
        };
    if (!domain_data.baccount || !domain_data.baccount.match(/^[a-z0-9\-]{2,63}$/)) errors.push('#dd_username');
    if (domain_data.bns0_ip && !domain_data.bns0_ip.match(/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/)) errors.push('#dd_ns0_ip');
    if (domain_data.bns1_ip && !domain_data.bns1_ip.match(/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/)) errors.push('#dd_ns1_ip');
    if (!domain_data.bns0 || !domain_data.bns0.match(/^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})$/)) errors.push('#dd_ns0');
    if (!domain_data.bns1 || !domain_data.bns1.match(/^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,6}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,3})$/)) errors.push('#dd_ns1');
    if (errors.length) {
        $(errors[0]).focus();
        var err_msg = _lang_vars.form_contains_errors + ' (',
            err_labels = [];
        for (var error in errors) {
            $(errors[error]).addClass('uk-form-danger');
            err_labels.push('"' + $(errors[error]).parent().parent().find('label').text().replace(/\*/, '').trim() + '"');
        }
        err_msg += err_labels.join(', ') + ')';
        $('#domain_add_error').html(err_msg);
        $('#domain_add_error').fadeIn(500);
        return;
    }
    $('.taracot-domain-add-btn').attr('disabled', true);
    $('#btn_domain_create_loading').show();
    $.ajax({
        type: 'POST',
        url: '/customer/ajax/create/domain',
        data: domain_data,
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                var btn_domain_up = '';
                $('#taracot_billing_table_domains > tbody').append('<tr><td>' + data.account.account + '.' + data.account.plan + '</td><td style="text-align:center" id="billing_de_' + data.account.account + '">' + moment(data.account.days).format('L') + '</td><td>' + btn_domain_up + '</td></tr>');
                // $('.taracot-btn-domain-up').unbind();
                // $('.taracot-btn-domain-up').click(taracot_btn_domain_up_handler);
                var trans_type = transactions_i18n.domain_reg + ' (' + data.account.account + '.' + data.account.plan + ')',
                    trans_badge = '<div class="uk-badge uk-badge-notification uk-badge-danger billing-trans-badge"><i class="uk-icon-minus"></i></div>';
                $('#taracot_billing_table_transactions > tbody').prepend('<tr><td>' + moment(Date.now()).format('L LT') + '</td><td>' + trans_type + '</td><td>' + trans_badge + '&nbsp;' + data.account.cost + ' ' + init_misc_hash.currency + '</td></tr>');
                $('.taracot-billing-funds').html(data.account.funds);
                dlg_domain_add.hide();
                UIkit.notify({
                    message: _lang_vars.domain_add_success,
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
                $('#domain_add_error').html(msg);
                $('#domain_add_error').fadeIn(500);
            }
        },
        error: function() {
            $('#domain_add_error').html(_lang_vars.ajax_failed);
            $('#domain_add_error').fadeIn(500);
        },
        complete: function() {
            $('.taracot-domain-add-btn').attr('disabled', false);
            $('#btn_domain_create_loading').hide();
        }
    });
};

/*******************************************************************

 document.ready

********************************************************************/

$(document).ready(function() {
    moment.lang(current_locale);
    if (init_hosting)
        for (var hi in init_hosting) hosting_plan_hash[init_hosting[hi].id] = init_hosting[hi][current_locale];
    for (var ms = 1; ms <= 12; ms++) {
        $('#dh_months').append('<option value="' + ms + '">' + ms + '</option>');
        $('#dhp_months').append('<option value="' + ms + '">' + ms + '</option>');
    }
    for (var sp in init_hosting)
        $('#dh_plan').append('<option value="' + init_hosting[sp].id + '">' + init_hosting[sp][current_locale] + ' (' + init_hosting[sp].price + ' ' + init_misc_hash.currency + ' ' + _lang_vars.per_month + ')</option>');
    for (var sd in init_domains)
        $('#dd_plan').append('<option value="' + init_domains[sd].id + '">' + init_domains[sd].id.toUpperCase() + ' (' + init_domains[sd].reg + ' ' + init_misc_hash.currency + ' ' + _lang_vars.per_year + ')</option>');
    for (var ai in init_accounts) {
        var btn_host_up = '<button class="uk-button uk-button-mini uk-button-success taracot-btn-hosting-up" id="_ha_' + init_accounts[ai].baccount + '_' + init_accounts[ai].bplan + '"><i class="uk-icon-plus"></i></button>';
        if (init_accounts[ai].btype == 'h') {
            init_hosting_count++;
            $('#taracot_billing_table_hosting > tbody').append('<tr><td>' + init_accounts[ai].baccount + '</td><td style="text-align:center">' + hosting_plan_hash[init_accounts[ai].bplan] + '</td><td style="text-align:center" id="billing_days_' + init_accounts[ai].baccount + '">' + init_accounts[ai].bexp + '</td><td>' + btn_host_up + '</td></tr>');
        }
        if (init_accounts[ai].btype == 'd') {
            init_domains_count++;
            $('#taracot_billing_table_domains > tbody').append('<tr><td>' + init_accounts[ai].baccount + '.' + init_accounts[ai].bplan + '</td><td style="text-align:center">' + moment(parseInt(init_accounts[ai].bexp)).format('L') + '</td><td></td></tr>');
        }
    }
    if (!init_hosting_count) $('#taracot_billing_table_hosting > tbody').html('<tr><td colspan="4">' + _lang_vars.no_records + '</td></tr>');
    if (!init_domains_count) $('#taracot_billing_table_domains > tbody').html('<tr><td colspan="3">' + _lang_vars.no_records + '</td></tr>');
    if (!init_transactions.length) {
        $('#taracot_billing_table_transactions > tbody').html('<tr><td colspan="4">' + _lang_vars.no_records + '</td></tr>');
    } else {
        for (var it in init_transactions) {
            var trans_type = transactions_i18n[init_transactions[it].trans_type],
                trans_badge = '<div class="uk-badge uk-badge-notification uk-badge-success billing-trans-badge"><i class="uk-icon-plus"></i></div>';
            if (init_transactions[it].trans_obj) trans_type += ' (' + init_transactions[it].trans_obj + ')';
            if (init_transactions[it].trans_sum <= 0) trans_badge = '<div class="uk-badge uk-badge-notification uk-badge-danger billing-trans-badge"><i class="uk-icon-minus"></i></div>';
            $('#taracot_billing_table_transactions > tbody').append('<tr><td>' + moment(parseInt(init_transactions[it].trans_timestamp)).format('L LT') + '</td><td>' + trans_type + '</td><td>' + trans_badge + '&nbsp;' + init_transactions[it].trans_sum + ' ' + init_misc_hash.currency + '</td></tr>');
        }
    }
    if (navigator.language) {
        var _country = navigator.language;
        if (navigator.language.length > 2) _country = navigator.language.slice(-2);
        $('#country').val(_country);
    }
    $('.taracot-dp-field').each(function() {
        var id = $(this).attr('id');
        if (init_profile_data[id]) $('#' + id).val(init_profile_data[id]);
    });
    // Set handlers
    $('#btn_billing_profile_save').click(btn_billing_profile_save_handler);
    $('#btn_hosting_add').click(btn_hosting_add_handler);
    $('.taracot-hosting-add-calc-field').change(dh_plan_months_change);
    $('#dhp_months').change(dhp_months_change);
    $('#btn_hosting_account_create').click(btn_hosting_account_create_handler);
    $('.taracot-btn-hosting-up').click(taracot_btn_hosting_up_handler);
    $('#btn_hosting_account_update').click(btn_hosting_account_update_handler);
    $('#btn_domain_add').click(btn_domain_add_handler);
    $('#dd_plan').change(dd_plan_change);
    $('#btn_domain_create').click(btn_domain_create_handler);
    // Bind Enter key
    $('.taracot-form-profile-control').bind('keypress', function(e) {
        if (submitOnEnter(e) && $('#btn_billing_profile_save').is(':enabled')) {
            $('html,body').animate({
                    scrollTop: $("#btn_billing_profile_save").offset().top - 20
                },
                'slow');
            $('#btn_billing_profile_save').click();
        }
    });
    $('.taracot-hosting-add-control').bind('keypress', function(e) {
        if (submitOnEnter(e) && $('#btn_hosting_account_create').is(':enabled'))
            $('#btn_hosting_account_create').click();
    });
});
