var users_data = [
    ['admin', 'Johann Poopkus', 'xtreme@rh1.ru', 2],
    ['test', 'Violent Ahead', 'v_a_h@mail.ru', 1],
    ['test1', 'Violentus Aheadus', 'billgates@microsoft.com', 1],
    ['zopo', 'Zopo China Manufacturing', 'zopo@ya.ru', 1],
];

var users_rows = [
    function(val) {

    },
    function(val) {

    },
    function(val) {

    },
    function(val) {

    }
];

for (var i=0; i < users_data.length; i++) {
    $('#users_table > tbody').append('<tr>');
    for (var j = 0; j < users_data[i].length; j++) {
        $('#users_table > tbody').append('<td>' + users_data[i][j] + '</td>');
    }
    $('#users_table > tbody').append('</tr>');
}