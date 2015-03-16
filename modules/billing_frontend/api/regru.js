var _debug_proxy_url = 'http://10.206.247.66:8080',
    request = require('request');

module.exports = function(app) {
    var config = app.get('config'),
        regru = {
            register_domain: function(domain, zone, data, req, callback) {
                var input_data = {
                    domain_name: domain + '.' + zone,
                    period: 1,
                    enduser_ip: req.ip,
                    folder_name: config.billing_frontend.regru.folder_name,
                    nss: {
                        ns0: data.ns0,
                        ns1: data.ns1,
                        ns0ip: data.ns0ip,
                        ns1ip: data.ns1ip
                    },
                    contacts: {}
                };
                if (zone == 'ru' || zone == 'su') {

                } else {

                }
                callback();
            },
            update_ns: function(domain, data, callback) {

            }
        };
    return regru;
};
