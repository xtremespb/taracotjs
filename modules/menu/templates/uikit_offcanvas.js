module.exports = function(app) {
    var driver = {
        node_with_child: function(data, children) {
            var html = '<li class="uk-parent"><a href="' + data.data.url + '">' + data.text + '</a><ul class="uk-nav-sub">';
            for (var c in children) {
                if (children[c].text == '-') {
                    // Do nothing
                } else {
                    if (children[c].text.match(/^{{header}}/)) {
                        // Do nothing too
                    } else {
                        html += '<li><a href="' + children[c].data.url + '">' + children[c].text + '</a></li>';
                    }
                }
            }
            html += '</ul></li>';
            return html;
        },
        node_without_child: function(data) {
            return '<li><a href="' + data.data.url + '">' + data.text + '</a></li>';
        },
        root_template: function(data) {
            return data;
        }
    };
    return driver;
};
