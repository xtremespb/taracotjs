module.exports = function(app) {
    var items_per_page = 30;
    var router = app.get('express').Router();
    var i18nm = new(require('i18n-2'))({
        locales: app.get('config').locales,
        directory: app.get('path').join(__dirname, 'lang'),
        extension: '.js',
        devMode: false
    });
    var renderer = app.get('renderer'),
        path = app.get('path'),
        parser = app.get('parser');
    router.get('/', function(req, res) {
        i18nm.setLocale(req.i18n.getLocale());
        var data = {
            title: i18nm.__('module_name'),
            page_title: i18nm.__('module_name'),
            keywords: '',
            description: '',
            extra_css: "\n\t" + '<link rel="stylesheet" href="/modules/search/css/main.css" type="text/css">'
        };
        var render = renderer.render_file(path.join(__dirname, 'views'), 'search', {
            lang: i18nm,
            data: data
        }, req);
        data.content = render;
        app.get('renderer').render(res, undefined, data, req);
    });
    router.post('/data', function(req, res) {
        i18nm.setLocale(req.i18n.getLocale());
        var rep = {
            ipp: items_per_page
        };
        var skip = req.body.skip;
        var query = req.body.query;
        if (typeof skip != 'undefined') {
            if (!skip.match(/^[0-9]{1,10}$/)) {
                rep.status = 0;
                rep.error = i18nm.__("invalid_query");
                res.send(JSON.stringify(rep));
                return;
            }
        }
        if (!query) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            res.send(JSON.stringify(rep));
            return;
        }
        var query_words = parser.words(query).words.split(/ /);
        if (!query_words || !query_words.length) {
            rep.status = 0;
            rep.error = i18nm.__("invalid_query");
            res.send(JSON.stringify(rep));
            return;
        }
        query_words = parser.stem_all(query_words);
        var query_arr = [];
        for (var i=0; i<query_words.length; i++) {
        	query_arr.push({ swords: new RegExp(query_words[i]) });
        }
        rep.items = [];
        var find_query = {
        	slang: req.i18n.getLocale(),
            $and: query_arr
        };
        app.get('mongodb').collection('search_index').find(find_query).count(function(err, items_count) {
            if (!err && items_count > 0) {
                rep.total = items_count;
                app.get('mongodb').collection('search_index').find(find_query, {
                    skip: skip,
                    limit: items_per_page
                }).toArray(function(err, items) {
                    if (typeof items != 'undefined' && !err) {
                        for (var i = 0; i < items.length; i++) {
                            var arr = [];
                            arr.push(items[i].stitle);
                            arr.push(items[i].sdesc);
                            arr.push(items[i].surl);
                            rep.items.push(arr);
                        }
                    }
                    // Return results
                    rep.status = 1;
                    res.send(JSON.stringify(rep));
                }); // data
            } else { // Error or count = 0
                rep.status = 1;
                rep.total = '0';
                res.send(JSON.stringify(rep));
            }
        }); // count
    });
    return router;
};
