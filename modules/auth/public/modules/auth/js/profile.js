var dlg_password = new $.UIkit.modal("#dlg_password");
var dlg_email = new $.UIkit.modal("#dlg_email");
var dlg_realname = new $.UIkit.modal("#dlg_realname");
var uploader;

$('#btn_password').click(function() {
    dlg_password.show();
    pc_password_event_input();
    $('#taracot_pc_loading').hide();
    $('#dlg_password_form_wrap').show();
    $('#taracot_pc_error').hide();
    $('.taracot_pc_field').each(function() {
        $(this).val('');
        $(this).removeClass('uk-form-danger');
    });
    $('#password_current').focus();
});

var pc_password_event_input = function() {
    var ps = evalPassword($('#pc_password').val());
    var str = (ps + 1) * 20;
    $('#pc_password_strength').css('width', str + '%');
    $('#pc_password_strength').html(_lang_vars['password_strength_' + ps]);
    $('#pc_password_strength').parent().removeClass('uk-progress-success');
    $('#pc_password_strength').parent().removeClass('uk-progress-warning');
    console.log($('#pc_password_strength').parent());
    $('#pc_password_strength').parent().removeClass('uk-progress-danger');
    if (ps <= 1) $('#pc_password_strength').parent().addClass('uk-progress-danger');
    if (ps == 2 || ps == 3) $('#pc_password_strength').parent().addClass('uk-progress-warning');
    if (ps == 4) $('#pc_password_strength').parent().addClass('uk-progress-success');
    $('#pc_password_match').css('color', '#eee');
    if (ps > 0 && $('#pc_password').val() == $('#pc_password_repeat').val()) $('#pc_password_match').css('color', '#9fd256');
};

var pc_password_repeat_event_input = function() {
    var ps = evalPassword($('#pc_password').val());
    $('#pc_password_match').css('color', '#eee');
    if (ps > 0 && $('#pc_password').val() == $('#pc_password_repeat').val()) $('#pc_password_match').css('color', '#9fd256');
};

$('#pc_password').on('input', pc_password_event_input);
$('#pc_password_repeat').on('input', pc_password_repeat_event_input);

