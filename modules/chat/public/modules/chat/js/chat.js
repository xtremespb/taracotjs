var last_message_timestamp, channels = {},
    current_channel = '', _block_switcher_event;

var _chatbox_resize = function() {
    var _hght = parseInt($(window).innerHeight() - ($('#taracot_chat_box_tabs').offset().top * 2)) + 'px';
    $('#taracot_chat_box_tabs').css('height', _hght);
    $('.taracot-chat-box-area').css('height', _hght);
    $('.taracot-chat-users-online').css('height', _hght);
};

var _init_socket_io = function() {
    var socket = io();
    socket.on('connect', function() {
        socket.emit('set_session', current_user.id, current_user.id_hash, current_username);
    });
    socket.on('taracot_chat_message', function(msg) {
        if (msg.type == 'u' && (!last_message_timestamp || last_message_timestamp < msg.timestamp)) {
            last_message_timestamp = msg.timestamp;
            _publish_msg(msg.channel, msg.username, msg.timestamp, msg.message);
            if (current_channel != msg.channel)
                $('#taracot_chat_cn' + msg.channel + ' > a > .taracot-support-unread').show();
        }
    });
    socket.on('taracot_user_online', function(msg) {
        if (msg && msg.id && msg.username && msg.timestamp)
            _publish_system_msg(msg.username, msg.timestamp, _lang_vars.user + ' ' + msg.username + ' ' + _lang_vars.is_now_online);
    });
    socket.on('taracot_user_offline', function(msg) {
        if (msg && msg.id && msg.username && msg.timestamp)
            _publish_system_msg(msg.username, msg.timestamp, _lang_vars.user + ' ' + msg.username + ' ' + _lang_vars.is_now_offline);
    });
};

var _publish_msg = function(channel, username, timestamp, msg) {
    var ca = '.taracot-chat-box';
    if (channel) ca += '-' + channel;
    $(ca).append('<div class="taracot-chat-msg"><b>' + username + ':&nbsp;</b><div class="uk-badge taracot-chat-msg-timestamp uk-float-right">' + moment(msg.timestamp).format('LT') + '</div>' + msg + '</div>');
    $('.taracot-chat-box-area').scrollTop(1000000);
};

var _publish_system_msg = function(username, timestamp, msg) {
    $('.taracot-chat-box').append('<div class="taracot-chat-system-msg"><div class="uk-badge taracot-chat-msg-timestamp uk-float-right">' + moment(msg.timestamp).format('LT') + '</div>' + msg + '</div>');
    if (channels[username]) $('.taracot-chat-box-' + username).append('<div class="taracot-chat-system-msg">' + msg + '<div class="taracot-chat-msg-timestamp uk-float-right">' + moment(msg.timestamp).format('LT') + '</div></div>');
    $('.taracot-chat-box-area').scrollTop(1000000);
};

var _create_channel = function(channel) {
    if (channels[channel]) return;
    $('#taracot_chat_box_sw').append('<li id="taracot_chat_cn' + channel + '"><a href=""><i class="uk-icon-envelope taracot-support-unread" style="display:none"></i>' + channel + '&nbsp;<i class="uk-close taracot-chat-tab-close" rel="' + channel + '"></i></a></li>');
    $('#taracot_chat_box_tabs').append('<li><div class="taracot-chat-box-area taracot-chat-box-' + channel + '"></div></li>');
    channels[channel] = true;
    $('.taracot-chat-tab-close').unbind();
    $('.taracot-chat-tab-close').click(_close_channel_handler);
    $('#taracot_chat_reply').focus();
};

var _close_channel_handler = function(e) {
    e.preventDefault();
    var channel = $(this).attr('rel'),
        prev_channel_id = $('#taracot_chat_cn' + channel).prev().attr('id');
    if (!prev_channel_id) prev_channel_id = 'taracot_chat_public';
    if (current_channel == channel) {
        _block_switcher_event = true;
        $('#' + prev_channel_id + ' > a').click();
        if (prev_channel_id == 'taracot_chat_public') {
            current_channel = '';
        } else {
            current_channel = prev_channel_id.replace(/^taracot_chat_cn/, '');
        }
    }
    $('#taracot_chat_cn' + channel).empty();
    $('#taracot_chat_cn' + channel).remove();
    $('.taracot-chat-box-' + channel).parent().empty();
    $('.taracot-chat-box-' + channel).parent().remove();
    $('#taracot_chat_reply').focus();
};

var _post_msg = function() {
    $('#taracot_chat_reply').removeClass('uk-form-danger');
    var msg = $('#taracot_chat_reply').val();
    if (!msg || msg.length < 2) return $('#taracot_chat_reply').addClass('uk-form-danger');
    $('#taracot_chat_reply').attr('disabled', true);
    $.ajax({
        type: 'POST',
        url: '/chat/ajax/msg',
        data: {
            msg: msg,
            channel: current_channel
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                $('#taracot_chat_reply').val('');
                if (!last_message_timestamp || last_message_timestamp < data.msg_data.timestamp) {
                    last_message_timestamp = data.msg_data.timestamp;
                    _publish_msg(data.msg_data.channel, data.msg_data.username, data.msg_data.timestamp, data.msg_data.message);
                }
            } else {
                UIkit.notify({
                    message: data.error || _lang_vars.ajax_failed,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
            UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        },
        complete: function() {
            $('#taracot_chat_reply').attr('disabled', false);
            $('#taracot_chat_reply').focus();
        }
    });
};

$(document).ready(function() {
    moment.locale(current_locale);
    $(window).resize(_chatbox_resize);
    _chatbox_resize();
    _init_socket_io();
    $('#taracot_chat_box_sw').on('show.uk.switcher', function(event, area_) {
        if (_block_switcher_event) {
            _block_switcher_event = undefined;
            return;
        }
        var area = $(area_).attr('id');
        if (area == 'taracot_chat_public') {
            current_channel = '';
        } else {
            current_channel = area.replace(/^taracot_chat_cn/, '');
        }
        $('#taracot_chat_cn' + current_channel + ' > a > .taracot-support-unread').hide();
        $('#taracot_chat_reply').focus();
        $('#taracot_chat_reply').removeClass('uk-form-danger');
    });
    $('#taracot_chat_reply').bind('keypress', function(e) {
        if (submitOnEnter(e)) _post_msg();
    });
    $('#taracot_chat_reply').focus();
    _create_channel('test1');
    _create_channel('admin');
    _create_channel('test');
});
