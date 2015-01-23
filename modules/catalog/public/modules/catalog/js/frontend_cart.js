var cart_items = [],
    subtotal_save = '';

var _process_cart = function(cart_values) {
    subtotal_save = $('#taracot_catalog_cart_subtotal').html();
    $('#taracot_catalog_cart_subtotal').html('<img src="/modules/catalog/images/loading_16x16.gif" alt="" width="16" height="16">');
    $('#taracot_catalog_cart_error').hide();
    $('.taracot-catalog-cart-input-amount').removeClass('uk-form-danger');
    $('#taracot_catalog_cart_btn_recalc').attr('disabled', true);
    $('.taracot-cart-item-del').attr('disabled', true);
    $.ajax({
        type: 'POST',
        url: '/catalog/ajax/cart',
        dataType: "json",
        data: {
            values: cart_values
        },
        success: function(data) {
            $('#taracot_catalog_cart_btn_recalc').attr('disabled', false);
            $('.taracot-cart-item-del').attr('disabled', false);
            if (data.status == 1) {
                if (data.subtotal) {
                    $('#taracot_catalog_cart_subtotal').html(data.subtotal);
                } else {
                    $('#taracot_catalog_cart_subtotal').html(subtotal_save);
                }
                if (data.cart && data.cart.length)
                    for (var c = 0; c < data.cart.length; c++) {
                        $('#cart_sum_' + data.cart[c].id).html(data.cart[c].sum);
                        $('#cart_amount_' + data.cart[c].id).val(data.cart[c].amount);
                        if (data.cart[c].amount == '0') $('#cart_sum_' + data.cart[c].id).parent().parent().remove();
                    }
                if (parseInt(data.cart_size) < 1) {
                    $('#taracot_catalog_cart_wrap').hide();
                    $('#taracot_catalog_cart_empty').show();
                }
            } else {
                $('#taracot_catalog_cart_subtotal').html(subtotal_save);
                $('#taracot_catalog_cart_error').html(_lang_vars.ajax_failed);
                $('#taracot_catalog_cart_error').show();
            }
        },
        error: function() {
            $('#taracot_catalog_cart_btn_recalc').attr('disabled', false);
            $('.taracot-cart-item-del').attr('disabled', false);
            $('#taracot_catalog_cart_subtotal').html(subtotal_save);
            $('#taracot_catalog_cart_error').html(_lang_vars.ajax_failed);
            $('#taracot_catalog_cart_error').show();
        }
    });
};

$(document).ready(function() {
    $('#taracot_catalog_cart_wrap').show();
    $('#taracot_catalog_cart_empty').hide();
    if (!init_cart.length || whitems_length === 0) {
        $('#taracot_catalog_cart_empty').show();
        $('#taracot_catalog_cart_wrap').hide();
    }
    for (var ic = 0; ic < init_cart.length; ic++) $('#cart_amount_' + init_cart[ic].sku).val(init_cart[ic].amount);
    $('.taracot-catalog-cart-input-amount').each(function() {
        var id = $(this).attr('id').replace(/^cart_amount_/, '');
        cart_items.push(id);
    });
    // Recalc button handler
    $('#taracot_catalog_cart_btn_recalc').click(function() {
        var cart_values = [];
        for (var i = 0; i < cart_items.length; i++) {
            var val = $.trim($('#cart_amount_' + cart_items[i]).val());
            if ($('#cart_amount_' + cart_items[i]).is(':visible') && (val === '' || isNaN(parseInt(val)) || parseInt(val) < 0 || parseInt(val) > 999)) {
                $('#cart_amount_' + cart_items[i]).addClass('uk-form-danger');
                $('#cart_amount_' + cart_items[i]).focus();
                $('#taracot_catalog_cart_error').html(_lang_vars.form_errors);
                $('#taracot_catalog_cart_error').show();
                return;
            }
            if ($('#cart_amount_' + cart_items[i]).is(':visible'))
                cart_values.push({
                    id: cart_items[i],
                    val: val
                });
        }
        _process_cart(cart_values);
    });
    // Delete item handler
    $('.taracot-cart-item-del').click(function() {
        var cart_values = [];
        for (var i = 0; i < cart_items.length; i++) {
            var val = $.trim($('#cart_amount_' + cart_items[i]).val()) || '0';
            if (cart_items[i] == $(this).attr('id').replace(/^cart_del_/, '')) val = '0';
            if (val === '' || isNaN(parseInt(val)) || parseInt(val) < 0 || parseInt(val) > 999) {
                $('#cart_amount_' + cart_items[i]).addClass('uk-form-danger');
                $('#cart_amount_' + cart_items[i]).focus();
                $('#taracot_catalog_cart_error').html(_lang_vars.form_errors);
                $('#taracot_catalog_cart_error').show();
                return;
            }
            cart_values.push({
                id: cart_items[i],
                val: val
            });
        }
        _process_cart(cart_values);
    });
    // Continue shopping handler
    $('.taracot-catalog-cart-btn-back').click(function() {
        var _path = _taracot_catalog_init_path || '/';
        location.href = '/catalog' + _path + '?find=' + (_taracot_catalog_init_find || '') + '&sort=' + (_taracot_catalog_init_sort || 't') + '&show_all=' + (_taracot_catalog_init_view || 1) + '&page=' + (_taracot_catalog_init_page || 1) + '&rnd=' + parseInt(Math.random() * 900000 + 1000);
    });
    // Checkout handler
    $('.taracot-catalog-cart-btn-checkout').click(function() {
        location.href = '/catalog/checkout?cat=' + (_taracot_catalog_init_path || '/') + '&find=' + (_taracot_catalog_init_find || '') + '&sort=' + (_taracot_catalog_init_sort || 't') + '&show_all=' + (_taracot_catalog_init_view || 1) + '&page=' + (_taracot_catalog_init_page || 1) + '&rnd=' + parseInt(Math.random() * 900000 + 1000);
    });
});
