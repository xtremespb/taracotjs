var production_dir = 'C:/xtreme/taracotjs_prod',
    modules_dir = 'C:/xtreme/taracotjs_modules',
    min_dir = 'C:/xtreme/taracotjs_min',
    fs = require('fs-extra'),
    path = require('path'),
    glob = require('glob'),
    cleancss = require('clean-css'),
    uglifyjs = require("uglify-js"),
    htmlminify = require('html-minifier').minify,
    compressor = require('node-minify')
    source_dir = path.join(__dirname, '..'),
    dist_files = fs.readdirSync(source_dir),
    modules = fs.readdirSync(source_dir + '/modules');

fs.removeSync(production_dir);
fs.ensureDir(production_dir);
fs.removeSync(modules_dir);
fs.ensureDir(modules_dir);
fs.removeSync(min_dir);
fs.ensureDir(min_dir);

// Copy all files to production folder

for (var f in dist_files) {
    var file = dist_files[f];
    if (!file.match(/^\./) && file != 'grunt_process.cmd' && file != 'node_modules' && file != 'Gruntfile.js') {
        console.log('Copying ' + file);
        fs.copySync(source_dir + '/' + file, production_dir + '/' + file);
    }
}

// Remove all unminified files

for (var m in modules) {
    var module = modules[m],
        js_files = [];
    try {
        js_files = fs.readdirSync(production_dir + '/modules/' + module + '/public/modules/' + module + '/js');
    } catch (ex) {}
    for (var j in js_files) {
        if (js_files[j].match(/\.js$/) && !js_files[j].match(/\.min\./)) {
            try {
                fs.removeSync(production_dir + '/modules/' + module + '/public/modules/' + module + '/js/' + js_files[j]);
            } catch (ex) {}
        }
    }
}

glob(production_dir + "/**/*.html", {}, function(err, html_files) {
    if (err) throw (err);
    for (var c in html_files) {
        console.log(html_files[c]);
        var src = String(fs.readFileSync(html_files[c]));
        src = src.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ').replace(/\n/g, '').replace(/\t/g, '><');
        // fs.writeFileSync(html_files[c], htmlminify(src, {
        //     removeComments: true,
        //     collapseWhitespace: true,
        //     preserveLineBreaks: false,
        //     keepClosingSlash: false,
        //     minifyJS: true,
        //     minifyCSS: true,
        //     maxLineLength: 0
        // }));
        fs.writeFileSync(html_files[c], src);
    }
});

glob(production_dir + "/**/*.css", {}, function(err, css_files) {
    if (err) throw (err);
    for (var c in css_files) {
        var src = fs.readFileSync(css_files[c]),
            min = new cleancss().minify(src).styles;
        fs.writeFileSync(css_files[c], min);
    }
});

glob(production_dir + "/modules/*/*.js", {}, function(err, js_files) {
    if (err) throw (err);
    for (var c in js_files) {
        console.log(js_files[c]);
        var result = uglifyjs.minify(js_files[c]);
        fs.writeFileSync(js_files[c], result.code);
    }
});

glob(production_dir + "/bin/*.js", {}, function(err, js_files) {
    if (err) throw (err);
    for (var c in js_files) {
        console.log(js_files[c]);
        var result = uglifyjs.minify(js_files[c]);
        fs.writeFileSync(js_files[c], result.code);
    }
});

glob(production_dir + "/core/*.js", {}, function(err, js_files) {
    if (err) throw (err);
    for (var c in js_files) {
        console.log(js_files[c]);
        var result = uglifyjs.minify(js_files[c]);
        fs.writeFileSync(js_files[c], result.code);
    }
});

//fs.writeFileSync(production_dir + '/app.js', String(fs.readFileSync(production_dir + '/app.js')).replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ').replace(/\n/g, ''));

new compressor.minify({
    type: 'uglifyjs',
    fileIn: production_dir + '/app.js',
    fileOut: production_dir + '/app.js',
    callback: function(err, min){
        console.log(err);
    }
});

fs.writeFileSync(production_dir + "/version.js", uglifyjs.minify(production_dir + "/version.js").code);

glob(production_dir + "/**/.*", {}, function(err, dot_files) {
    if (err) throw (err);
    for (var c in dot_files)
        if (!dot_files[c].match(/\.template$/))
            fs.removeSync(dot_files[c]);
});
