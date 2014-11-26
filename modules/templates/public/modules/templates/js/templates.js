var edit_modal = new $.UIkit.modal("#taracot-modal-edit");
var current_id = '';
var ckeditor;

/* Configuration */

var process_rows = [ // Handlers for each column
    function(val, id) {
        return val;
    },
    function(val, id) {
        return '<div style="text-align:center"><button class="uk-icon-button uk-icon-edit taracot-tableitem-edit" id="taracot-btnedt-' + id + '" type="button"></button></div>';
    }
];

var load_edit_data = function(id) {
    $.ajax({
        type: 'POST',
        url: '/cp/templates/data/load',
        data: {
            id: id
        },
        dataType: "json",
        success: function(data) {
            $('#taracot-modal-edit-loading').addClass('uk-hidden');
            if (data.status == 1) {
                $('#taracot-modal-edit-wrap').removeClass('uk-hidden');
                if (typeof data.data !== undefined) {
                    if (typeof data.data.pvalue !== undefined) {
                        $('#pvalue').val(data.data.pvalue);
                    } else {
                        $('#pvalue').val('');
                    }
                }
                $('#taracot-modal-edit-h1-edit').html(id.replace(/__/g, '/') + '.html');
                $('#pvalue').focus();
            } else {
                $('#taracot-modal-edit-loading-error').removeClass('uk-hidden');
            }
        },
        error: function() {
            $('#taracot-modal-edit-loading').addClass('uk-hidden');
            $('#taracot-modal-edit-loading-error').removeClass('uk-hidden');
        }
    });
};

var edit_item = function(id) {
    current_id = id;
    edit_modal.show();
    $('#taracot-modal-edit-wrap > form.uk-form > fieldset > div.uk-form-row > input').removeClass('uk-form-danger');
    $('#taracot-modal-edit-wrap > form.uk-form > fieldset > div.uk-form-row > input').val('');
    $('#taracot-modal-edit-wrap').addClass('uk-hidden');
    $('#taracot-modal-edit-loading').removeClass('uk-hidden');
    $('#taracot-modal-edit-loading-error').addClass('uk-hidden');
    load_edit_data(id);
};

$('#taracot-edit-btn-save').click(function() {
    $('#taracot-modal-edit-wrap > form.uk-form > fieldset > div.uk-form-row > input').removeClass('uk-form-danger');
    $('#taracot-modal-edit-wrap').addClass('uk-hidden');
    $('#taracot-modal-edit-loading').removeClass('uk-hidden');
    $('#taracot-modal-edit-loading-error').addClass('uk-hidden');
    $.ajax({
        type: 'POST',
        url: '/cp/templates/data/save',
        data: {
            pvalue: $('#pvalue').val(),
            id: current_id
        },
        dataType: "json",
        success: function(data) {
            $('#taracot-modal-edit-loading').addClass('uk-hidden');
            if (data.status == 1) {
                $('#taracot_table').medvedTable('update');
                edit_modal.hide();
                $.UIkit.notify({
                    message: _lang_vars.save_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
            } else {
                $('#taracot-modal-edit-wrap').removeClass('uk-hidden');
                var _errmsg = _lang_vars.form_err_msg;
                if (data.error) {
                    _errmsg = data.error;
                }
                if (data.err_fields && data.err_fields.length) {
                    var _focus = false;
                    for (var i = 0; i < data.err_fields.length; i++) {
                        $('#' + data.err_fields[i]).addClass('uk-form-danger');
                        if (!_focus) {
                            $('#' + data.err_fields[i]).focus();
                            _focus = true;
                        }
                    }
                }
                $.UIkit.notify({
                    message: _errmsg,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
            $('#taracot-modal-edit-loading').addClass('uk-hidden');
            $('#taracot-modal-edit-wrap').removeClass('uk-hidden');
            $.UIkit.notify({
                message: _lang_vars.form_err_msg,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
});

/*******************************************************************

 document.ready

********************************************************************/

$(document).ready(function() {
    $('#taracot_table').medvedTable({
        col_count: 2,
        sort_mode: 1,
        sort_cell: 'template',
        taracot_table_url: '/cp/templates/data/list',
        process_rows: process_rows,
        error_message: _lang_vars.ajax_failed
    });
    $('#taracot_table_filter').parent().hide();
    init_ckeditor();
});

/*******************************************************************

 Helper functions

********************************************************************/

var init_ckeditor = function() {
    ckeditor = $('#pvalue').ckeditor({
        filebrowserBrowseUrl: '/cp/browse',
        filebrowserImageBrowseUrl: '/cp/browse?io=1',
        filebrowserWindowWidth: 800,
        filebrowserWindowHeight: 500,
        allowedContent: true,
        fullPage: true,
        autoParagraph: false
    }).editor;
};
