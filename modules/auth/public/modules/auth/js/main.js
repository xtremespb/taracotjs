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
    $.ajax({
        type: 'POST',
        url: '/auth/process',
        data: {
            username: $('#auth_username').val(),
            password: $('#auth_password').val()
        },
        dataType: "json",
        success: function (data) {
            if (data.result != 1) {
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
            } else {
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