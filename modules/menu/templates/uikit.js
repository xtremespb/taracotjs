module.exports = function(app) {
    var driver = {
        node_with_child: function(data, children) {
            var id = 'taracot_menu_item_' + data.data.url.replace(/\//g, '_').replace(/#/, '_submenu__').replace(/^_/, '').replace(/[^a-zA-Z0-9_\-]/g, ''),
                html = '<li class="' + id + ' uk-parent" data-uk-dropdown="{mode:\'click\'}"><a href="' + data.data.url + '">' + data.text + '&nbsp;<i class="uk-icon-caret-down uk-hidden-small"></i></a><div class="uk-dropdown uk-dropdown-navbar"><ul class="uk-nav uk-nav-navbar">';
            for (var c in children) {
                if (children[c].text == '-') {
                    html += '<li class="uk-nav-divider"></li>';
                } else {
                    if (children[c].text.match(/^{{header}}/)) {
                        children[c].text = children[c].text.replace(/^{{header}}/, '');
                        html += '<li class="uk-nav-header">' + children[c].text + '</li>';
                    } else {
                        var sub_id = 'taracot_menu_item_' + children[c].data.url.replace(/\//g, '_').replace(/#/, '_submenu__').replace(/^_/, '').replace(/[^a-zA-Z0-9_\-]/g, '');
                        html += '<li class="' + sub_id + '"><a href="' + children[c].data.url + '">' + children[c].text + '</a></li>';
                    }
                }
            }
            html += '</ul></div></li>';
            return html;
        },
        node_without_child: function(data) {
            var id = 'taracot_menu_item_' + data.data.url.replace(/\//g, '_').replace(/#/, '_submenu__').replace(/^_/, '').replace(/[^a-zA-Z0-9_\-]/g, '');
            return '<li class="' + id + '"><a href="' + data.data.url + '">' + data.text + '</a></li>';
        },
        root_template: function(data) {
            return '<ul class="uk-navbar-nav">' + data + '</ul>';
        }
    };
    return driver;
};
