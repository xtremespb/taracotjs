var captcha_loading = false;

var load_captcha = function() {
	if (typeof captcha_type != 'undefined' && captcha_type == 'png') {
		$('#reset_captcha_img').attr('src', '/auth/captcha?rnd=' + Math.random().toString().replace('.', ''));
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
				$('#reset_captcha_img').attr('src', 'data:image/jpeg;base64,' + data.img);
			} else {
				$('#taracot-reset-error').html(_lang_vars.ajax_failed);
				$('#taracot-reset-error').show();
			}
		},
		error: function() {
			$('#taracot-reset-error').html(_lang_vars.ajax_failed);
			$('#taracot-reset-error').show();
			captcha_loading = false;
		}
	});
};

$('#reset_captcha_img').click(load_captcha);
$('#reset_captcha').val('');

// Reset button is clicked
$('#btn_reset').click(function() {
	$('#taracot-reset-error').hide();
	$('.taracot-auth-field').removeClass('uk-form-danger');
	if (captcha_req && !$('#reset_captcha').val().match(/^[0-9]{4}$/)) {
		$('#reset_captcha').addClass('uk-form-danger');
		$('#reset_captcha').select();
		$('#reset_captcha').focus();
		$('#taracot-reset-error').html(_lang_vars.invalid_captcha);
		$('#taracot-reset-error').show();
		return;
	}
	if (!$('#reset_email').val().match(/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/)) {
		$('#reset_email').addClass('uk-form-danger');
		$('#reset_email').focus();
		$('#taracot-reset-error').html(_lang_vars.invalid_email_syntax);
		$('#taracot-reset-error').show();
		return;
	}
	$('#reset_wrap').hide();
	$('#reset_loading').show();
	$('#taracot-reset-error').hide();
	$.ajax({
		type: 'POST',
		url: '/auth/reset/process',
		data: {
			email: $('#reset_email').val(),
			captcha: $('#reset_captcha').val()
		},
		dataType: "json",
		success: function(data) {
			if (data.result != 1) {
				$('#reset_wrap').show();
				$('#reset_loading').hide();
				$('#reset_captcha').val('');
				if (data.field) {
					$('#' + data.field).addClass('uk-form-danger');
					$('#' + data.field).select();
					$('#' + data.field).focus();
				}
				$('#captcha_div').show();
				captcha_req = true;
				if (data.error) {
					$('#taracot-reset-error').html(data.error);
					$('#taracot-reset-error').show();
				}
				load_captcha();
			} else {
				$('#reset_loading').hide();
				$('#reset_success').show();
			}
		},
		error: function() {
			$('#reset_wrap').show();
			$('#reset_loading').hide();
			$('#taracot-reset-error').html(_lang_vars.ajax_failed);
			$('#taracot-reset-error').show();
			$('#reset_captcha').val('');
			load_captcha();
		}
	});
});

// Bind <Enter> key to form input fields

$('.taracot-auth-field').bind('keypress', function(e) {
	if (submitOnEnter(e)) {
		$('#btn_reset').click();
		e.preventDefault();
	}
});

// Focus first input field by default

$('#reset_email').focus();

// Load captcha image

$(document).ready(function() {
	load_captcha();
});