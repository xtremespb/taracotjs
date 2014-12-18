$(document).ready(function() {
    // Init Magnific Popup
    $('.taracot-catalog-item-images-gallery').magnificPopup({
        delegate: 'a',
        type: 'image',
        gallery: {
            enabled: true
        }
    });
    $.extend(true, $.magnificPopup.defaults, _taracot_catalog_gallery_magnific_int);
    // Buy button handler
    $('.taracot-catalog-btn-buy').click(function() {
        location.href = '/catalog/cart?sku=' + _taracot_catalog_init_sku + '&cat=' + _taracot_catalog_init_path + '&find=' + (_taracot_catalog_init_find || '') + '&sort=' + _taracot_catalog_init_sort + '&show_all=' + _taracot_catalog_init_view + '&page=1&rnd=' + parseInt(Math.random() * 9000 + 1000);
    });
});