$('#btn_pc_save').click(function() {
    $('.taracot_pc_field').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    if (!$('#password_current').val().match(/^.{5,80}$/)) {
        $('#password_current').addClass('uk-form-danger');
        $('#password_current').focus();
        $('#taracot_pc_error').html(_lang_vars.invalid_current_password_syntax);
        $('#taracot_pc_error').show();
        return;
    }
    if (!$('#pc_password').val().match(/^.{8,80}$/) || $('#pc_password').val() != $('#pc_password_repeat').val()) {
        $('#pc_password').addClass('uk-form-danger');
        $('#pc_password_repeat').addClass('uk-form-danger');
        $('#pc_password').focus();
        $('#taracot_pc_error').html(_lang_vars.invalid_password_syntax);
        $('#taracot_pc_error').show();
        return;
    }
    $('#taracot_pc_loading').show();
    $('#dlg_password_form_wrap').hide();
    $('#taracot_pc_error').hide();
    dlg_allow_close(false);
    $.ajax({
        type: 'POST',
        url: '/auth/profile/process',
        data: {
            password: $('#password_current').val(),
            password_new: $('#pc_password').val()
        },
        dataType: "json",
        success: function(data) {
            dlg_allow_close(true);
            if (data.result != 1) {
                $('#taracot_pc_loading').hide();
                $('#dlg_password_form_wrap').show();
                if (data.field) {
                    $('#' + data.field).addClass('uk-form-danger');
                    $('#' + data.field).focus();
                }
                if (data.error) {
                    $('#taracot_pc_error').html(data.error);
                } else {
                    $('#taracot_pc_error').html(_lang_vars.ajax_failed);
                }
                $('#taracot_pc_error').show();
            } else {
                dlg_password.hide();
                $.UIkit.notify({
                    message: _lang_vars.password_saved,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
            dlg_allow_close(true);
            $('#taracot_pc_loading').hide();
            $('#dlg_password_form_wrap').show();
            $('#taracot_pc_error').html(_lang_vars.ajax_failed);
            $('#taracot_pc_error').show();
            $('#password_current').focus();
        }
    });
});

$('.taracot_pc_field').bind('keypress', function(e) {
    if (submitOnEnter(e)) {
        $('#btn_pc_save').click();
    }
});

$('#btn_email').click(function() {
    dlg_email.show();
    $('#taracot_ec_loading').hide();
    $('#dlg_email_form_wrap').show();
    $('#taracot_ec_error').hide();
    $('.taracot_ec_field').each(function() {
        $(this).val('');
        $(this).removeClass('uk-form-danger');
    });
    $('#ec_email').focus();
});

$('#btn_ec_save').click(function() {
    $('.taracot_ec_field').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    if (!$('#ec_email').val().match(/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/)) {
        $('#ec_email').addClass('uk-form-danger');
        $('#ec_email').focus();
        $('#taracot_ec_error').html(_lang_vars.invalid_email_syntax);
        $('#taracot_ec_error').show();
        return;
    }
    if (!$('#ec_password_current').val().match(/^.{5,80}$/)) {
        $('#ec_password_current').addClass('uk-form-danger');
        $('#ec_password_current').focus();
        $('#taracot_ec_error').html(_lang_vars.invalid_current_password_syntax);
        $('#taracot_ec_error').show();
        return;
    }
    $('#taracot_ec_loading').show();
    $('#dlg_email_form_wrap').hide();
    $('#taracot_ec_error').hide();
    dlg_allow_close(false);
    $.ajax({
        type: 'POST',
        url: '/auth/profile/process',
        data: {
            password: $('#ec_password_current').val(),
            email_new: $('#ec_email').val()
        },
        dataType: "json",
        success: function(data) {
            $('#taracot_ec_loading').hide();
            $('#dlg_email_form_wrap').show();
            if (data.result != 1) {
                dlg_allow_close(true);
                if (data.field) {
                    $('#' + data.field).addClass('uk-form-danger');
                    $('#' + data.field).focus();
                }
                if (data.error) {
                    $('#taracot_ec_error').html(data.error);
                } else {
                    $('#taracot_ec_error').html(_lang_vars.ajax_failed);
                }
                $('#taracot_ec_error').show();
            } else {
                $('#dlg_email_form_wrap').html(_lang_vars.email_saved);
                setTimeout(function() {
                    location.href = "/auth/profile?rnd=" + Math.random().toString().replace('.', '');
                }, 3000);
            }
        },
        error: function() {
            dlg_allow_close(true);
            $('#taracot_ec_loading').hide();
            $('#dlg_email_form_wrap').show();
            $('#taracot_ec_error').html(_lang_vars.ajax_failed);
            $('#taracot_ec_error').show();
            $('#ec_password_current').focus();
        }
    });
});

$('.taracot_ec_field').bind('keypress', function(e) {
    if (submitOnEnter(e)) {
        $('#btn_ec_save').click();
    }
});

$('#btn_realname').click(function() {
    dlg_realname.show();
    $('#taracot_rn_loading').hide();
    $('#dlg_realname_form_wrap').show();
    $('#taracot_rn_error').hide();
    $('.taracot_rn_field').each(function() {
        $(this).val('');
        $(this).removeClass('uk-form-danger');
    });
    $('#rn_realname').val(auth_realname);
    $('#rn_realname').select();
    $('#rn_realname').focus();
});

$('#btn_rn_save').click(function() {
    $('.taracot_rn_field').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    if (!$('#rn_realname').val().match(/^.{1,40}$/)) {
        $('#rn_realname').addClass('uk-form-danger');
        $('#rn_realname').focus();
        $('#taracot_rn_error').html(_lang_vars.invalid_realname_syntax);
        $('#taracot_rn_error').show();
        return;
    }
    if (!$('#rn_password_current').val().match(/^.{5,80}$/)) {
        $('#rn_password_current').addClass('uk-form-danger');
        $('#rn_password_current').focus();
        $('#taracot_rn_error').html(_lang_vars.invalid_current_password_syntax);
        $('#taracot_rn_error').show();
        return;
    }
    $('#taracot_rn_loading').show();
    $('#dlg_email_form_wrap').hide();
    $('#taracot_rn_error').hide();
    dlg_allow_close(false);
    $.ajax({
        type: 'POST',
        url: '/auth/profile/process',
        data: {
            password: $('#rn_password_current').val(),
            realname: $('#rn_realname').val()
        },
        dataType: "json",
        success: function(data) {
            $('#taracot_rn_loading').hide();
            $('#dlg_email_form_wrap').show();
            if (data.result != 1) {
                dlg_allow_close(true);
                if (data.field) {
                    $('#' + data.field).addClass('uk-form-danger');
                    $('#' + data.field).focus();
                }
                if (data.error) {
                    $('#taracot_rn_error').html(data.error);
                } else {
                    $('#taracot_rn_error').html(_lang_vars.ajax_failed);
                }
                $('#taracot_rn_error').show();
            } else {
                dlg_realname.hide();
                if (data.realname) {
                	$('#profile_realname').html(data.realname);
                	auth_realname = data.realname;
                } else {
                	$('#profile_realname').html('');
                	auth_realname = '';
                }
                $.UIkit.notify({
                    message: _lang_vars.realname_saved,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
            dlg_allow_close(true);
            $('#taracot_rn_loading').hide();
            $('#dlg_email_form_wrap').show();
            $('#taracot_rn_error').html(_lang_vars.ajax_failed);
            $('#taracot_rn_error').show();
            $('#rn_password_current').focus();
        }
    });
});

$('.taracot_rn_field').bind('keypress', function(e) {
    if (submitOnEnter(e)) {
        $('#btn_rn_save').click();
    }
});

$('#btn_logout').click(function() {
	location.href = '/auth/logout?rnd=' + Math.random().toString().replace('.', '');
});

$('#profile_set_avatar').click(function() {});

var dlg_allow_close = function(val) {
    dlg_password.options.bgclose = val;
    dlg_password.options.keyboard = val;
    dlg_email.options.bgclose = val;
    dlg_email.options.keyboard = val;
    dlg_realname.options.bgclose = val;
    dlg_realname.options.keyboard = val;
};

var uploader_init = function() {
    uploader = new plupload.Uploader({
        runtimes: 'html5,flash,silverlight,html4',
        browse_button: 'profile_set_avatar',
        drop_element: "profile_set_avatar_dnd",
        url: '/auth/profile/process',
        flash_swf_url: '/js/plupload/moxie.swf',
        silverlight_xap_url: '/js/plupload/moxie.xap',
        filters: {
            max_file_size: '3mb',
            mime_types: [{
                title: "Image files",
                extensions: "jpg,jpeg,png"
            }]
        },
        multi_selection: false
    });
    uploader.init();
    uploader.bind('FilesAdded', function(up, files) {
    	uploader.start();
    });
    uploader.bind('Error', function(up, err) {
    	taracot_progress_indicator('body', false);
    	$.UIkit.notify({
            message: err.message,
            status: 'danger',
            timeout: 2000,
            pos: 'top-center'
        });
    });
    uploader.bind('UploadProgress', function(up, file) {
    	taracot_progress_indicator('body', true);
    });
    uploader.bind('FileUploaded', function(upldr, file, object) {
    	taracot_progress_indicator('body', false);
        var data;
        try {
            data = eval(object.response);
        } catch (err) {
            data = eval('(' + object.response + ')');
        }
        if (data) {
            if (data.result === 0) {
                if (data.error) {
                	$.UIkit.notify({
			            message: data.error,
			            status: 'danger',
			            timeout: 2000,
			            pos: 'top-center'
			        });
                }
            }
            if (data.result == 1 && data.avatar_id) {
            	$('#profile_avatar').attr('src', '/images/avatars/' + data.avatar_id + '.jpg');
            }
        }
    });
};

var taracot_progress_indicator = function(sel, show) {
	if (show) {
		var destination = $(sel).offset();
		$('.taracot-progress').css({
			top: destination.top,
			left: destination.left,
			width: $(sel).width(),
			height: $(sel).height()
		});
		$('.taracot-progress').show();
	} else {
		$('.taracot-progress').hide();
	}
};

$(document).ready(function() {
    uploader_init();
});
