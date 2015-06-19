module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'settings',
            version: '0.5.170',
            collections: function(_callback) {
                // Create collections
                async.series([
                    function(callback) {
                        db.createCollection('settings', function(err, collection) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.createCollection('counters', function(err, collection) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.createCollection('statistics', function(err, collection) {
                            if (err) return callback(err);
                            callback();
                        });
                    }
                ], function(err) {
                    if (err) return _callback(err);
                    _callback();
                });
            },
            indexes: function(_callback) {
                // Create indexes
                async.series([
                    function(callback) {
                        ensure_indexes('settings', ['oname', 'olang'], null, null, function() {
                            callback();
                        });
                    },
                    function(callback) {
                        ensure_indexes('statistics', ['day'], null, true, function() {
                            callback();
                        });
                    }
                ], function(err) {
                    _callback();
                });
            },
            defaults: function(_callback) {
                // Create default values
                async.series([
                    function(callback) {
                        db.collection('settings').insert({
                            oname: 'site_title',
                            ovalue: 'Taracot JS',
                            olang: 'en'
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('settings').insert({
                            oname: 'site_title',
                            ovalue: 'Taracot JS',
                            olang: 'ru'
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('settings').insert({
                            oname: 'site_keywords',
                            ovalue: 'taracot, taracotjs, node.js, mongodb, redis, cms, content management system',
                            olang: 'en'
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('settings').insert({
                            oname: 'site_keywords',
                            ovalue: 'taracot, taracotjs, node.js, mongodb, redis, cms, система управления сайтами',
                            olang: 'ru'
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('settings').insert({
                            oname: 'site_description',
                            ovalue: 'TaracotJS is a simple content management system (CMS) written in JavaScript on both client and server sides (using Node). It\'s free, open source and is running on multiple platrforms including Linux, MacOS and Windows. All modern browsers are supported.',
                            olang: 'en'
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('settings').insert({
                            oname: 'site_description',
                            ovalue: 'TaracotJS - простая система управления сайтами (CMS), написанная на JavaScript и построенная на технологиях Node.JS, MongoDB и Redis.',
                            olang: 'ru'
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    }
                ], function(err) {
                    if (err) return _callback(err);
                    _callback();
                });
            },
            misc: function(_callback) {
                // Other things to do
                _callback();
            },
            uninstall: function(_callback) {
                var collections = ['settings', 'counters', 'statistics'];
                async.eachSeries(collections, function(name, e_callback) {
                    db.collection(name).drop(function(err) {
                        if (err) return e_callback(err);
                        e_callback();
                    });

                }, function(err) {
                    if (err) return _callback(err);
                    _callback();
                });
            }
        };
    return is;
};
