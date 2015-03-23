var production_dir = 'C:/xtreme/taracotjs_prod',
    modules_dir = 'C:/xtreme/taracotjs_modules',
    modules_dir_tmp = 'C:/xtreme/taracotjs_modules/temp',
    min_dir = 'C:/xtreme/taracotjs_min',
    fs = require('fs-extra'),
    path = require('path'),
    glob = require('glob'),
    cleancss = require('clean-css'),
    uglifyjs = require("uglify-js"),
    htmlminify = require('html-minifier').minify,
    compressor = require('node-minify'),
    archiver = require('archiver'),
    async = require('async'),
    checksum = require('checksum'),
    source_dir = path.join(__dirname, '..'),
    dist_files = fs.readdirSync(source_dir),
    modules = fs.readdirSync(source_dir + '/modules'),
    // non_full_modules = ['billing_accounts', 'billing_conf', 'billing_frontend', 'billing_profiles'],
    core_modules = ['settings', 'search', 'auth', 'cp', 'pages', 'parts', 'user', 'lang'];

console.log("Removing and re-creating production, modules and min. version dirs...");

fs.removeSync(production_dir);
fs.ensureDir(production_dir);
fs.removeSync(modules_dir);
fs.ensureDir(modules_dir);
fs.ensureDir(modules_dir_tmp);
fs.removeSync(min_dir);
fs.ensureDir(min_dir);

// Copy all files to production folder

console.log("Copying files to production folder...");

for (var f in dist_files) {
    var file = dist_files[f];
    if (!file.match(/^\./) && file != 'grunt_process.cmd' && file != 'node_modules') {
        fs.copySync(source_dir + '/' + file, production_dir + '/' + file);
    }
}

console.log("Creating dev release ZIP file...");
var dev_archive = archiver('zip'),
    dev_output = fs.createWriteStream(modules_dir + '/latest_dev.zip_');
