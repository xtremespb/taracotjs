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
		success: function(data) {
			captcha_loading = false;
			if (data.img) {
				$('#auth_captcha_img').attr('src', 'data:image/jpeg;base64,' + data.img);
			} else {
				$('#taracot-login-error').html(_lang_vars.ajax_failed);
				$('#taracot-login-error').show();
			}
		},
		error: function() {
			$('#taracot-login-error').html(_lang_vars.ajax_failed);
			$('#taracot-login-error').show();
			captcha_loading = false;
		}
	});
};

$('#auth_captcha_img').click(load_captcha);

// Login button is clicked
$('#btn_login').click(function() {
	$('#taracot-login-error').hide();
	$('.taracot-auth-field').removeClass('uk-form-danger');
	if (!$('#auth_username').val().match(/^[A-Za-z0-9_\-]{3,20}$/)) {
		$('#auth_username').addClass('uk-form-danger');
		$('#auth_username').focus();
		$('#taracot-login-error').html(_lang_vars.invalid_username_syntax);
		$('#taracot-login-error').show();
		return;
	}
	if (!$('#auth_password').val().match(/^.{5,20}$/)) {
		$('#auth_password').addClass('uk-form-danger');
		$('#auth_password').focus();
		$('#taracot-login-error').html(_lang_vars.invalid_password_syntax);
		$('#taracot-login-error').show();
		return;
	}
	if (captcha_req && !$('#auth_captcha').val().match(/^[0-9]{4}$/)) {
		$('#auth_captcha').addClass('uk-form-danger');
		$('#auth_captcha').focus();
		$('#taracot-login-error').html(_lang_vars.invalid_captcha);
		$('#taracot-login-error').show();
		return;
	}
	$('#auth_wrap').hide();
	$('#auth_loading').show();
	$.ajax({
		type: 'POST',
		url: '/auth/process',
		data: {
			username: $('#auth_username').val(),
			password: $('#auth_password').val(),
			captcha: $('#auth_captcha').val()
		},
		dataType: "json",
		success: function(data) {
			if (data.result != 1) {
				$('#auth_captcha').val('');
				if (data.field) {
					$('#' + data.field).addClass('uk-form-danger');
					$('#' + data.field).focus();
				}
				$('#captcha_div').show();
				captcha_req = true;
				if (data.error) {
					$('#taracot-login-error').html(data.error);
					$('#taracot-login-error').show();
				}
				$('#auth_wrap').show();
				$('#auth_loading').hide();
				load_captcha();
			} else {
				$('#auth_form').hide();
				location.href = redirect_url + "?rnd=" + Math.random().toString().replace('.', '');
			}
		},
		error: function() {
			$('#auth_wrap').show();
			$('#auth_loading').hide();
			$('#taracot-login-error').html(_lang_vars.ajax_failed);
			$('#taracot-login-error').show();
			load_captcha();
		}
	});
});

// Bind <Enter> key to form input fields

$('.taracot-auth-field').bind('keypress', function(e) {
	if (submitOnEnter(e)) {
		$('#btn_login').click();
		e.preventDefault();
	}
});

// Focus first input field by default

$('#auth_username').focus();

// Load captcha image

$(document).ready(function() {
	load_captcha();
});
