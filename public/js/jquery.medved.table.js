/* ****************************************************************** */
/* Taracot jQuery Dynamic Table */
/* ****************************************************************** */

;
(function($) {

    /* Configuration */

    var options = jQuery.extend({
        col_count: 0, // Number of columns
        sort_mode: 1, // Sorting mode, -1 = DESC, 1 = ASC
        sort_cell: '', // Default sorting column
        taracot_table_url: '', // URL to load the data from
        error_message: 'Server request failed',
        process_rows: [], // Processing functions for each row
        row_click_handler: undefined
    }, options);

    /* System variables, do not modify */

    var current_page = 1;
    var autocomplete_flag = false;
    var autocomplete_timer;
    var items_per_page = 0;
    var table_id = '';

    /* Methods */

    var methods = {
        init: function(_options) {
            options = _options;
            table_id = $(this).attr('id');
            load_data(1);
            $('#' + table_id + '_filter').on('input', function() {
                search_event();
            });
            $('.' + table_id + '_sortable').click(function() {
                sort_event(this);
            });
        },
        update: function() {
            load_data(current_page);
        },
        loading_indicator_show: function() {
            taracot_table_loading_indicator(true);
        },
        loading_indicator_hide: function() {
            taracot_table_loading_indicator(false);
        }
    };

    /* Handlers */

    var taracot_tableitem_edit_handler = function() {
        var id = $(this).attr('id').replace('taracot-btnedt-', '');
        $('#taracot-modal-edit-h1-edit').removeClass('uk-hidden');
        $('#taracot-modal-edit-h1-add').addClass('uk-hidden');
        edit_item(id);
    };

    var taracot_tableitem_delete_handler = function() {
        delete_item([$(this).attr('id').replace('taracot-btndel-', '')]);
    };

    /* Render the table rows */

    var render_table = function(data) {
        $('#' + table_id + ' > tbody').empty();
        if (typeof data == 'undefined' || !data.length) {
            $('#' + table_id + ' > tbody').append('<tr><td colspan="' + options.col_count + '">' + _lang_vars.no_res + '</td></tr>');
            return;
        }
        for (var i = 0; i < data.length; i++) {
            var _id = data[i][0],
                table_data = '<tr rel="' + _id + '">';
            for (var j = 1; j <= options.col_count; j++) {
                if (j < data[i].length) {
                    table_data += '<td style="vertical-align:middle">' + options.process_rows[j - 1](data[i][j], _id, data[i]) + '</td>';
                } else {
                    table_data += '<td style="vertical-align:middle">' + options.process_rows[j - 1]('', _id, data[i]) + '</td>';
                }
            }
            table_data += '</tr>';
            $('#' + table_id + ' > tbody').append(table_data);
            $('.taracot-tableitem-edit').unbind();
            $('.taracot-tableitem-edit').click(taracot_tableitem_edit_handler);
            $('.taracot-tableitem-delete').unbind();
            $('.taracot-tableitem-delete').click(taracot_tableitem_delete_handler);
        }
        if (options.row_click_handler) {
            $('#' + table_id + ' > tbody > tr').unbind();
            $('#' + table_id + ' > tbody > tr').click(options.row_click_handler);
        }
    };

    /* Render the pagination */

    var render_pagination = function(page, total) {
        var pgnt = '';
        $('#' + table_id + '_pagination').html(pgnt);
        page = parseInt(page);
        var max_pages = 10;
        var num_pages = Math.ceil(total / items_per_page);
        if (num_pages < 2) {
            return;
        }
        pgnt = '<ul class="uk-pagination uk-float-left" id="taracot-pgnt">';
        if (num_pages > max_pages) {
            if (page > 1) {
                pgnt += '<li id="taracot-pgnt-' + (page - 1) + '"><a href="#"><i class="uk-icon-angle-double-left"></i></a></li>';
            }
            if (page > 3) {
                pgnt += '<li id="taracot-pgnt-1"><a href="#">1</i></a></li>';
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
                pgnt += '<li id="taracot-pgnt-' + i + '"><a href="#">' + i + '</a></li>';
            }
            if (_en < num_pages - 1) {
                pgnt += '<li><span>...</span></li>';
            }
            if (page <= num_pages - 3) {
                pgnt += '<li id="taracot-pgnt-' + num_pages + '"><a href="#">' + num_pages + '</a></li>';
            }
            if (page < num_pages) {
                pgnt += '<li id="taracot-pgnt-' + (page + 1) + '"><a href="#"><i class="uk-icon-angle-double-right"></i></a></li>';
            }
        } else {
            for (var j = 1; j <= num_pages; j++) {
                pgnt += '<li id="taracot-pgnt-' + j + '"><a href="#">' + j + '</a></li>';
            }
        }
        pgnt += '</ul>';
        $('#' + table_id + '_pagination').html(pgnt);
        $('#taracot-pgnt-' + page).html('<span>' + page + '</span>');
        $('#taracot-pgnt-' + page).addClass('uk-active');
        $('#taracot-pgnt > li').click(pagination_handler);
    };

    /* Turn on or off the loading indicator */

    var taracot_table_loading_indicator = function(show) {
        if (show) {
            var destination = $('#' + table_id).offset();
            $('.taracot-loading').css({
                top: destination.top,
                left: destination.left,
                width: $('#' + table_id).width(),
                height: $('#' + table_id).height()
            });
            $('.taracot-loading').removeClass('uk-hidden');
            $('#taracot_table_pagination').hide();
        } else {
            $('.taracot-loading').addClass('uk-hidden');
            $('#' + table_id + '_pagination').show();
        }
    };

    /* Load AJAX data from server */

    var load_data = function(page) {
        var skip = (page - 1) * items_per_page;
        var query;
        if (autocomplete_flag) {
            query = $('#' + table_id + '_filter').val().replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' '); // trim
        }
        taracot_table_loading_indicator(true);
        $.ajax({
            type: 'POST',
            url: options.taracot_table_url,
            data: {
                skip: skip,
                query: query,
                sort_mode: options.sort_mode,
                sort_cell: options.sort_cell
            },
            dataType: "json",
            success: function(data) {
                $('#' + table_id + '_filter').prop('disabled', false);
                taracot_table_loading_indicator(false);
                if (data.status == 1) {
                    if (typeof data.items !== undefined) {
                        items_per_page = data.ipp;
                        render_table(data.items);
                        render_pagination(page, data.total);
                        current_page = page;
                    }
                }
            },
            error: function() {
                taracot_table_loading_indicator(false);
                $('#' + table_id + '_filter').prop('disabled', false);
                UIkit.notify({
                    message: options.error_message,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });

            }
        });
    };

    /* Handle pagination clicks */

    var pagination_handler = function() {
        if ($(this).hasClass('uk-active')) {
            return;
        }
        var page = $(this).attr('id').replace('taracot-pgnt-', '');
        load_data(page);
    };

    /* Handle sorting events */

    var sort_event = function(what) {
        var item = $(what).attr('rel').replace(table_id + '_sortable_', '');
        if (item == options.sort_cell) {
            options.sort_mode = options.sort_mode * -1;
        } else {
            options.sort_mode = 1;
            options.sort_cell = item;
        }
        $('.taracot-sort-marker').remove();
        var _sm = 'asc';
        if (options.sort_mode == -1) {
            _sm = 'desc';
        }
        $('.' + table_id + '_sortable[rel="' + table_id + '_sortable_' + options.sort_cell + '"]').append('<span class="taracot-sort-marker">&nbsp;<i class="uk-icon-sort-' + _sm + '"></i></span>');
        $('#' + table_id + '_filter').val('');
        load_data(1);
    };

    /* Handle search events */

    var search_event = function() {
        var val = $('#' + table_id + '_filter').val();
        val = val.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' '); // trim
        if (val.length < 2) {
            clearTimeout(autocomplete_timer);
            if (autocomplete_flag) {
                autocomplete_flag = false;
                load_data(1);
            }
            return;
        }
        if (!val.match(/^[\w\sА-Яа-я0-9_\-\.]{3,40}$/)) {
            return;
        }
        clearTimeout(autocomplete_timer);
        autocomplete_timer = setTimeout(function() {
            autocomplete_flag = true;
            $('#' + table_id + '_filter').prop('disabled', true);
            load_data(1);
        }, 300);
    };

    $.fn.medvedTable = function(method) {

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' doesn\'t exists');
        }

    };

})(jQuery);