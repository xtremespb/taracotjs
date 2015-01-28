var taracot_dlg_update = new UIkit.modal("#taracot_dlg_update", {
    bgclose: false,
    keyboard: false
});

var taracot_btn_update_handler = function() {
    taracot_dlg_update.show();
};

var check_update_status = function() {
    $.ajax({
        type: 'POST',
        url: '/cp/_update/status',
        dataType: "json",
        success: function(data) {
            var msg_html = '';
            if (data.messages)
                for (var i = 0; i < data.messages.length; i++)
                    msg_html += '<li>' + data.messages[i] + '</li>';
            $('#taracot_updater_messages').html(msg_html);
            if (data.complete) {
            	$('.taracot-update-progress-gif').hide();
                if (data.failed) {
                    $('#taracot-update-progress').append('<p class="uk-alert uk-alert-danger">' + _lang_vars.update_failed + '</p>');
                } else {
                    $('#taracot-update-progress').append('<p class="uk-alert uk-alert-success">' + _lang_vars.update_complete + '</p>');
                }
            }
            if (!data.complete && !data.failed) setTimeout(check_update_status, 1000);
        },
        error: function() {
            $('#taracot_updater_messages').html('<li>' + _lang_vars.cannot_get_update_status + '</li>');
        }
    });
};

var taracot_btn_update_start_handler = function() {
    $('.taracot-dlg-update-footer').hide();
    var _text_save = $('#taracot-update-progress').html();
    $('#taracot-update-progress').html('<p class="taracot-update-progress-gif"><img src="/modules/cp/images/loading_36x36.gif"></p><i class="uk-icon-circle-o"></i> ' + _lang_vars.initializing_update + '<br>');
    $.ajax({
        type: 'POST',
        url: '/cp/_update/start',
        dataType: "json",
        success: function(data) {
            if (data) {
                if (data.status === 1) {
                    $('#taracot-update-progress').append('<i class="uk-icon-circle-o"></i> ' + _lang_vars.update_started + '<p>' + _lang_vars.update_progress + ':</p><div class="uk-panel uk-panel-box taracot-update-progress-box"><div id="taracot_updater_messages" class="uk-list uk-list-line"></div></div>');
                    setTimeout(check_update_status, 1000);
                } else {
                    var err = data.error || _lang_vars.ajax_failed;
                    UIkit.notify({
                        message: err,
                        status: 'danger',
                        timeout: 2000,
                        pos: 'top-center'
                    });
                    $('#taracot-update-progress').html(_text_save);
                    $('.taracot-dlg-update-footer').show();
                }
            }
        },
        error: function() {
            UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
            $('#taracot-update-progress').html(_text_save);
            $('.taracot-dlg-update-footer').show();
        }
    });
};

/*******************************************************************

 document.ready

********************************************************************/

$(document).ready(function() {
    if (total_updates_avail === 0) $('.taracot_updates_buttons_wrap').hide();
    $('#taracot_btn_update').click(taracot_btn_update_handler);
    $('#taracot_btn_update_start').click(taracot_btn_update_start_handler);
    var data = {
        labels: days,
        datasets: [{
            fillColor: "rgba(255,76,54,0.2)",
            strokeColor: "rgba(255,76,54,1)",
            pointColor: "rgba(255,76,54,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(220,220,220,1)",
            data: visitors
        }, {
            fillColor: "rgba(53,93,128,0.2)",
            strokeColor: "rgba(53,93,128,1)",
            pointColor: "rgba(53,93,128,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(151,187,205,1)",
            data: hits
        }]
    };
    var options = {
        responsive: true,
        animation: false
    };
    var taracot_statistics;
    if (visitors.length > 1) {
        taracot_statistics = new Chart($("#taracot_statistics").get(0).getContext("2d")).Line(data, options);
        var _mn = [];
        for (var i = 0; i < months.length; i++) {
            _mn.push(months[i].month + ' ' + months[i].year);
        }
        $('#h2_stat').append(' (' + _mn.join(', ') + ')');
    } else {
        $('#taracot_stats_wrap').html(_lang_vars.no_stats_avail);
    }
});
