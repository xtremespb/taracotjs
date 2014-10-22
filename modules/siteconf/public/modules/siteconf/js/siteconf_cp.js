$.loadingIndicator();

$('#btn_save').click(function() {
    $.loadingIndicator('show');
    var siteconf_mode = 'public',
        siteconf_authn = 'opt';
    if ($('#siteconf_mode_private').hasClass('uk-active')) siteconf_mode = 'private';
    if ($('#siteconf_mode_invites').hasClass('uk-active')) siteconf_mode = 'invites';
    if ($('#siteconf_mode_maintenance').hasClass('uk-active')) siteconf_mode = 'maintenance';
    if ($('#siteconf_authn_mnd').hasClass('uk-active')) siteconf_authn = 'mnd';
    var siteconf_metadata = [],
        _cnt = 0,
        _itm = 0,
        _ai = {};
    $('#siteconf_metadata_tb  > tr > td').each(function() {
        if (_cnt === 0) {
            if (_itm === 0) _ai.id = 'site_title';
            if (_itm === 1) _ai.id = 'site_keywords';
            if (_itm === 2) _ai.id = 'site_description';
        }
        if (_cnt > 0 && _cnt <= locales.length) _ai[locales[_cnt - 1]] = $(this).children().first().val();
        _cnt++;
        if (_cnt > locales.length) {
            siteconf_metadata.push(_ai);
            _cnt = 0;
            _itm++;
            _ai = {};
            return;
        }
    });
    $.ajax({
        type: 'POST',
        url: '/cp/siteconf/config/save',
        data: {
            mode: siteconf_mode,
            authn: siteconf_authn,
            metadata: siteconf_metadata
        },
        dataType: "json",
        success: function(data) {
            $.loadingIndicator('hide');
            if (data.status && data.status == 1) {
                $.UIkit.notify({
                    message: _lang_vars.save_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
            } else {
                $.UIkit.notify({
                    message: _lang_vars.ajax_failed,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
            $.loadingIndicator('hide');
            $.UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
});

$(document).ready(function() {
    $('.taracot-siteconf-mode').removeClass('uk-active');
    $('.taracot-siteconf-authn').removeClass('uk-active');
    $('#siteconf_mode_public').click();
    $('#siteconf_authn_opt').click();
    if (init_mode == 'private') $('#siteconf_mode_private').click();
    if (init_mode == 'invites') $('#siteconf_mode_invites').click();
    if (init_mode == 'maintenance') $('#siteconf_mode_maintenance').click();
    if (init_authn == 'mnd') $('#siteconf_authn_mnd').click();
});
