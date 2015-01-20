module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        is = {
            name: 'feedback',
            version: '0.5.20',
            collections: function(_callback) {
                // Create collections
                _callback();
            },
            indexes: function(_callback) {
                // Create indexes
                _callback();
            },
            defaults: function(_callback) {
                // Create default values
                console.log("\nInserting default values for module: " + this.name + ' (version ' + this.version + ")\n");
                async.series([
                    function(callback) {
                        console.log("[+] Feedback page: en");
                        db.collection('pages').insert({
                            "ptitle": "Feedback",
                            "pfilename": "feedback",
                            "pfolder": "/",
                            "pfolder_id": "j1_1",
                            "plang": "en",
                            "playout": "index",
                            "pkeywords": "",
                            "pdesc": "",
                            "pcontent": "<h1>Feedback</h1>\n\n<p>Please fill the following form to leave your feedback.</p>\n\n<p>!{root.blocks_sync.feedback(&#39;&quot;lang&quot;:&quot;&#39;+root.current_lang+&#39;&quot;#&quot;data&quot;:(([&quot;id&quot;:&quot;name&quot;#&quot;label_en&quot;:&quot;Your name&quot;#&quot;label_ru&quot;:&quot;Ваше имя&quot;#&quot;type&quot;:&quot;text&quot;#&quot;class&quot;:&quot;uk-form-width-large&quot;#&quot;mandatory&quot;:&quot;true&quot;]#[&quot;id&quot;:&quot;email&quot;#&quot;label_en&quot;:&quot;Your e-mail&quot;#&quot;label_ru&quot;:&quot;Ваш e-mail&quot;#&quot;type&quot;:&quot;email&quot;#&quot;class&quot;:&quot;uk-form-width-medium&quot;]#[&quot;id&quot;:&quot;reason&quot;#&quot;label_en&quot;:&quot;Do you like TaracotJS?&quot;#&quot;label_ru&quot;:&quot;Вам нравится система?&quot;#&quot;type&quot;:&quot;select&quot;#&quot;class&quot;:&quot;uk-form-width-small&quot;#&quot;values&quot;:(([&quot;value_en&quot;:&quot;Yes&quot;#&quot;value_ru&quot;:&quot;Да&quot;]#[&quot;value_en&quot;:&quot;No&quot;#&quot;value_ru&quot;:&quot;Нет&quot;]))]#[&quot;id&quot;:&quot;message&quot;#&quot;label_en&quot;:&quot;Message&quot;#&quot;label_ru&quot;:&quot;Сообщение&quot;#&quot;type&quot;:&quot;textarea&quot;#&quot;class&quot;:&quot;uk-form-width-large&quot;#&quot;mandatory&quot;:&quot;true&quot;]))&#39;)}</p>\n"
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
                        console.log("[+] Feedback page: ru");
                        db.collection('warehouse').insert({
                            "ptitle": "Feedback",
                            "pfilename": "feedback",
                            "pfolder": "/",
                            "pfolder_id": "j1_1",
                            "plang": "ru",
                            "playout": "index",
                            "pkeywords": "",
                            "pdesc": "",
                            "pcontent": "<h1>Обратная связь</h1>\n\n<p>Пожалуйста, используйте форму, расположенную ниже, для обратной связи.</p>\n\n<p>!{root.blocks_sync.feedback(&#39;&quot;lang&quot;:&quot;&#39;+root.current_lang+&#39;&quot;#&quot;data&quot;:(([&quot;id&quot;:&quot;name&quot;#&quot;label_en&quot;:&quot;Your name&quot;#&quot;label_ru&quot;:&quot;Ваше имя&quot;#&quot;type&quot;:&quot;text&quot;#&quot;class&quot;:&quot;uk-form-width-large&quot;#&quot;mandatory&quot;:&quot;true&quot;]#[&quot;id&quot;:&quot;email&quot;#&quot;label_en&quot;:&quot;Your e-mail&quot;#&quot;label_ru&quot;:&quot;Ваш e-mail&quot;#&quot;type&quot;:&quot;email&quot;#&quot;class&quot;:&quot;uk-form-width-medium&quot;]#[&quot;id&quot;:&quot;reason&quot;#&quot;label_en&quot;:&quot;Do you like TaracotJS?&quot;#&quot;label_ru&quot;:&quot;Вам нравится система?&quot;#&quot;type&quot;:&quot;select&quot;#&quot;class&quot;:&quot;uk-form-width-small&quot;#&quot;values&quot;:(([&quot;value_en&quot;:&quot;Yes&quot;#&quot;value_ru&quot;:&quot;Да&quot;]#[&quot;value_en&quot;:&quot;No&quot;#&quot;value_ru&quot;:&quot;Нет&quot;]))]#[&quot;id&quot;:&quot;message&quot;#&quot;label_en&quot;:&quot;Message&quot;#&quot;label_ru&quot;:&quot;Сообщение&quot;#&quot;type&quot;:&quot;textarea&quot;#&quot;class&quot;:&quot;uk-form-width-large&quot;#&quot;mandatory&quot;:&quot;true&quot;]))&#39;)}</p>\n"
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
            }
        };
    return is;
};
