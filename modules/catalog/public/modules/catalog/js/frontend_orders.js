var edit_addr_dlg = new UIkit.modal("#taracot_modal_edit_addr"),
    shipping_address_data = {},
    current_id = '',
    current_num,
    _history_handler_disable = false;

var taracot_catalog_orders_tr_handler = function(evnt, _id) {
    $('#taracot_catalog_order_data_wrap').hide();
    $('#taracot_catalog_orders_list').hide();
    $('#taracot_catalog_order_loading').show();
    $('#taracot_catalog_order_error').hide();
    $('#catalog_cancel_order').hide();
    $('#catalog_addr_edit').hide();
    var id = _id || $(this).attr('rel');
    $.ajax({
        type: 'POST',
        url: '/catalog/ajax/order',
        dataType: "json",
        data: {
            id: id
        },
        success: function(data) {
            if (data.status == '1') {
                push_state({
                    mode: 'view',
                    order_id: id
                }, "?mode=view&order_id=" + id);
                current_id = id;
                if (data.order_id) current_num = data.order_id;
                $('#taracot_catalog_order_loading').hide();
                $('#taracot_catalog_order_data_wrap').show();
                $('.catalog_order_data').empty();
                $('#catalog_order_id').html(data.order_id);
                $('#catalog_order_status').html(data.order_status_text);
                $('#catalog_order_status').removeClass('uk-badge-success uk-badge-warning uk-badge-danger');
                if (data.order_status == '0' || data.order_status == '2') $('#catalog_order_status').addClass('uk-badge-warning');
                if (data.order_status == '1' || data.order_status == '3') $('#catalog_order_status').addClass('uk-badge-success');
                if (data.order_status == '4') $('#catalog_order_status').addClass('uk-badge-danger');
                if (data.order_status == '0') {
                    $('#catalog_addr_edit').show();
                    $('#catalog_cancel_order').show();
                }
                $('.taracot-catalog-checkout-btn-pay').show();
                if (!data.payment_enabled) $('.taracot-catalog-checkout-btn-pay').hide();
                $('#catalog_order_date').html(data.order_timestamp);
                for (var i = 0; i < data.cart_data.length; i++) $('#catalog_orders_list').append('<tr><td>' + data.cart_data[i].title + '</td><td>' + data.cart_data[i].amount + '</td></tr>');
                $('#catalog_shipping_method').html(data.ship_method);
                var addr = '';
                addr += (data.shipping_address.ship_name || '') + "<br>";
                addr += (data.shipping_address.ship_street || '') + "<br>";
                addr += (data.shipping_address.ship_city || '') + "<br>";
                addr += (data.shipping_address.ship_region || '') + "<br>";
                addr += (data.shipping_address.ship_zip || '') + ' ';
                addr += (data.shipping_address.ship_country_full || '');
                shipping_address_data.addr = data.shipping_address || {};
                shipping_address_data.comment = data.ship_comment || '';
                $('#catalog_shipping_addr').html(addr);
                $('#catalog_shipping_phone').html(data.shipping_address.ship_phone || '');
                $('#catalog_shipping_track').html(data.ship_track || '-');
                $('#catalog_shipping_comment').html(data.ship_comment || '');
                $('#catalog_order_subtotal').html(data.sum_subtotal || '0');
                $('#catalog_order_total').html(data.sum_total || '0');
                $('.catalog-currency').html(data.currency || '');
            } else {
                $('#taracot_catalog_order_error').html(data.error || _lang_vars.ajax_failed);
                $('#taracot_catalog_order_error').show();
                $('#taracot_catalog_order_loading').hide();
                $('#taracot_catalog_orders_list').show();
            }
        },
        error: function() {
            $('#taracot_catalog_order_error').html(_lang_vars.ajax_failed);
            $('#taracot_catalog_order_error').show();
            $('#taracot_catalog_order_loading').hide();
            $('#taracot_catalog_orders_list').show();
        }
    });
};

