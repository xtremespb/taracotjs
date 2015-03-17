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
                        ns0: data.ns0 || '',
                        ns1: data.ns1 || '',
                        ns0ip: data.ns0ip || '',
                        ns1ip: data.ns1ip || ''
                    },
                    contacts: {}
                };
                if (zone == 'ru' || zone == 'su') {
                    var _contacts = {
                        p_addr: data.profile.addr_ru,
                        phone: data.profile.phone,
                        e_mail: data.profile.email
                    };
                    if (data.profile.org_r) {
                        _contacts.org = data.profile.org;
                        _contacts.org_r = data.profile.org_r;
                        _contacts.code = data.profile.code;
                        _contacts.kpp = data.profile.kpp;
                        _contacts.country = data.profile.country;
                        _contacts.address_r = data.profile.addr_ru;
                    } else {
                        _contacts.person = data.profile.n2e + ' ' + data.profile.n3e + ' ' + data.profile.n1e;
                        _contacts.person_r = data.profile.n1r + ' ' + data.profile.n2r + ' ' + data.profile.n3r;
                        _contacts.private_person_flag = parseInt(data.profile.private);
                        _contacts.passport = data.profile.passport;
                        _contacts.birth_date = data.profile.birth_date;
                        _contacts.country = data.profile.country;
                    }
                    if (data.profile.fax) _contacts.fax = data.profile.fax;
                    input_data.contacts = _contacts;
                } else {
                    var phone = data.profile.phone.replace(/ /, '.').replace(/ /gm, '');
                    var _contacts_int = {
                        o_company: data.profile.org || 'Private Person',
                        o_first_name: data.profile.n2e,
                        o_last_name: data.profile.n1e,
                        o_email: data.profile.email,
                        o_phone: phone,
                        o_addr: data.profile.addr,
                        o_city: data.profile.city,
                        o_state: data.profile.state,
                        o_postcode: data.profile.postcode,
                        o_country_code: data.profile.country,
                        a_company: data.profile.org || 'Private Person',
                        a_first_name: data.profile.n2e,
                        a_last_name: data.profile.n1e,
                        a_email: data.profile.email,
                        a_phone: phone,
                        a_addr: data.profile.addr,
                        a_city: data.profile.city,
                        a_state: data.profile.state,
                        a_postcode: data.profile.postcode,
                        a_country_code: data.profile.country,
                        t_company: data.profile.org || 'Private Person',
                        t_first_name: data.profile.n2e,
                        t_last_name: data.profile.n1e,
                        t_email: data.profile.email,
                        t_phone: phone,
                        t_addr: data.profile.addr,
                        t_city: data.profile.city,
                        t_state: data.profile.state,
                        t_postcode: data.profile.postcode,
                        t_country_code: data.profile.country,
                        b_company: data.profile.org || 'Private Person',
                        b_first_name: data.profile.n2e,
                        b_last_name: data.profile.n1e,
                        b_email: data.profile.email,
                        b_phone: phone,
                        b_addr: data.profile.addr,
                        b_city: data.profile.city,
                        b_state: data.profile.state,
                        b_postcode: data.profile.postcode,
                        b_country_code: data.profile.country
                    };
                    if (data.profile.fax) {
                        var fax = data.profile.fax.replace(/ /, '.').replace(/ /gm, '');
                        _contacts_int.o_fax = fax;
                        _contacts_int.a_fax = fax;
                        _contacts_int.t_fax = fax;
                        _contacts_int.b_fax = fax;
                    }
                    if (data.profile.private) _contacts_int.private_person_flag = 1;
                    input_data.contacts = _contacts_int;
                }
                request({
                    url: 'https://api.reg.ru/api/regru2/domain/create?input_data=' + JSON.stringify(input_data) + '&input_format=json&output_format=json&password=' + config.billing_frontend.regru.password + '&username=' + config.billing_frontend.regru.username,
                    proxy: _debug_proxy_url,
                    timeout: 10000, // 10 seconds
                    json: true
                }, function(error, response, body) {
                    var rep = {
                        error: error,
                        response: response,
                        body: body,
                        status: -1
                    };
                    if (!error && response.statusCode === 200) {
                        if (body.result == 'success') {
                            rep.status = 1;
                            return callback(rep);
                        } else {
                            rep.status = 0;
                            return callback(rep);
                        }
                    } else {
                        callback(rep);
                    }
                });
            },
            renew_domain: function(domain, zone, callback) {
                request({
                    url: 'https://api.reg.ru/api/regru2/service/renew?output_format=json&period=1&servtype=domain&domain_name=' + domain + '.' + zone + '&password=' + config.billing_frontend.regru.password + '&username=' + config.billing_frontend.regru.username,
                    proxy: _debug_proxy_url,
                    timeout: 10000, // 10 seconds
                    json: true
                }, function(error, response, body) {
                    var rep = {
                        error: error,
                        response: response,
                        body: body,
                        status: -1
                    };
                    if (!error && response.statusCode === 200) {
                        if (body.result == 'success') {
                            rep.status = 1;
                            return callback(rep);
                        } else {
                            rep.status = 0;
                            return callback(rep);
                        }
                    } else {
                        callback(rep);
                    }
                });
            },
            change_ns: function(domain, zone, data, callback) {
                var input_data = {
                    domain_name: domain + '.' + zone,
                    nss: {
                        ns0: data.ns0 || '',
                        ns1: data.ns1 || '',
                        ns0ip: data.ns0ip || '',
                        ns1ip: data.ns1ip || ''
                    }
                };
                request({
                    url: 'https://api.reg.ru/api/regru2/domain/update_nss?input_data=' + JSON.stringify(input_data) + '&input_format=json&output_format=json&password=' + config.billing_frontend.regru.password + '&username=' + config.billing_frontend.regru.username,
                    proxy: _debug_proxy_url,
                    timeout: 10000, // 10 seconds
                    json: true
                }, function(error, response, body) {
                    var rep = {
                        error: error,
                        response: response,
                        body: body,
                        status: -1
                    };
                    if (!error && response.statusCode === 200) {
                        if (body.result == 'success') {
                            rep.status = 1;
                            return callback(rep);
                        } else {
                            rep.status = 0;
                            return callback(rep);
                        }
                    } else {
                        callback(rep);
                    }
                });
            }
        };
    return regru;
};
