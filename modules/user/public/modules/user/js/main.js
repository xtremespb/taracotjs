var col_count = 5;
var items_per_page = 0;

var process_rows = [
    function(val, id) {
        return val;
    },
    function(val, id) {
        return val;
    },
    function(val, id) {
        return val;
    },
    function(val, id) {
        return '<div style="text-align:center">' + val + '</div>';
    },
    function(val, id) {
        return '<div style="text-align:center">' + val + '</div>';
    }
];

var render_table = function(data) {       
    $('#taracot_table > tbody').html('');
    for (var i=0; i < data.length; i++) {
        var table_data = '<tr>';
        var _id = data[i][0]        
        for (var j = 1; j <= col_count; j++) {            
            if (j < data[i].length) {
                table_data += '<td>' + process_rows[j-1](data[i][j], _id) + '</td>';
            } else {
                table_data += '<td>' + process_rows[j-1]('', _id) + '</td>';
            }            
        }
        table_data += '</tr>';
        $('#taracot_table > tbody').append(table_data);
    }
};

var render_pagination = function(page, total) {
    if (!page || 0 > page) {
        offset=0;
    }
    var pgnt = '',
    var max_pages = 10,
    var num_pages = Math.ceil(total / items_per_page);
    
    pgnt = '<ul class="uk-pagination">';
    pgnt += '</ul>';
    $('#taracot_table_pagination').html(pgnt);
};

var load_data = function(skip) {
    $.ajax({
        type: 'POST',
        url: '/cp/users/data/list',
        data: {
            skip: skip
        },
        dataType: "json",
        success: function (data) {
            if (data.status == 1) {
                if (typeof data.users != undefined) {
                    items_per_page = data.ipp;
                    render_table(data.users);
                    render_pagination(1, data.total);
                }
            }
        },
        error: function () {
        }
    });
};

load_data(0);