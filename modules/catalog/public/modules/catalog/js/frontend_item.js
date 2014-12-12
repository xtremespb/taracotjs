$(document).ready(function() {
    $('.taracot-catalog-item-images-gallery').magnificPopup({
        delegate: 'a',
        type: 'image',
        gallery: {
            enabled: true
        }
    });
    $.extend(true, $.magnificPopup.defaults, _taracot_catalog_gallery_magnific_int);
});
