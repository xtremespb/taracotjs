var items_per_page = 0;
var current_search_query = '';

$('#btn_search').click(function() {
    $('#search_query').removeClass('uk-form-danger');
    if (!$('#search_query').val()) {
        $('#search_query').addClass('uk-form-danger');
        return;
    }
    current_search_query = $('#search_query').val();
    taracot_search_loading_indicator(true);
    load_data(1);
});

var load_data = function(page) {
    if (!page) page = 1;
    $.ajax({
        type: 'POST',
        url: '/search/data',
        data: {
            query: current_search_query,
            skip: (page - 1) * items_per_page
        },
        dataType: "json",
        success: function(data) {
            $('#search_query').focus();
            taracot_search_loading_indicator(false);
            if (data.status != 1) {
                $('#search_pagination').html('');
                if (data.error) {
                    $('#search_results').html(data.error);
                } else {
                    $('#search_results').html(_lang_vars.ajax_failed);
                }
            } else {
                items_per_page = data.ipp;
                render_pagination(page, data.total);
                render_results(data.items, data.total);
            }
        },
        error: function() {
            $('#search_query').focus();
            taracot_search_loading_indicator(false);
            $('#search_pagination').html('');
            $('#search_results').html(_lang_vars.ajax_failed);
        }
    });
};

var render_results = function(data, total) {
    $('#search_results').html('<div class="uk-margin-bottom">' + _lang_vars.total_results + ': ' + total + '</div>');
    for (var i = 0; i < data.length; i++) {
        var title = data[i][0],
            desc = data[i][1],
            url = data[i][2];
        $('#search_results').append('<div uk-data-margin><div><a href="' + url + '" class="taracot-search-res-title">' + title + '</a><div><a href="' + url + '" class="taracot-search-res-link">' + window.location.protocol + '//' + window.location.host + url + '</a></div><div class="taracot-search-res-desc uk-margin-bottom">' + desc + '</div></div>');
    }
    if (!data.length) {
        $('#search_results').html(_lang_vars.no_results);
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
    pgnt = '<ul class="uk-pagination uk-float-left search-pgnt">';
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
    if ($(this).hasClass('uk-active')) return;
    taracot_search_loading_indicator(true);
    load_data($(this).attr('class').replace('search-pgnt-', ''));
};

var taracot_search_loading_indicator = function(show) {
    if (show) {
        var destination = $('#search_results').offset();
        $('.taracot-loading').css({
            top: destination.top,
            left: destination.left,
            width: $('#search_results').width(),
            height: $('#search_results').height()
        });
        $('.taracot-loading').show();
        $('#search_pagination').hide();
        $('#btn_search').attr('disabled', true);
    } else {
        $('.taracot-loading').hide();
        $('#search_pagination').show();
        $('#btn_search').attr('disabled', false);
    }
};

$('#search_query').bind('keypress', function(e) {
    if (submitOnEnter(e) && !$('#btn_search').attr('disabled')) {
        $('#btn_search').click();
    }
});

/*******************************************************************

 document.ready

********************************************************************/

$(document).ready(function() {
    $('#search_query').focus();
    var _url_vars = getUrlVars();
    if (_url_vars && _url_vars.query) {
        $('#search_query').val(decodeURIComponent(_url_vars.query));
        $('#btn_search').click();
    }
});
