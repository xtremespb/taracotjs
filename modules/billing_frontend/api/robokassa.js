/*

 Hosting/domains billing
 Robokassa API

*/

module.exports = function(app) {
    var path = require('path'),
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales.avail,
            directory: path.join(__dirname, 'robokassa_lang'),
            extension: '.js',
            devMode: app.get('config').locales.dev_mode
        }),
        router = app.get('express').Router(),
        config = app.get('config'),
        fs = require('fs'),
        crypto = require('crypto'),
        mailer = app.get('mailer'),
        ObjectId = require('mongodb').ObjectID;

    var gaikan = require('gaikan'),
        payment_html = (fs.existsSync(path.join(__dirname, 'payment_views') + '/custom_payment.html')) ? gaikan.compileFromFile(path.join(__dirname, 'payment_views') + '/custom_payment.html') : gaikan.compileFromFile(path.join(__dirname, 'payment_views') + '/payment.html'),
        pt_payment_btn = (fs.existsSync(path.join(__dirname, 'payment_views') + '/custom_parts_payment_btn.html')) ? gaikan.compileFromFile(path.join(__dirname, 'payment_views') + '/custom_parts_payment_btn.html') : gaikan.compileFromFile(path.join(__dirname, 'payment_views') + '/parts_payment_btn.html');

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
            render_data.content = payment_html(gaikan, {
                title: i18nm.__('payment_error'),
                msg: i18nm.__('invalid_order_id')
            }, undefined);
            return app.get('renderer').render(res, undefined, render_data, req);
        }
        app.get('mongodb').collection('billing_payment').find({
            order_id: invid,
            user_id: req.session.auth._id
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err || !items || !items.length || items[0].order_status !== 0) {
                render_data.content = payment_html(gaikan, {
                    title: i18nm.__('payment_error'),
                    msg: i18nm.__('invalid_order_id')
                }, undefined);
                return app.get('renderer').render(res, undefined, render_data, req);
            }
            var order = items[0],
                signature = crypto.createHash('md5').update(config.billing_frontend.robokassa.sMerchantLogin + ':' + order.order_sum + ':' + invid + ':' + config.billing_frontend.robokassa.sMerchantPass1).digest('hex').toUpperCase();
            req.session.billing_frontend_payment_redirect_host = req.get('host');
            return res.redirect(303, config.billing_frontend.robokassa.url + "?MrchLogin=" + config.billing_frontend.robokassa.sMerchantLogin + "&OutSum=" + order.order_sum + "&InvId=" + invid + "&Desc=" + i18nm.__('payment_for_order') + ' ' + invid + "&SignatureValue=" + signature + "&IncCurrLabel=" + config.billing_frontend.robokassa.sIncCurrLabel + "&Culture=" + req.session.current_locale + "&rnd=" + Math.random().toString().replace('.', ''));
        });
    });

    /*

    Process a result request from Robokassa

    */

    router.all('/process', function(req, res) {
        var OutSum = req.body.OutSum || req.query.OutSum,
            InvId = parseInt(req.body.InvId || req.query.InvId),
            SignatureValue = String(req.body.SignatureValue || req.query.SignatureValue);
        if (!OutSum || parseFloat(OutSum).isNAN || parseFloat(OutSum) < 0 || !InvId || InvId.isNAN || InvId < 0 || !SignatureValue) return res.send("Invalid parameters");
        app.get('mongodb').collection('billing_payment').find({
            order_id: InvId,
            order_status: 0
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err || !items || !items.length) return res.send('Invalid order');
            var order = items[0],
                signature = crypto.createHash('md5').update(OutSum + ':' + InvId + ':' + config.billing_frontend.robokassa.sMerchantPass2).digest('hex').toUpperCase();
            if (signature != SignatureValue) return res.send("Invalid signature");
            i18nm.setLocale(order.order_locale);
            app.get('mongodb').collection('billing_payment').update({
                    order_id: InvId
                }, {
                    $set: {
                        order_status: 1
                    }
                },
                function(err) {
                    if (err) return res.send("Cannot update billing_payment collection");
                    app.get('mongodb').collection('users').update({
                            _id: new ObjectId(order.user_id)
                        }, {
                            $inc: {
                                billing_funds: order.order_sum
                            }
                        },
                        function() {
                            if (err) return res.send("Cannot increment funds in users collection");
                            app.get('mongodb').collection('billing_transactions').insert({
                                trans_type: 'funds_replenishment',
                                trans_obj: 'robokassa',
                                trans_timestamp: Date.now(),
                                trans_sum: order.order_sum,
                                user_id: order.user_id
                            }, function() {
                                app.get('mongodb').collection('billing_conf').find({
                                    $or: [{
                                        conf: 'misc'
                                    }]
                                }).toArray(function(err, db) {
                                    var misc = [];
                                    for (var i = 0; i < db.length; i++)
                                        if (!err && db && db.length)
                                            if (db[i].conf == 'misc' && db[i].data)
                                                try {
                                                    misc = JSON.parse(db[i].data);
                                                } catch (ex) {}
                                    var currency = '';
                                    for (var mi in misc)
                                        if (misc[mi].id == 'currency')
                                            currency = misc[mi][order.order_locale];
                                    var customer_url = app.get('config').protocol + '://' + order.order_host + '/customer?rnd=' + Math.random().toString().replace('.', ''),
                                        mail_data = {
                                            lang: i18nm,
                                            site_title: app.get('settings').site_title,
                                            customer_url: customer_url,
                                            amount: order.order_sum + ' ' + currency,
                                            subj: i18nm.__('mail_funds_subj')
                                        };
                                    mailer.send(order.order_email, mail_data.subj + ' (' + app.get('settings').site_title + ')', path.join(__dirname, 'payment_views'), 'mail_funds_html', 'mail_funds_txt', mail_data, req, function() {
                                        return res.send("OK" + InvId);
                                    });
                                });
                            });
                        });
                });
        });
    });

    /*

    Success URL

    */

    router.all('/success', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var OutSum = req.body.OutSum || req.query.OutSum,
            InvId = parseInt(req.body.InvId || req.query.InvId),
            SignatureValue = String(req.body.SignatureValue || req.query.SignatureValue);
        // Redirect if wrong language loaded
        if (req.session.billing_frontend_payment_redirect_host && req.session.billing_frontend_payment_redirect_host != req.get('host')) return res.redirect(303, app.get('config').protocol + '://' + req.session.billing_frontend_payment_redirect_host + '/customer/robokassa/success?rnd=' + Math.random().toString().replace('.', ''));
        var render_data = {
            title: i18nm.__('payment'),
            current_lang: req.session.current_locale,
            page_title: i18nm.__('payment')
        };
        if (!InvId || InvId.isNaN || InvId < 1 || !OutSum || parseFloat(OutSum).isNaN || parseFloat(OutSum) < 0 || !SignatureValue) {
            render_data.content = payment_html(gaikan, {
                title: i18nm.__('payment_error'),
                msg: i18nm.__('invalid_order_id')
            }, undefined);
            return app.get('renderer').render(res, undefined, render_data, req);
        }
        app.get('mongodb').collection('billing_payment').find({
            order_id: InvId,
            user_id: req.session.auth._id
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err || !items || !items.length) {
                render_data.content = payment_html(gaikan, {
                    title: i18nm.__('payment_error'),
                    msg: i18nm.__('invalid_order_id')
                }, undefined);
                return app.get('renderer').render(res, undefined, render_data, req);
            }
            var order = items[0],
                signature = crypto.createHash('md5').update(OutSum + ':' + InvId + ':' + config.billing_frontend.robokassa.sMerchantPass1).digest('hex').toUpperCase();
            if (signature != SignatureValue.toUpperCase()) {
                render_data.content = payment_html(gaikan, {
                    title: i18nm.__('payment_error'),
                    msg: i18nm.__('invalid_signature')
                }, undefined);
                return app.get('renderer').render(res, undefined, render_data, req);
            }
            render_data.content = payment_html(gaikan, {
                title: i18nm.__('payment_success'),
                msg: i18nm.__('payment_success_msg'),
                html: pt_payment_btn(gaikan, {
                    lang: i18nm,
                    order_id: order._id
                }, undefined)
            }, undefined);
            return app.get('renderer').render(res, undefined, render_data, req);
        });
    });

    /*

    Fail URL

    */

    router.all('/fail', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (req.session.billing_frontend_payment_redirect_host && req.session.billing_frontend_payment_redirect_host != req.get('host')) return res.redirect(303, app.get('config').protocol + '://' + req.session.billing_frontend_payment_redirect_host + '/customer/robokassa/fail?rnd=' + Math.random().toString().replace('.', ''));
        var render_data = {
            title: i18nm.__('payment'),
            current_lang: req.session.current_locale,
            page_title: i18nm.__('payment')
        };
        render_data.content = payment_html(gaikan, {
            title: i18nm.__('payment_error'),
            msg: i18nm.__('payment_failed')
        }, undefined);
        return app.get('renderer').render(res, undefined, render_data, req);
    });

    return router;
};
