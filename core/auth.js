var ObjectId = require('mongodb').ObjectID;

module.exports = function(app) {

    var auth = {
        check: function(req, callback) {
            var _sa = req.session.auth;
            if (typeof _sa == 'undefined' || !_sa) {
                callback(false);
                return;
            }
            var collection = app.get('mongodb').collection('users');
            app.get('mongodb').collection('users').find({
                _id: new ObjectId(_sa._id)
            }, {
                limit: 1
            }).toArray(function(err, items) {
                if (typeof items != 'undefined' && !err) {
                    if (items.length > 0) {
                        delete items[0].password;
                        if (items[0].groups) {
                            var groups_arr = items[0].groups.split(',');
                            items[0].groups_hash = {};
                            for (var i=0; i<groups_arr.length; i++) items[0].groups_hash[groups_arr[i]] = true;
                        }
                        callback(items[0]);
                        return;
                    }
                }
                callback(false);
                return;
            });
        }
    };

    return auth;

};
