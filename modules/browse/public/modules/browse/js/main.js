var file_ids = {};
var file_types = {};
var file_mime = {};
var current_dir = '';
var up_dir = [];
var clpbrd = {
	mode: null,
	dir: null,
	files: []
};
var taracot_dlg_edit = new $.UIkit.modal("#taracot_dlg_edit");
var taracot_dlg_upload = new $.UIkit.modal("#taracot_dlg_upload", {
	bgclose: false,
	keyboard: false
});
var buttons_state = [];
var uploader;
var refresh_required = false;

var shifty_select_handler = function() {
	$('.taracot-fade').addClass('taracot-fade-elipsis');
	var ns = $('.taracot-files-item').getSelected('taracot-files-item-selected');
	for (var i = 0; i < ns.length; i++) {
		var id = ns[i].replace('taracot_file_', '');
		$('#taracot_el_' + id).removeClass('taracot-fade-elipsis');
		if (ns.length == 1 & file_types[id] == 'd') {
			$('#btn_down').attr('disabled', false);
		} else {
			$('#btn_down').attr('disabled', true);
		}
		if (ns.length == 1 & file_types[id] != 'd') {
			$('#btn_select').attr('disabled', false);
		} else {
			$('#btn_select').attr('disabled', true);
		}
	}
};

var shifty_unselect_handler = function() {
	var ns = $('.taracot-files-item').getSelected('taracot-files-item-selected');
	$('#btn_down').attr('disabled', true);
	if (ns.length == 1) {
		var id = ns[0].replace('taracot_file_', '');
		if (file_types[id] == 'd') $('#btn_down').attr('disabled', false);
	}
};

var shifty_handler = function() {
	shifty_select_handler();
	shifty_unselect_handler();
};