var taracot_catalog_checkout_btn_pay_handler = function() {
    if (!current_num) return;
    location.href = '/catalog/api/payment/invoice/' + current_num + '?rnd=' + Math.random().toString().replace('.', '');
};

var catalog_addr_edit_handler = function() {
    $('#taracot_catalog_addr_error').hide();
    $('.taracot-catalog-addr-field').removeClass('uk-form-danger');
    $('#addr_ship_name').val(shipping_address_data.addr.ship_name || '');
    $('#addr_ship_street').val(shipping_address_data.addr.ship_street || '');
    $('#addr_ship_city').val(shipping_address_data.addr.ship_city || '');
    $('#addr_ship_region').val(shipping_address_data.addr.ship_region || '');
    $('#addr_ship_country').val(shipping_address_data.addr.ship_country || '');
    $('#addr_ship_zip').val(shipping_address_data.addr.ship_zip || '');
    $('#addr_ship_phone').val(shipping_address_data.addr.ship_phone || '');
    $('#addr_ship_comment').val(shipping_address_data.comment || '');
    edit_addr_dlg.show();
    $('#addr_ship_name').focus();
};

var btn_save_addr_handler = function() {
    var ship_method = $('#addr_ship_method').val(),
        ship_name = $.trim($('#addr_ship_name').val()),
        ship_street = $.trim($('#addr_ship_street').val()),
        ship_city = $.trim($('#addr_ship_city').val()),
        ship_region = $.trim($('#addr_ship_region').val()),
        ship_country = $('#addr_ship_country').val(),
        ship_zip = $.trim($('#addr_ship_zip').val()),
        ship_phone = $('#addr_ship_phone').val().replace(/[^0-9\+]+/g, ''),
        ship_comment = $.trim($('#addr_ship_comment').val()),
        errors = [];
    if (!ship_name || !ship_name.length || ship_name.length > 80) errors.push('#addr_ship_name');
    if (!ship_street || !ship_street.length || ship_street.length > 120) errors.push('#addr_ship_street');
    if (!ship_city || !ship_city.length || ship_city.length > 120) errors.push('#addr_ship_city');
    if (!ship_region || !ship_region.length || ship_region.length > 120) errors.push('#addr_ship_region');
    if (!ship_country || !ship_country.match(/^[A-Z]{2}$/)) errors.push('#addr_ship_country');
    if (!ship_zip || !ship_zip.match(/^[0-9]{5,6}$/)) errors.push('#addr_ship_zip');
    if (!ship_phone || !ship_phone.match(/^[0-9\+]{1,40}$/)) errors.push('#addr_ship_phone');
    if (ship_comment && ship_comment.length > 1024) errors.push('#addr_ship_comment');
    if (errors.length) {
        for (var e = 0; e < errors.length; e++) {
            $(errors[e]).addClass('uk-form-danger');
            if (e === 0) $(errors[e]).focus();
        }
        $('#taracot_catalog_addr_error').html(_lang_vars.form_contains_errors);
        $('#taracot_catalog_addr_error').show();
        return;
    }
    $('#btn_save_addr').attr('disabled', true);
    $('#btn_save_addr_loading').show();
    $.ajax({
        type: 'POST',
        url: '/catalog/ajax/addr',
        dataType: "json",
        data: {
            id: current_id,
            ship_name: ship_name,
            ship_street: ship_street,
            ship_city: ship_city,
            ship_region: ship_region,
            ship_country: ship_country,
            ship_zip: ship_zip,
            ship_phone: ship_phone,
            ship_comment: ship_comment
        },
        success: function(data) {
            if (data.status == '1') {
                edit_addr_dlg.hide();
                taracot_catalog_orders_tr_handler(undefined, current_id);
            } else {
                $('#taracot_catalog_addr_error').html(data.error || _lang_vars.ajax_failed);
                $('#taracot_catalog_addr_error').show();
            }
        },
        error: function() {
            $('#taracot_catalog_addr_error').html(_lang_vars.ajax_failed);
            $('#taracot_catalog_addr_error').show();
        },
        complete: function() {
            $('#btn_save_addr').attr('disabled', false);
            $('#btn_save_addr_loading').hide();
        }
    });
};

