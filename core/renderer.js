var config = require('../config'),
    gaikan = require('gaikan'),
    fs = require('fs'),
    async = require('async'),
    path = require('path'),
    _default_auth_data = {
        username: '',
        email: '',
        status: 0,
        realname: ''
    };

module.exports = function(app) {
    var i18nm = new(require('i18n-2'))({
            locales: config.locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: config.locales.dev_mode
        }),
        templates = {};
    var renderer = {
        render: function(res, layout, data, req) {
            i18nm.setLocale(req.session.current_locale);
            var _layout = (layout || config.layouts.default) + '_' + req.session.current_locale;
            data.auth = _default_auth_data;
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
                    var rfn = templates[_layout] || gaikan.compileFromFile('../views/' + _layout + '.html');
                    if (!templates[_layout]) templates[_layout] = rfn;
                    return res.send(rfn(gaikan, data, undefined));
                } catch (ex) {
                    return res.send('Cannot render layout: ' + ex);
                }
            });
        },
        render_file: function(dir, filename, data, req) {
            var _layout = dir + '/' + filename + '.html',
                rfn = templates[dir + '/' + filename + '.html'];
            if (!rfn) {
                if (fs.existsSync(path.join(dir, '/custom_' + filename + '.html'))) {
                    rfn = gaikan.compileFromFile(dir + '/custom_' + filename + '.html');
                } else {
                    rfn = gaikan.compileFromFile(_layout);
                }
            }
            if (!rfn) return 'Cannot render layout: ' + filename;
            data.auth = _default_auth_data;
            if (req && req.session && req.session.auth) data.auth = req.session.auth;
            if (!templates[_layout]) templates[_layout] = rfn;
            return rfn(gaikan, data, undefined);
        }
    };

    return renderer;

};
