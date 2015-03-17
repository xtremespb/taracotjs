var config = {
    "billing_frontend": {
        "hosting_api": "ispmanager",
        "whois_api": "whois",
        "ignore_whois_errors": 1,
        "domain_api": "regru",
        "default_ns0": "ns1.re-hash.org",
        "default_ns1": "ns2.re-hash.org",
        "default_ns0_ip": "",
        "default_ns1_ip": "",
        "ispmanager": {
            "url": "https://cp.re-hash.org/ispmgr",
            "login": "rhcp",
            "pwd": "3W5k1H5o"
        },
        "regru": {
        	"folder_name": "re-hash.ru",
        	"username": "test",
        	"password": "test"
        }
    }
};

module.exports = config;
