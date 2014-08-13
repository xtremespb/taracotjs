var items_per_page = 0;

$('#btn_search').click(function() {
    load_data(1);
});

var load_data = function(page) {
    $.ajax({
        type: 'POST',
        url: '/search/data',
        data: {
            query: $('#search_query').val()
        },
        dataType: "json",
        success: function(data) {
            if (data.status != 1) {

            } else {
                items_per_page = data.ipp;
                render_pagination(page, data.total);
                render_results(data.items);
            }
        },
        error: function() {

        }
    });
};

var render_results = function(data) {
	$('#search_results').html('');
	for (var i=0; i < data.length; i++) {
		var title = data[i][0], desc = data[i][1], url = data[i][2];
		$('#search_results').append('<div uk-data-margin><div><a href="' + url + '" class="taracot-search-res-title">' + title + '</a><div><a href="' + url + '" class="taracot-search-res-link">' + window.location.protocol + '//' + window.location.host + url + '</a></div><div class="taracot-search-res-desc uk-margin-bottom">' + desc + '</div></div>');
	}
};

var render_pagination = function(page, total) {
    var pgnt = '';
    $('#search_pagination').html(pgnt);
    page = parseInt(page);
    var max_pages = 10;
    var num_pages = Math.ceil(total / items_per_page);
    if (num_pages < 2) {
        return;
    }
    pgnt = '<ul class="uk-pagination uk-float-left" class="search-pgnt">';
    if (num_pages > max_pages) {
        if (page > 1) {
            pgnt += '<li class="search-pgnt-' + (page - 1) + '"><a href="#"><i class="uk-icon-angle-double-left"></i></a></li>';
        }
        if (page > 3) {
            pgnt += '<li class="search-pgnt-1"><a href="#">1</i></a></li>';
        }
        var _st = page - 2;
        if (_st < 1) {
            _st = 1;
        }
        if (_st - 1 > 1) {
            pgnt += '<li>...</li>';
        }
        var _en = page + 2;
        if (_en > num_pages) {
            _en = num_pages;
        }
        for (var i = _st; i <= _en; i++) {
            pgnt += '<li class="search-pgnt-' + i + '"><a href="#">' + i + '</a></li>';
        }
        if (_en < num_pages - 1) {
            pgnt += '<li><span>...</span></li>';
        }
        if (page <= num_pages - 3) {
            pgnt += '<li class="search-pgnt-' + num_pages + '"><a href="#">' + num_pages + '</a></li>';
        }
        if (page < num_pages) {
            pgnt += '<li class="search-pgnt-' + (page + 1) + '"><a href="#"><i class="uk-icon-angle-double-right"></i></a></li>';
        }
    } else {
        for (var j = 1; j <= num_pages; j++) {
            pgnt += '<li class="search-pgnt-' + j + '"><a href="#">' + j + '</a></li>';
        }
    }
    pgnt += '</ul>';
    $('#search_pagination').html(pgnt);
    $('.search-pgnt-' + page).html('<span>' + page + '</span>');
    $('.search-pgnt-' + page).addClass('uk-active');
    $('.search-pgnt > li').click(pagination_handler);
};

var pagination_handler = function() {

};
