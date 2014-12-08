$.loadingIndicator();

var warehouse_item_dlg = $.UIkit.modal("#warehouse_item_dlg"),
    current_collection;

$('#btn_descitem_add').click(function() {
    var tr = '<tr class="uk-form"><td><input type="text" class="uk-width-1-1"></td>';
    for (var i = 0; i < locales.length; i++) tr += '<td><input type="text" class="uk-width-1-1"></td>';
    tr += '<td style="text-align:right"><button class="uk-button uk-button-danger taracot-warehouseconf-descitem-delete"><i class="uk-icon-trash-o"></i></button></td></tr>';
    $('#warehouseconf_descitems_tb').append(tr);
    $('.taracot-warehouseconf-descitem-delete').unbind();
    $('.taracot-warehouseconf-descitem-delete').click(btn_taracot_descitem_delete_handler);
    $('#warehouseconf_descitems').show();
});


$('#btn_collection_add').click(function() {
    var tr = '<tr class="uk-form"><td style="width:150px"><input type="text" class="uk-width-1-1"></td><td class="uk-sortable"></td>';
    tr += '<td style="text-align:right;width:80px"><button class="uk-button taracot-warehouseconf-collections-add"><i class="uk-icon-plus"></i></button>&nbsp;<button class="uk-button uk-button-danger taracot-warehouseconf-collections-delete"><i class="uk-icon-trash-o"></i></button></td></tr>';
    $('#warehouseconf_collections_tb').append(tr);
    $('.taracot-warehouseconf-collections-delete').unbind();
    $('.taracot-warehouseconf-collections-delete').click(btn_taracot_collection_delete_handler);
    $('.taracot-warehouseconf-collections-add').unbind();
    $('.taracot-warehouseconf-collections-add').click(btn_taracot_collection_add_handler);
    $('#warehouseconf_collections').show();
});

$('#btn_currency_add').click(function() {
    var tr = '<tr class="uk-form"><td><input type="text" class="uk-width-1-1"></td><td><input type="text" class="uk-width-1-1"></td>';
    for (var i = 0; i < locales.length; i++) tr += '<td><input type="text" class="uk-width-1-1"></td>';
    tr += '<td style="width:40px"><button class="uk-button uk-button-danger taracot-warehouseconf-curs-delete"><i class="uk-icon-trash-o"></i></button>&nbsp;<button class="uk-button taracot-btn-curs-sort"><i class="uk-icon uk-icon-unsorted"></i></button></td></tr>';
    $('#warehouseconf_curs_tb').append(tr);
    $('.taracot-warehouseconf-curs-delete').unbind();
    $('.taracot-warehouseconf-curs-delete').click(btn_taracot_curs_delete_handler);
    $('#warehouseconf_curs').show();
    $.UIkit.sortable($('#warehouseconf_curs_tb'), {
        dragCustomClass: 'uk-form',
        handleClass: 'taracot-btn-curs-sort'
    });
});

$('#btn_ship_add').click(function() {
    var tr = '<tr class="uk-form"><td><input type="text" class="uk-width-1-1"></td><td><input type="text" class="uk-width-1-1"></td><td><input type="text" class="uk-width-1-1"></td><td><input type="text" class="uk-width-1-1"></td>';
    for (var i = 0; i < locales.length; i++) tr += '<td><input type="text" class="uk-width-1-1"></td>';
    tr += '<td style="width:60px" nowrap><button class="uk-button uk-button-danger taracot-warehouseconf-ship-delete"><i class="uk-icon-trash-o"></i></button>&nbsp;<button class="uk-button taracot-btn-ship-sort"><i class="uk-icon uk-icon-unsorted"></i></button></td></tr>';
    $('#warehouseconf_ship_tb').append(tr);
    $('.taracot-warehouseconf-ship-delete').unbind();
    $('.taracot-warehouseconf-ship-delete').click(btn_taracot_ship_delete_handler);
    $('#warehouseconf_ship').show();
    $.UIkit.sortable($('#warehouseconf_ship_tb'), {
        dragCustomClass: 'uk-form',
        handleClass: 'taracot-btn-ship-sort'
    });
});

var btn_taracot_descitem_delete_handler = function() {
    if (confirm(_lang_vars.confirm_delete_descitem)) $(this).parent().parent().remove();
    if ($('#warehouseconf_descitems tr').length > 1) {
        $('#warehouseconf_descitems').show();
    } else {
        $('#warehouseconf_descitems').hide();
    }
};

var btn_taracot_curs_delete_handler = function() {
    if (confirm(_lang_vars.confirm_delete_descitem)) $(this).parent().parent().remove();
    if ($('#warehouseconf_curs tr').length > 1) {
        $('#warehouseconf_curs').show();
    } else {
        $('#warehouseconf_curs').hide();
    }
};

