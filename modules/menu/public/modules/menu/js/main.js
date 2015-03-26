var taracot_dlg_menu_edit = new UIkit.modal("#taracot_dlg_menu_edit");
var edit_id;
var edit_lng;

$('#btn_item_add').click(function() {
	taracot_dlg_menu_edit.show();
	$('.taracot_dlg_menu_edit_field').each(function() {
		$(this).val('');
		$(this).removeClass('uk-form-danger');
	});
	$('#taracot_dlg_menu_edit_text').focus();
	edit_id = undefined;
});

$('.taracot_dlg_menu_edit_field').bind('keypress', function(e) {
	if (submitOnEnter(e)) {
		$('#taracot_dlg_menu_edit_btn_save').click();
	}
});

$('#btn_item_delall').click(function() {
	if (confirm(_lang_vars.confirm_menu_deleteall)) $('#menu_nest').empty();
});

$('#btn_menu_save_cancel').click(function() {
	if (confirm(_lang_vars.confirm_menu_cancel)) {
		$('#menu_nest').empty();
		$('#menu_editor').addClass('uk-hidden');
		$('#btn_load_menu').attr('disabled', false);
	}
});

$('#btn_load_menu').click(function() {
	$('#load_menu_loading').removeClass('uk-hidden');
	$('#btn_load_menu').attr('disabled', true);
	$('#menu_nest').empty();
	edit_lng = $('#menu_lang').val();
	$.ajax({
		type: 'POST',
		url: '/cp/menu/data/load',
		dataType: "json",
		data: {
			lng: edit_lng
		},
		success: function(data) {
			$('#load_menu_loading').addClass('uk-hidden');
			if (data.status == 1) {
				if (data.menu_source) {
					$('#menu_nest').html(data.menu_source);
					bind_menu_handlers();
				}
				$('#menu_editor').removeClass('uk-hidden');
				$('#menu_edit_lang').html(edit_lng);
			} else {
				$('#btn_load_menu').attr('disabled', false);
				var _err = _lang_vars.ajax_failed;
				if (data.error) {
					_err = data.error;
				}
				UIkit.notify({
					message: _err,
					status: 'danger',
					timeout: 2000,
					pos: 'top-center'
				});
			}
		},
		error: function() {
			$('#load_menu_loading').addClass('uk-hidden');
			$('#btn_load_menu').attr('disabled', false);
			UIkit.notify({
				message: _lang_vars.ajax_failed,
				status: 'danger',
				timeout: 2000,
				pos: 'top-center'
			});
		}
	});
	// var data = walk_nest_uikit($('#menu_nest'));
	// $('#tmp_res').html('<nav class="uk-navbar">' + data + '</nav>');
});

$('#btn_menu_save').click(function() {
	taracot_ajax_progress_indicator('body', true);
	var menu_source = $('#menu_nest').html();
	//var menu_uikit = '<nav class="uk-navbar">' + walk_nest_uikit($('#menu_nest')) + '</nav>';
	var menu_uikit = walk_nest_uikit($('#menu_nest'));
	var menu_uikit_offcanvas = walk_nest_uikit_offcanvas($('#menu_nest'));
	var menu_raw = walk_nest_raw($('#menu_nest'));
	$.ajax({
		type: 'POST',
		url: '/cp/menu/data/save',
		dataType: "json",
		data: {
			lng: edit_lng,
			menu_source: menu_source,
			menu_uikit: menu_uikit,
			menu_uikit_offcanvas: menu_uikit_offcanvas,
			menu_raw: menu_raw
		},
		success: function(data) {
			taracot_ajax_progress_indicator('body', false);
			if (data.status == 1) {
				$('#menu_editor').addClass('uk-hidden');
				$('#btn_load_menu').attr('disabled', false);
				UIkit.notify({
					message: _lang_vars.save_success,
					status: 'success',
					timeout: 2000,
					pos: 'top-center'
				});
			} else {
				var _err = _lang_vars.ajax_failed;
				if (data.error) {
					_err = data.error;
				}
				UIkit.notify({
					message: _err,
					status: 'danger',
					timeout: 2000,
					pos: 'top-center'
				});
			}
		},
		error: function() {
			taracot_ajax_progress_indicator('body', false);
			UIkit.notify({
				message: _lang_vars.ajax_failed,
				status: 'danger',
				timeout: 2000,
				pos: 'top-center'
			});
		}
	});
});

