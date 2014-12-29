var edit_modal = new UIkit.modal("#taracot-modal-edit"),
    current_id = '',
    current_shipping_address = {};

/* Configuration */

var process_rows = [ // Handlers for each column
    function(val, id) {
        return '<label><input type="checkbox" class="taracot-table-chbx" id="taracot-table-chbx-' + id + '" rel="taracot-item_' + val + '"></div>&nbsp;' + val + '</label>';
    },
    function(val, id) {
        return '<div>' + val + '</div>';
    },
    function(val, id) {
        return '<div>' + val + '</div>';
    },
    function(val, id) {
        return '<div>' + val + '</div>';
    },
    function(val, id) {
        return '<div style="text-align:center"><button class="uk-icon-button uk-icon-edit taracot-tableitem-edit" id="taracot-btnedt-' + id + '" type="button"></button>&nbsp;<button class="uk-icon-button uk-icon-button-danger uk-icon-trash-o taracot-tableitem-delete" id="taracot-btndel-' + id + '" type="button"></button></div>';
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

var load_edit_data = function(id) {
    $.ajax({
        type: 'POST',
        url: '/cp/catalog_orders/data/load',
        data: {
            id: id
        },
        dataType: "json",
        success: function(data) {
            $('#taracot-modal-edit-loading').addClass('uk-hidden');
            if (data.status == 1) {
                $('.taracot-buttons-area').show();
                $('#catalog_cart_add_btn > i').show();
                $('#catalog_cart_add_btn > img').hide();
                $('#catalog_cart_add_btn').attr('disabled', false);
                $('#catalog_cart_add_sku').removeClass('uk-form-danger');
                $('.order-edit-field').each(function() {
                    $(this).val('');
                    $(this)[0].selectedIndex = 0;
                });
                $('#taracot-modal-edit-wrap').removeClass('uk-hidden');
                if (data.data) data = data.data;
                if (data.order_id) $('#order_id').html(data.order_id);
                if (data.order_timestamp) $('#order_date').html(data.order_timestamp);
                if (data.order_status) $('#order_status').val(data.order_status);
                if (data.ship_method) $('#shipping_method').val(data.ship_method);
                if (data.sum_subtotal) $('#sum_subtotal').val(data.sum_subtotal);
                if (data.sum_total) $('#sum_total').val(data.sum_total);
                if (data.sum_total) $('#sum_total').val(data.sum_total);
                if (data.ship_comment) $('#shipping_comment').val(data.ship_comment);
                if (data.shipping_address) {
                    if (data.shipping_address.ship_name) $('#ship_name').val(data.shipping_address.ship_name);
                    if (data.shipping_address.ship_street) $('#ship_street').val(data.shipping_address.ship_street);
                    if (data.shipping_address.ship_city) $('#ship_city').val(data.shipping_address.ship_city);
                    if (data.shipping_address.ship_region) $('#ship_region').val(data.shipping_address.ship_region);
                    if (data.shipping_address.ship_country) $('#ship_country').val(data.shipping_address.ship_country);
                    if (data.shipping_address.ship_zip) $('#ship_zip').val(data.shipping_address.ship_zip);
                    if (data.shipping_address.ship_phone) $('#ship_phone').val(data.shipping_address.ship_phone);
                }
                $('#edit_order_general_li').click();
                $('#order_cart_body').empty();
                var warehouse_titles = data.warehouse_titles || {};
                if (data.cart_data)
                    for (var key in data.cart_data) {
                        var title = warehouse_titles[key] || key,
                            amount = data.cart_data[key];
                        $('#order_cart_body').append('<tr><td class="order_cart_title" rel="' + key + '">' + title + ' [' + key + ']</td><td class="order_cart_amount"><input class="uk-width-1-1 uk-form-small" id="cart_item_' + key + '" value="' + amount + '"></td><td class="order_cart_del"><button class="uk-button uk-button-mini uk-button-danger order-cart-del-btn"><i class="uk-icon-trash-o"></i></button></td></tr>');
                    }
                $('.order-cart-del-btn').unbind();
                $('.order-cart-del-btn').click(order_cart_del_btn_handler);
                $('#order_status').focus();
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

var order_cart_del_btn_handler = function() {
    $(this).parent().parent().remove();
};

$('#taracot_edit_btn_cancel_order').click(function() {
	if (!confirm(_lang_vars.order_cancel_confirm)) return;
	$('#taracot-modal-edit-wrap').addClass('uk-hidden');
    $('#taracot-modal-edit-loading').removeClass('uk-hidden');
    $('#taracot-modal-edit-loading-error').addClass('uk-hidden');
    $('.taracot-buttons-area').hide();
    $.ajax({
        type: 'POST',
        url: '/cp/catalog_orders/data/cancel',
        data: {
            id: current_id
        },
        dataType: "json",
        success: function(data) {
            $('#taracot-modal-edit-loading').addClass('uk-hidden');
            if (data.status == 1) {
                $('#taracot_table').medvedTable('update');
                edit_modal.hide();
                UIkit.notify({
                    message: _lang_vars.save_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
            } else {
                $('#taracot-modal-edit-wrap').removeClass('uk-hidden');
                $('.taracot-buttons-area').show();
                var _errmsg = _lang_vars.form_err_msg;
                if (data.error) {
                    _errmsg = data.error;
                }
                UIkit.notify({
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
            $('.taracot-buttons-area').show();
            UIkit.notify({
                message: _lang_vars.form_err_msg,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }

    });
});

$('#catalog_cart_add_btn').click(function() {
    $('#catalog_cart_add_sku').removeClass('uk-form-danger');
    var sku = $.trim($('#catalog_cart_add_sku').val());
    if (!sku.match(/^[A-Za-z0-9_\-\.]{1,80}$/)) return $('#catalog_cart_add_sku').addClass('uk-form-danger') && $('#catalog_cart_add_sku').focus();
    $('#catalog_cart_add_btn > i').hide();
    $('#catalog_cart_add_btn > img').show();
    $('#catalog_cart_add_btn').attr('disabled', true);
    $.ajax({
        type: 'POST',
        url: '/cp/catalog_orders/data/sku',
        data: {
            sku: sku
        },
        dataType: "json",
        success: function(data) {
            var title = sku;
            if (data.status == 1 && data.title) title = data.title;
            $('#order_cart_body').append('<tr><td class="order_cart_title" rel="' + sku + '">' + title + ' [' + sku + ']</td><td class="order_cart_amount"><input class="uk-width-1-1 uk-form-small" id="cart_item_' + sku + '" value="1"></td><td class="order_cart_del"><button class="uk-button uk-button-mini uk-button-danger order-cart-del-btn"><i class="uk-icon-trash-o"></i></button></td></tr>');
            $('.order-cart-del-btn').unbind();
            $('.order-cart-del-btn').click(order_cart_del_btn_handler);
        },
        error: function() {
            $('#catalog_cart_add_sku').addClass('uk-form-danger');
            $('#catalog_cart_add_sku').focus();
        },
        complete: function() {
            $('#catalog_cart_add_btn > i').show();
            $('#catalog_cart_add_btn > img').hide();
            $('#catalog_cart_add_btn').attr('disabled', false);
        }
    });
});

var edit_item = function(id) {
    current_id = id;
    edit_modal.show();
    $('#taracot-modal-edit-wrap > form.uk-form > fieldset > div.uk-form-row > input').removeClass('uk-form-danger');
    $('#taracot-modal-edit-wrap > form.uk-form > fieldset > div.uk-form-row > input').val('');
    $('#taracot-modal-edit-wrap').addClass('uk-hidden');
    $('#taracot-modal-edit-loading').removeClass('uk-hidden');
    $('#taracot-modal-edit-loading-error').addClass('uk-hidden');
    $('#order_save_error').hide();
    $('.taracot-buttons-area').hide();
    load_edit_data(id);
};

$('#taracot-edit-btn-save').click(function() {
    $('#order_save_error').hide();
    $('.order-edit-field').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    var errors = [],
        order_status = parseInt($('#order_status').val()),
        sum_subtotal = parseFloat($('#sum_subtotal').val()),
        sum_total = parseFloat($('#sum_total').val()),
        shipping_method = $('#shipping_method').val(),
        ship_name = $.trim($('#ship_name').val()),
        ship_street = $.trim($('#ship_street').val()),
        ship_city = $.trim($('#ship_city').val()),
        ship_region = $.trim($('#ship_region').val()),
        ship_country = $('#ship_country').val(),
        ship_zip = $.trim($('#ship_zip').val()),
        ship_phone = $.trim($('#ship_phone').val()),
        ship_comment = $.trim($('#shipping_comment').val()),
        cart_data = {};
    // Validation
    if (!sum_subtotal || sum_subtotal < 0) errors.push('#sum_subtotal');
    if (!sum_total || sum_total < 0) errors.push('#sum_total');
    if (ship_name && (!ship_name.length || ship_name.length > 80)) errors.push('#ship_name');
    if (ship_street && (!ship_street.length || ship_street.length > 120)) errors.push('#ship_street');
    if (ship_city && (!ship_city.length || ship_city.length > 120)) errors.push('#ship_city');
    if (ship_region && (!ship_region.length || ship_region.length > 120)) errors.push('#ship_region');
    if (ship_country && (!ship_country.match(/^[A-Z]{2}$/))) errors.push('#ship_country');
    if (ship_zip && (!ship_zip.match(/^[0-9]{5,6}$/))) errors.push('#ship_zip');
    if (ship_phone && (!ship_phone.match(/^[0-9\+]{1,40}$/))) errors.push('#ship_phone');
    if (ship_comment && ship_comment.length > 1024) errors.push('#ship_comment');
    if (errors.length) {
        var _focus = false;
        for (var e = 0; e < errors.length; e++)
            $(errors[e]).addClass('uk-form-danger');
        if (!_focus) {
            $(errors[e]).focus();
            _focus = true;
        }
        return $('#order_save_error').show();
    }
    $('#order_cart_body').children().each(function() {
        var sku = $(this).children(':first').attr('rel'),
            amount = parseInt($('#cart_item_' + sku).val()) || 1;
        cart_data[sku] = amount;
    });
    $('#taracot-modal-edit-wrap').addClass('uk-hidden');
    $('#taracot-modal-edit-loading').removeClass('uk-hidden');
    $('#taracot-modal-edit-loading-error').addClass('uk-hidden');
    $('.taracot-buttons-area').hide();
    $.ajax({
        type: 'POST',
        url: '/cp/catalog_orders/data/save',
        data: {
            id: current_id,
            order_status: order_status,
            sum_subtotal: sum_subtotal,
            sum_total: sum_total,
            shipping_method: shipping_method,
            shipping_address: {
                ship_name: ship_name,
                ship_street: ship_street,
                ship_city: ship_city,
                ship_region: ship_region,
                ship_country: ship_country,
                ship_zip: ship_zip,
                ship_phone: ship_phone
            },
            ship_comment: ship_comment,
            cart_data: cart_data
        },
        dataType: "json",
        success: function(data) {
            $('#taracot-modal-edit-loading').addClass('uk-hidden');
            if (data.status == 1) {
                $('#taracot_table').medvedTable('update');
                edit_modal.hide();
                UIkit.notify({
                    message: _lang_vars.save_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
            } else {
                $('#taracot-modal-edit-wrap').removeClass('uk-hidden');
                $('.taracot-buttons-area').show();
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
                UIkit.notify({
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
            $('.taracot-buttons-area').show();
            UIkit.notify({
                message: _lang_vars.form_err_msg,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }

    });
});

var delete_item = function(ids) {
    var users = [];
    for (var i = 0; i < ids.length; i++) {
        users.push($('#taracot-table-chbx-' + ids[i]).attr('rel').replace('taracot-item_', ''));
    }
    if (confirm(_lang_vars.del_confirm + "\n\n" + users.join(', '))) {
        $('#taracot_table').medvedTable('loading_indicator_show');
        $.ajax({
            type: 'POST',
            url: '/cp/catalog_orders/data/delete',
            data: {
                ids: ids
            },
            dataType: "json",
            success: function(data) {
                $('#taracot_table').medvedTable('loading_indicator_hide');
                if (data.status == 1) {
                    // load_data(current_page);
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

$('.taracot-edit-form > fieldset > .uk-form-row > input, .taracot-edit-form > fieldset > .uk-form-row > select').bind('keypress', function(e) {
    if (submitOnEnter(e)) {
        $('#taracot-edit-btn-save').click();
    }
});

$(document).ready(function() {
    $('#taracot_table').medvedTable({
        col_count: 5,
        sort_mode: -1,
        sort_cell: 'order_timestamp',
        taracot_table_url: '/cp/catalog_orders/data/list',
        process_rows: process_rows,
        error_message: _lang_vars.ajax_failed
    });
});
