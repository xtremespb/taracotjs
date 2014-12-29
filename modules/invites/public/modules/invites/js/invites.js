$.loadingIndicator();
var inv_modal = new UIkit.modal("#taracot-modal-view");

/* Configuration */

var process_rows = [ // Handlers for each column
    function(val, id) {
    	val = moment(val).format('L LT');
        return '<label><input type="checkbox" class="taracot-table-chbx" id="taracot-table-chbx-' + id + '" rel="taracot-item_' + val + '"></div>&nbsp;' + val + '</label>';
    },
    function(val, id) {
        return val;
    },
    function(val, id) {
    	if (val === null || val == '0') {
            val = '&mdash;';
        }
        return '<div style="text-align:center">' + val + '</div>';
    },
    function(val, id) {
        return '<div style="text-align:center"><button class="uk-icon-button uk-icon-gears taracot-tableitem-edit" id="taracot-btnedt-' + id + '" type="button"></button>&nbsp;<button class="uk-icon-button uk-icon-button-danger uk-icon-trash-o taracot-tableitem-delete" id="taracot-btndel-' + id + '" type="button"></button></div>';
    }
];

$('#btn-select-all').click(function() {
    $('.taracot-table-chbx').prop('checked', true);
});


$('#btn-select-none').click(function() {
    $('.taracot-table-chbx').prop('checked', false);
});

$('#btn-delete-selected').click(function() {
    var ids = [];
    $('.taracot-table-chbx').each(function(i, val) {
        if ($(val).prop('checked')) {
            ids.push($(val).attr('id').replace('taracot-table-chbx-', ''));
        }
    });
    if (ids.length > 0) {
        delete_item(ids);
    }
});

$('#btn-add-item').click(function() {
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/invites/data/generate',
        dataType: "json",
        success: function(data) {
            $.loadingIndicator('hide');
            if (data.status == 1) {
            	$('#taracot_table').medvedTable('update');
            	$('#invurl').val(window.location.origin + '/auth/register?inv=' + data.invcode);
            	if (data.invdate) $('#invdate').html(moment(data.invdate).format('L LT'));
            	$('#invused').html(data.invused);
            	if (data.invused == '0') $('#invused').html(_lang_vars.not_used);
            	inv_modal.show();
            	$('#invurl').focus();
            	$('#invurl').select();
            } else {
                UIkit.notify({
                    message: _lang_vars.ajax_failed,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
            $.loadingIndicator('hide');
            UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
});

var edit_item = function(id) {
	$.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/cp/invites/data/load',
        data: {
            id: id
        },
        dataType: "json",
        success: function(data) {
            $.loadingIndicator('hide');
            if (data.status == 1) {
            	$('#invurl').val(window.location.origin + '/auth/register?inv=' + data.data.invcode);
            	if (data.data.invdate) $('#invdate').html(moment(data.data.invdate).format('L LT'));
            	$('#invused').html(data.data.invused);
            	if (data.data.invused == '0') $('#invused').html(_lang_vars.not_used);
            	inv_modal.show();
            	$('#invurl').focus();
            	$('#invurl').select();
            } else {
            	$.loadingIndicator('hide');
                UIkit.notify({
                    message: _lang_vars.ajax_failed,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
        	$.loadingIndicator('hide');
            UIkit.notify({
                    message: _lang_vars.ajax_failed,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
        }
    });
};

var delete_item = function(ids) {
    if (confirm(_lang_vars.del_confirm)) {
        $('#taracot_table').medvedTable('loading_indicator_show');
        $.ajax({
            type: 'POST',
            url: '/cp/invites/data/delete',
            data: {
                ids: ids
            },
            dataType: "json",
            success: function(data) {
                $('#taracot_table').medvedTable('loading_indicator_hide');
                if (data.status == 1) {
                    $('#taracot_table').medvedTable('update');
                } else {
                    UIkit.notify({
                        message: _lang_vars.delete_err_msg,
                        status: 'danger',
                        timeout: 2000,
                        pos: 'top-center'
                    });
                }
            },
            error: function() {
                $('#taracot_table').medvedTable('loading_indicator_hide');
                UIkit.notify({
                    message: _lang_vars.delete_err_msg,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        });
    }
};

$(document).ready(function() {
	moment.locale(current_locale);
    $('#taracot_table').medvedTable({
        col_count: 4,
        sort_mode: -1,
        sort_cell: 'invdate',
        taracot_table_url: '/cp/invites/data/list',
        process_rows: process_rows,
        error_message: _lang_vars.ajax_failed
    });
});
