/*

 Robokassa API

*/

module.exports = function(app) {
    var i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales,
            directory: app.get('path').join(__dirname, 'lang'),
            extension: '.js',
            devMode: app.get('config').locales_dev_mode
        }),
        router = app.get('express').Router(),
        config = app.get('config'),
        crypto = require('crypto');

    /*

    Redirect user to the Robokassa website to make a payment

    */

    router.get('/invoice/:invid', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var invid = parseInt(req.params.invid);
        var render_data = {
            title: i18nm.__('process_payment'),
            current_lang: req.session.current_locale,
            page_title: i18nm.__('process_payment')
        };
        if (!invid || invid.isNaN || invid < 1) {
            render_data.content = i18nm.__('invalid_order_id');
            return app.get('renderer').render(res, undefined, render_data, req);
        }
        app.get('mongodb').collection('warehouse_orders').find({
            order_id: invid,
            user_id: req.session.auth._id
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err || !items || !items.length || items[0].order_status !== 0) {
                render_data.content = i18nm.__('invalid_order_id');
                return app.get('renderer').render(res, undefined, render_data, req);
            }
            var order = items[0],
                signature = crypto.createHash('md5').update(config.payment.robokassa.sMerchantLogin + ':' + order.sum_total + ':' + invid + ':' + config.payment.robokassa.sMerchantPass1).digest('hex');
            return res.redirect(303, config.payment.robokassa.url + "?MrchLogin=" + config.payment.robokassa.sMerchantLogin + "&OutSum=" + order.sum_total + "&InvId=" + invid + "&Desc=" + i18nm.__('payment_for_order') + invid + "&SignatureValue=" + signature + "&IncCurrLabel=" + config.payment.robokassa.sIncCurrLabel + "&Culture=" + req.session.current_locale + "&rnd=" + Math.random().toString().replace('.', ''));
        });
    });

    /*

    Process a result request from Robokassa

    */

    router.post('/process', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var OutSum = parseFloat(req.body.OutSum),
            InvId = parseInt(req.body.InvId),
            SignatureValue = String(req.body.SignatureValue);
        if (!OutSum || OutSum.isNAN || OutSum < 0 || !InvId || InvId.isNAN || InvId < 0 || !SignatureValue) return res.send("Invalid parameters");
        app.get('mongodb').collection('warehouse_orders').find({
            order_id: InvId
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err || !items || !items.length) return res.send('Invalid order');
            var order = items[0],
                signature = crypto.createHash('md5').update(order.sum_total + ':' + order.order_id + ':' + config.payment.robokassa.sMerchantPass2).digest('hex');
            if (signature != SignatureValue) return res.send("Invalid signature");
            app.get('mongodb').collection('warehouse_orders').update({
                    order_id: InvId
                }, {
                    $set: {
                        order_status: 1
                    }
                },
                function(err) {
                    if (err) return res.send("Cannot update database");
                    return res.send("OK" + InvId);
                });
        });
    });

    /*

    Success URL

    */

    router.post('/success', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var OutSum = parseFloat(req.body.OutSum),
            InvId = parseInt(req.body.InvId),
            SignatureValue = String(req.body.SignatureValue);
        var render_data = {
            title: i18nm.__('payment'),
            current_lang: req.session.current_locale,
            page_title: i18nm.__('payment')
        };
        app.get('mongodb').collection('warehouse_orders').find({
            order_id: InvId,
            user_id: req.session.auth._id
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err || !items || !items.length) {
                render_data.content = i18nm.__('invalid_order_id');
                return app.get('renderer').render(res, undefined, render_data, req);
            }
            var order = items[0],
                signature = crypto.createHash('md5').update(order.sum_total + ':' + order.order_id + ':' + config.payment.robokassa.sMerchantPass1).digest('hex');
            if (signature != SignatureValue) {
                render_data.content = i18nm.__('invalid_signature');
                return app.get('renderer').render(res, undefined, render_data, req);
            }

        });
    });

    return router;
};
