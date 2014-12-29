$.loadingIndicator();

$('#btn_area_add').click(function() {
    var tr = '<tr class="uk-form"><td><input type="text" class="uk-width-1-1"></td>';
    for (var i = 0; i < locales.length; i++) tr += '<td><input type="text" class="uk-width-1-1"></td>';
    tr += '<td style="text-align:right"><button class="uk-button uk-button-danger taracot-blog-area-delete"><i class="uk-icon-trash-o"></i></button></td></tr>';
    $('#blog_areas_tb').append(tr);
    $('.taracot-blog-area-delete').unbind();
    $('.taracot-blog-area-delete').click(btn_taracot_area_delete_handler);
    $('#blog_areas').show();
});

var btn_taracot_area_delete_handler = function() {
    if (confirm(_lang_vars.confirm_delete_area)) $(this).parent().parent().remove();
    if ($('#blog_areas tr').length > 1) {
        $('#blog_areas').show();
    } else {
        $('#blog_areas').hide();
    }
};

$('#btn_save').click(function() {
    $.loadingIndicator('show');
    var blog_mode = '';
    if ($('#blog_mode_private').hasClass('uk-active')) blog_mode = 'private';
    if ($('#blog_mode_moderation').hasClass('uk-active')) blog_mode = 'moderation';
    if ($('#blog_mode_public').hasClass('uk-active')) blog_mode = 'public';
    var blog_areas = [],
        _cnt = 0,
        _ai = {};
    $('#blog_areas_tb  > tr > td').each(function() {
        if (_cnt === 0) _ai.id = $(this).children().first().val();
        if (_cnt > 0 && _cnt <= locales.length) _ai[locales[_cnt - 1]] = $(this).children().first().val();
        if (_cnt > locales.length) {
            blog_areas.push(_ai);
            _cnt = 0;
            _ai = {};
            return;
        }
        _cnt++;
    });
    $.ajax({
        type: 'POST',
        url: '/cp/blog/config/save',
        data: {
            mode: blog_mode,
            areas: blog_areas
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

$(document).ready(function() {
    $('#blog_areas_tb  > tr').each(function() {
        $(this).remove();
    });
    $('.taracot-blog-mode').removeClass('uk-active');
    $('#blog_mode_private').click();
    if (init_mode == 'private') $('#blog_mode_private').click();
    if (init_mode == 'moderation') $('#blog_mode_moderation').click();
    if (init_mode == 'public') $('#blog_mode_public').click();
    for (var i = 0; i < init_areas.length; i++) $('#btn_area_add').click();
    var _cnt = 0,
        _gc = 0;
    $('#blog_areas_tb  > tr > td').each(function() {
        var _ai = init_areas[_gc];
        if (_ai) {
            if (_cnt === 0) $(this).children().first().val(_ai.id);
            if (_cnt > 0 && _cnt <= locales.length) $(this).children().first().val(_ai[locales[_cnt - 1]]);
        }
        if (_cnt > locales.length) {
            _cnt = 0;
            _gc++;
            return;
        }
        _cnt++;
    });
});