var btn_taracot_collection_delete_handler = function() {
    if (confirm(_lang_vars.confirm_delete_descitem)) $(this).parent().parent().remove();
    if ($('#warehouseconf_collections tr').length > 1) {
        $('#warehouseconf_collections').show();
    } else {
        $('#warehouseconf_collections').hide();
    }
};

var btn_taracot_ship_delete_handler = function() {
    if (confirm(_lang_vars.confirm_delete_descitem)) $(this).parent().parent().remove();
    if ($('#warehouseconf_ship tr').length > 1) {
        $('#warehouseconf_ship').show();
    } else {
        $('#warehouseconf_ship').hide();
    }
};

var btn_taracot_collection_add_handler = function() {
    var descitems = _get_items_array(),
        select_html = '';

    var descitems_arr = [];
    for (var key in descitems) descitems_arr.push([descitems[key].id, descitems[key][current_locale]]);
    descitems_arr.sort(function(a, b) {
        a = a[1];
        b = b[1];
        return a < b ? -1 : (a > b ? 1 : 0);
    });

    for (var i = 0; i < descitems_arr.length; i++) {
        var k = descitems_arr[i][0],
            v = descitems_arr[i][1];
        var label = v || k;
        select_html += '<div class="taracot-dlg-item" id="_di_' + k + '">' + label + '</div>';
    }

    $('#warehouse_items').html(select_html);
    $('.taracot-dlg-item').unbind();
    $('.taracot-dlg-item').click(taracot_dlg_item_click_hanlder);
    current_collection = $(this).parent().parent();
    warehouse_item_dlg.show();
};

var taracot_dlg_item_click_hanlder = function() {
    warehouse_item_dlg.hide();
    var item = '<li class="uk-badge uk-badge-success uk-badge-notification taracot-warehouse-item-notification" rel="' + $(this).attr('id').replace(/^_di_/, '') + '"><span>' + $(this).html() + '</span>&nbsp;<span><a class="uk-close taracot-warehouse-colitem-del"></a></span></li>';
    current_collection.children('td').eq(1).append(item);
    $.UIkit.sortable(current_collection.children('td').eq(1), {
        dragCustomClass: 'sortable-dragged-coll'
    });
    $('.taracot-warehouse-colitem-del').unbind();
    $('.taracot-warehouse-colitem-del').click(taracot_warehouse_colitem_del_handler);
};

var taracot_warehouse_colitem_del_handler = function() {
    $(this).parent().parent().remove();
};

