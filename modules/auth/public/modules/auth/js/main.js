var captcha_loading = false;

var load_captcha = function() {
    if (typeof captcha_type != 'undefined' && captcha_type == 'png') {
        $('#auth_captcha_img').attr('src', '/auth/captcha?rnd=' + Math.random().toString().replace('.', ''));
        return;
    }
    if (captcha_loading) {
        return;
    }
    captcha_loading = true;
    $.ajax({
        type: 'POST',
        url: '/auth/captcha',
        data: {},
        dataType: "json",
        success: function (data) {
            captcha_loading = false;
            if (data.img) {                
                $('#auth_captcha_img').attr('src', 'data:image/jpeg;base64,' + data.img);
            } else {
                $.UIkit.notify({
                    message: _lang_vars.ajax_failed,
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
            captcha_loading = false;
        }
    });
};

$('#auth_captcha_img').click(load_captcha);

// Login button is clicked
$('#auth_login').click(function () {
    $('.taracot-auth-field').removeClass('uk-form-danger');
    if (!$('#auth_username').val().match(/^[A-Za-z0-9_\-]{3,20}$/)) {
        $('#auth_username').addClass('uk-form-danger');
        $('#auth_username').focus();
        $.UIkit.notify({
            message: _lang_vars.invalid_username_syntax,
            status: 'danger',
            timeout: 2000,
            pos: 'top-center'
        });
        return;
    }
    if (!$('#auth_password').val().match(/^.{5,20}$/)) {
        $('#auth_password').addClass('uk-form-danger');
        $('#auth_password').focus();
        $.UIkit.notify({
            message: _lang_vars.invalid_password_syntax,
            status: 'danger',
            timeout: 2000,
            pos: 'top-center'
        });
        return;
    }
    if (!$('#auth_captcha').val().match(/^[0-9]{4}$/)) {
        $('#auth_captcha').addClass('uk-form-danger');
        $('#auth_captcha').focus();
        $.UIkit.notify({
            message: _lang_vars.invalid_captcha,
            status: 'danger',
            timeout: 2000,
            pos: 'top-center'
        });
        return;
    }
    $.ajax({
        type: 'POST',
        url: '/auth/process',
        data: {
            username: $('#auth_username').val(),
            password: $('#auth_password').val(),
            captcha: $('#auth_captcha').val()
        },
        dataType: "json",
        success: function (data) {
            if (data.result != 1) {
                $('#auth_captcha').val('');
                if (data.field) {
                    $('#' + data.field).addClass('uk-form-danger');
                    $('#' + data.field).focus();
                }
                if (data.error) {
                    $.UIkit.notify({
                        message: data.error,
                        status: 'danger',
                        timeout: 2000,
                        pos: 'top-center'
                    });
                }
                load_captcha();
            } else {
                $('#auth_captcha').val('');
                $('#auth_box_wrap').addClass('uk-hidden');
                $('#wait_box_wrap').removeClass('uk-hidden');
                location.href = redirect_url + "?rnd=" + Math.random().toString().replace('.', '');
            }
        },
        error: function () {
            $.UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
            load_captcha();
        }
    })
});

// Bind <Enter> key to form input fields

$('.taracot-auth-field').bind('keypress', function (e) {
    if (submitOnEnter(e)) {
        $('#auth_login').click();
        e.preventDefault();
    }
});

// Focus first input field by default

$('#auth_username').focus();

// Load captcha image

$(document).ready(function () {
    load_captcha();
});