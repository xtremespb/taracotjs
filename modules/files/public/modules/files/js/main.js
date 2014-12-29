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
var taracot_dlg_edit = new UIkit.modal("#taracot_dlg_edit");
var taracot_dlg_link = new UIkit.modal("#taracot_dlg_link");
var taracot_dlg_upload = new UIkit.modal("#taracot_dlg_upload", {
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
		if (ns.length == 1 && file_types[id] == 'd') {
			$('#btn_down').attr('disabled', false);
		} else {
			$('#btn_down').attr('disabled', true);
		}
		if (ns.length == 1 && file_types[id] == 'f' && textedit) {
			$('#btn_editfile').attr('disabled', false);
		} else {
			$('#btn_editfile').attr('disabled', true);
		}
		if (ns.length == 1 && file_mime[id] == 'application/zip') {
			$('#btn_unzip').attr('disabled', false);
		} else {
			$('#btn_unzip').attr('disabled', true);
		}
	}
	if (ns.length) {
		$('#btn_delete').attr('disabled', false);
		$('#btn_copy').attr('disabled', false);
		$('#btn_cut').attr('disabled', false);
		$('#btn_download').attr('disabled', false);
		if (ns.length == 1) {
			$('#btn_rename').attr('disabled', false);
			$('#btn_link').attr('disabled', false);
		} else {
			$('#btn_rename').attr('disabled', true);
			$('#btn_link').attr('disabled', true);
		}
	} else {
		$('#btn_delete').attr('disabled', true);
		$('#btn_copy').attr('disabled', true);
		$('#btn_cut').attr('disabled', true);
		$('#btn_rename').attr('disabled', true);
		$('#btn_download').attr('disabled', true);
		$('#btn_editfile').attr('disabled', true);
		$('#btn_link').attr('disabled', true);
	}
};

var shifty_unselect_handler = function() {
	var ns = $('.taracot-files-item').getSelected('taracot-files-item-selected');
	$('#btn_down').attr('disabled', true);
	$('#btn_unzip').attr('disabled', true);
	if (ns.length == 1) {
		var id = ns[0].replace('taracot_file_', '');
		if (file_types[id] == 'd') $('#btn_down').attr('disabled', false);
	}
};

var shifty_handler = function() {
	shifty_select_handler();
	shifty_unselect_handler();
};

var uploader_init = function() {
	uploader = new plupload.Uploader({
		runtimes: 'html5,flash,silverlight,html4',
		browse_button: 'taracot_dlg_upload_btn_add',
		drop_element: "taracot_upload_box",
		url: '/cp/files/data/upload',
		flash_swf_url: '/js/plupload/moxie.swf',
		silverlight_xap_url: '/js/plupload/moxie.xap',
		filters: {
			max_file_size: '100mb',
		}
	});
	uploader.init();
	uploader.bind('FilesAdded', function(up, files) {
		if (uploader.files.length) {
			$('#uploader_dnd_hint').hide();
			$('#taracot_dlg_upload_btn_clear').attr('disabled', false);
			$('#taracot_dlg_upload_btn_upload').attr('disabled', false);
		}
		plupload.each(files, function(file) {
			$('#taracot_upload_box').append('<div class="uk-alert" id="' + file.id + '"><b>' + file.name + '</b> (' + plupload.formatSize(file.size) + ')<div class="uk-progress uk-progress-mini uk-progress-success"><div class="uk-progress-bar" style="width: 0%"></div></div></div>');
		});
		if ($("#cbx_upload_auto_start").is(':checked')) dlguploadbtnupload_handler();
	});
	uploader.bind('Error', function(up, err) {
		UIkit.notify({
			message: err.file.name + ': ' + err.message,
			status: 'danger',
			timeout: 2000,
			pos: 'top-center'
		});
		$('#' + err.file.id).addClass('uk-alert-danger');
	});
	uploader.bind('UploadProgress', function(up, file) {
		$('#' + file.id + ' > .uk-progress > .uk-progress-bar').css('width', file.percent + '%');
	});
	uploader.bind('FileUploaded', function(upldr, file, object) {
		var data;
		try {
			data = eval(object.response);
		} catch (err) {
			data = eval('(' + object.response + ')');
		}
		if (data) {
			if (data.status === 0) {
				if (data.error) {
					UIkit.notify({
						message: data.error,
						status: 'danger',
						timeout: 2000,
						pos: 'top-center'
					});
				}
			}
			if (data.status == 1) {
				$('#' + file.id).addClass('uk-alert-success');
				refresh_required = true;
			}
		}
	});
	uploader.bind('UploadComplete', function() {
		$('#taracot_dlg_upload_btn_add').attr('disabled', false);
		$('#taracot_dlg_upload_btn_clear').attr('disabled', false);
		$('#taracot_dlg_upload_btn_cancel').attr('disabled', false);
	});
};

