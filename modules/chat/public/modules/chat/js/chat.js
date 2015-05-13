var last_message_timestamp, channels = {},
    current_channel = '',
    _block_switcher_event,
    history_loaded = {};

var _chatbox_resize = function() {
    $('.taracot-chat-box-area').height($('.taracot-content').height() - $('.taracot-chat-reply-wrap').height());
    $('.taracot-chat-users-online').height($('.taracot-chat-box-area').height() + 10);
};

var _init_socket_io = function() {
    var socket = io();
    socket.on('connect', function() {
        socket.emit('set_session', current_user.id, current_user.id_hash, current_username);
    });
    socket.on('taracot_chat_message', function(msg) {
        if (msg.type == 'u' && (!last_message_timestamp || last_message_timestamp < msg.timestamp)) {
            last_message_timestamp = msg.timestamp;
            if (msg.channel == current_username) msg.channel = msg.username;
            if (!channels[msg.channel])
                _create_channel(msg.channel);
            _publish_msg(msg.channel, msg.username, msg.timestamp, msg.message);
            if (current_channel != msg.channel)
                $('#taracot_chat_cn' + msg.channel + ' > a > .taracot-support-unread').show();
        }
    });
    socket.on('taracot_user_online', function(msg) {
        if (msg && msg.id && msg.username && msg.timestamp) {
            _publish_system_msg(msg.username, msg.timestamp, _lang_vars.user + ' ' + msg.username + ' ' + _lang_vars.is_now_online);
            if ($.inArray(msg.username, users_online) == -1) {
                users_online.push(msg.username);
                _add_online_user(msg.username);
                _online_user_rebind();
            }
        }
    });
    socket.on('taracot_user_offline', function(msg) {
        if (msg && msg.id && msg.username && msg.timestamp) {
            _publish_system_msg(msg.username, msg.timestamp, _lang_vars.user + ' ' + msg.username + ' ' + _lang_vars.is_now_offline);
            _del_online_user(msg.username);
            users_online.splice($.inArray(msg.username, users_online), 1);
        }
    });
};

var _publish_msg = function(channel, username, timestamp, msg) {
    var ca = '.taracot-chat-box',
        dt;
    if (moment(timestamp).format('D') != moment().format('D') && Date.now() > timestamp) {
        dt = moment(timestamp).format('L LT');
    } else {
        dt = moment(timestamp).format('LT');
    }
    if (channel) ca += '-' + channel;
    $(ca).append('<div class="taracot-chat-msg"><b>' + username + ':&nbsp;</b><div class="taracot-chat-msg-timestamp taracot-chat-msg-timestamp-normal uk-float-right">' + dt + '</div>' + msg + '</div>');
    $('.taracot-chat-box-area').scrollTop(1000000);
};

var _publish_system_msg = function(username, timestamp, msg) {
    var dt;
    if (moment(timestamp).format('D') != moment().format('D') && Date.now() > timestamp) {
        dt = moment(timestamp).format('L LT');
    } else {
        dt = moment(timestamp).format('LT');
    }
    var html = '<div class="taracot-chat-system-msg"><div class="uk-badge uk-badge-warning taracot-chat-msg-timestamp uk-float-right">' + dt + '</div>' + msg + '</div>';
    $('.taracot-chat-box').append(html);
    if (channels[username]) $('.taracot-chat-box-' + username).append(html);
    $('.taracot-chat-box-area').scrollTop(1000000);
};

var _create_channel = function(channel) {
    if (channels[channel]) return;
    channels[channel] = true;
    $('#taracot_chat_box_sw').append('<li id="taracot_chat_cn' + channel + '"><a href=""><i class="uk-icon-envelope taracot-support-unread" style="display:none"></i>' + channel + '&nbsp;<i class="uk-icon-close taracot-chat-tab-close" rel="' + channel + '"></i></a></li>');
    $('#taracot_chat_box_tabs').append('<li><div class="taracot-chat-box-area taracot-chat-box-' + channel + '"></div></li>');
    $('.taracot-chat-tab-close').unbind();
    $('.taracot-chat-tab-close').click(_close_channel_handler);
};

