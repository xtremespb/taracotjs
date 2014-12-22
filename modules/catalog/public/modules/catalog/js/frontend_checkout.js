var _catalog_addr_required = false;

var catalog_checkout_ship_method_handler = function() {
    for (var i = 0; i < _taracot_catalog_ship_methods.length; i++)
        if (_taracot_catalog_ship_methods[i].id == $('#catalog_checkout_ship_method').val()) {
            if (_taracot_catalog_ship_methods[i].id.match(/_noaddr$/i)) {
                $('#taracot_checkout_ship_address').hide();
                _catalog_addr_required = false;
            } else {
                $('#taracot_checkout_ship_address').show();
                _catalog_addr_required = true;
            }
            var sm_amount = _taracot_catalog_ship_methods[i].amnt,
                sm_weight = _taracot_catalog_ship_methods[i].weight,
                ship_cost = _taracot_catalog_ship_methods[i].price;
            if (sm_weight > 0 && _taracot_catalog_total_weight > 0) ship_cost *= Math.ceil(_taracot_catalog_total_weight / sm_weight);
            if (sm_amount > 0) ship_cost *= Math.ceil(_taracot_catalog_total_amount / sm_amount);
            $('#taracot_catalog_cart_total_shipment').html(ship_cost);
            var total = parseFloat(parseFloat(ship_cost) + parseFloat(_taracot_catalog_subtotal));
            $('#taracot_catalog_cart_total_sum').html(total);
        }
};

var taracot_catalog_checkout_btn_checkout_handler = function() {
    $('#taracot_catalog_addr_error').hide();
    $('.taracot-catalog-addr-field').removeClass('uk-form-danger');
    var ship_method = $('#catalog_checkout_ship_method').val(),
        ship_name = $.trim($('#catalog_checkout_ship_name').val()),
        ship_street = $.trim($('#catalog_checkout_ship_street').val()),
        ship_city = $.trim($('#catalog_checkout_ship_city').val()),
        ship_region = $.trim($('#catalog_checkout_ship_region').val()),
        ship_country = $('#catalog_checkout_ship_country').val(),
        ship_zip = $.trim($('#catalog_checkout_ship_zip').val()),
        ship_phone = $('#catalog_checkout_ship_phone').val().replace(/[^0-9\+]+/g, ''),
        ship_comment = $.trim($('#catalog_checkout_ship_comment').val()),
        errors = [];
    if (_catalog_addr_required) {
        if (!ship_name || !ship_name.length || ship_name.length > 80) errors.push('#catalog_checkout_ship_name');
        if (!ship_street || !ship_street.length || ship_street.length > 120) errors.push('#catalog_checkout_ship_street');
        if (!ship_city || !ship_city.length || ship_city.length > 120) errors.push('#catalog_checkout_ship_city');
        if (!ship_region || !ship_region.length || ship_region.length > 120) errors.push('#catalog_checkout_ship_region');
        if (!ship_country || !ship_country.match(/^[A-Z]{2}$/)) errors.push('#catalog_checkout_ship_country');
        if (!ship_zip || !ship_zip.match(/^[0-9]{5,6}$/)) errors.push('#catalog_checkout_ship_zip');
        if (!ship_phone || !ship_phone.match(/^[0-9\+]{1,40}$/)) errors.push('#catalog_checkout_ship_phone');
        if (ship_comment && ship_comment.length > 1024) errors.push('#catalog_checkout_ship_comment');
        if (errors.length) {
            for (var e = 0; e < errors.length; e++) {
                $(errors[e]).addClass('uk-form-danger');
                if (e === 0) $(errors[e]).focus();
            }
            $('#taracot_catalog_addr_error').show();
            $('html,body').animate({
                    scrollTop: $("#taracot_catalog_addr_error").offset().top
                },
                'slow');
            return;
        }
    }
    $('.taracot-catalog-checkout-ajax').show();
    $('.taracot-catalog-checkout-btn-checkout').attr('disabled', true);
    $.ajax({
        type: 'POST',
        url: '/catalog/ajax/checkout',
        dataType: "json",
        data: {
            ship_method: ship_method,
            ship_name: ship_name,
            ship_street: ship_street,
            ship_city: ship_city,
            ship_region: ship_region,
            ship_country: ship_country,
            ship_zip: ship_zip,
            ship_phone: ship_phone,
            ship_comment: ship_comment,
            total_cost: $('#taracot_catalog_cart_total_sum').html()
        },
        success: function(data) {

        },
        error: function() {

        },
        complete: function() {
            $('.taracot-catalog-checkout-ajax').hide();
            $('.taracot-catalog-checkout-btn-checkout').attr('disabled', false);
        }
    });

};

$(document).ready(function() {
    $('#taracot_catalog_checkout_wrap').show();
    $('#taracot_catalog_checkout_empty').hide();
    $('#catalog_checkout_ship_method').change(catalog_checkout_ship_method_handler);
    catalog_checkout_ship_method_handler();
    if (navigator.language) {
        var _country = navigator.language;
        if (navigator.language.length > 2) _country = navigator.language.slice(-2);
        $('#catalog_checkout_country').val(_country);
    }
    $('.taracot-catalog-checkout-btn-checkout').attr('disabled', false);
    if (_taracot_catalog_missing_items.length) $('.taracot-catalog-checkout-btn-checkout').attr('disabled', true);
    $('.taracot-catalog-checkout-btn-checkout').click(taracot_catalog_checkout_btn_checkout_handler);
});
