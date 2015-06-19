module.exports = function(app) {
    var _timestamp_settings_query = {},
        menu_cache = {},
        path = require('path'),
        config = app.get('config'),
        fs = require('fs');
    var menu_config;
    if (fs.existsSync(path.join(__dirname, 'config.js'))) menu_config = require('./config');
    if (!menu_config && fs.existsSync(path.join(__dirname, 'dist_config.js'))) menu_config = require('./dist_config');
    if (menu_config)
        for (var attrname in menu_config)
            config[attrname] = menu_config[attrname];

    var drivers = {};
    for (var dn in config.menu.drivers)
        drivers[dn] = require(path.join(__dirname, 'templates', config.menu.drivers[dn]))(app);
    var block = {
        data: function(req, res, callback) {
            var lng = req.session.current_locale;
            if (_timestamp_settings_query[lng] && (Date.now() - _timestamp_settings_query[lng] <= 60000) && menu_cache[lng]) {
                return callback(menu_cache[lng]);
            }
            app.get('mongodb').collection('menu').find({
                lang: lng
            }, {
                limit: 1
            }).toArray(function(err, items) {
                if (err) return callback();
                var data = {};
                if (items && items.length && items[0].menu_source) {
                    var tree = items[0].menu_source;
                    try {
                        tree = JSON.parse(tree);
                    } catch (er) {
                        tree = undefined;
                    }
                    if (tree) {
                        var html = {};
                        for (var driver in config.menu.drivers)
                            html[config.menu.drivers[driver]] = '';
                        var root_node = 'j1_1';
                        for (var mr in tree)
                            if (tree[mr].parent == '#') root_node = tree[mr].id;
                        for (var mi in tree)
                            if (tree[mi].parent == root_node) {
                                var id = tree[mi].id,
                                    children = [];
                                for (var mc in tree)
                                    if (tree[mc].parent == id) children.push(tree[mc]);
                                if (children.length) {
                                    for (var driver_nc in config.menu.drivers)
                                        html[config.menu.drivers[driver_nc]] += drivers[driver_nc].node_with_child(tree[mi], children);
                                } else {
                                    for (var driver_nw in drivers)
                                        html[config.menu.drivers[driver_nw]] += drivers[driver_nw].node_without_child(tree[mi], children);
                                }
                            }
                        for (var driver_rt in config.menu.drivers) {
                            html[config.menu.drivers[driver_rt]] = drivers[driver_rt].root_template(html[config.menu.drivers[driver_rt]]);
                            data[config.menu.drivers[driver_rt]] = html[config.menu.drivers[driver_rt]];
                        }
                    }
                }
                menu_cache[lng] = data;
                _timestamp_settings_query[lng] = Date.now();
                callback(menu_cache[lng]);
            });
        }
    };
    return block;
};
