var taracot_dlg_menu_edit = new $.UIkit.modal("#taracot_dlg_menu_edit");

var walk_nest = function(ul, cd) {
	var res = '';
	if (cd) res += '<div class="uk-dropdown uk-dropdown-navbar">';
	var nbc = '';
	if (cd) {
		nbc = 'uk-nav uk-nav-navbar';
	} else {
		nbc = 'uk-navbar-nav';
	}
	res += '<ul class="' + nbc + '">';
	var li = $(ul).children('li');
	li.each(function() {
		var text = $(this).children('.uk-nestable-item').children('span.uk-nestable-item-text').html();
		var url = $(this).children('.uk-nestable-item').children('a.uk-nestable-item-url').html();
		var ddc = '';
		var pc = '';
		var nxul = $(this).children('ul.uk-nestable-list');
		if (nxul.html()) {
			ddc = ' data-uk-dropdown';
			pc = ' class="uk-parent"';
		}
		res += '<li' + pc + ddc + '><a href="' + url + '">' + text + '</a>';		
		if (nxul.html()) {
			res += walk_nest(nxul, true);
		}		
		res += '</li>';
	});
	res += '</ul>';
	if (cd) res += '</div>'
	return res;
};

$('#btn_item_add').click(function() {
	taracot_dlg_menu_edit.show();
});

$('#btn_load_menu').click(function() {	
	// var data = walk_nest($('#menu_nest'));
	// $('#tmp_res').html('<nav class="uk-navbar">' + data + '</nav>');
});

$('#taracot_dlg_menu_edit_btn_save').click(function() {
	$('#menu_nest').append('<li id="taracot_menu_' + Date.now() + '" class="uk-nestable-list-item"><div class="uk-nestable-item"><div class="uk-nestable-handle"></div><div data-nestable-action="toggle"></div>&nbsp;<span class="uk-nestable-item-text">' + $('#taracot_dlg_menu_edit_text').val() + '</span>&nbsp;(<a href="' + $('#taracot_dlg_menu_edit_url').val() + '" class="uk-nestable-item-url">' + $('#taracot_dlg_menu_edit_url').val() + '</a>)&nbsp;&nbsp;&nbsp;<button class="uk-button uk-button-small taracot-btn-menu-edit"><i class="uk-icon-edit"></i></button>&nbsp;<button class="uk-button uk-button-small uk-button-danger taracot-btn-menu-delete"><i class="uk-icon-trash-o"></i></button></div></li>');	
	taracot_dlg_menu_edit.hide();
	$('.taracot-btn-menu-delete').click(function() {
		alert($(this).parent().parent().attr('id'));
	});
});

/*******************************************************************
 
 document.ready

********************************************************************/

$(document).ready(function () {
    $('#menu_nest').empty();
    $('#taracot_dlg_menu_edit_page').change(function() {
    	$('#taracot_dlg_menu_edit_text').val($(this).text().replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' '));
    	$('#taracot_dlg_menu_edit_url').val($(this).val());
    });
});
