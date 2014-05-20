/* ****************************************************************** */
/* Taracot jQuery Dynamic Table */
/* ****************************************************************** */

(function( $ ) {
 
    /* Configuration */

	var options = jQuery.extend({
		col_count: 0, // Number of columns
		sort_mode: 1, // Sorting mode, -1 = DESC, 1 = ASC
		sort_cell: '', // Default sorting column
		taracot_table_url: '', // URL to load the data from
		process_rows: [] // Processing functions for each row
	}, options);
	
	/* System variables, do not modify */

	var current_page = 1;
	var autocomplete_flag = false;
	var autocomplete_timer;
	var items_per_page = 0;
	var table_id = '';

	/* Methods */

	var methods = {
		init: function( _options) {
			options = _options;
			table_id = $(this).attr('id');
			load_data(1);
		},
		update: function() {
			load_data(current_page);
		}
	};

	/* Render the table rows */

	var render_table = function(data) {       
	    $('#' + table_id + ' > tbody').html('');
	    for (var i=0; i < data.length; i++) {
	        var table_data = '<tr>';
	        var _id = data[i][0]        
	        for (var j = 1; j <= options.col_count; j++) {            
	            if (j < data[i].length) {
	                table_data += '<td style="vertical-align:middle">' + options.process_rows[j-1](data[i][j], _id) + '</td>';
	            } else {
	                table_data += '<td style="vertical-align:middle">' + options.process_rows[j-1]('', _id) + '</td>';
	            }            
	        }
	        table_data += '</tr>';
	        $('#' + table_id + ' > tbody').append(table_data);
	        $('.taracot-tableitem-edit').unbind();
	        $('.taracot-tableitem-edit').click(function() {
	             var id = $(this).attr('id').replace('taracot-btnedt-', '');
	             $('#taracot-modal-edit-h1-edit').removeClass('uk-hidden');
	             $('#taracot-modal-edit-h1-add').addClass('uk-hidden');
	             edit_item(id);
	        });
	        $('.taracot-tableitem-delete').unbind();
	        $('.taracot-tableitem-delete').click(function() {            
	            delete_item([$(this).attr('id').replace('taracot-btndel-', '')]);
	        });
	    }
	    if (!data.length) {
	        $('#' + table_id + ' > tbody').append('<tr><td colspan="' + options.col_count + '">' + _lang_vars.no_res + '</td></tr>');
	    }
	};

	/* Render the pagination */

	var render_pagination = function(page, total) {
	    var pgnt = '';
	    $('#' + table_id + '_pagination').html(pgnt);
	    var page = parseInt(page);
	    var max_pages = 10;
	    var num_pages = Math.ceil(total / items_per_page);
	    if (num_pages < 2) {
	        return;
	    }
	    pgnt = '<ul class="uk-pagination uk-float-left" id="taracot-pgnt">';
	    if (num_pages > max_pages) {
	        if (page > 1) {
	            pgnt += '<li id="taracot-pgnt-' + (page-1) + '"><a href="#"><i class="uk-icon-angle-double-left"></i></a></li>';
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
	        if (_en < num_pages-1) {
	            pgnt += '<li><span>...</span></li>';
	        }
	        if (page <= num_pages-3) {            
	            pgnt += '<li id="taracot-pgnt-' + num_pages + '"><a href="#">' + num_pages + '</a></li>';
	        }
	        if (page < num_pages) {            
	            pgnt += '<li id="taracot-pgnt-' + (page + 1) + '"><a href="#"><i class="uk-icon-angle-double-right"></i></a></li>';
	        }
	    } else {
	        for (var i = 1; i <= num_pages; i++) {
	            pgnt += '<li id="taracot-pgnt-' + i + '"><a href="#">' + i + '</a></li>';
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
	        $('.taracot-loading').css({top: destination.top, left: destination.left, width: $('#' + table_id).width(), height: $('#' + table_id).height() });
	        $('.taracot-loading').removeClass('uk-hidden');
	        $('#taracot_table_pagination').hide();
	    } else {
	        $('.taracot-loading').addClass('uk-hidden');
	        $('#' + table_id + '_pagination').show();
	    }
	};

	/* Load AJAX data from server */

	var load_data = function(page) {
	    var skip = (page-1) * items_per_page;
	    var query;
	    if (autocomplete_flag) {
	        query = $('#' + table_id + '_filter').val().replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' '); // trim
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
	        success: function (data) {
	            $('#' + table_id + '_filter').prop('disabled', false);
	            taracot_table_loading_indicator(false);
	            if (data.status == 1) {
	                if (typeof data.users != undefined) {
	                    items_per_page = data.ipp;
	                    render_table(data.users);
	                    render_pagination(page, data.total);
	                    current_page = page;
	                }
	            }
	        },
	        error: function () {
	            taracot_table_loading_indicator(false);
	            $('#' + table_id + '-filter').prop('disabled', false);
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
	}

	/* Handle sorting events */

	$('.' + table_id + '_sortable').click(function() {
	    var item = $(this).attr('rel').replace( table_id + '_sortable_', '');
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
	    $('.' + table_id +'_sortable[rel="' + table_id +'_sortable_' + options.sort_cell  + '"]').append('<span class="taracot-sort-marker">&nbsp;<i class="uk-icon-sort-' + _sm + '"></i></span>');
	    $('#' + table_id +'_filter').val('');
	    load_data(1);
	});

	/* Handle search events */

	$('#' + table_id + '_filter').on('input', function() {
	    var val = $('#' + table_id + '_filter').val();
	    val = val.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' '); // trim
	    if (val.length < 3) {
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
	});

	/* Load data */

	// load_data(1);

	 $.fn.medvedTable = function( method ) {

	 	if ( methods[method] ) {
      		return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    	} else if ( typeof method === 'object' || ! method ) {
      		return methods.init.apply( this, arguments );
    	} else {
      		$.error( 'Method ' +  method + ' doesn\'t exists' );
    	}

	 }  

}) (jQuery);