$('#taracot_dlg_menu_edit_btn_save').click(function() {
	$('.taracot_dlg_menu_edit_field').each(function() {
		$(this).removeClass('uk-form-danger');
	});
	var errors = false;
	if (!$('#taracot_dlg_menu_edit_text').val()) {
		$('#taracot_dlg_menu_edit_text').addClass('uk-form-danger');
		$('#taracot_dlg_menu_edit_text').select();
		$('#taracot_dlg_menu_edit_text').focus();
		errors = true;
	}
	if (!$('#taracot_dlg_menu_edit_url').val()) {
		$('#taracot_dlg_menu_edit_url').addClass('uk-form-danger');
		if (!errors) {
			$('#taracot_dlg_menu_edit_text').select();
			$('#taracot_dlg_menu_edit_text').focus();
		}
		errors = true;
	}
	if (errors) {
		UIkit.notify({
			message: _lang_vars.form_contains_errors,
			status: 'danger',
			timeout: 2000,
			pos: 'top-center'
		});
		return;
	}
	taracot_dlg_menu_edit.hide();
	if (edit_id) {
		$('#' + edit_id).children('.uk-nestable-item').children('span.uk-nestable-item-text').html($('#taracot_dlg_menu_edit_text').val());
		$('#' + edit_id).children('.uk-nestable-item').children('a.uk-nestable-item-url').html($('#taracot_dlg_menu_edit_url').val());
		$('#' + edit_id).children('.uk-nestable-item').children('a.uk-nestable-item-url').attr('href', $('#taracot_dlg_menu_edit_url').val());
	} else {
		$('#menu_nest').append('<li id="taracot_menu_' + Date.now() + '" class="uk-nestable-list-item"><div class="uk-nestable-item"><div class="uk-nestable-handle"></div><div data-nestable-action="toggle"></div>&nbsp;<span class="uk-nestable-item-text">' + $('#taracot_dlg_menu_edit_text').val() + '</span>&nbsp;(<a href="' + $('#taracot_dlg_menu_edit_url').val() + '" class="uk-nestable-item-url">' + $('#taracot_dlg_menu_edit_url').val() + '</a>)&nbsp;&nbsp;&nbsp;<button class="uk-button uk-button-small taracot-btn-menu-edit"><i class="uk-icon-edit"></i></button>&nbsp;<button class="uk-button uk-button-small uk-button-danger taracot-btn-menu-delete"><i class="uk-icon-trash-o"></i></button></div></li>');
		bind_menu_handlers();
	}
});

var bind_menu_handlers = function() {
	$('.taracot-btn-menu-delete').unbind();
	$('.taracot-btn-menu-edit').unbind();
	$('.taracot-btn-menu-delete').click(function() {
		var name = $(this).parent().parent().children('.uk-nestable-item').children('span.uk-nestable-item-text').html();
		if (confirm(_lang_vars.confirm_menu_delete + "\n\n" + name)) $(this).parent().parent().remove();
	});
	$('.taracot-btn-menu-edit').click(function() {
		var name = $(this).parent().parent().children('.uk-nestable-item').children('span.uk-nestable-item-text').html();
		var url = $(this).parent().parent().children('.uk-nestable-item').children('a.uk-nestable-item-url').html();
		var id = $(this).parent().parent().attr('id');
		edit_id = id;
		$('#taracot_dlg_menu_edit_text').val(name);
		$('#taracot_dlg_menu_edit_url').val(url);
		$('#taracot_dlg_menu_edit_page').val('');
		taracot_dlg_menu_edit.show();
		$('.taracot_dlg_menu_edit_field').each(function() {
			$(this).removeClass('uk-form-danger');
		});
		$('#taracot_dlg_menu_edit_text').focus();
	});
};

/*******************************************************************

 document.ready

********************************************************************/

