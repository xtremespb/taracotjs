var whois = require('node-whois');

module.exports = function(app) {
    var config = app.get('config'),
        whois_api = {
            query: function(domain, callback) {
                whois.lookup(domain, function(err, data) {
                    if (err) return callback(-1);
                    if (data.match(/No entries found/) || data.match(/No match for domain/)) return callback(1);
                    return callback(0);
                });
            }
        };
    return whois_api;
};
