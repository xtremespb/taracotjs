/*

 Hosting/domains billing
 WebMoney API

*/

module.exports = function(app) {
    var path = require('path'),
        i18nm = new(require('i18n-2'))({
            locales: app.get('config').locales.avail,
            directory: path.join(__dirname, 'webmoney_lang'),
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

    Redirect user to the WebMoney website to make a payment

    */

    router.get('/invoice/:invid', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        var invid = parseInt(req.params.invid),
            render_data = {
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
            var db = items[0],
                desc = config.billing_frontend.webmoney.LMI_PAYMENT_DESC.replace(/\[inv\]/igm, db.order_id),
                id = "webmoney_" + Date.now(),
                post_form = i18nm.__('processing_payment') + '<form id="' + id + '" action="https://merchant.webmoney.ru/lmi/payment.asp" method="POST"><input type="hidden" name="LMI_PAYMENT_AMOUNT" value="' + db.order_sum + '"><input type="hidden" name="LMI_PAYMENT_DESC" value="' + desc + '"><input type="hidden" name="LMI_PAYMENT_NO" value="' + db.order_id + '"><input type="hidden" name="LMI_PAYEE_PURSE" value="' + config.billing_frontend.webmoney.LMI_PAYEE_PURSE + '"><input type="hidden" name="LMI_SIM_MODE" value="' + config.billing_frontend.webmoney.LMI_SIM_MODE + '"></form><script>$("#' + id + '").submit();</script>';
            render_data.content = payment_html(gaikan, {
                title: i18nm.__('process_payment'),
                msg: post_form
            }, undefined);
            req.session.billing_frontend_payment_redirect_host = req.get('host');
            return app.get('renderer').render(res, undefined, render_data, req);
        });
    });

    /*

    Process a result request from Robokassa

    */

    router.all('/process', function(req, res) {
        var LMI_PAYEE_PURSE = req.body.LMI_PAYEE_PURSE || req.query.LMI_PAYEE_PURSE,
            LMI_PAYMENT_NO = req.body.LMI_PAYMENT_NO || req.query.LMI_PAYMENT_NO,
            LMI_PREREQUEST = req.body.LMI_PREREQUEST || req.query.LMI_PREREQUEST,
            LMI_SECRET_KEY = req.body.LMI_SECRET_KEY || req.query.LMI_SECRET_KEY,
            LMI_PAYMENT_AMOUNT = req.body.LMI_PAYMENT_AMOUNT || req.query.LMI_PAYMENT_AMOUNT;
        if (typeof LMI_PAYMENT_NO == 'undefined' || !LMI_PAYMENT_NO.match(/^[0-9]+$/) || parseFloat(LMI_PAYMENT_NO).isNaN || parseInt(LMI_PAYMENT_NO) < 1)
            return res.send('Invalid LMI_PAYMENT_NO');
        LMI_PAYMENT_NO = parseInt(LMI_PAYMENT_NO);
        if (typeof LMI_PAYMENT_AMOUNT == 'undefined' || !LMI_PAYMENT_AMOUNT.match(/^[0-9\.]+$/) || parseFloat(LMI_PAYMENT_NO).isNaN || parseFloat(LMI_PAYMENT_NO) <= 0)
            return res.send('Invalid LMI_PAYMENT_AMOUNT');
        LMI_PAYMENT_AMOUNT = parseFloat(LMI_PAYMENT_AMOUNT);
        if (config.billing_frontend.webmoney.LMI_PAYEE_PURSE != LMI_PAYEE_PURSE)
            return res.send('Invalid LMI_PAYEE_PURSE');
        app.get('mongodb').collection('billing_payment').find({
            order_id: LMI_PAYMENT_NO
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err || !items || !items.length) return res.send('Database query error');
            var order = items[0];
            if (order.order_status !== 0) return res.send('Invalid order status');
            if (order.order_sum != LMI_PAYMENT_AMOUNT)
                return res.send('Invalid LMI_PAYMENT_AMOUNT');
            if (LMI_PREREQUEST)
                return res.send('YES');
            if (config.billing_frontend.webmoney.LMI_SECRET_KEY != LMI_SECRET_KEY)
                return res.send('Invalid LMI_SECRET_KEY');
            i18nm.setLocale(order.order_locale);
            app.get('mongodb').collection('billing_payment').update({
                    order_id: order.order_id
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
                                trans_obj: 'webmoney',
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
                                    mailer.send(order.order_email, mail_data.subj + ' (' + app.get('settings').site_title + ')', path.join(__dirname, 'payment_views'), 'mail_funds_html', 'mail_funds_txt', mail_data, req);
                                    return res.send('YES');
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
        // Redirect if wrong language loaded
        if (req.session.billing_frontend_payment_redirect_host && req.session.billing_frontend_payment_redirect_host != req.get('host')) return res.redirect(303, app.get('config').protocol + '://' + req.session.billing_frontend_payment_redirect_host + '/customer/webmoney/success?rnd=' + Math.random().toString().replace('.', ''));
        var render_data = {
            title: i18nm.__('payment'),
            current_lang: req.session.current_locale,
            page_title: i18nm.__('payment')
        };
        render_data.content = payment_html(gaikan, {
            title: i18nm.__('payment_success'),
            msg: i18nm.__('payment_success_msg'),
            html: pt_payment_btn(gaikan, {
                lang: i18nm,
                order_id: Math.random().toString().replace('.', '')
            }, undefined)
        }, undefined);
        return app.get('renderer').render(res, undefined, render_data, req);
    });

    /*

    Fail URL

    */

    router.all('/fail', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        if (req.session.billing_frontend_payment_redirect_host && req.session.billing_frontend_payment_redirect_host != req.get('host')) return res.redirect(303, app.get('config').protocol + '://' + req.session.billing_frontend_payment_redirect_host + '/customer/webmoney/fail?rnd=' + Math.random().toString().replace('.', ''));
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