dev_archive.pipe(dev_output);
dev_archive.bulk([{
    expand: true,
    cwd: production_dir,
    src: ['./**']
}]);
dev_output.on('close', function() {
    // Remove modules from non_full_modules array
    // for (var nfm in non_full_modules)
    //     fs.removeSync(production_dir + '/modules/' + non_full_modules[nfm]);
    // Remove all unminified files
    console.log("Removing all uminified JS files from modules...");
    fs.removeSync(production_dir + '/Gruntfile.js');

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
    console.log("Processing html files...");
    glob(production_dir + "/**/*.html", {}, function(err, html_files) {
        if (err) throw (err);
        for (var c in html_files) {
            var src = String(fs.readFileSync(html_files[c]));
            src = src.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ').replace(/\n/g, '').replace(/\t/g, '><');
            fs.writeFileSync(html_files[c], src);
        }
        console.log("Processing css files...");
        glob(production_dir + "/**/*.css", {}, function(err, css_files) {
            if (err) throw (err);
            for (var c in css_files) {
                var src = fs.readFileSync(css_files[c]),
                    min = new cleancss().minify(src).styles;
                fs.writeFileSync(css_files[c], min);
            }
            console.log("Processing modules/ JS files...");
            glob(production_dir + "/modules/*/*.js", {}, function(err, js_files) {
                if (err) throw (err);
                for (var c in js_files) {
                    var result = uglifyjs.minify(js_files[c]);
                    fs.writeFileSync(js_files[c], result.code);
                }
                console.log("Processing bin/ JS files...");
                glob(production_dir + "/bin/*.js", {}, function(err, js_files) {
                    if (err) throw (err);
                    for (var c in js_files) {
                        var result = uglifyjs.minify(js_files[c]);
                        fs.writeFileSync(js_files[c], result.code);
                    }
                    console.log("Processing core/ JS files...");
                    glob(production_dir + "/core/*.js", {}, function(err, js_files) {
                        if (err) throw (err);
                        for (var c in js_files) {
                            var result = uglifyjs.minify(js_files[c]);
                            fs.writeFileSync(js_files[c], result.code);
                        }
                    });
                    console.log("Minifiying app.js...");
                    new compressor.minify({
                        type: 'uglifyjs',
                        fileIn: production_dir + '/app.js',
                        fileOut: production_dir + '/app.js',
                        callback: function(err, min) {
                            if (err) console.log(err);
                        }
                    });
                    console.log("Minifiying version.js...");
                    fs.writeFileSync(production_dir + "/version.js", uglifyjs.minify(production_dir + "/version.js").code);
                    glob(production_dir + "/**/.*", {}, function(err, dot_files) {
                        if (err) throw (err);
                        for (var c in dot_files)
                            if (!dot_files[c].match(/\.template$/))
                                fs.removeSync(dot_files[c]);
                        console.log("Copying production folder to minimal folder...");
                        fs.copySync(production_dir, min_dir);
                        var core_modules_hash = {};
                        for (var cm in core_modules) core_modules_hash[core_modules[cm]] = 1;
                        console.log("Removing non-core modules from minimal version...");
                        for (var m in modules) {
                            if (!core_modules_hash[modules[m]]) {
                                fs.removeSync(min_dir + '/modules/' + modules[m]);
                            }
                        }
                        // Build core update
                        console.log("Copying core update files...");
                        fs.copySync(min_dir + '/bin', modules_dir_tmp + '/bin');
                        fs.copySync(min_dir + '/core', modules_dir_tmp + '/core');
                        fs.copySync(min_dir + '/fonts', modules_dir_tmp + '/fonts');
                        fs.copySync(min_dir + '/public', modules_dir_tmp + '/public');
                        fs.copySync(min_dir + '/views', modules_dir_tmp + '/views');
                        fs.copySync(min_dir + '/app.js', modules_dir_tmp + '/app.js');
                        fs.copySync(min_dir + '/version.js', modules_dir_tmp + '/version.js');
                        fs.copySync(min_dir + '/package.json', modules_dir_tmp + '/package.json');
                        var core_archive = archiver('zip'),
                            core_output = fs.createWriteStream(modules_dir + '/taracot_core.zip_');
                        core_archive.pipe(core_output);
                        console.log("Creating core update ZIP file...");
                        core_archive.bulk([{
                            expand: true,
                            cwd: modules_dir_tmp,
                            src: ['./**']
                        }]);
                        core_output.on('close', function() {
                            checksum.file(modules_dir + '/taracot_core.zip_', function(err, core_sum) {
                                async.eachSeries(modules, function(module, callback) {
                                    console.log("Re-creating temp dir...");
                                    fs.removeSync(modules_dir_tmp);
                                    fs.ensureDir(modules_dir_tmp);
                                    console.log("Copying " + module + " files...");
                                    fs.copySync(production_dir + '/modules/' + module, modules_dir_tmp + '/' + module);
                                    var core_archive = archiver('zip'),
                                        core_output = fs.createWriteStream(modules_dir + '/taracot_' + module + '.zip');
                                    core_archive.pipe(core_output);
                                    console.log("Creating " + module + " update ZIP file...");
                                    core_archive.bulk([{
                                        expand: true,
                                        cwd: modules_dir_tmp,
                                        src: ['./**']
                                    }]);
                                    core_output.on('close', function() {
                                        callback();
                                    });
                                    core_archive.finalize();
                                }, function(err) {
                                    if (err) return console.log(err);
                                    console.log("Gathering version information...");
                                    var taracot_info = {
                                            core: {}
                                        },
                                        config = require(source_dir + '/version');
                                    taracot_info.core.version = config.taracotjs;
                                    taracot_info.core.checksum = core_sum;
                                    for (var m in modules) {
                                        var module = modules[m],
                                            installer = require(source_dir + '/modules/' + module + '/install')(undefined, undefined, undefined);
                                        taracot_info[module] = {};
                                        taracot_info[module].version = installer.version || '0.0.1';
                                    }
                                    glob(modules_dir + "/*.zip", {}, function(err, zip_files) {
                                        var cnt = 0;
                                        async.eachSeries(zip_files, function(file, callback) {
                                            checksum.file(file, function(err, sum) {
                                                if (err || !sum) return callback(err || "Failed to get checksum for " + file);
                                                taracot_info[modules[cnt]].checksum = sum;
                                                cnt++;
                                                callback();
                                            });
                                        }, function(err) {
                                            if (err) return console.log(err);
                                            fs.outputJson(modules_dir + '/' + 'update_info.json', taracot_info, function(err) {
                                                if (err) return console.log(err);
                                                fs.renameSync(modules_dir + '/taracot_core.zip_', modules_dir + '/taracot_core.zip');
                                                fs.renameSync(modules_dir + '/latest_dev.zip_', modules_dir + '/latest_dev.zip');
                                                fs.removeSync(modules_dir_tmp);
                                                console.log("Creating production release ZIP file...");
                                                var prod_archive = archiver('zip'),
                                                    prod_output = fs.createWriteStream(modules_dir + '/latest_prod.zip');
                                                prod_archive.pipe(prod_output);
                                                prod_archive.bulk([{
                                                    expand: true,
                                                    cwd: production_dir,
                                                    src: ['./**']
                                                }]);
                                                prod_output.on('close', function() {
                                                    console.log("Creating minimal release ZIP file...");
                                                    var min_archive = archiver('zip'),
                                                        min_output = fs.createWriteStream(modules_dir + '/latest_min.zip');
                                                    min_archive.pipe(min_output);
                                                    min_archive.bulk([{
                                                        expand: true,
                                                        cwd: min_dir,
                                                        src: ['./**']
                                                    }]);
                                                    min_output.on('close', function() {
                                                        console.log("Removing production and min. version dirs...");
                                                        fs.removeSync(min_dir);
                                                        fs.removeSync(production_dir);
                                                        console.log("All done.");
                                                    });
                                                    min_archive.finalize();
                                                });
                                                prod_archive.finalize();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                        core_archive.finalize();
                    });
                });
            });
        });
    });

});
dev_archive.finalize();
