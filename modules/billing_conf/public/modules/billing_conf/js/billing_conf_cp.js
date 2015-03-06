$.loadingIndicator();

$('#btn_hosting_add').click(function() {
    var tr = '<tr class="uk-form"><td><input type="text" class="uk-width-1-1"></td><td><input type="text" class="uk-width-1-1"></td>';
    for (var i = 0; i < locales.length; i++) tr += '<td><input type="text" class="uk-width-1-1"></td>';
    tr += '<td style="width:40px"><button class="uk-button uk-button-danger taracot-billing_conf-hosting-delete"><i class="uk-icon-trash-o"></i></button>&nbsp;<button class="uk-button taracot-btn-hosting-sort"><i class="uk-icon uk-icon-unsorted"></i></button></td></tr>';
    $('#billing_conf_hosting_tb').append(tr);
    $('.taracot-billing_conf-hosting-delete').unbind();
    $('.taracot-billing_conf-hosting-delete').click(btn_taracot_hosting_delete_handler);
    $('#billing_conf_hosting').show();
    UIkit.sortable($('#billing_conf_hosting_tb'), {
        dragCustomClass: 'uk-form',
        handleClass: 'taracot-btn-hosting-sort'
    });
});

$('#btn_domains_add').click(function() {
    var tr = '<tr class="uk-form"><td><input type="text" class="uk-width-1-1"></td><td><input type="text" class="uk-width-1-1"></td><td><input type="text" class="uk-width-1-1"></td>';
    tr += '<td style="width:40px"><button class="uk-button uk-button-danger taracot-billing_conf-domains-delete"><i class="uk-icon-trash-o"></i></button>&nbsp;<button class="uk-button taracot-btn-domains-sort"><i class="uk-icon uk-icon-unsorted"></i></button></td></tr>';
    $('#billing_conf_domains_tb').append(tr);
    $('.taracot-billing_conf-domains-delete').unbind();
    $('.taracot-billing_conf-domains-delete').click(btn_taracot_domains_delete_handler);
    $('#billing_conf_domains').show();
    UIkit.sortable($('#billing_conf_domains_tb'), {
        dragCustomClass: 'uk-form',
        handleClass: 'taracot-btn-domains-sort'
    });
});

var btn_taracot_hosting_delete_handler = function() {
    if (confirm(_lang_vars.confirm_delete_descitem)) $(this).parent().parent().remove();
    if ($('#billing_conf_hosting tr').length > 1) {
        $('#billing_conf_hosting').show();
    } else {
        $('#billing_conf_hosting').hide();
    }
};

var btn_taracot_domains_delete_handler = function() {
    if (confirm(_lang_vars.confirm_delete_descitem)) $(this).parent().parent().remove();
    if ($('#billing_conf_domains tr').length > 1) {
        $('#billing_conf_domains').show();
    } else {
        $('#billing_conf_domains').hide();
    }
};

var taracot_billing_colitem_del_handler = function() {
    $(this).parent().parent().remove();
};

$('#btn_save').click(function() {
    $.loadingIndicator('show');
    var hosting = _get_hosting_array(),
        domains = _get_domains_array(),
        misc = _get_misc_array();
    $.ajax({
        type: 'POST',
        url: '/cp/billing_conf/config/save',
        data: {
            hosting: hosting,
            domains: domains,
            misc: misc
        },
        dataType: "json",
        success: function(data) {
            $.loadingIndicator('hide');
            if (data.status && data.status == 1) {
                UIkit.notify({
                    message: _lang_vars.save_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
            } else {
                UIkit.notify({
                    message: _lang_vars.ajax_failed,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
            $.loadingIndicator('hide');
            UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
});

var _get_hosting_array = function() {
    var hosting = [],
        _cnt = 0,
        _ai = {};
    $('#billing_conf_hosting_tb  > tr > td').each(function() {
        if (_cnt === 0) _ai.id = $(this).children().first().val();
        if (_cnt === 1) _ai.price = $(this).children().first().val();
        if (_cnt > 1 && _cnt <= locales.length + 1) _ai[locales[_cnt - 2]] = $(this).children().first().val();
        if (_cnt > locales.length + 1) {
            hosting.push(_ai);
            _cnt = 0;
            _ai = {};
            return;
        }
        _cnt++;
    });
    return hosting;
};

var _get_domains_array = function() {
    var domains = [],
        _cnt = 0,
        _ai = {};
    $('#billing_conf_domains_tb  > tr > td').each(function() {
        if (_cnt === 0) _ai.id = $(this).children().first().val();
        if (_cnt === 1) _ai.reg = $(this).children().first().val();
        if (_cnt === 2) _ai.up = $(this).children().first().val();
        if (_cnt > 2) {
            domains.push(_ai);
            _cnt = 0;
            _ai = {};
            return;
        }
        _cnt++;
    });
    return domains;
};

var _get_misc_array = function() {
    var misc = [],
        _cnt = 0,
        _ai = {},
        _gc = 0;
    $('#billing_conf_misc_tb  > tr > td').each(function() {
        if (_cnt === 0) {
            if (_gc === 0) _ai.id = 'currency';
        }
        if (_cnt > 0 && _cnt <= locales.length) _ai[locales[_cnt - 1]] = $(this).children().first().val();
        if (_cnt >= locales.length) {
            misc.push(_ai);
            _cnt = 0;
            _ai = {};
            _gc++;
            return;
        }
        _cnt++;
    });
    return misc;
};


$(document).ready(function() {
    if (init_hosting)
        for (var s = 0; s < init_hosting.length; s++) $('#btn_hosting_add').click();
    if (init_domains)
        for (var d = 0; d < init_domains.length; d++) $('#btn_domains_add').click();
    var _cnt = 0,
        _gc = 0;
    $('#billing_conf_hosting_tb  > tr > td').each(function() {
        var _ai = init_hosting[_gc];
        if (_ai) {
            if (!_ai.price) _ai.price = '';
            if (_cnt === 0) $(this).children().first().val(_ai.id);
            if (_cnt === 1) $(this).children().first().val(_ai.price);
            if (_cnt > 1 && _cnt <= locales.length + 1) $(this).children().first().val(_ai[locales[_cnt - 2]]);
        }
        if (_cnt > locales.length + 1) {
            _cnt = 0;
            _gc++;
            return;
        }
        _cnt++;
    });
    _cnt = 0;
    _gc = 0;
    $('#billing_conf_domains_tb  > tr > td').each(function() {
        var _ai = init_domains[_gc];
        if (_ai) {
            if (!_ai.reg) _ai.reg = 0;
            if (!_ai.up) _ai.up = 0;
            if (_cnt === 0) $(this).children().first().val(_ai.id);
            if (_cnt === 1) $(this).children().first().val(_ai.reg);
            if (_cnt === 2) $(this).children().first().val(_ai.up);
        }
        if (_cnt > 2) {
            _cnt = 0;
            _gc++;
            return;
        }
        _cnt++;
    });
    _cnt = 0;
    _gc = 0;
    $('#billing_conf_misc_tb  > tr > td').each(function() {
        var _ai = init_misc[_gc];
        if (_ai) if (_cnt > 0 && _cnt <= locales.length) $(this).children().first().val(_ai[locales[_cnt - 1]]);
        if (_cnt > locales.length) {
            _cnt = 0;
            _gc++;
            return;
        }
        _cnt++;
    });

});
