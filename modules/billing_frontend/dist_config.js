var config = {
    "billing_frontend": {
        "hosting_api": "ispmanager",
        "whois_api": "whois",
        "ignore_whois_errors": 1,
        "domain_api": "regru",
        "payment_api": "robokassa, webmoney",
        "order_ttl": 604800, // Time before an outdated order gets removed - 7 days by default
        "default_ns0": "ns1.re-hash.org",
        "default_ns1": "ns2.re-hash.org",
        "default_ns0_ip": "",
        "default_ns1_ip": "",
        "hosting_panel_url": "https://cp.re-hash.org/ispmgr",
        "site_url": "https://re-hash.ru",
        "customer_panel_url": {
            "en": "https://en.re-hash.ru/customer",
            "ru": "https://re-hash.ru/customer"
        },
        "log": {
            "console": {
                "level": "info",
                "colorize": true
            },
            "file": {
                "level": "info",
                "filename": "billing_process_accounts.log",
                "json": true,
                "maxsize": 1048576,
                "maxFiles": 3
            }
        },
        "ispmanager": {
            "url": "https://cp.re-hash.org/ispmgr",
            "login": "",
            "pwd": ""
        },
        "regru": {
            "folder_name": "re-hash.ru",
            "username": "test",
            "password": "test"
        },
        "robokassa": {
            "url": "http://test.robokassa.ru/Index.aspx",
            "sMerchantLogin": "",
            "sIncCurrLabel": "BANKOCEAN2R",
            "sMerchantPass1": "",
            "sMerchantPass2": "",
            "discount_percent": 7
        },
        "webmoney": {
            "LMI_PAYEE_PURSE": "R704413344646",
            "LMI_PAYMENT_DESC": "Payment for invoice [inv]",
            "LMI_SECRET_KEY": "webmoney_secret_key"
        }
    }
};

module.exports = config;