var _add_online_user = function(username) {
    $('.taracot-chat-users-online').prepend('<div id="taracot_chat_uo' + username + '" class="taracot-chat-user-online"><i class="uk-icon-user"></i>&nbsp;' + username + '</div>');
};

var _online_user_rebind = function() {
    $('.taracot-chat-user-online').unbind();
    $('.taracot-chat-user-online').click(_online_user_click_handler);
};

var _online_user_click_handler = function() {
    var username = $(this).attr('id').replace(/^taracot_chat_uo/, '');
    if (username == current_username) return;
    _create_channel(username);
    $('#taracot_chat_cn' + username + ' > a').click();
    $('.taracot-chat-box-area').height($('.taracot-chat-box').height());
};

var _del_online_user = function(username) {
    $('#taracot_chat_uo' + username).remove();
};

var _close_channel_handler = function(e) {
    e.preventDefault();
    var channel = $(this).attr('rel'),
        prev_channel_id = $('#taracot_chat_cn' + channel).prev().attr('id');
    channels[channel] = undefined;
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
    $('#taracot_chat_cn' + channel).remove();
    $('.taracot-chat-box-' + channel).parent().remove();
    $('#taracot_chat_reply').focus();
    delete history_loaded[channel];
    $.ajax({
        type: 'POST',
        url: '/chat/ajax/channel/close',
        data: {
            channel: channel
        },
        dataType: "json"
    });
};

var _post_msg = function() {
    $('#taracot_chat_reply').removeClass('uk-form-danger');
    var msg = $.trim($('#taracot_chat_reply').val());
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

var _chat_box_tab_switch_handler = function(event, area_) {
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
    $('.taracot-chat-box-area').height($('.taracot-chat-box').height());
    $('#taracot_chat_cn' + current_channel + ' > a > .taracot-support-unread').hide();
    $('#taracot_chat_reply').removeClass('uk-form-danger');
    $('#taracot_chat_reply').focus();
    if (!history_loaded[current_channel]) {
        _chat_loading_indicator(true);
        history_loaded[current_channel] = 1;
        $.ajax({
            type: 'POST',
            url: '/chat/ajax/channel/history',
            data: {
                channel: current_channel
            },
            dataType: "json",
            success: function(data) {
                if (data && data.status == 1) {
                    var messages = data.messages[current_channel];
                    for (var mi in messages)
                        _publish_msg(current_channel, messages[mi].username, messages[mi].timestamp, messages[mi].message);
                    $('.taracot-chat-box-area').scrollTop(1000000);
                }
            },
            complete: function() {
                _chat_loading_indicator(false);
            }
        });
    } else {
    	$('.taracot-chat-box-area').scrollTop(1000000);
    }
};

var _chat_reply_handler = function(e) {
    if (submitOnEnter(e)) _post_msg();
};

var _restore_history_messages = function() {
    Object.keys(messages_data).forEach(function(channel) {
        history_loaded[channel] = 1;
        var messages = messages_data[channel];
        if (channel && channel.length && !channels[channel]) _create_channel(channel);
        for (var mi in messages)
            _publish_msg(channel, messages[mi].username, messages[mi].timestamp, messages[mi].message);
    });
};

var _chat_loading_indicator = function(show) {
    if (show) {
        var destination = $('#taracot-chat-grid').offset();
        $('.taracot-loading').css({
            top: destination.top,
            left: destination.left,
            width: $('#taracot-chat-grid').width(),
            height: $('#taracot-chat-grid').height()
        });
        $('.taracot-loading').show();
    } else {
        $('.taracot-loading').hide();
    }
};


$(document).ready(function() {
    moment.locale(current_locale);
    $('#taracot_chat_box_sw').on('show.uk.switcher', _chat_box_tab_switch_handler);
    $('#taracot_chat_reply').bind('keypress', _chat_reply_handler);
    $('#taracot_chat_reply').focus();
    for (var ui in users_online) _add_online_user(users_online[ui]);
    _online_user_rebind();
    _chatbox_resize();
    _restore_history_messages();
    _init_socket_io();
});
