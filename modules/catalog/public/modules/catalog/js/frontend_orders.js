var taracot_catalog_orders_tr_handler = function() {
    $('#taracot_catalog_orders_list').hide();
    $('#taracot_catalog_order_loading').show();
    $('#taracot_catalog_order_error').hide();
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
                $('#taracot_catalog_order_data').empty();
                var order_html = '';
                order_html += '<h3>' + _lang_vars.order_id + ': ' + data.order_id + '. ';
                order_html += _lang_vars.order_date + ': ' + data.order_timestamp + '</h3>';
                order_html += '<p>' + _lang_vars.items_ordered + ':</p><table class="uk-table"><thead><tr><th>' + _lang_vars.title + '</th><th class="taracot-catalog-cart-th-amount">' + _lang_vars.amount + '</th></tr></thead><tbody>';
                for (var i = 0; i < data.cart_data.length; i++)
                    order_html += '<tr><td>' + data.cart_data[i].title + '</td><td>' + data.cart_data[i].amount + '</td></tr>';
                order_html += '</tbody></table>';
                $('#taracot_catalog_order_data').html(order_html);
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
