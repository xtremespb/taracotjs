module.exports = function(db, ensure_indexes, config) {
    var async = require('async'),
        ObjectId = require('mongodb').ObjectID,
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
                async.series([
                    function(callback) {
                        db.collection('pages').insert({
                            "_id": new ObjectId('54c0ef39c00ad59027af779d'),
                            "pfilename": "feedback",
                            "pfolder": "/",
                            "pfolder_id": "j1_1",
                            "pdata": {
                                "en": {
                                    "ptitle": "Feedback",
                                    "plang": "en",
                                    "playout": config.layouts.default,
                                    "pkeywords": "",
                                    "pdesc": "",
                                    "pcontent": "<h1>Feedback</h1>\n\n<p>Please fill the following form to leave your feedback.</p>\n\n<p>!{root.blocks_sync.feedback(&#39;&quot;lang&quot;:&quot;&#39;+root.current_lang+&#39;&quot;#&quot;data&quot;:(([&quot;id&quot;:&quot;name&quot;#&quot;label_en&quot;:&quot;Your name&quot;#&quot;label_ru&quot;:&quot;Ваше имя&quot;#&quot;type&quot;:&quot;text&quot;#&quot;class&quot;:&quot;uk-form-width-large&quot;#&quot;mandatory&quot;:&quot;true&quot;]#[&quot;id&quot;:&quot;email&quot;#&quot;label_en&quot;:&quot;Your e-mail&quot;#&quot;label_ru&quot;:&quot;Ваш e-mail&quot;#&quot;type&quot;:&quot;email&quot;#&quot;class&quot;:&quot;uk-form-width-medium&quot;]#[&quot;id&quot;:&quot;reason&quot;#&quot;label_en&quot;:&quot;Do you like TaracotJS?&quot;#&quot;label_ru&quot;:&quot;Вам нравится система?&quot;#&quot;type&quot;:&quot;select&quot;#&quot;class&quot;:&quot;uk-form-width-small&quot;#&quot;values&quot;:(([&quot;value_en&quot;:&quot;Yes&quot;#&quot;value_ru&quot;:&quot;Да&quot;]#[&quot;value_en&quot;:&quot;No&quot;#&quot;value_ru&quot;:&quot;Нет&quot;]))]#[&quot;id&quot;:&quot;message&quot;#&quot;label_en&quot;:&quot;Message&quot;#&quot;label_ru&quot;:&quot;Сообщение&quot;#&quot;type&quot;:&quot;textarea&quot;#&quot;class&quot;:&quot;uk-form-width-large&quot;#&quot;mandatory&quot;:&quot;true&quot;]))&#39;)}</p>\n"
                                },
                                "ru": {
                                    "ptitle": "Обратная связь",
                                    "plang": "ru",
                                    "playout": config.layouts.default,
                                    "pkeywords": "",
                                    "pdesc": "",
                                    "pcontent": "<h1>Обратная связь</h1>\n\n<p>Пожалуйста, используйте форму, расположенную ниже, для обратной связи.</p>\n\n<p>!{root.blocks_sync.feedback(&#39;&quot;lang&quot;:&quot;&#39;+root.current_lang+&#39;&quot;#&quot;data&quot;:(([&quot;id&quot;:&quot;name&quot;#&quot;label_en&quot;:&quot;Your name&quot;#&quot;label_ru&quot;:&quot;Ваше имя&quot;#&quot;type&quot;:&quot;text&quot;#&quot;class&quot;:&quot;uk-form-width-large&quot;#&quot;mandatory&quot;:&quot;true&quot;]#[&quot;id&quot;:&quot;email&quot;#&quot;label_en&quot;:&quot;Your e-mail&quot;#&quot;label_ru&quot;:&quot;Ваш e-mail&quot;#&quot;type&quot;:&quot;email&quot;#&quot;class&quot;:&quot;uk-form-width-medium&quot;]#[&quot;id&quot;:&quot;reason&quot;#&quot;label_en&quot;:&quot;Do you like TaracotJS?&quot;#&quot;label_ru&quot;:&quot;Вам нравится система?&quot;#&quot;type&quot;:&quot;select&quot;#&quot;class&quot;:&quot;uk-form-width-small&quot;#&quot;values&quot;:(([&quot;value_en&quot;:&quot;Yes&quot;#&quot;value_ru&quot;:&quot;Да&quot;]#[&quot;value_en&quot;:&quot;No&quot;#&quot;value_ru&quot;:&quot;Нет&quot;]))]#[&quot;id&quot;:&quot;message&quot;#&quot;label_en&quot;:&quot;Message&quot;#&quot;label_ru&quot;:&quot;Сообщение&quot;#&quot;type&quot;:&quot;textarea&quot;#&quot;class&quot;:&quot;uk-form-width-large&quot;#&quot;mandatory&quot;:&quot;true&quot;]))&#39;)}</p>\n"
                                }
                            }
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('search_index').insert({
                            "swords": "feedback please fill following form leave your rootblockssyncfeedback'lang'rootcurrentlang'dataidnamelabelenyour namelabelruваше имяtypetextclassuk-form-width-largemandatorytrueidemaillabelenyour e-maillabelruваш e-mailtypeemailclassuk-form-width-mediumidreasonlabelendo like taracotjslabelruвам нравится системаtypeselectclassuk-form-width-smallvaluesvalueenyesvalueruдаvalueennovalueruнетidmessagelabelenmessagelabelruсообщениеtypetextareaclassuk-form-width-largemandatorytrue'",
                            "sdesc": "FEEDBACK Please fill the following form to leave your feedback.",
                            "stitle": "Feedback",
                            "slang": "en",
                            "surl": "/feedback",
                            "item_id": "54c0ef39c00ad59027af779d",
                            "space": "pages",
                        }, function(err) {
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function(callback) {
                        db.collection('search_index').insert({
                            "swords": "обратная связь пожалуйста используйте форму расположенную ниже обратной связи rootblockssyncfeedback'lang'rootcurrentlang'dataidnamelabelenyour namelabelruваше имяtypetextclassuk-form-width-largemandatorytrueidemaillabelenyour e-maillabelruваш e-mailtypeemailclassuk-form-width-mediumidreasonlabelendo like taracotjslabelruвам нравится системаtypeselectclassuk-form-width-smallvaluesvalueenyesvalueruдаvalueennovalueruнетidmessagelabelenmessagelabelruсообщениеtypetextareaclassuk-form-width-largemandatorytrue'",
                            "sdesc": "ОБРАТНАЯ СВЯЗЬ Пожалуйста, используйте форму, расположенную ниже, для обратной связи.",
                            "stitle": "Обратная связь",
                            "slang": "ru",
                            "surl": "/feedback",
                            "item_id": "54c0ef39c00ad59027af779d",
                            "space": "pages",
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
                // Misc. tasks
                _callback();
            },
            uninstall: function(_callback) {
                // Uninstall tasks
                _callback();
            }
        };
    return is;
};
