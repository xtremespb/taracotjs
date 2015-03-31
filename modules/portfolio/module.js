module.exports = function(app) {

    var router = app.get('express').Router(),
        path = require('path'),
        async = require('async'),
        renderer = app.get('renderer'),
        gaikan = require('gaikan'),
        config = app.get('config'),
        fs = require('fs-extra'),
        i18nm = new(require('i18n-2'))({
            locales: config.locales.avail,
            directory: path.join(__dirname, 'lang'),
            extension: '.js',
            devMode: config.locales.dev_mode
        });

    var part_areas = (fs.existsSync(path.join(__dirname, 'views') + '/custom_parts_areas.html')) ? gaikan.compileFromFile(path.join(__dirname, 'views') + '/custom_parts_areas.html') : gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_areas.html'),
        part_area = (fs.existsSync(path.join(__dirname, 'views') + '/custom_parts_area.html')) ? gaikan.compileFromFile(path.join(__dirname, 'views') + '/custom_parts_area.html') : gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_area.html'),
        part_area_item = (fs.existsSync(path.join(__dirname, 'views') + '/custom_parts_area_item.html')) ? gaikan.compileFromFile(path.join(__dirname, 'views') + '/custom_parts_area_item.html') : gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_area_item.html'),
        part_screen_large = (fs.existsSync(path.join(__dirname, 'views') + '/custom_parts_screen_large.html')) ? gaikan.compileFromFile(path.join(__dirname, 'views') + '/custom_parts_screen_large.html') : gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_screen_large.html'),
        part_screen_small = (fs.existsSync(path.join(__dirname, 'views') + '/custom_parts_screen_small.html')) ? gaikan.compileFromFile(path.join(__dirname, 'views') + '/custom_parts_screen_small.html') : gaikan.compileFromFile(path.join(__dirname, 'views') + '/parts_screen_small.html');

    router.get('/', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        fs.readJson(path.join(__dirname, 'data', 'portfolio_' + req.session.current_locale + '.json'), function(err, pf) {
            if (err) return res.status(404);
            var areas_html = '';
            for (var pd in pf.data) {
                var area_content = '';
                for (var pi in pf.data[pd].works)
                    area_content += part_area_item(gaikan, {
                        lang: i18nm,
                        id: pi,
                        text: pf.data[pd].works[pi]
                    });
                areas_html += part_area(gaikan, {
                    lang: i18nm,
                    title: pf.data[pd].desc,
                    content: area_content
                });
            }
            areas_html = part_areas(gaikan, {
                desc: pf.desc,
                items: areas_html
            });
            var data = {
                title: i18nm.__('module_name'),
                page_title: i18nm.__('module_name'),
                keywords: '',
                description: '',
                extra_css: '<link rel="stylesheet" href="/modules/portfolio/css/main.css" type="text/css">'
            };
            var render = renderer.render_file(path.join(__dirname, 'views'), 'portfolio', {
                lang: i18nm,
                areas: areas_html
            }, req);
            data.content = render;
            return app.get('renderer').render(res, undefined, data, req);
        });
    });

    router.get('/:id', function(req, res, next) {
        var id = req.params.id;
        if (!id || !id.match(/^[a-z\-_0-9]{1,32}$/)) return res.status(404) && next();
        i18nm.setLocale(req.session.current_locale);
        fs.readJson(path.join(__dirname, 'data', 'portfolio_' + req.session.current_locale + '.json'), function(err, pf) {
            if (err) return res.status(404) && next();
            var _id, area;
            for (var pd in pf.data)
                for (var pi in pf.data[pd].works)
                    if (pi == id) {
                        _id = pi;
                        area = pf.data[pd];
                    }
            if (!_id) return res.status(404) && next();
            fs.readJson(path.join(__dirname, 'data', id + '_' + req.session.current_locale + '.json'), function(err, pfi) {
                if (err) return res.status(404) && next();
                var s_small = '',
                    s_large = '';
                for (var sl in pfi.screenshots_large)
                    s_large += part_screen_large(gaikan, {
                        lang: i18nm,
                        src: sl,
                        alt: pfi.screenshots_large[sl]
                    });
                for (var sm in pfi.screenshots)
                    s_small += part_screen_small(gaikan, {
                        lang: i18nm,
                        src: sm,
                        alt: pfi.screenshots[sm]
                    });
                var data = {
                    title: pfi.title + ' | ' + i18nm.__('module_name'),
                    page_title: pfi.title + ' | ' + i18nm.__('module_name'),
                    keywords: '',
                    description: '',
                    extra_css: '<link rel="stylesheet" href="/modules/portfolio/css/main.css" type="text/css">'
                };
                var render = renderer.render_file(path.join(__dirname, 'views'), 'portfolio_item', {
                    lang: i18nm,
                    text: pfi.title,
                    cat: area.desc,
                    year: pfi.year,
                    task: pfi.task,
                    responsive: pfi.responsive,
                    screenshots_large: s_large,
                    screenshots_small: s_small,
                    comp: pfi.comp
                }, req);
                data.content = render;
                app.get('renderer').render(res, undefined, data, req);
            });
        });
    });

    return router;
};
