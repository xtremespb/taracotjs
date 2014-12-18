var taracot_catlaog_search_btn_click_hander = function() {
    location.href = '/catalog' + _taracot_catalog_init_path + '?find=' + ($('.taracot-catalog-search-field').val() || '') + '&sort=' + _taracot_catalog_init_sort + '&show_all=' + _taracot_catalog_init_view + '&page=1&rnd=' + parseInt(Math.random() * 9000 + 1000);
};

$(document).ready(function() {
    $('.taracot-catlaog-search-btn').click(taracot_catlaog_search_btn_click_hander);
    $('.taracot-catalog-search-field').bind('keypress', function(e) {
        if (submitOnEnter(e)) {
            taracot_catlaog_search_btn_click_hander();
            e.preventDefault();
        }
    });
    $('.taracot-catalog-btn-buy').click(function() {
        var _taracot_catalog_init_find = $('.taracot-catalog-search-field').val(),
            _taracot_catalog_init_sku = $(this).attr('id').replace(/^taracot_catalog_buy_/, ''),
            _taracot_catalog_init_cat = $(this).attr('rel') || '/';
        location.href = '/catalog/cart?cat=' + _taracot_catalog_init_cat + '&sku=' + _taracot_catalog_init_sku + '&find=' + (_taracot_catalog_init_find || '') + '&sort=' + _taracot_catalog_init_sort + '&show_all=' + _taracot_catalog_init_view + '&page=1&rnd=' + parseInt(Math.random() * 9000 + 1000);
    });
});
