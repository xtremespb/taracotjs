$.loadingIndicator();

var dlg_ticket_reply = new UIkit.modal("#dlg_ticket_reply", {
        bgclose: false,
        keyboard: false
    }),
    dlg_locked = new UIkit.modal("#dlg_locked", {
        bgclose: false,
        keyboard: false
    }),
    process_rows = [
        function(val, id, data) {
            var color = 'grey';
            if (data[9]) color = 'red';
            var badge = '<i class="uk-icon-circle" style="color:' + color + '"></i>&nbsp;';
            return badge + val;
        },
        function(val, id) {
            return val || '&mdash;';
        },
        function(val, id, data) {
            if (!val) {
                return '&mdash;';
            } else {
                var badge_class = 'uk-badge-success';
                if (data[2] == data[3]) badge_class = 'uk-badge-warning';
                return '<span class="taracot-support-td-reply-count uk-badge ' + badge_class + '">' + data[8] + '</span>&nbsp;<span class="taracot-support-td-reply-user">' + val + '</span>';
            }
        },
        function(val, id) {
            return val;
        },
        function(val, id) {
            return _lang_vars.status_list[val - 1];
        },
        function(val, id) {
            return _lang_vars.prio_list[val - 1];
        },
        function(val, id) {
            return moment(val).format('L LT');
        }
    ],
    uploader_reply, uploading, current_ticket_id, current_ticket_data, _history_handler_disable;

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

var _show_ticket = function(data) {
    push_state({
        mode: 'view',
        ticket_id: current_ticket_id
    }, "?mode=view&ticket_id=" + current_ticket_id);
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
};

/*******************************************************************

 Handlers

********************************************************************/

var table_row_click_handler = function(evnt, _id) {
    var id = _id || $(this).attr('rel');
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
                current_ticket_data = data;
                if (data.ticket.locked_by && data.ticket.locked_by != current_username) {
                    $('#dlg_locked_user').html(data.ticket.locked_by);
                    return dlg_locked.show();
                }
                _show_ticket(data);
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
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/support/ajax/ticket/unlock',
        data: {
            id: current_ticket_id
        },
        dataType: "json",
        complete: function() {
            push_state({
                mode: 'list'
            }, "?mode=list");
            $('.support-area').hide();
            $('#support_area_list').show();
            $('#taracot_table').medvedTable('update');
            $.loadingIndicator('hide');
        }
    });
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

var btn_steal_lock_handler = function() {
    dlg_locked.hide();
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/support/ajax/ticket/unlock',
        data: {
            id: current_ticket_id
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                table_row_click_handler(undefined, current_ticket_id);
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

/*******************************************************************

 History API handler

********************************************************************/

var bind_history = function() {
    History.Adapter.bind(window, 'statechange', function() {
        history_handler();
    });
};

var history_handler = function() {
    if (_history_handler_disable) return;
    var state = History.getState();
    if (state.data.mode) {
        switch (state.data.mode) {
            case 'list':
                $('.support-area').hide();
                $('#support_area_list').show();
                break;
            case 'new':
                btn_new_ticket_hander();
                break;
            case 'view':
                if (state.data.ticket_id)
                    table_row_click_handler(undefined, state.data.ticket_id);
                break;
        }
    }
};

var push_state = function(p1, p2) {
    _history_handler_disable = true;
    History.pushState(p1, save_title, p2);
    _history_handler_disable = false;
};


/*******************************************************************

 document.ready

********************************************************************/

$(document).ready(function() {
    bind_history();
    if (!History.getState().data || !History.getState().data.mode) {
        if ($.queryString.mode) {
            push_state({
                mode: $.queryString.mode,
                ticket_id: $.queryString.ticket_id || ''
            }, "?mode=" + $.queryString.mode + "&ticket_id=" + $.queryString.ticket_id || '');
        }
    }
    history_handler();
    moment.locale(current_locale);
    $('#btn_ticket_reply_dlg').click(btn_ticket_reply_dlg_handler);
    $('#btn_ticket_reply').click(btn_ticket_reply_handler);
    $('#btn_ticket_reply_cancel').click(btn_ticket_reply_cancel_handler);
    $('#btn_steal_lock').click(btn_steal_lock_handler);
    $('#taracot_table').medvedTable({
        col_count: 7,
        sort_mode: -1,
        sort_cell: 'ticket_id',
        taracot_table_url: '/support/ajax/dashboard/list',
        process_rows: process_rows,
        error_message: _lang_vars.ajax_failed,
        row_click_handler: table_row_click_handler
    });
    var socket = io();
    socket.on('connect', function() {
        socket.emit('set_session', current_user.id, current_user.id_hash);
    });
    socket.on('ticket_changed', function(msg) {
        if (msg.ticket_id) {
            if ($('#taracot_table > tbody > tr[rel="' + msg.ticket_id + '"] > td:first > i'))
                if (msg.locked_by) {
                    $('#taracot_table > tbody > tr[rel="' + msg.ticket_id + '"] > td:first > i').css('color', 'red');
                } else {
                    $('#taracot_table > tbody > tr[rel="' + msg.ticket_id + '"] > td:first > i').css('color', 'grey');
                }
            if (msg.ticket_date && $('#taracot_table > tbody > tr[rel="' + msg.ticket_id + '"] > td:eq( 6 )'))
                $('#taracot_table > tbody > tr[rel="' + msg.ticket_id + '"] > td:eq( 6 )').html(moment(msg.ticket_date).format('L LT'));
            if (msg.ticket_status)
                $('#taracot_table > tbody > tr[rel="' + msg.ticket_id + '"] > td:eq( 4 )').html(_lang_vars.status_list[msg.ticket_status - 1]);
            if (msg.reply_user) {
                var count = parseInt($('#taracot_table > tbody > tr[rel="' + msg.ticket_id + '"] > td:eq( 2 ) > span.taracot-support-td-reply-count').html()) || 0,
                    origin_user = $('#taracot_table > tbody > tr[rel="' + msg.ticket_id + '"] > td:eq( 1 )').html();
                count++;
                var badge_class = 'uk-badge-success';
                if (msg.reply_user == origin_user) badge_class = 'uk-badge-warning';
                $('#taracot_table > tbody > tr[rel="' + msg.ticket_id + '"] > td:eq( 2 )').html('<span class="taracot-support-td-reply-count uk-badge ' + badge_class + '">' + count + '</span>&nbsp;<span class="taracot-support-td-reply-user">' + msg.reply_user + '</span>');
            }
        }
    });
});
