var captcha_loading = false;

var load_captcha = function() {
	if (typeof captcha_type != 'undefined' && captcha_type == 'png') {
		$('#reg_captcha_img').attr('src', '/auth/captcha?rnd=' + Math.random().toString().replace('.', ''));
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
		success: function(data) {
			captcha_loading = false;
			if (data.img) {
				$('#reg_captcha_img').attr('src', 'data:image/jpeg;base64,' + data.img);
			} else {
				$('#taracot-reg-error').html(_lang_vars.ajax_failed);
				$('#taracot-reg-error').show();
			}
		},
		error: function() {
			$('#taracot-reg-error').html(_lang_vars.ajax_failed);
			$('#taracot-reg-error').show();
			captcha_loading = false;
		}
	});
};

$('#reg_captcha_img').click(load_captcha);

// Login button is clicked
$('#btn_register').click(function() {
	$('#taracot-reg-error').hide();
	$('.taracot-auth-field').removeClass('uk-form-danger');
	if (!$('#reg_username').val().match(/^[A-Za-z0-9_\-]{3,20}$/)) {
		$('#reg_username').addClass('uk-form-danger');
		$('#reg_username').focus();
		$('#taracot-reg-error').html(_lang_vars.invalid_username_syntax);
		$('#taracot-reg-error').show();
		return;
	}
	if (!$('#reg_password').val().match(/^.{5,20}$/) || $('#reg_password').val() != $('#reg_password_repeat').val()) {
		$('#reg_password').addClass('uk-form-danger');
		$('#reg_password').focus();
		$('#taracot-reg-error').html(_lang_vars.invalid_password_syntax);
		$('#taracot-reg-error').show();
		return;
	}
	if (captcha_req && !$('#reg_captcha').val().match(/^[0-9]{4}$/)) {
		$('#reg_captcha').addClass('uk-form-danger');
		$('#reg_captcha').focus();
		$('#taracot-reg-error').html(_lang_vars.invalid_captcha);
		$('#taracot-reg-error').show();
		return;
	}
	if (!$('#reg_email').val().match(/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/)) {
		$('#reg_email').addClass('uk-form-danger');
		$('#reg_email').focus();
		$('#taracot-reg-error').html(_lang_vars.invalid_email_syntax);
		$('#taracot-reg-error').show();
		return;
	}
	$('#reg_wrap').hide();
	$('#reg_loading').show();
	$('#taracot-reg-error').hide();
	$.ajax({
		type: 'POST',
		url: '/auth/register/process',
		data: {
			username: $('#reg_username').val(),
			email: $('#reg_email').val(),
			password: $('#reg_password').val(),
			captcha: $('#reg_captcha').val()
		},
		dataType: "json",
		success: function(data) {
			if (data.result != 1) {
				$('#reg_wrap').show();
				$('#reg_loading').hide();
				$('#reg_captcha').val('');
				if (data.field) {
					$('#' + data.field).addClass('uk-form-danger');
					$('#' + data.field).focus();
				}
				$('#captcha_div').show();
				captcha_req = true;
				if (data.error) {
					$('#taracot-reg-error').html(data.error);
					$('#taracot-reg-error').show();
				}
				load_captcha();
			} else {
				$('#reg_loading').hide();
				$('#reg_success').show();
			}
		},
		error: function() {
			$('#reg_wrap').show();
			$('#reg_loading').hide();
			$('#taracot-reg-error').html(_lang_vars.ajax_failed);
			$('#taracot-reg-error').show();
			load_captcha();
		}
	});
});

// Bind <Enter> key to form input fields

$('.taracot-auth-field').bind('keypress', function(e) {
	if (submitOnEnter(e)) {
		$('#btn_register').click();
		e.preventDefault();
	}
});

// Focus first input field by default

$('#reg_username').focus();

// Load captcha image

$(document).ready(function() {
	load_captcha();
});