var load_files_data = function(dir) {
	save_buttons_state();
	$('.taracot-files-button').attr('disabled', true);
	$('#files_grid_progress').show();
	$('#files_grid').empty();
	if (clpbrd.mode !== null) {
		$('#btn_paste').attr('disabled', false);
	} else {
		$('#btn_paste').attr('disabled', true);
	}
	file_ids = {};
	file_types = {};
	$('#files_grid').click();
	$.ajax({
		type: 'POST',
		url: '/cp/files/data/load',
		data: {
			dir: dir
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
				$('#btn_dummy').mouseover();
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
					if (data.files[i].type == 'd') {
						var drop_target_folder = new DropTarget(document.getElementById('taracot_file_' + i));
						drop_target_folder.onLeave = drop_target_folder_onleave;
					}
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
				var dragObjects = $('.taracot-files-item');
				for (var j = 0; j < dragObjects.length; j++) {
					new DragObject(dragObjects[j]);
				}
				$('.taracot-files-item').bind('dblclick', dblclick_handler);
				$('#taracot_total_files').html(data.files.length);
				if (!data.files.length) $('#files_grid').html(_lang_vars.no_files);
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
				$('#taracot_total_files').html('0');
			}
		},
		error: function() {
			$('#files_grid_progress').hide();
			$('#files_grid').html(_lang_vars.ajax_failed);
			UIkit.notify({
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

var drop_target_folder_onleave = function() {
	cutcopy('cut');
	var dest = current_dir + '/' + file_ids[this.toString().replace('taracot_file_', '')];
	btnpaste_handler(dest);
};

var dblclick_handler = function() {
	var id = $(this).attr('id').replace('taracot_file_', '');
	if (file_types[id] != 'd') {
		open_textedit_window(file_ids[id]);
		return;
	}
	up_dir.push(current_dir);
	current_dir += '/' + file_ids[id];
	current_dir = current_dir.replace(/^\//, '');
	$('#taracot-files-current-dir').html('/' + current_dir);
	load_files_data(current_dir);
};

var btnnewfile_handler = function() {
	$('#taracot-dlg-edit-h1').html(_lang_vars.new_filename);
	$('#btn_dummy').mouseover();
	taracot_dlg_edit.show();
	$('#taracot_dlg_edit_value').val('');
	$('#taracot_dlg_edit_btn_save').unbind();
	$('#taracot_dlg_edit_btn_save').click(new_text_file);
	$('#taracot_dlg_edit_value').select();
	$('#taracot_dlg_edit_value').focus();
};

var btneditfile_hanlder = function() {
	var ns = $('.taracot-files-item').getSelected('taracot-files-item-selected');
	if (!ns || !ns.length || ns.length > 1) return;
	var id = ns[0].replace('taracot_file_', '');
	if (file_types[id] != 'f') return;
	$('#btn_dummy').mouseover();
	open_textedit_window(file_ids[id]);
};

var new_text_file = function() {
	$('#taracot_dlg_edit_value').removeClass('uk-form-danger');
	if (!check_filename($('#taracot_dlg_edit_value').val())) {
		$('#taracot_dlg_edit_value').addClass('uk-form-danger');
		UIkit.notify({
			message: _lang_vars.invalid_filename_syntax,
			status: 'danger',
			timeout: 2000,
			pos: 'top-center'
		});
		return;
	}
	open_textedit_window($('#taracot_dlg_edit_value').val());
	taracot_dlg_edit.hide();
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

var btndelete_handler = function(dnd) {
	if (typeof dnd == 'undefined') dnd = false;
	var ns = $('.taracot-files-item').getSelected('taracot-files-item-selected');
	var fna = [];
	for (var i = 0; i < ns.length; i++) {
		var id = ns[i].replace('taracot_file_', '');
		fna.push(file_ids[id]);
	}

	if (!confirm(_lang_vars.delete_confirm + "\n\n" + fna.join(', '))) {
		return;
	}
	$('#files_grid_progress').show();
	$('#files_grid').hide();
	save_buttons_state();
	$('.taracot-files-button').attr('disabled', true);
	// uikit tooltip bug workaround
	$('#btn_dummy').mouseover();
	$.ajax({
		type: 'POST',
		url: '/cp/files/data/del',
		data: {
			dir: current_dir,
			items: fna
		},
		dataType: "json",
		success: function(data) {
			$('#files_grid_progress').hide();
			$('#files_grid').show();
			load_buttons_state();
			// uikit tooltip bug workaround
			$('#btn_dummy').mouseover();
			if (data && data.status == 1) {
				load_files_data(current_dir);
				UIkit.notify({
					message: _lang_vars.delete_success,
					status: 'success',
					timeout: 2000,
					pos: 'top-center'
				});
			} else {
				load_files_data(current_dir);
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
			$('#files_grid_progress').hide();
			$('#files_grid').show();
			UIkit.notify({
				message: _lang_vars.ajax_failed,
				status: 'danger',
				timeout: 2000,
				pos: 'top-center'
			});
		}
	});
};

$('#taracot_dlg_edit_value').bind('keypress', function(e) {
	if (submitOnEnter(e)) {
		$('#taracot_dlg_edit_btn_save').click();
	}
});

var btnnewfolder_handler = function() {
	$('#taracot-dlg-edit-h1').html(_lang_vars.new_folder);
	taracot_dlg_edit.show();
	$('#taracot_dlg_edit_value').val('');
	$('#taracot_dlg_edit_btn_save').unbind();
	$('#taracot_dlg_edit_btn_save').click(create_new_dir);
	$('#taracot_dlg_edit_value').focus();
};

var create_new_dir = function() {
	var new_dir = $('#taracot_dlg_edit_value').val().replace(/^\s+|\s+$/g, '');
	$('#taracot_dlg_edit_value').removeClass('uk-form-danger');
	if (!new_dir || !check_directory(new_dir)) {
		$('#taracot_dlg_edit_value').addClass('uk-form-danger');
		UIkit.notify({
			message: _lang_vars.invalid_dir_syntax,
			status: 'danger',
			timeout: 2000,
			pos: 'top-center'
		});
		return;
	}
	taracot_dlg_edit.hide();
	$('#files_grid_progress').show();
	$('#files_grid').hide();
	save_buttons_state();
	$('.taracot-files-button').attr('disabled', true);
	$.ajax({
		type: 'POST',
		url: '/cp/files/data/newdir',
		data: {
			dir: current_dir,
			newdir: new_dir
		},
		dataType: "json",
		success: function(data) {
			$('#files_grid_progress').hide();
			$('#files_grid').show();
			load_buttons_state();
			shifty_handler();
			if (data && data.status == 1) {
				load_files_data(current_dir);
				UIkit.notify({
					message: _lang_vars.newdir_success,
					status: 'success',
					timeout: 2000,
					pos: 'top-center'
				});
			} else {
				taracot_dlg_edit.show();
				$('#taracot_dlg_edit_value').focus();
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
			$('#files_grid_progress').hide();
			$('#files_grid').show();
			load_buttons_state();
			taracot_dlg_edit.show();
			shifty_handler();
			$('#taracot_dlg_edit_value').focus();
			UIkit.notify({
				message: _lang_vars.ajax_failed,
				status: 'danger',
				timeout: 2000,
				pos: 'top-center'
			});
		}
	});
};

var btnrename_handler = function() {
	var ns = $('.taracot-files-item').getSelected('taracot-files-item-selected');
	if (!ns || !ns.length || ns.length > 1) return;
	var id = ns[0].replace('taracot_file_', '');
	$('#taracot-dlg-edit-h1').html(_lang_vars.rename + ' <span id="taracot_rename_old_name">' + file_ids[id] + '</span>');
	taracot_dlg_edit.show();
	$('#taracot_dlg_edit_value').val(file_ids[id]);
	$('#taracot_dlg_edit_btn_save').unbind();
	$('#taracot_dlg_edit_btn_save').click(rename_file);
	$('#taracot_dlg_edit_value').select();
	$('#taracot_dlg_edit_value').focus();
};

var rename_file = function() {
	$('#taracot_dlg_edit_value').removeClass('uk-form-danger');
	if (!check_filename($('#taracot_dlg_edit_value').val())) {
		$('#taracot_dlg_edit_value').addClass('uk-form-danger');
		UIkit.notify({
			message: _lang_vars.invalid_filename_syntax,
			status: 'danger',
			timeout: 2000,
			pos: 'top-center'
		});
		return;
	}
	if ($('#taracot_dlg_edit_value').val() == $('#taracot_rename_old_name').html()) {
		$('#taracot_dlg_edit_value').addClass('uk-form-danger');
		UIkit.notify({
			message: _lang_vars.cannot_rename_same,
			status: 'danger',
			timeout: 2000,
			pos: 'top-center'
		});
		return;
	}
	taracot_dlg_edit.hide();
	$('#files_grid_progress').show();
	$('#files_grid').hide();
	save_buttons_state();
	$('.taracot-files-button').attr('disabled', true);
	$.ajax({
		type: 'POST',
		url: '/cp/files/data/rename',
		data: {
			dir: current_dir,
			old_filename: $('#taracot_rename_old_name').html(),
			new_filename: $('#taracot_dlg_edit_value').val()
		},
		dataType: "json",
		success: function(data) {
			$('#files_grid_progress').hide();
			$('#files_grid').show();
			load_buttons_state();
			shifty_handler();
			if (data && data.status == 1) {
				load_files_data(current_dir);
				UIkit.notify({
					message: _lang_vars.rename_success,
					status: 'success',
					timeout: 2000,
					pos: 'top-center'
				});
			} else {
				taracot_dlg_edit.show();
				$('#taracot_dlg_edit_value').focus();
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
			$('#files_grid_progress').hide();
			$('#files_grid').show();
			load_buttons_state();
			taracot_dlg_edit.show();
			shifty_handler();
			$('#taracot_dlg_edit_value').focus();
			UIkit.notify({
				message: _lang_vars.ajax_failed,
				status: 'danger',
				timeout: 2000,
				pos: 'top-center'
			});
		}
	});
};

var cutcopy = function(mode) {
	clpbrd = {
		mode: null,
		dir: null,
		files: []
	};
	var ns = $('.taracot-files-item').getSelected('taracot-files-item-selected');
	for (var i = 0; i < ns.length; i++) {
		var id = ns[i].replace('taracot_file_', '');
		clpbrd.files.push(file_ids[id]);
	}
	clpbrd.dir = current_dir;
	clpbrd.mode = mode;
	$('#taracot-files-clipboard').html(clpbrd.files.length);
	$('#btn_paste').attr('disabled', false);
};

var btncopy_handler = function() {
	cutcopy('copy');
	UIkit.notify({
		message: _lang_vars.clipboard_copy_success,
		status: 'success',
		timeout: 2000,
		pos: 'top-center'
	});
};

var btncut_handler = function() {
	cutcopy('cut');
	UIkit.notify({
		message: _lang_vars.clipboard_cut_success,
		status: 'success',
		timeout: 2000,
		pos: 'top-center'
	});
};

var btnpaste_handler = function(_dir) {
	if (clpbrd.mode === null) {
		return;
	}
	var _current_dir = current_dir;
	if (typeof _dir !== undefined && typeof _dir === 'string') {
		_current_dir = _dir;
	}
	if (clpbrd.dir == _current_dir) {
		UIkit.notify({
			message: _lang_vars.cannot_paste_to_source_dir,
			status: 'danger',
			timeout: 2000,
			pos: 'top-center'
		});
		return;
	}
	for (var i = 0; i < clpbrd.files.length; i++) {
		var _fn = clpbrd.dir + '/' + clpbrd.files[i];
		if (_fn.match(/^\//)) _fn = _fn.replace(/^\//, '');
		var rex1 = new RegExp('^' + _fn + '\/');
		var rex2 = new RegExp('^' + _fn + '$');
		if (_current_dir.match(rex1) || _current_dir.match(rex2)) {
			UIkit.notify({
				message: _lang_vars.cannot_paste_to_itself,
				status: 'danger',
				timeout: 2000,
				pos: 'top-center'
			});
			return;
		}
	}
	// uikit tooltip bug workaround
	$('#btn_dummy').mouseover();
	$('#files_grid_progress').show();
	$('#files_grid').hide();
	save_buttons_state();
	$('.taracot-files-button').attr('disabled', true);
	$.ajax({
		type: 'POST',
		url: '/cp/files/data/paste',
		data: {
			clipboard: clpbrd,
			dest: _current_dir
		},
		dataType: "json",
		success: function(data) {
			load_buttons_state();
			shifty_handler();
			$('#files_grid_progress').hide();
			$('#files_grid').show();
			if (data && data.status == 1) {
				$('#btn_paste').attr('disabled', true);
				load_files_data(current_dir);
				UIkit.notify({
					message: _lang_vars.paste_success,
					status: 'success',
					timeout: 2000,
					pos: 'top-center'
				});
				clpbrd = {
					mode: null,
					dir: null,
					files: []
				};
				$('#btn_paste').attr('disabled', true);
				$('#taracot-files-clipboard').html('0');
			} else {
				var _err = _lang_vars.paste_error;
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
			load_buttons_state();
			$('#files_grid_progress').hide();
			$('#files_grid').show();
			UIkit.notify({
				message: _lang_vars.ajax_failed,
				status: 'danger',
				timeout: 2000,
				pos: 'top-center'
			});
		}
	});
};

var btnunzip_handler = function(_dir) {
	var ns = $('.taracot-files-item').getSelected('taracot-files-item-selected');
	if (!ns || !ns.length || ns.length > 1) return;
	var id = ns[0].replace('taracot_file_', '');
	if (file_mime[id] != 'application/zip') return;
	// uikit tooltip bug workaround
	$('#btn_dummy').mouseover();
	$('#files_grid_progress').show();
	$('#files_grid').hide();
	save_buttons_state();
	$('.taracot-files-button').attr('disabled', true);
	$.ajax({
		type: 'POST',
		url: '/cp/files/data/unzip',
		data: {
			dir: current_dir,
			file: file_ids[id]
		},
		dataType: "json",
		success: function(data) {
			load_buttons_state();
			shifty_handler();
			$('#files_grid_progress').hide();
			$('#files_grid').show();
			if (data && data.status == 1) {
				load_files_data(current_dir);
				UIkit.notify({
					message: _lang_vars.unzip_success,
					status: 'success',
					timeout: 2000,
					pos: 'top-center'
				});
			} else {
				var _err = _lang_vars.unzip_error;
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
			load_buttons_state();
			$('#files_grid_progress').hide();
			$('#files_grid').show();
			UIkit.notify({
				message: _lang_vars.ajax_failed,
				status: 'danger',
				timeout: 2000,
				pos: 'top-center'
			});
		}
	});
};

var btndownload_handler = function() {
	var ns = $('.taracot-files-item').getSelected('taracot-files-item-selected');
	if (!ns.length) return;
	var files = [];
	for (var i = 0; i < ns.length; i++) {
		var id = ns[i].replace('taracot_file_', '');
		files.push(file_ids[id]);
	}
	// uikit tooltip bug workaround
	$('#btn_dummy').mouseover();
	$('#files_grid_progress').show();
	$('#files_grid').hide();
	save_buttons_state();
	$('.taracot-files-button').attr('disabled', true);
	$.fileDownload('/cp/files/data/download', {
		httpMethod: "POST",
		data: {
			dir: current_dir,
			files: files
		},
		successCallback: function(url) {
			load_buttons_state();
			shifty_handler();
			$('#files_grid_progress').hide();
			$('#files_grid').show();
		},
		failCallback: function(html, url) {
			load_buttons_state();
			shifty_handler();
			$('#files_grid_progress').hide();
			$('#files_grid').show();
			var data = JSON.parse(html);
			var _err = _lang_vars.download_error;
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
	});
};

var btnupload_handler = function() {
	refresh_required = false;
	taracot_dlg_upload.show();
	// uikit tooltip bug workaround
	$('#btn_dummy').mouseover();
	$('#taracot_dlg_upload_btn_clear').attr('disabled', true);
	$('#taracot_dlg_upload_btn_upload').attr('disabled', true);
	if (!uploader) uploader_init();
	uploader.splice(0);
	$('#taracot_upload_box').html('<div style="text-align:center" id="uploader_dnd_hint">' + _lang_vars.drag_and_drop_files_here + '</div>');
};

var btnrefresh_hanlder = function() {
	load_files_data(current_dir);
};


var dlguploadbtnclear_handler = function() {
	$('#taracot_dlg_upload_btn_clear').attr('disabled', true);
	$('#taracot_dlg_upload_btn_upload').attr('disabled', true);
	uploader.splice(0);
	$('#taracot_upload_box').empty();
	$('#taracot_upload_box').html('<div style="text-align:center" id="uploader_dnd_hint">' + _lang_vars.drag_and_drop_files_here + '</div>');
};

var dlguploadbtnupload_handler = function() {
	if (!uploader.files.length) return;
	uploader.settings.multipart_params = {
		dir: current_dir
	};
	$('.taracot-upload-btn').attr('disabled', true);
	uploader.start();
};

var btnlink_handler = function() {
	var ns = $('.taracot-files-item').getSelected('taracot-files-item-selected');
	if (!ns || !ns.length || ns.length > 1) return;
	var url = location.protocol + '//' + location.host + '/' + $('#taracot-files-current-dir').html() + '/' + files_url + '/' + file_ids[ns[0].replace('taracot_file_', '')];
	$('#taracot_dlg_link_value').val(url.replace(/([^:]\/)\/+/g, '$1'));
	taracot_dlg_link.show();
	$('#taracot_dlg_link_value').focus();
	$('#taracot_dlg_link_value').select();
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
	$('#btn_new_folder').attr('disabled', false);
	$('#btn_copy').attr('disabled', true);
	$('#btn_cut').attr('disabled', true);
	$('#btn_paste').attr('disabled', true);
	$('#btn_rename').attr('disabled', true);
	$('#btn_delete').attr('disabled', true);
	$('#btn_upload').attr('disabled', false);
	$('#btn_download').attr('disabled', true);
	$('#btn_unzip').attr('disabled', true);
	$('#btn_link').attr('disabled', false);
	if (textedit) {
		$('#btn_newfile').attr('disabled', false);
	} else {
		$('#btn_newfile').attr('disabled', true);
	}
	$('#btn_editfile').attr('disabled', true);
};

$('#btn_refresh').click(btnrefresh_hanlder);
$('#btn_new_folder').click(btnnewfolder_handler);
$('#btn_up').click(btnup_handler);
$('#btn_down').click(btndown_handler);
$('#btn_delete').click(btndelete_handler);
$('#btn_copy').click(btncopy_handler);
$('#btn_cut').click(btncut_handler);
$('#btn_paste').click(btnpaste_handler);
$('#btn_rename').click(btnrename_handler);
$('#btn_upload').click(btnupload_handler);
$('#btn_download').click(btndownload_handler);
$('#btn_unzip').click(btnunzip_handler);
$('#btn_newfile').click(btnnewfile_handler);
$('#btn_editfile').click(btneditfile_hanlder);
$('#btn_link').click(btnlink_handler);
$('#taracot_dlg_upload_btn_clear').click(dlguploadbtnclear_handler);
$('#taracot_dlg_upload_btn_upload').click(dlguploadbtnupload_handler);

$(document).ready(function() {
	$('#files_grid_progress').hide();
	init_buttons_state();
	load_files_data();
	var drop_target_btn_delete = new DropTarget(document.getElementById('btn_delete'));
	drop_target_btn_delete.onLeave = function() {
		btndelete_handler(true);
	};
	$('#files_grid').click(function(e) {
		if (e.target.id === "files_grid") {
			$('.taracot-files-item').removeClass('taracot-files-item-selected');
			$('.taracot-fade').addClass('taracot-fade-elipsis');
			$('#btn_down').attr('disabled', true);
			shifty_handler();
		}
	});
	$('#taracot_dlg_upload').on({
		'uk.modal.hide': function() {
			if (refresh_required) {
				load_files_data(current_dir);
			}
		}
	});
});

// Helper functions (regexp)

var open_textedit_window = function(fn) {
	var w = parseInt(screen.width / 1.5);
	var h = 500;
	var left = parseInt((screen.width / 2) - (w / 2));
  	var top = parseInt((screen.height / 2) - (h / 2));
	window.open('/cp/textedit?fn=' + current_dir + '/' + fn, '', 'toolbar=no, location=0, status=no, titlebar=no, menubar=no, width=' + w +', height=' + h + ', top=' + top + ', left=' + left);
};

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
