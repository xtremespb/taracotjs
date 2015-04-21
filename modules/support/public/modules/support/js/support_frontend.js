$.loadingIndicator();

var process_rows = [

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
    uploader_new, uploader_reply, uploading;

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
                $('.support-area').hide();
                $('#support_area_view_ticket').show();
                $('#support_h1_ticket_id').html(data.ticket.ticket_id);
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

/*******************************************************************

 document.ready

********************************************************************/

$(document).ready(function() {
    $('#btn_new_ticket').click(btn_new_ticket_hander);
    $('#btn_ticket_create').click(btn_ticket_create_handler);
    $('#btn_ticket_create_cancel').click(btn_ticket_create_cancel_handler);
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