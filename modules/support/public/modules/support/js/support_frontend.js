$.loadingIndicator();

var dlg_ticket_reply = new UIkit.modal("#dlg_ticket_reply", {
        bgclose: false,
        keyboard: false
    }),
    process_rows = [
        function(val, id) {
            return val;
        },
        function(val, id) {
            return val;
        },
        function(val, id) {
            return val;
        },
        function(val, id) {
            return val;
        },
        function(val, id) {
            return val;
        }
    ],
    uploader_new, uploader_reply, uploading, current_ticket_id;

var init_uploader_new = function() {
    uploader_new = new plupload.Uploader({
        runtimes: 'html5,flash,silverlight,html4',
        browse_button: 'btn_file_new_attach',
        url: '/support/ajax/upload',
        flash_swf_url: '/js/plupload/moxie.swf',
        silverlight_xap_url: '/js/plupload/moxie.xap',
        filters: {
            max_file_size: '10mb'
        }
    });
    uploader_new.init();
    uploader_new.bind('FilesAdded', function(up, files) {
        if (!uploader_new.files.length) return;
        $('.taracot-attach-filename').html(files[0].name);
        $('.taracot-attach-filename').show();
        $('#btn_file_new_attach').attr('disabled', true);
        $('#btn_file_new_del').show();
        $('#ticket_error').hide();
    });
    uploader_new.bind('Error', function(up, err) {
        if (!uploading) {
            $('#btn_ticket_create_loading').hide();
            $('#btn_ticket_create').attr('disabled', false);
            $('#ticket_error').html(err.message);
            $('#ticket_error').fadeIn(500);
            $('html,body').animate({
                    scrollTop: $("#ticket_error").offset().top - 20
                },
                'slow');
        } else {
            uploading = undefined;
            _ticket_create_success();
            UIkit.notify({
                message: _lang_vars.upload_failed + ' (' + err.message + ')',
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
    uploader_new.bind('FileUploaded', function(upldr, file, object) {
        var res;
        try {
            res = eval(object.response);
        } catch (err) {
            res = eval('(' + object.response + ')');
        }
        if (!res || res.status != 1) {
            _ticket_create_success();
            var msg = _lang_vars.upload_failed;
            if (res.error) msg = res.error;
            UIkit.notify({
                message: msg,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        } else {
            _ticket_create_success();
        }
    });
    uploader_new.bind('UploadComplete', function() {
        uploading = undefined;
        $('#btn_ticket_create_loading').hide();
        $('#btn_ticket_create').attr('disabled', false);
    });
    $('#btn_file_new_del').click(function() {
        uploader_new.splice(0);
        $('.taracot-attach-filename').hide();
        $('#btn_file_new_del').hide();
        $('#btn_file_new_attach').attr('disabled', false);
    });
};

var init_uploader_reply = function() {
    uploader_reply = new plupload.Uploader({
        runtimes: 'html5,flash,silverlight,html4',
        browse_button: 'btn_file_reply_attach',
        url: '/support/ajax/upload',
        flash_swf_url: '/js/plupload/moxie.swf',
        silverlight_xap_url: '/js/plupload/moxie.xap',
        filters: {
            max_file_size: '10mb'
        }
    });
    uploader_reply.init();
    uploader_reply.bind('FilesAdded', function(up, files) {
        if (!uploader_reply.files.length) return;
        $('.taracot-attach-filename').html(files[0].name);
        $('.taracot-attach-filename').show();
        $('#btn_file_reply_attach').attr('disabled', true);
        $('#btn_file_reply_del').show();
        $('#ticket_error').hide();
    });
    uploader_reply.bind('Error', function(up, err) {
        if (!uploading) {
            $('#btn_ticket_reply_loading').hide();
            $('#btn_ticket_reply').attr('disabled', false);
            $('#ticket_reply_error').html(err.message);
            $('#ticket_reply_error').fadeIn(500);
        } else {
            uploading = undefined;
            _ticket_reply_success();
            UIkit.notify({
                message: _lang_vars.upload_failed + ' (' + err.message + ')',
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
    uploader_reply.bind('FileUploaded', function(upldr, file, object) {
        var res;
        try {
            res = eval(object.response);
        } catch (err) {
            res = eval('(' + object.response + ')');
        }
        if (!res || res.status != 1) {
            _ticket_reply_success();
            var msg = _lang_vars.upload_failed;
            if (res.error) msg = res.error;
            UIkit.notify({
                message: msg,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        } else {
            _ticket_reply_success();
        }
    });
    uploader_reply.bind('UploadComplete', function() {
        uploading = undefined;
        $('#btn_ticket_reply_loading').hide();
        $('#btn_ticket_reply').attr('disabled', false);
    });
    $('#btn_file_reply_del').click(function() {
        uploader_reply.splice(0);
        $('.taracot-attach-filename').hide();
        $('#btn_file_reply_del').hide();
        $('#btn_file_reply_attach').attr('disabled', false);
    });
};

/*******************************************************************

 Handlers

********************************************************************/

var btn_new_ticket_hander = function() {
    $('.support-area').hide();
    $('#support_area_new_ticket').show();
    if (!uploader_new) init_uploader_new();
    $('.taracot-form-ticket-control').each(function() {
        $(this).val('');
        $(this).prop("selectedIndex", 0);
        $(this).removeClass('uk-form-danger');
    });
    $('#btn_file_new_del').click();
    $('#ticket_error').hide();
    $('#ticket_subj').focus();
};

var btn_ticket_create_handler = function() {
    $('.taracot-form-ticket-control').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    $('#ticket_error').hide();
    var errors = [],
        form_data = {};
    $('.taracot-form-ticket-control').each(function() {
        var id = $(this).attr('id'),
            val = $.trim($(this).val());
        if (id == 'ticket_subj' && (!val || val.length > 100))
            errors.push('#' + id);
        if (id == 'ticket_msg' && (!val || val.length > 4096))
            errors.push('#' + id);
        form_data[id] = val;
    });
    if (errors.length) {
        $(errors[0]).focus();
        var err_msg = _lang_vars.form_contains_errors + ' (',
            err_labels = [];
        for (var error in errors) {
            $(errors[error]).addClass('uk-form-danger');
            err_labels.push('"' + $(errors[error]).parent().parent().find('label').text().replace(/\*/, '').trim() + '"');
        }
        err_msg += err_labels.join(', ') + ')';
        $('#ticket_error').html(err_msg);
        $('#ticket_error').fadeIn(500);
        $('html,body').animate({
                scrollTop: $("#ticket_error").offset().top - 20
            },
            'slow');
        return;
    }
    form_data.ticket_prio = parseInt($('#ticket_prio').val());
    $('#btn_ticket_create_loading').show();
    $('#btn_ticket_create').attr('disabled', true);
    $.ajax({
        type: 'POST',
        url: '/support/ajax/ticket/create',
        data: form_data,
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                if (uploader_new.files.length) {
                    uploader_new.settings.multipart_params = {
                        ticket_id: data.ticket_id
                    };
                    uploading = 1;
                    uploader_new.start();
                } else {
                    _ticket_create_success();
                }
            } else {
                var msg = _lang_vars.ajax_failed;
                if (data.err_msg) msg = data.err_msg;
                if (data.err_field) {
                    $('#' + data.err_field).addClass('uk-form-danger');
                    $('#' + data.err_field).focus();
                }
                $('#ticket_error').html(msg);
                $('#ticket_error').fadeIn(500);
                $('html,body').animate({
                        scrollTop: $("#ticket_error").offset().top - 20
                    },
                    'fast');
                $('#btn_ticket_create_loading').hide();
                $('#btn_ticket_create').attr('disabled', false);
            }
        },
        error: function() {
            $('#btn_ticket_create_loading').hide();
            $('#btn_ticket_create').attr('disabled', false);
            $('#ticket_error').html(_lang_vars.ajax_failed);
            $('#ticket_error').fadeIn(500);
            $('html,body').animate({
                    scrollTop: $("#ticket_error").offset().top - 20
                },
                'fast');
        }
    });
};

var table_row_click_handler = function() {
    var id = $(this).attr('rel');
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/support/ajax/ticket/load',
        data: {
            id: id
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                current_ticket_id = id;
                $('#support_replies').html('');
                $('.support-area').hide();
                $('#support_area_view_ticket').show();
                $('#support_h1_ticket_id').html(data.ticket.ticket_id);
                $('#support_h3_subj').html(data.ticket.ticket_subj);
                $('#support_box_msg').html(data.ticket.ticket_msg);
                $('#support_text_last_modified').html(moment(data.ticket.ticket_date).format('LLL'));
                $('#support_badge_status').html(_lang_vars.status_list[data.ticket.ticket_status - 1]);
                $('#support_attachment').hide();
                if (data.ticket.attachment) {
                    $('#support_attachment_link').attr('href', '/support/attachment?file=' + data.ticket.attachment);
                    $('#support_attachment_link').html(data.ticket.attachment);
                    $('#support_attachment').show();
                }
                $('#support_username_starter').html(data.users[data.ticket.user_id].realname || data.users[data.ticket.user_id].username);
                if (data.ticket.ticket_replies && data.ticket.ticket_replies.length) {
                    data.ticket.ticket_replies.sort(function(a, b) {
                        if (a.reply_date > b.reply_date)
                            return -1;
                        if (a.reply_date < b.reply_date)
                            return 1;
                        return 0;
                    });
                    for (var tr in data.ticket.ticket_replies) {
                        var attachment = '';
                        if (data.ticket.ticket_replies[tr].attachment)
                            attachment = '<div class="taracot-support-attachment"><i class="uk-icon-paperclip"></i>&nbsp;<a href="/support/attachment?file=' + data.ticket.ticket_replies[tr].attachment + '">' + data.ticket.ticket_replies[tr].attachment + '</a></div>';
                        $('#support_replies').append('<div class="uk-margin-top taracot-support-username"><i class="uk-icon-user"></i>&nbsp;' + (data.users[data.ticket.ticket_replies[tr].reply_user].realname || data.users[data.ticket.ticket_replies[tr].reply_user].username) + '&nbsp;<span class="taracot-support-reply-date">[' + moment(data.ticket.ticket_replies[tr].reply_date).format('LLL') + ']</span></div><div class="uk-panel uk-panel-box">' + data.ticket.ticket_replies[tr].reply_msg + '</div>' + attachment);
                    }
                }
            } else {
                var msg = _lang_vars.ajax_failed;
                if (data.err_msg) msg = data.err_msg;
                UIkit.notify({
                    message: msg,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
            UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        },
        complete: function() {
            $.loadingIndicator('hide');
        }
    });
};

var btn_ticket_create_cancel_handler = function() {
    $('.support-area').hide();
    $('#support_area_list').show();
};

var btn_ticket_reply_dlg_handler = function() {
    dlg_ticket_reply.show();
    if (!uploader_reply) init_uploader_reply();
    $('.taracot-form-ticket-control').each(function() {
        $(this).val('');
        $(this).prop("selectedIndex", 0);
        $(this).removeClass('uk-form-danger');
    });
    $('#ticket_reply_msg').focus();
    $('#btn_file_reply_del').click();
    $('#ticket_reply_error').hide();
};

var btn_ticket_reply_handler = function() {
    $('.taracot-form-ticket-control').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    $('#ticket_error').hide();
    var errors = [],
        form_data = {};
    form_data.ticket_reply_msg = $.trim($('#ticket_reply_msg').val());
    if (!form_data.ticket_reply_msg || form_data.ticket_reply_msg.length > 4096)
        errors.push('#ticket_reply_msg');
    if (errors.length) {
        $(errors[0]).focus();
        var err_msg = _lang_vars.form_contains_errors + ' (',
            err_labels = [];
        for (var error in errors) {
            $(errors[error]).addClass('uk-form-danger');
            err_labels.push('"' + $(errors[error]).parent().parent().find('label').text().replace(/\*/, '').trim() + '"');
        }
        err_msg += err_labels.join(', ') + ')';
        $('#ticket_reply_error').html(err_msg);
        $('#ticket_reply_error').fadeIn(500);
        return;
    }
    form_data.id = current_ticket_id;
    $('#btn_ticket_reply_loading').show();
    $('#btn_ticket_reply').attr('disabled', true);
    $.ajax({
        type: 'POST',
        url: '/support/ajax/ticket/reply',
        data: form_data,
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                if (uploader_reply.files.length) {
                    uploader_reply.settings.multipart_params = {
                        ticket_id: data.ticket_id,
                        reply_id: data.reply_date
                    };
                    uploading = 1;
                    uploader_reply.start();
                } else {
                    _ticket_reply_success();
                }
            } else {
                var msg = _lang_vars.ajax_failed;
                if (data.err_msg) msg = data.err_msg;
                if (data.err_field) {
                    $('#' + data.err_field).addClass('uk-form-danger');
                    $('#' + data.err_field).focus();
                }
                $('#ticket_reply_error').html(msg);
                $('#ticket_reply_error').fadeIn(500);
                $('html,body').animate({
                        scrollTop: $("#ticket_reply_error").offset().top - 20
                    },
                    'fast');
                $('#btn_ticket_reply_loading').hide();
                $('#btn_ticket_reply').attr('disabled', false);
            }
        },
        error: function() {
            $('#btn_ticket_reply_loading').hide();
            $('#btn_ticket_reply').attr('disabled', false);
            $('#ticket_reply_error').html(_lang_vars.ajax_failed);
            $('#ticket_reply_error').fadeIn(500);
        }
    });
};

var btn_ticket_reply_cancel_handler = function() {
    $('.support-area').hide();
    $('#support_area_list').show();
    $('#taracot_table').medvedTable('update');
};

/*******************************************************************

 Helper functions

********************************************************************/

var _ticket_create_success = function() {
    $('#btn_ticket_create_loading').hide();
    $('#btn_ticket_create').attr('disabled', false);
    $('.support-area').hide();
    $('#support_area_list').show();
    UIkit.notify({
        message: _lang_vars.ticket_create_success,
        status: 'success',
        timeout: 2000,
        pos: 'top-center'
    });
    $('#taracot_table').medvedTable('update');
};

var _ticket_reply_success = function() {
    $.ajax({
        type: 'POST',
        url: '/support/ajax/ticket/load',
        data: {
            id: current_ticket_id
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                $('#support_replies').html('');
                $('#support_text_last_modified').html(moment(data.ticket.ticket_date).format('LLL'));
                $('#support_badge_status').html(_lang_vars.status_list[data.ticket.ticket_status - 1]);
                if (data.ticket.ticket_replies && data.ticket.ticket_replies.length) {
                    data.ticket.ticket_replies.sort(function(a, b) {
                        if (a.reply_date > b.reply_date)
                            return -1;
                        if (a.reply_date < b.reply_date)
                            return 1;
                        return 0;
                    });
                    for (var tr in data.ticket.ticket_replies) {
                        var attachment = '';
                        if (data.ticket.ticket_replies[tr].attachment)
                            attachment = '<div class="taracot-support-attachment"><i class="uk-icon-paperclip"></i>&nbsp;<a href="/support/attachment?file=' + data.ticket.ticket_replies[tr].attachment + '">' + data.ticket.ticket_replies[tr].attachment + '</a></div>';
                        $('#support_replies').append('<div class="uk-margin-top taracot-support-username"><i class="uk-icon-user"></i>&nbsp;' + (data.users[data.ticket.ticket_replies[tr].reply_user].realname || data.users[data.ticket.ticket_replies[tr].reply_user].username) + '&nbsp;<span class="taracot-support-reply-date">[' + moment(data.ticket.ticket_replies[tr].reply_date).format('LLL') + ']</span></div><div class="uk-panel uk-panel-box">' + data.ticket.ticket_replies[tr].reply_msg + '</div>' + attachment);
                    }
                }
                UIkit.notify({
                    message: _lang_vars.ticket_reply_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
            } else {
                var msg = _lang_vars.ajax_failed;
                if (data.err_msg) msg = data.err_msg;
                UIkit.notify({
                    message: msg,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
            UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        },
        complete: function() {
            $('#btn_ticket_reply_loading').hide();
            $('.support-dialog-button').attr('disabled', false);
            dlg_ticket_reply.hide();
        }
    });
};

/*******************************************************************

 document.ready

********************************************************************/

$(document).ready(function() {
    moment.locale(current_locale);
    $('#btn_new_ticket').click(btn_new_ticket_hander);
    $('#btn_ticket_create').click(btn_ticket_create_handler);
    $('#btn_ticket_create_cancel').click(btn_ticket_create_cancel_handler);
    $('#btn_ticket_reply_dlg').click(btn_ticket_reply_dlg_handler);
    $('#btn_ticket_reply').click(btn_ticket_reply_handler);
    $('#btn_ticket_reply_cancel').click(btn_ticket_reply_cancel_handler);
    $('#taracot_table').medvedTable({
        col_count: 5,
        sort_mode: -1,
        sort_cell: 'ticket_date',
        taracot_table_url: '/support/ajax/list',
        process_rows: process_rows,
        error_message: _lang_vars.ajax_failed,
        row_click_handler: table_row_click_handler
    });
});
