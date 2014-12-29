$('#btn_save').attr('disabled', true);

var btn_save_click_handler = function() {
    taracot_ajax_progress_indicator('body', true);
    var content = codemirror.getValue();
    $.ajax({
        type: 'POST',
        url: '/cp/textedit/data/save',
        data: {
            fn: file.name,
            content: content
        },
        dataType: "json",
        success: function(data) {
            taracot_ajax_progress_indicator('body', false);
            if (data && data.status == 1) {
                UIkit.notify({
                    message: _lang_vars.document_saved,
                    status: 'success',
                    timeout: 2000,
                    pos: 'top-center'
                });
                $('#btn_save').attr('disabled', true);
            } else {
                var _err = _lang_vars.ajax_failed;
                if (data.error) {
                    _err = data.error;
                }
                UIkit.notify({
                    message: _err,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
            taracot_ajax_progress_indicator('body', false);
            UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
};

var btn_cancel_click_handler = function(bu) {
    if (!$('#btn_save').attr('disabled')) {
        if (!confirm(_lang_vars.cancel_confirm)) return;
    }
    window.close();
};

$(window).bind("beforeunload", function() {
    if (!$('#btn_save').attr('disabled')) return false;
});

$('#btn_save').click(btn_save_click_handler);
$('#btn_cancel').click(btn_cancel_click_handler);

/*******************************************************************

 document.ready

********************************************************************/

var codemirror,
	mode_set = false;

var set_cm_mode = function(mode) {
    var script = '/modules/textedit/js/codemirror/mode/' + mode + '.js';
    $.getScript(script, function(data, success) {
        if (success) {
        	codemirror.setOption('mode', mode);
        	mode_set = true;
        }
    });
};

$(document).ready(function() {
    codemirror = CodeMirror.fromTextArea(document.getElementById('cmeditor'), {
        lineNumbers: true,
        keyMap: "sublime",
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true
    });
    codemirror.on("change", function() {
        $('#btn_save').attr('disabled', false);
    });
    if (file.mime) {
        if (file.mime.match('javascript')) set_cm_mode('javascript');
        if (file.mime.match('css')) set_cm_mode('css');
        if (file.mime.match('xml')) set_cm_mode('xml');
        if (file.mime.match('html')) set_cm_mode('htmlmixed');
    }
    if (!mode_set) codemirror.setOption('mode', 'text');
});

/*******************************************************************

 Helper functions

********************************************************************/

var taracot_ajax_progress_indicator = function(sel, show) {
    if (show) {
        var destination = $(sel).offset();
        $('.taracot-progress').css({
            top: destination.top,
            left: destination.left,
            width: $(sel).width(),
            height: $(sel).height()
        });
        $('.taracot-progress').removeClass('uk-hidden');
    } else {
        $('.taracot-progress').addClass('uk-hidden');
    }
};