var load_files_data = function(dir) {
	save_buttons_state();
	$('.taracot-files-button').attr('disabled', true);
	$('#files_grid_progress').show();
	$('#files_grid').empty();
	file_ids = {};
	file_types = {};
	$('#files_grid').click();
	$.ajax({
		type: 'POST',
		url: '/cp/browse/data/load',
		data: {
			dir: dir,
			io: io
		},
		dataType: "json",
		success: function(data) {
			$('#files_grid_progress').hide();
			if (data && data.status == 1) {
				load_buttons_state();
				shifty_handler();
				$('#btn_down').attr('disabled', true);
				$('.taracot-files-panel').removeClass('uk-hidden');
				if (dir) {
					$('#btn_up').attr('disabled', false);
				} else {
					$('#btn_up').attr('disabled', true);
				}
				// uikit tooltip bug workaround
				for (var i = 0; i < data.files.length; i++) {
					var tp = '/modules/files/images/folder.png';
					if (data.files[i].type == 'f') {
						tp = '/modules/files/images/file.png';
						if (data.files[i].mime.match(/^image\//)) tp = '/modules/files/images/image.png';
						if (data.files[i].mime.match(/excel/) || data.files[i].mime.match(/csv/) || data.files[i].mime.match(/spreadsheet/)) tp = '/modules/files/images/excel.png';
						if (data.files[i].mime.match(/msword/) || data.files[i].mime.match(/rtf/)) tp = '/modules/files/images/word.png';
						if (data.files[i].mime.match(/text\/plain/)) tp = '/modules/files/images/txt.png';
						if (data.files[i].mime.match(/video/)) tp = '/modules/files/images/video.png';
						if (data.files[i].mime.match(/pdf/)) tp = '/modules/files/images/pdf.png';
						if (data.files[i].mime.match(/photoshop/)) tp = '/modules/files/images/psd.png';
						if (data.files[i].mime.match(/zip/) || data.files[i].mime.match(/rar/)) tp = '/modules/files/images/archive.png';
					}
					if (data.files[i].thumb) {
						tp = '/files/' + current_dir + '/___thumb_' + data.files[i].thumb + '.jpg';
					}
					file_ids[i] = data.files[i].name;
					file_types[i] = data.files[i].type;
					file_mime[i] = data.files[i].mime;
					$('#files_grid').append('<li class="uk-thumbnail taracot-files-item" id="taracot_file_' + i + '"><div class="uk-badge uk-badge-notification uk-badge-success" style="position:absolute;display:none">0</div><img src="' + tp + '" style="max-height:70px;max-width:70px"><div class="uk-thumbnail-caption taracot-thumbnail-caption"><div class="taracot-fade taracot-fade-elipsis" id="taracot_el_' + i + '">' + data.files[i].name + '</div></div></li>');
				}
				$('.taracot-files-item').shifty({
					className: 'taracot-files-item-selected',
					select: function(el) {
						shifty_select_handler();
					},
					unselect: function(el) {
						shifty_unselect_handler();
					}
				});
				$('.taracot-files-item').bind('dblclick', dblclick_handler);
				$('#taracot_total_files').html(data.files.length);
				if (!data.files.length) $('#files_grid').html(_lang_vars.no_files);
			} else {
				var _err = _lang_vars.ajax_failed;
				if (data.error) {
					_err = data.error;
				}
				$.UIkit.notify({
					message: _err,
					status: 'danger',
					timeout: 2000,
					pos: 'top-center'
				});
				$('#taracot_total_files').html('0');
			}
		},
		error: function() {
			$('#files_grid_progress').hide();
			$('#files_grid').html(_lang_vars.ajax_failed);
			$.UIkit.notify({
				message: _lang_vars.ajax_failed,
				status: 'danger',
				timeout: 2000,
				pos: 'top-center'
			});
			$('#taracot_total_files').html('0');
			load_buttons_state();
			shifty_handler();
		}
	});
};

var dblclick_handler = function() {
	var id = $(this).attr('id').replace('taracot_file_', '');
	if (file_types[id] != 'd') return;
	up_dir.push(current_dir);
	current_dir += '/' + file_ids[id];
	current_dir = current_dir.replace(/^\//, '');
	$('#taracot-files-current-dir').html('/' + current_dir);
	load_files_data(current_dir);
};

var btnup_handler = function() {
	if (up_dir.length) {
		current_dir = up_dir[up_dir.length - 1];
		delete up_dir[up_dir.length - 1];
	} else {
		current_dir = '';
	}
	if (typeof current_dir == 'undefined') current_dir = '';
	$('#taracot-files-current-dir').html('/' + current_dir);
	load_files_data(current_dir);
};

var btndown_handler = function() {
	var ns = $('.taracot-files-item').getSelected('taracot-files-item-selected');
	if (!ns.length || ns.length > 1) return;
	var id = ns[0].replace('taracot_file_', '');
	if (file_types[id] != 'd') return;
	up_dir.push(current_dir);
	current_dir += '/' + file_ids[id];
	current_dir = current_dir.replace(/^\//, '');
	$('#taracot-files-current-dir').html('/' + current_dir);
	load_files_data(current_dir);
};

var btnselect_hander = function() {
	if (CKEditorFuncNum) {
		var ns = $('.taracot-files-item').getSelected('taracot-files-item-selected');
		if (!ns.length || ns.length > 1) return;
		var url = '/files/' + $('#taracot-files-current-dir').html();
		if (url != '/') url += '/';
		url += file_ids[ns[0].replace('taracot_file_', '')];
		window.opener.CKEDITOR.tools.callFunction(CKEditorFuncNum, url);
		close();
	}
};

var btnrefresh_hanlder = function() {
	load_files_data(current_dir);
};

var save_buttons_state = function() {
	buttons_state = [];
	$('.taracot-files-button').each(function() {
		buttons_state.push($(this).attr('disabled'));
	});
};

var load_buttons_state = function() {
	$('.taracot-files-button').each(function(n) {
		if (buttons_state.length < n) return;
		if (buttons_state[n]) {
			$(this).attr('disabled', true);
		} else {
			$(this).attr('disabled', false);
		}
	});
};

var init_buttons_state = function() {
	$('#btn_refresh').attr('disabled', false);
	$('#btn_down').attr('disabled', true);
	$('#btn_up').attr('disabled', true);
	$('#btn_select').attr('disabled', true);
};

$('#btn_refresh').click(btnrefresh_hanlder);
$('#btn_up').click(btnup_handler);
$('#btn_down').click(btndown_handler);
$('#btn_select').click(btnselect_hander);

$(document).ready(function() {
	if (!io) io = undefined;
	$('#files_grid_progress').hide();
	init_buttons_state();
	load_files_data();
	$('#files_grid').click(function(e) {
		if (e.target.id === "files_grid") {
			$('.taracot-files-item').removeClass('taracot-files-item-selected');
			$('.taracot-fade').addClass('taracot-fade-elipsis');
			$('#btn_down').attr('disabled', true);
			shifty_handler();
		}
	});
});

// Helper functions (regexp)
var check_filename = function(_fn) {
	var fn = _fn.replace(/^\s+|\s+$/g, '');
	if (!fn || fn.length > 80) return false; // null or too long
	if (fn.match(/^\./)) return false; // starting with a dot
	if (fn.match(/^[\^<>\:\"\/\\\|\?\*\x00-\x1f]+$/)) return false; // invalid characters
	return true;
};
var check_directory = function(_fn) {
	if (!_fn) return true; // allow null
	var fn = _fn.replace(/^\s+|\s+$/g, '');
	if (fn.length > 40) return false; // too long
	if (fn.match(/^\./)) return false; // starting with a dot
	if (fn.match(/^\\/)) return false; // starting with a slash
	if (fn.match(/^[\^<>\:\"\\\|\?\*\x00-\x1f]+$/)) return false; // invalid characters
	return true;
};