$(document).ready(function() {
	$('#menu_nest').empty();
	$('#menu_lang').val(locales[0]);
	$('#btn_load_menu').attr('disabled', false);
	$('#taracot_dlg_menu_edit_page').change(function() {
		$('#taracot_dlg_menu_edit_text').val($('#' + this.id + ' option:selected').text().replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' '));
		$('#taracot_dlg_menu_edit_url').val($(this).val());
	});
});

/*******************************************************************

 Helper functions

********************************************************************/

var taracot_ajax_progress_indicator = function(sel, show) {
	if (show) {
		var destination = $(sel).offset();
		$('.taracot-progress').css({
			top: destination.top,
			left: destination.left,
			width: $(sel).width(),
			height: $(sel).height()
		});
		$('.taracot-progress').removeClass('uk-hidden');
	} else {
		$('.taracot-progress').addClass('uk-hidden');
	}
};

var walk_nest_uikit = function(ul, cd, pnt) {
	var res = '';
	if (cd) res += '<div class="uk-dropdown uk-dropdown-navbar">';
	var nbc = '';
	if (cd) {
		nbc = 'uk-nav uk-nav-navbar';
	} else {
		nbc = 'uk-navbar-nav';
	}
	res += '<ul class="' + nbc + '">';
	var li = $(ul).children('li');
	li.each(function() {
		var text = $(this).children('.uk-nestable-item').children('span.uk-nestable-item-text').html();
		var url = $(this).children('.uk-nestable-item').children('a.uk-nestable-item-url').html();
		var ddc = '';
		var pc = '';
		var pr = '';
		if (pnt) pr = ' rel="' + pnt + '"';
		var id = 'taracot_menu_item_' + url.replace(/\//g, '_').replace(/^_/, '').replace(/[^a-zA-Z0-9_\-]/g, '');
		var nxul = $(this).children('ul.uk-nestable-list');
		if (nxul.html()) {
			ddc = ' data-uk-dropdown';
			pc = ' class="uk-parent"';
		}
		res += '<li class="' + id + '"' + pc + ddc + pr + '><a href="' + url + '">' + text + '</a>';
		if (nxul.html()) {
			res += walk_nest_uikit(nxul, true, id);
		}
		res += '</li>';
	});
	res += '</ul>';
	if (cd) res += '</div>';
	return res;
};

var walk_nest_uikit_offcanvas = function(ul, pnt, r) {
	var res = '';
	if (r) res += '<ul class="uk-nav-sub">';
	var li = $(ul).children('li');
	li.each(function() {
		var text = $(this).children('.uk-nestable-item').children('span.uk-nestable-item-text').html();
		var url = $(this).children('.uk-nestable-item').children('a.uk-nestable-item-url').html();
		var nxul = $(this).children('ul.uk-nestable-list');
		var id = 'taracot_menu_item_' + url.replace(/\//g, '_').replace(/^_/, '').replace(/[^a-zA-Z0-9_\-]/g, '');
		if (url.match(/^#/)) {
			id += Date.now();
			url = '#';
		}
		var pr = '';
		if (pnt) pr = ' rel="' + pnt + '"';
		if (nxul.html() && !r) id += ' uk-parent';
		res += '<li class="' + id + '"' + pr + '><a href="' + url + '">' + text + '</a>';
		if (nxul.html()) {
			res += walk_nest_uikit_offcanvas(nxul, id, true);
		}
		res += '</li>';
	});
	if (r) res += '</ul>';
	return res;
};

var walk_nest_raw = function(ul, pnt) {
	var res = '';
	res += '<ul>';
	var li = $(ul).children('li');
	li.each(function() {
		var text = $(this).children('.uk-nestable-item').children('span.uk-nestable-item-text').html();
		var url = $(this).children('.uk-nestable-item').children('a.uk-nestable-item-url').html();
		var nxul = $(this).children('ul.uk-nestable-list');
		var id = 'taracot_menu_item_' + url.replace(/\//g, '_').replace(/^_/, '').replace(/[^a-zA-Z0-9_\-]/g, '');
		var pr = '';
		if (pnt) pr = ' rel="' + pnt + '"';
		res += '<li class="' + id + '"' + pr + '><a href="' + url + '">' + text + '</a>';
		if (nxul.html()) {
			res += walk_nest_raw(nxul, id);
		}
		res += '</li>';
	});
	res += '</ul>';
	return res;
};