var config = require('../config'),
    gaikan = require('gaikan'),
    fs = require('fs'),
    async = require('async'),
    path = require('path');

module.exports = function(app) {

    var i18nm = new(require('i18n-2'))({
        locales: config.locales,
        directory: path.join(__dirname, 'lang'),
        extension: '.js',
        devMode: config.locales_dev_mode
    });

    var renderer = {
        render: function(res, layout, data, req) {
        	i18nm.setLocale(req.session.current_locale);
            var _layout = layout || config.layouts.default;
            data.auth = {
                username: '',
                email: '',
                status: 0,
                realname: ''
            };
            data.blocks = {};
            data.blocks_sync = {};
            if (req && req.session && req.session.auth) data.auth = req.session.auth;
            var fa = [];
            Object.keys(app.get('blocks')).forEach(function(key) {
                var fn = app.get('blocks')[key];
                var fp = function(callback) {
                    fn(req, res, function(_data) {
                        data.blocks[key] = _data;
                        callback();
                    });
                };
                fa.push(fp);
            });
            Object.keys(app.get('blocks_sync')).forEach(function(key) {
                var fn = app.get('blocks_sync')[key];
                if (fn) data.blocks_sync[key] = fn;
            });
            var global_description = app.get('settings').site_description || '',
                global_keywords = app.get('settings').site_keywords || '';
            if (data.keywords && global_keywords) {
                data.keywords += ', ' + global_keywords;
            } else {
                data.keywords = global_keywords;
            }
            if (data.description && global_description) {
                data.description += '. ' + global_description;
            } else {
                data.description = global_description;
            }
            data._lang = i18nm;
            if (app.get('settings') && app.get('settings').site_title) data.site_title = app.get('settings').site_title;
            async.waterfall(fa, function() {
                try {
                    res.render(_layout, data);
                } catch (ex) {
                    res.send('Cannot render layout: ' + ex);
                }
            });
        },
        render_file: function(dir, filename, data, req) {
            var render = gaikan.compileFromFile(dir + '/' + filename + '.html');
            data.auth = {
                username: '',
                email: '',
                status: 0,
                realname: ''
            };
            if (req && req.session && req.session.auth) data.auth = req.session.auth;
            var html_data = render(gaikan, data, undefined);
            return html_data;
        }
    };

    return renderer;

};