var catalog_cancel_order_handler = function() {
    if (!confirm(_lang_vars.order_cancel_confirm)) return;
    $('#catalog_cancel_order').attr('disabled', true);
    $('#catalog_cancel_order_loading').show();
    $.ajax({
        type: 'POST',
        url: '/catalog/ajax/cancel',
        dataType: "json",
        data: {
            id: current_id
        },
        success: function(data) {
            if (data.status == '1') {
                edit_addr_dlg.hide();
                location.href = "/catalog/orders?rnd=" + Math.random().toString().replace('.', '');
            } else {
                alert(data.error || _lang_vars.ajax_failed);
            }
        },
        error: function() {
            alert(_lang_vars.ajax_failed);
        },
        complete: function() {
            $('#catalog_cancel_order').attr('disabled', false);
            $('#catalog_cancel_order_loading').hide();
        }
    });
};

$('.taracot-catalog-addr-field').bind('keypress', function(e) {
    if (submitOnEnter(e)) btn_save_addr_handler();
});

/*

 History API handler

*/

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
                $('#taracot_catalog_orders_list').show();
                $('#taracot_catalog_order_data_wrap').hide();
                break;
            case 'view':
                if (state.data.order_id)
                    taracot_catalog_orders_tr_handler(undefined, state.data.order_id);
                break;
        }
    }
};

var push_state = function(p1, p2) {
    _history_handler_disable = true;
    History.pushState(p1, save_title, p2);
    _history_handler_disable = false;
};


/*

 document.ready handler

*/

$(document).ready(function() {
    bind_history();
    history_handler();
    $('#taracot_catalog_addr_error').hide();
    $('.taracot-catalog-addr-field').removeClass('uk-form-danger');
    $('#btn_save_addr').attr('disabled', false);
    $('#catalog_cancel_order').attr('disabled', false);
    // Pay online button handler
    $('.taracot-catalog-checkout-btn-pay').click(taracot_catalog_checkout_btn_pay_handler);
    // Orders list click handler
    $('.taracot-catalog-orders-tr').click(taracot_catalog_orders_tr_handler);
    // Save address click handler
    $('#btn_save_addr').click(btn_save_addr_handler);
    // Cancel order click handler
    $('#catalog_cancel_order').click(catalog_cancel_order_handler);
    // Continue shopping handler
    $('.taracot-catalog-orders-btn-back').click(function() {
        var _path = _taracot_catalog_init_path || '/';
        location.href = '/catalog' + _path + '?find=' + (_taracot_catalog_init_find || '') + '&sort=' + (_taracot_catalog_init_sort || 't') + '&show_all=' + (_taracot_catalog_init_view || 1) + '&page=' + (_taracot_catalog_init_page || 1) + '&rnd=' + parseInt(Math.random() * 900000 + 1000);
    });
    // Back to order list handler
    $('.taracot-catalog-orders-btn-back-to-list').click(function() {
        push_state({
            mode: 'list'
        }, "?mode=list");
        $('#taracot_catalog_orders_list').show();
        $('#taracot_catalog_order_data_wrap').hide();
    });
    $('#catalog_addr_edit').click(catalog_addr_edit_handler);
    // Show an order if requested
    if ($.queryString.mode == 'view' && $.queryString.order_id) {
        push_state({
            mode: 'list',
            order_id: $.queryString.order_id
        }, "?mode=view&order_id=" + $.queryString.order_id);
        taracot_catalog_orders_tr_handler(undefined, $.queryString.order_id);
    }
});