$('#btn_save').click(function() {
    $.loadingIndicator('show');
    var descitems = _get_items_array(),
        collections = _get_collections_array(),
        curs = _get_curs_array(),
        ship = _get_ship_array();
    $.ajax({
        type: 'POST',
        url: '/cp/warehouseconf/config/save',
        data: {
            descitems: descitems,
            collections: collections,
            curs: curs,
            ship: ship
        },
        dataType: "json",
        success: function(data) {
            $.loadingIndicator('hide');
            if (data.status && data.status == 1) {
                $.UIkit.notify({
                    message: _lang_vars.save_success,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
            } else {
                $.UIkit.notify({
                    message: _lang_vars.ajax_failed,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
            $.loadingIndicator('hide');
            $.UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
});

var _get_items_array = function() {
    var descitems = [],
        _cnt = 0,
        _ai = {};
    $('#warehouseconf_descitems_tb  > tr > td').each(function() {
        if (_cnt === 0) _ai.id = $(this).children().first().val();
        if (_cnt > 0 && _cnt <= locales.length) _ai[locales[_cnt - 1]] = $(this).children().first().val();
        if (_cnt > locales.length) {
            descitems.push(_ai);
            _cnt = 0;
            _ai = {};
            return;
        }
        _cnt++;
    });
    return descitems;
};

var _get_collections_array = function() {
    var collections = [],
        _cnt = 0,
        _ai = {};
    $('#warehouseconf_collections_tb  > tr > td').each(function() {
        if (_cnt === 0) _ai.id = $(this).children().first().val();
        if (_cnt === 1) {
            _ai.items = [];
            $(this).children().each(function() {
                _ai.items.push($(this).attr('rel'));
            });
        }
        if (_cnt === 2) {
            collections.push(_ai);
            _cnt = 0;
            _ai = {};
            return;
        }
        _cnt++;
    });
    return collections;
};

var _get_curs_array = function() {
    var curs = [],
        _cnt = 0,
        _ai = {};
    $('#warehouseconf_curs_tb  > tr > td').each(function() {
        if (_cnt === 0) _ai.id = $(this).children().first().val();
        if (_cnt === 1) _ai.exr = $(this).children().first().val();
        if (_cnt > 1 && _cnt <= locales.length + 1) _ai[locales[_cnt - 2]] = $(this).children().first().val();
        if (_cnt > locales.length + 1) {
            curs.push(_ai);
            _cnt = 0;
            _ai = {};
            return;
        }
        _cnt++;
    });
    return curs;
};

var _get_ship_array = function() {
    var ship = [],
        _cnt = 0,
        _ai = {};
    $('#warehouseconf_ship_tb  > tr > td').each(function() {
        if (_cnt === 0) _ai.id = $(this).children().first().val();
        if (_cnt === 1) _ai.weight = $(this).children().first().val();
        if (_cnt === 2) _ai.amnt = $(this).children().first().val();
        if (_cnt === 3) _ai.price = $(this).children().first().val();
        if (_cnt > 3 && _cnt <= locales.length + 3) _ai[locales[_cnt - 4]] = $(this).children().first().val();
        if (_cnt > locales.length + 3) {
            ship.push(_ai);
            _cnt = 0;
            _ai = {};
            return;
        }
        _cnt++;
    });
    return ship;
};

$(document).ready(function() {
    $('#warehouseconf_descitems_tb  > tr').each(function() {
        $(this).remove();
    });
    $('#warehouseconf_collections_tb  > tr').each(function() {
        $(this).remove();
    });
    for (var i = 0; i < init_items.length; i++) $('#btn_descitem_add').click();
    for (var c = 0; c < init_collections.length; c++) $('#btn_collection_add').click();
    for (var s = 0; s < init_curs.length; s++) $('#btn_currency_add').click();
    for (var n = 0; n < init_ship.length; n++) $('#btn_ship_add').click();
    var _cnt = 0,
        _gc = 0;
    $('#warehouseconf_descitems_tb  > tr > td').each(function() {
        var _ai = init_items[_gc];
        if (_ai) {
            if (_cnt === 0) $(this).children().first().val(_ai.id);
            if (_cnt > 0 && _cnt <= locales.length) $(this).children().first().val(_ai[locales[_cnt - 1]]);
        }
        if (_cnt > locales.length) {
            _cnt = 0;
            _gc++;
            return;
        }
        _cnt++;
    });
    _cnt = 0;
    _gc = 0;
    var _items = _get_items_array(),
        _items_hash = {};
    for (var it = 0; it < _items.length; it++) _items_hash[_items[it].id] = _items[it][current_locale] || _items[it].id;
    $('#warehouseconf_collections_tb  > tr > td').each(function(i) {
        if (_cnt === 0) {
            $(this).children().first().val(init_collections[_gc].id);
        }
        if (_cnt === 1 && init_collections[_gc].items) {
            for (var ci = 0; ci < init_collections[_gc].items.length; ci++) {
                var item = '<div class="uk-badge uk-badge-success uk-badge-notification taracot-warehouse-item-notification" rel="' + init_collections[_gc].items[ci] + '"><span>' + _items_hash[init_collections[_gc].items[ci]] + '</span>&nbsp;<span><a class="uk-close taracot-warehouse-colitem-del"></a></span></div>';
                $(this).append(item);
            }
            $.UIkit.sortable($(this), {
                dragCustomClass: 'sortable-dragged-coll'
            });
            $('.taracot-warehouse-colitem-del').unbind();
            $('.taracot-warehouse-colitem-del').click(taracot_warehouse_colitem_del_handler);
        }
        if (_cnt === 2) {
            _cnt = 0;
            _gc++;
            return;
        }
        _cnt++;
    });
    _cnt = 0;
    _gc = 0;
    $('#warehouseconf_curs_tb  > tr > td').each(function() {
        var _ai = init_curs[_gc];
        if (_ai) {
            if (!_ai.exr) _ai.exr = '';
            if (_cnt === 0) $(this).children().first().val(_ai.id);
            if (_cnt === 1) $(this).children().first().val(_ai.exr);
            if (_cnt > 1 && _cnt <= locales.length + 1) $(this).children().first().val(_ai[locales[_cnt - 2]]);
        }
        if (_cnt > locales.length + 1) {
            _cnt = 0;
            _gc++;
            return;
        }
        _cnt++;
    });
    _cnt = 0;
    _gc = 0;
    $('#warehouseconf_ship_tb  > tr > td').each(function() {
        var _ai = init_ship[_gc];
        if (_ai) {
            if (!_ai.exr) _ai.exr = '';
            if (_cnt === 0) $(this).children().first().val(_ai.id);
            if (_cnt === 1) $(this).children().first().val(_ai.weight);
            if (_cnt === 2) $(this).children().first().val(_ai.amnt);
            if (_cnt === 3) $(this).children().first().val(_ai.price);
            if (_cnt > 3 && _cnt <= locales.length + 3) $(this).children().first().val(_ai[locales[_cnt - 4]]);
        }
        if (_cnt > locales.length + 3) {
            _cnt = 0;
            _gc++;
            return;
        }
        _cnt++;
    });
});
