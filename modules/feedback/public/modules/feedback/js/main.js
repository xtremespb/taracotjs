var captcha_loading = false;

var feedback_load_captcha = function() {
    $('#taracot_feedback_captcha').val('');
    if (typeof captcha_type != 'undefined' && captcha_type == 'png') {
        $('#taracot-feedback-captcha').attr('src', '/auth/captcha?rnd=' + Math.random().toString().replace('.', ''));
        return;
    }
    if (captcha_loading) return;
    captcha_loading = true;
    $.ajax({
        type: 'POST',
        url: '/auth/captcha',
        data: {},
        dataType: "json",
        success: function(data) {
            captcha_loading = false;
            if (data.img) {
                $('#taracot-feedback-captcha').attr('src', 'data:image/jpeg;base64,' + data.img);
            } else {
                $('#taracot-feedback-error').html(feedback_lang_vars.ajax_failed);
                $('#taracot-feedback-error').show();
            }
        },
        error: function() {
            $('#taracot-feedback-error').html(feedback_lang_vars.ajax_failed);
            $('#taracot-feedback-error').show();
            captcha_loading = false;
        }
    });
};

$('#taracot-feedback-captcha').click(feedback_load_captcha);

$('#feedback_btn_send_message').click(function() {
    $('#taracot-feedback-error').hide();
    $('.taracot-feedback-field').removeClass('uk-form-danger');
    var fields = [];
    for (var i = 0; i < feedback_form_data.length; i++) {
        var val = $('#taracot_feedback_' + feedback_form_data[i].id).val();
        if (val) val = val.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
        if (feedback_form_data[i].mandatory)
            if (!val) {
                $('#taracot_feedback_' + feedback_form_data[i].id).focus();
                $('#taracot_feedback_' + feedback_form_data[i].id).addClass('uk-form-danger');
                $('#taracot-feedback-error').html(feedback_lang_vars.mandatory_field_empty + ': ' + feedback_form_data[i]['label_' + feedback_current_lang]);
                $('#taracot-feedback-error').show();
                return;
            }
        if (feedback_form_data[i].type == 'email')
            if (val && !val.match(/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/)) {
                $('#taracot_feedback_' + feedback_form_data[i].id).focus();
                $('#taracot_feedback_' + feedback_form_data[i].id).addClass('uk-form-danger');
                $('#taracot-feedback-error').html(feedback_lang_vars.invalid_email + ': ' + feedback_form_data[i]['label_' + feedback_current_lang]);
                $('#taracot-feedback-error').show();
                return;
            }
        fields.push({
            id: feedback_form_data[i].id,
            val: val
        });
    }
    var captcha = $('#taracot_feedback_captcha').val();
    if (captcha) captcha = captcha.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
    if (!captcha || !captcha.match(/^[0-9]{4}$/)) {
        $('#taracot_feedback_captcha').focus();
        $('#taracot_feedback_captcha').addClass('uk-form-danger');
        $('#taracot-feedback-error').html(feedback_lang_vars.invalid_captcha);
        $('#taracot-feedback-error').show();
        return;
    }
    $('#feedback_btn_send_message_normal').hide();
    $('#feedback_btn_send_message_loading').show();
    $('#feedback_btn_send_message').attr('disabled', true);
    $.ajax({
        type: 'POST',
        url: '/feedback/send',
        data: {
            fields: fields,
            captcha: captcha,
            form_data: feedback_form_data,
            form_checksum: feedback_form_checksum
        },
        dataType: "json",
        success: function(data) {
            if (data) {
                if (data.result == '1') {
                    $('#taracot_feedback_form').hide();
                    $('#taracot-feedback-success').show();
                } else {
                    $('.taracot-feedback-field').first().focus();
                    $('#taracot-feedback-error').html(feedback_lang_vars.ajax_failed);
                    if (data.error) $('#taracot-feedback-error').html(data.error);
                    if (data.field) {
                    	$('#taracot_feedback_' + data.field).addClass('uk-form-danger');
                    	$('#taracot_feedback_' + data.field).focus();
                    }
                    $('#taracot-feedback-error').show();
                    feedback_load_captcha();
                }
            }
        },
        error: function() {
            $('.taracot-feedback-field').first().focus();
            $('#taracot-feedback-error').html(feedback_lang_vars.ajax_failed);
            $('#taracot-feedback-error').show();
            feedback_load_captcha();
        },
        complete: function() {
            $('#feedback_btn_send_message_normal').show();
            $('#feedback_btn_send_message_loading').hide();
            $('#feedback_btn_send_message').attr('disabled', false);
        }
    });
});

$('.taracot-feedback-field').bind('keypress', function(e) {
    if (submitOnEnter(e)) {
        $('#feedback_btn_send_message').click();
        e.preventDefault();
    }
});

$(document).ready(function() {
    feedback_load_captcha();
    $('.taracot-feedback-field').first().focus();
});
