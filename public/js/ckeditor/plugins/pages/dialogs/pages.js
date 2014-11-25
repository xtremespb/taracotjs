/*
Copyright (c) 2014 Michael A. Matveev
*/
CKEDITOR.dialog.add('pages', function(editor) {
    var lang = editor.lang.pages;
    return {
        title: CKEDITOR.env.ie ? lang.dlgTitle : lang.title,
        minWidth: 390,
        minHeight: 50,
        maxHeight: 400,
        contents: [{
            id: 'tab1',
            label: '',
            title: '',
            expand: true,
            padding: 0,
            elements: [{
                type: 'html',
                html: '<style>#ckeditor_pages_list > ul > li > a { cursor: pointer; }</style>' +
                	  '<div id="ckeditor_pages_loading"><img src="' + CKEDITOR.plugins.get('pages').path + 'dialogs/loading.gif">&nbsp;' + lang.loading + '</div>' +
                      '<div style="width:98%;height:300px;padding:5px;background:#efefef;overflow:scroll;border:1px solid #ddd;display:none" id="ckeditor_pages_list"></div>'
            }]
        }],
        onLoad: function() {
            $.ajax({
                type: 'POST',
                url: '/cp/pages/data/list/all',
                dataType: 'json',
                success: function(data) {
                    $('#ckeditor_pages_loading').hide();
                    $('#ckeditor_pages_list').show();
                    var html_data = '<ul>';
                    if (data.items && data.items.length)
                        for (var i = 0; i < data.items.length; i++) html_data += '<li>&ndash;&nbsp;<a href="' + data.items[i][0] + '">' + data.items[i][1] + '</a></li>';
                    html_data += '</ul>';
                    $('#ckeditor_pages_list').html(html_data);
                    $('#ckeditor_pages_list > ul > li > a').click(function(e) {
                    	e.preventDefault();
                    	var url = $('#ckeditor_pages_list > ul > li > a').attr('href'),
                    		text = $('#ckeditor_pages_list > ul > li > a').html();
                    	editor.insertHtml( '<a href="' + url + '"">' + text + '</a>' );
                    	CKEDITOR.dialog.getCurrent().hide();
                    });
                },
                error: function() {
                    $('#ckeditor_pages_loading').html('" + lang.loading_err + "');
                }
            });
        },
        buttons: [CKEDITOR.dialog.cancelButton]
    };
});
