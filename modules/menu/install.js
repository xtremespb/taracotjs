module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'menu',
            version: '0.5.135',
            collections: function(_callback) {
                // Create collections
                async.series([
                    function(callback) {
                        db.createCollection('menu', function(err, collection) {
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
                        ensure_indexes('menu', ['lang'], null, true, function() {
                            callback();
                        });
                    }
                ], function(err) {
                    if (err) return _callback(err);
                    _callback();
                });
            },
            defaults: function(_callback) {
                // Create default values
                async.series([
                    function(callback) {
                        db.collection('menu').insert({
                            "lang": "en",
                            "menu_source": "<li id=\"taracot_menu_1408371943280\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Home</span>&nbsp;(<a href=\"/\" class=\"uk-nestable-item-url\">/</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1413378176219\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Blog</span>&nbsp;(<a href=\"/blog\" class=\"uk-nestable-item-url\">/blog</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1413378186758\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Social</span>&nbsp;(<a href=\"/social\" class=\"uk-nestable-item-url\">/social</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1420029808206\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Shop</span>&nbsp;(<a href=\"/catalog\" class=\"uk-nestable-item-url\">/catalog</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1430918202658\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Support</span>&nbsp;(<a href=\"/support\" class=\"uk-nestable-item-url\">/support</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1414680280546\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Feedback</span>&nbsp;(<a href=\"/feedback\" class=\"uk-nestable-item-url\">/feedback</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li>",
                            "menu_raw": "<ul><li class=\"taracot_menu_item_\"><a href=\"/\">Home</a></li><li class=\"taracot_menu_item_blog\"><a href=\"/blog\">Blog</a></li><li class=\"taracot_menu_item_social\"><a href=\"/social\">Social</a></li><li class=\"taracot_menu_item_catalog\"><a href=\"/catalog\">Shop</a></li><li class=\"taracot_menu_item_support\"><a href=\"/support\">Support</a></li><li class=\"taracot_menu_item_feedback\"><a href=\"/feedback\">Feedback</a></li></ul>",
                            "menu_uikit": "<ul class=\"uk-navbar-nav\"><li class=\"taracot_menu_item_\"><a href=\"/\">Home</a></li><li class=\"taracot_menu_item_blog\"><a href=\"/blog\">Blog</a></li><li class=\"taracot_menu_item_social\"><a href=\"/social\">Social</a></li><li class=\"taracot_menu_item_catalog\"><a href=\"/catalog\">Shop</a></li><li class=\"taracot_menu_item_support\"><a href=\"/support\">Support</a></li><li class=\"taracot_menu_item_feedback\"><a href=\"/feedback\">Feedback</a></li></ul>",
                            "menu_uikit_offcanvas": "<li class=\"taracot_menu_item_\"><a href=\"/\">Home</a></li><li class=\"taracot_menu_item_blog\"><a href=\"/blog\">Blog</a></li><li class=\"taracot_menu_item_social\"><a href=\"/social\">Social</a></li><li class=\"taracot_menu_item_catalog\"><a href=\"/catalog\">Shop</a></li><li class=\"taracot_menu_item_support\"><a href=\"/support\">Support</a></li><li class=\"taracot_menu_item_feedback\"><a href=\"/feedback\">Feedback</a></li>"
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('menu').insert({
                            "lang": "ru",
                            "menu_source": "<li id=\"taracot_menu_1415889121113\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Главная</span>&nbsp;(<a href=\"/\" class=\"uk-nestable-item-url\">/</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1415889130223\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Блог</span>&nbsp;(<a href=\"/blog\" class=\"uk-nestable-item-url\">/blog</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1423237799014\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Соц. сеть</span>&nbsp;(<a href=\"/social/\" class=\"uk-nestable-item-url\">/social/</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1423237809079\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Магазин</span>&nbsp;(<a href=\"/catalog/\" class=\"uk-nestable-item-url\">/catalog/</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1430918230748\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Поддержка</span>&nbsp;(<a href=\"/support\" class=\"uk-nestable-item-url\">/support</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1415889169227\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Обратная связь</span>&nbsp;(<a href=\"/feedback\" class=\"uk-nestable-item-url\">/feedback</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li>",
                            "menu_raw": "<ul><li class=\"taracot_menu_item_\"><a href=\"/\">Главная</a></li><li class=\"taracot_menu_item_blog\"><a href=\"/blog\">Блог</a></li><li class=\"taracot_menu_item_social_\"><a href=\"/social/\">Соц. сеть</a></li><li class=\"taracot_menu_item_catalog_\"><a href=\"/catalog/\">Магазин</a></li><li class=\"taracot_menu_item_support\"><a href=\"/support\">Поддержка</a></li><li class=\"taracot_menu_item_feedback\"><a href=\"/feedback\">Обратная связь</a></li></ul>",
                            "menu_uikit": "<ul class=\"uk-navbar-nav\"><li class=\"taracot_menu_item_\"><a href=\"/\">Главная</a></li><li class=\"taracot_menu_item_blog\"><a href=\"/blog\">Блог</a></li><li class=\"taracot_menu_item_social_\"><a href=\"/social/\">Соц. сеть</a></li><li class=\"taracot_menu_item_catalog_\"><a href=\"/catalog/\">Магазин</a></li><li class=\"taracot_menu_item_support\"><a href=\"/support\">Поддержка</a></li><li class=\"taracot_menu_item_feedback\"><a href=\"/feedback\">Обратная связь</a></li></ul>",
                            "menu_uikit_offcanvas": "<li class=\"taracot_menu_item_\"><a href=\"/\">Главная</a></li><li class=\"taracot_menu_item_blog\"><a href=\"/blog\">Блог</a></li><li class=\"taracot_menu_item_social_\"><a href=\"/social/\">Соц. сеть</a></li><li class=\"taracot_menu_item_catalog_\"><a href=\"/catalog/\">Магазин</a></li><li class=\"taracot_menu_item_support\"><a href=\"/support\">Поддержка</a></li><li class=\"taracot_menu_item_feedback\"><a href=\"/feedback\">Обратная связь</a></li>"
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
                var collections = ['menu'];
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
