module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'menu',
            version: '0.5.20',
            collections: function(_callback) {
                // Create collections
                console.log("\nCreating collections for module: " + this.name + ' (version ' + this.version + ")\n");
                async.series([
                    function(callback) {
                        console.log("[+] Collection: menu");
                        db.createCollection('menu', function(err, collection) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    }
                ], function(err) {
                    if (err) {
                        console.log("[!] Installation failed");
                        console.log(err);
                        process.exit(1);
                    }
                    console.log("[*] Finished creating collections");
                    _callback();
                });
            },
            indexes: function(_callback) {
                // Create indexes
                console.log("\nCreating indexes for module: " + this.name + ' (version ' + this.version + ")\n");
                async.series([
                    function(callback) {
                        console.log("[+] Collection: menu");
                        ensure_indexes('menu', ['lang'], null, true, function() {
                            console.log("[*] Success (menu)");
                            callback();
                        });
                    }
                ], function(err) {
                    if (err) {
                        console.log("[!] Installation failed");
                        console.log(err);
                        process.exit(1);
                    }
                    console.log("[*] Finished creating indexes");
                    _callback();
                });
            },
            defaults: function(_callback) {
                // Create default values
                console.log("\nInserting default values for module: " + this.name + ' (version ' + this.version + ")\n");
                async.series([
                    function(callback) {
                        console.log("[+] menu: en");
                        db.collection('menu').insert({
                            "lang": "en",
                            "menu_source": "<li id=\"taracot_menu_1408371943280\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Home</span>&nbsp;(<a href=\"/\" class=\"uk-nestable-item-url\">/</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1413378176219\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Blog feed</span>&nbsp;(<a href=\"/blog\" class=\"uk-nestable-item-url\">/blog</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1413378845428\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">New post</span>&nbsp;(<a href=\"/blog/post\" class=\"uk-nestable-item-url\">/blog/post</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1413378186758\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Social</span>&nbsp;(<a href=\"/social\" class=\"uk-nestable-item-url\">/social</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1420029808206\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Shop</span>&nbsp;(<a href=\"/catalog\" class=\"uk-nestable-item-url\">/catalog</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1414680280546\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Feedback</span>&nbsp;(<a href=\"/feedback\" class=\"uk-nestable-item-url\">/feedback</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li>",
                            "menu_raw": "<ul><li class=\"taracot_menu_item_\"><a href=\"/\">Home</a></li><li class=\"taracot_menu_item_blog\"><a href=\"/blog\">Blog feed</a></li><li class=\"taracot_menu_item_blog_post\"><a href=\"/blog/post\">New post</a></li><li class=\"taracot_menu_item_social\"><a href=\"/social\">Social</a></li><li class=\"taracot_menu_item_catalog\"><a href=\"/catalog\">Shop</a></li><li class=\"taracot_menu_item_feedback\"><a href=\"/feedback\">Feedback</a></li></ul>",
                            "menu_uikit": "<nav class=\"uk-navbar\"><ul class=\"uk-navbar-nav\"><li class=\"taracot_menu_item_\"><a href=\"/\">Home</a></li><li class=\"taracot_menu_item_blog\"><a href=\"/blog\">Blog feed</a></li><li class=\"taracot_menu_item_blog_post\"><a href=\"/blog/post\">New post</a></li><li class=\"taracot_menu_item_social\"><a href=\"/social\">Social</a></li><li class=\"taracot_menu_item_catalog\"><a href=\"/catalog\">Shop</a></li><li class=\"taracot_menu_item_feedback\"><a href=\"/feedback\">Feedback</a></li></ul></nav>",
                            "menu_uikit_offcanvas": "<li class=\"taracot_menu_item_\"><a href=\"/\">Home</a></li><li class=\"taracot_menu_item_blog\"><a href=\"/blog\">Blog feed</a></li><li class=\"taracot_menu_item_blog_post\"><a href=\"/blog/post\">New post</a></li><li class=\"taracot_menu_item_social\"><a href=\"/social\">Social</a></li><li class=\"taracot_menu_item_catalog\"><a href=\"/catalog\">Shop</a></li><li class=\"taracot_menu_item_feedback\"><a href=\"/feedback\">Feedback</a></li>"
                        }, function(err) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    },
                    function(callback) {
                        console.log("[+] menu: ru");
                        db.collection('menu').insert({
                            "lang": "ru",
                            "menu_source": "<li id=\"taracot_menu_1415889121113\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Главная</span>&nbsp;(<a href=\"/\" class=\"uk-nestable-item-url\">/</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1415889130223\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Блог</span>&nbsp;(<a href=\"/blog\" class=\"uk-nestable-item-url\">/blog</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1415889142706\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Новый пост</span>&nbsp;(<a href=\"/blog/post\" class=\"uk-nestable-item-url\">/blog/post</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li><li id=\"taracot_menu_1415889169227\" class=\"uk-nestable-list-item\"><div class=\"uk-nestable-item\"><div class=\"uk-nestable-handle\"></div><div data-nestable-action=\"toggle\"></div>&nbsp;<span class=\"uk-nestable-item-text\">Обратная связь</span>&nbsp;(<a href=\"/feedback\" class=\"uk-nestable-item-url\">/feedback</a>)&nbsp;&nbsp;&nbsp;<button class=\"uk-button uk-button-small taracot-btn-menu-edit\"><i class=\"uk-icon-edit\"></i></button>&nbsp;<button class=\"uk-button uk-button-small uk-button-danger taracot-btn-menu-delete\"><i class=\"uk-icon-trash-o\"></i></button></div></li>",
                            "menu_raw": "<ul><li class=\"taracot_menu_item_\"><a href=\"/\">Главная</a></li><li class=\"taracot_menu_item_blog\"><a href=\"/blog\">Блог</a></li><li class=\"taracot_menu_item_blog_post\"><a href=\"/blog/post\">Новый пост</a></li><li class=\"taracot_menu_item_feedback\"><a href=\"/feedback\">Обратная связь</a></li></ul>",
                            "menu_uikit": "<nav class=\"uk-navbar\"><ul class=\"uk-navbar-nav\"><li class=\"taracot_menu_item_\"><a href=\"/\">Главная</a></li><li class=\"taracot_menu_item_blog\"><a href=\"/blog\">Блог</a></li><li class=\"taracot_menu_item_blog_post\"><a href=\"/blog/post\">Новый пост</a></li><li class=\"taracot_menu_item_feedback\"><a href=\"/feedback\">Обратная связь</a></li></ul></nav>",
                            "menu_uikit_offcanvas": "<li class=\"taracot_menu_item_\"><a href=\"/\">Главная</a></li><li class=\"taracot_menu_item_blog\"><a href=\"/blog\">Блог</a></li><li class=\"taracot_menu_item_blog_post\"><a href=\"/blog/post\">Новый пост</a></li><li class=\"taracot_menu_item_feedback\"><a href=\"/feedback\">Обратная связь</a></li>"
                        }, function(err) {
                            if (err) {
                                console.log("[!] Fail");
                                console.log(err);
                                process.exit(1);
                            }
                            console.log("[*] Success");
                            callback();
                        });
                    }
                ], function(err) {
                    if (err) {
                        console.log("[!] Installation failed");
                        console.log(err);
                        process.exit(1);
                    }
                    console.log("[*] Finished inserting default values");
                    _callback();
                });
            },
            misc: function(_callback) {
                // Other things to do
                _callback();
            }
        };
    return is;
};
