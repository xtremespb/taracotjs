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
            return app.get('renderer').render(res, undefined, render_data, req);
        });
    });

    /*

    Process a result request from Robokassa

    */

    router.all('/process', function(req, res) {
        i18nm.setLocale(req.session.current_locale);
        # Pre-request

  // if (param('LMI_PAYEE_PURSE') ne $LMI_PAYEE_PURSE) { return "Invalid LMI_PAYEE_PURSE";}
  // my $LMI_PAYMENT_NO = param('LMI_PAYMENT_NO') || 0;
  // $LMI_PAYMENT_NO = int($LMI_PAYMENT_NO);
  // if (!param('LMI_PAYMENT_NO')) { return "Invalid LMI_PAYMENT_NO" }

  // if (param('LMI_PREREQUEST') eq 1) {
  //   my $amount;
  //   my $sth = database->prepare(
  //    'SELECT amount FROM '.config->{db_table_prefix}.'_billing_bills WHERE id='.database->quote($LMI_PAYMENT_NO)
  //   );
  //   if ($sth->execute()) {
  //    ($amount) = $sth->fetchrow_array;
  //   }
  //   $sth->finish();
  //   if ($amount) {
  //     $amount=sprintf("%01.2f", $amount);
  //     if ($amount eq $LMI_PAYMENT_AMOUNT) {
  //         return "YES";
  //     } else {
  //         return "Invalid LMI_PAYMENT_AMOUNT";
  //     }
  //   } else {
  //       return "Invalid LMI_PAYMENT_AMOUNT";
  //   }
  // }

  // # Request

  // if (param('LMI_SECRET_KEY') ne $LMI_SECRET_KEY) { return "Invalid LMI_SECRET_KEY"; }

  // my ($user_id, $amount);
  // my $sth = database->prepare(
  //  'SELECT user_id, amount FROM '.config->{db_table_prefix}.'_billing_bills WHERE id='.database->quote($LMI_PAYMENT_NO)
  // );
  // if ($sth->execute()) {
  //   ($user_id, $amount) = $sth->fetchrow_array;
  // }
  // $sth->finish();

  // if (!$user_id) { return "Invalid USER_ID"; }
  // if ($amount) {
  //   $amount=sprintf("%01.2f", $amount);
  //   if ($amount ne $LMI_PAYMENT_AMOUNT) {
  //     return "Invalid LMI_PAYMENT_AMOUNT";
  //   }
  // } else {
  //   return "Invalid LMI_PAYMENT_AMOUNT";
  // }

  // my $res=0;
  // $sth = database->prepare(
  //  'INSERT INTO '.config->{db_table_prefix}.'_billing_funds (user_id,amount,lastchanged) VALUES ('.database->quote($user_id).','.database->quote($amount).','.time.') ON DUPLICATE KEY UPDATE amount=amount+'.database->quote($amount).',lastchanged='.time
  // );
  // if ($sth->execute()) {
  //   $res=1;
  // }
  // $sth->finish();

  // if (!$res) {
  //   return "Database error";
  // }

  // $sth = database->prepare(
  //  'DELETE FROM '.config->{db_table_prefix}.'_billing_bills WHERE id='.database->quote($LMI_PAYMENT_NO)
  // );
  // $sth->execute();
  // $sth->finish();

  // $sth = database->prepare(
  //  'INSERT INTO '.config->{db_table_prefix}.'_billing_funds_history(user_id,trans_id,trans_objects,trans_amount,trans_date,lastchanged) VALUES('.database->quote($user_id).','.database->quote('addfunds').','.database->quote('Webmoney').','.database->quote($amount).','.time.','.time.')'
  // );
  // $sth->execute();
  // $sth->finish();

  // return "YES";
        var OutSum = parseFloat(req.body.OutSum || req.query.OutSum),
            InvId = parseInt(req.body.InvId || req.query.InvId),
            SignatureValue = String(req.body.SignatureValue || req.query.SignatureValue);
        if (!OutSum || OutSum.isNAN || OutSum < 0 || !InvId || InvId.isNAN || InvId < 0 || !SignatureValue) return res.send("Invalid parameters");
        app.get('mongodb').collection('billing_payment').find({
            order_id: InvId
        }, {
            limit: 1
        }).toArray(function(err, items) {
            if (err || !items || !items.length) return res.send('Invalid order');
            var order = items[0],
                signature = crypto.createHash('md5').update(order.sum_total + ':' + order.order_id + ':' + config.catalog_payment.webmoney.sMerchantPass2).digest('hex').toUpperCase();
            if (signature != SignatureValue) return res.send("Invalid signature");
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
                            user: new ObjectId(items[0]._id)
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
                                return res.send("OK" + InvId);
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
        var OutSum = parseFloat(req.body.OutSum || req.query.OutSum),
            InvId = parseInt(req.body.InvId || req.query.InvId),
            SignatureValue = String(req.body.SignatureValue || req.query.SignatureValue);
        // Redirect if wrong language loaded
        if (req.session.catalog_redirect_host && req.session.catalog_redirect_host != req.get('host')) return res.redirect(303, app.get('config').protocol + '://' + req.session.catalog_redirect_host + '/api/catalog_payment/success?OutSum=' + OutSum + '&InvId=' + InvId + '&SignatureValue=' + SignatureValue);
        var render_data = {
            title: i18nm.__('payment'),
            current_lang: req.session.current_locale,
            page_title: i18nm.__('payment')
        };
        if (!InvId || InvId.isNaN || InvId < 1 || !OutSum || OutSum.isNaN || OutSum < 0 || !SignatureValue) {
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
                signature = crypto.createHash('md5').update(order.sum_total + ':' + order.order_id + ':' + config.catalog_payment.webmoney.sMerchantPass1).digest('hex').toUpperCase();
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
        if (req.session.catalog_redirect_host && req.session.catalog_redirect_host != req.get('host')) return res.redirect(303, app.get('config').protocol + '://' + req.session.catalog_redirect_host + '/api/catalog_payment/fail');
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
