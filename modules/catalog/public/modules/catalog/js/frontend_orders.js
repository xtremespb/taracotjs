var taracot_catalog_orders_tr_handler = function() {
    $('#taracot_catalog_orders_list').hide();
    $('#taracot_catalog_order_loading').show();
    $('#taracot_catalog_order_error').hide();
    $('#catalog_addr_edit').hide();
    var id = $(this).attr('rel');
    $.ajax({
        type: 'POST',
        url: '/catalog/ajax/order',
        dataType: "json",
        data: {
            id: id
        },
        success: function(data) {
            if (data.status == '1') {
                $('#taracot_catalog_order_loading').hide();
                $('#taracot_catalog_order_data_wrap').show();
                $('.catalog_order_data').empty();
                $('#catalog_order_id').html(data.order_id);
                $('#catalog_order_status').html(data.order_status_text);
                $('#catalog_order_status').removeClass('uk-badge-success uk-badge-warning uk-badge-danger');
                if (data.order_status == '0' || data.order_status == '2') $('#catalog_order_status').addClass('uk-badge-warning');
                if (data.order_status == '1' || data.order_status == '3') $('#catalog_order_status').addClass('uk-badge-success');
                if (data.order_status == '4') $('#catalog_order_status').addClass('uk-badge-danger');
                if (data.order_status == '0') $('#catalog_addr_edit').show();
                $('#catalog_order_date').html(data.order_timestamp);
                for (var i = 0; i < data.cart_data.length; i++) $('#catalog_orders_list').append('<tr><td>' + data.cart_data[i].title + '</td><td>' + data.cart_data[i].amount + '</td></tr>');
                $('#catalog_shipping_method').html(data.ship_method);
                var addr = '';
                addr += (data.shipping_address.ship_name || '') + "<br>";
                addr += (data.shipping_address.ship_street || '') + "<br>";
                addr += (data.shipping_address.ship_city || '') + "<br>";
                addr += (data.shipping_address.ship_region || '') + "<br>";
                addr += (data.shipping_address.ship_zip || '') + ' ';
                addr += (data.shipping_address.ship_country || '');
                $('#catalog_shipping_addr').html(addr);
                $('#catalog_shipping_phone').html(data.shipping_address.ship_phone || '');
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

$(document).ready(function() {
    // Orders list click handler
    $('.taracot-catalog-orders-tr').click(taracot_catalog_orders_tr_handler);
    // Continue shopping handler
    $('.taracot-catalog-orders-btn-back').click(function() {
        var _path = _taracot_catalog_init_path || '/';
        location.href = '/catalog' + _path + '?find=' + (_taracot_catalog_init_find || '') + '&sort=' + (_taracot_catalog_init_sort || 't') + '&show_all=' + (_taracot_catalog_init_view || 1) + '&page=' + (_taracot_catalog_init_page || 1) + '&rnd=' + parseInt(Math.random() * 900000 + 1000);
    });
    // Back to order list handler
    $('.taracot-catalog-orders-btn-back-to-list').click(function() {
        $('#taracot_catalog_orders_list').show();
        $('#taracot_catalog_order_data_wrap').hide();

    });
});
