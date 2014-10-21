var ObjectId = require('mongodb').ObjectID;

module.exports = function(app) {

    var auth = {
        check: function(req, callback) {
            if (!req.session || !req.session.auth || !req.session.auth._id) return callback(false);
            app.get('mongodb').collection('users').find({
                _id: new ObjectId(req.session.auth._id)
            }, {
                limit: 1
            }).toArray(function(err, items) {
                if (!err && items && items.length) {
                    delete items[0].password;
                    items[0]._id = items[0]._id.toHexString();
                    items[0].avatar = '';
                    if (items[0].groups) {
                        var groups_arr = items[0].groups.split(',');
                        items[0].groups_hash = {};
                        for (var i = 0; i < groups_arr.length; i++) items[0].groups_hash[groups_arr[i]] = true;
                    }
                    return callback(items[0]);
                }
                return callback(false);
            });
        }
    };

    return auth;

};
