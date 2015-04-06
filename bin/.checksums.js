var modules_dir = 'C:/xtreme/taracotjs_modules/',
    checksum = require('checksum'),
    glob = require('glob'),
    files_hash = {},
    async = require('async'),
    fs = require('fs-extra'),
    checksums = [],
    update = fs.readJsonSync(modules_dir + 'update_info.json');

glob(modules_dir + "/*.zip", {}, function(err, zip_files) {
    if (err) throw (err);
    for (var zf in zip_files) {
        var file = zip_files[zf].replace(new RegExp(modules_dir), '').replace(/^taracot_/, '').replace(/\.zip$/, '');
        files_hash[zip_files[zf]] = file;
    }
    async.each(Object.keys(files_hash), function(key, callback) {
        if (!key.match(/latest_(.*)\.zip/)) {
            checksum.file(key, function(err, sum) {
                if (err) return callback(err);
                console.log("Setting " + sum + " for " + files_hash[key]);
                update[files_hash[key]].checksum = sum;
                callback();
            });
        } else {
            callback();
        }
    }, function(err) {
        if (err) return console.log('Error: ' + err);
        fs.writeJson(modules_dir + 'update_info.json', update, function(err) {
            if (err) return console.log(err);
            return console.log("All done");
        });
    });
});
