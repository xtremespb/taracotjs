var last_message_timestamp, channels = {},
    current_channel = '',
    _block_switcher_event,
    history_loaded = {},
    max_history_items = 100,
    emotes = {
        "smile": Array(":-)", ":)", "=]", "=)"),
        "sad": Array(":-(", "=(", ":[", ":&lt;"),
        "wink": Array(";-)", ";)", ";]", "*)"),
        "grin": Array(":D", "=D", "XD", "BD", "8D", "xD"),
        "surprise": Array(":O", "=O", ":-O", "=-O"),
        "devilish": Array("(6)"),
        "angel": Array("(A)"),
        "crying": Array(":'(", ":'-("),
        "plain": Array(":|"),
        "smile-big": Array(":o)"),
        "glasses": Array("8)", "8-)"),
        "kiss": Array("(K)", ":-*"),
        "monkey": Array("(M)")
    };

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
            if (msg.channel && !channels[msg.channel]) {
                var nickname;
                if (msg.nicknames && msg.nicknames[msg.channel]) nickname = msg.nicknames[msg.channel];
                _create_channel(msg.channel, nickname);
            } else {
                _publish_msg(msg.channel, msg.username, msg.timestamp, msg.message, msg.data);
            }
            if (current_channel != msg.channel)
                $('#taracot_chat_cn' + msg.channel + ' > a > .taracot-support-unread').show();
        }
        if (msg.type == 'c' && (!last_message_timestamp || last_message_timestamp < msg.timestamp)) {
            last_message_timestamp = msg.timestamp;
            _publish_cmd(msg.username, msg.cmd_index, msg.cmd_data, msg.timestamp);
            _process_cmd(msg);
            if (current_channel != msg.channel)
                $('#taracot_chat_cn' + msg.channel + ' > a > .taracot-support-unread').show();
        }
    });
    socket.on('taracot_user_online', function(msg) {
        if (msg && msg.id && msg.username && msg.timestamp) {
            var nick = msg.username;
            if (msg.user_data && msg.user_data.chat_data && msg.user_data.chat_data.nickname) nick = msg.user_data.chat_data.nickname;
            _publish_system_msg(msg.username, msg.timestamp, _lang_vars.user + ' ' + nick + ' ' + _lang_vars.is_now_online);
            if ($.inArray(msg.username, users_online) == -1) {
                var nickname = '',
                    mod_flag = false;
                if (msg.user_data && msg.user_data.chat_data) {
                    nickname = msg.user_data.chat_data.nickname || '';
                    mod_flag = msg.user_data.chat_data.mod_flag || false;
                    if (msg.user_data.status == 2) mod_flag = true;
                }
                users_online.push(msg.username);
                _add_online_user(msg.username, nickname, mod_flag);
                _online_user_rebind();
            }
        }
    });
    socket.on('taracot_user_offline', function(msg) {
        if (msg && msg.id && msg.username && msg.timestamp) {
            var nick = msg.username;
            if (msg.user_data && msg.user_data.chat_data && msg.user_data.chat_data.nickname) nick = msg.user_data.chat_data.nickname;
            _publish_system_msg(msg.username, msg.timestamp, _lang_vars.user + ' ' + nick + ' ' + _lang_vars.is_now_offline);
            _del_online_user(msg.username);
            users_online.splice($.inArray(msg.username, users_online), 1);
        }
    });
};

var _process_cmd = function(msg) {
    // Set moderator flag
    if (msg.cmd_index == 1) {
        $('#taracot_chat_uo' + msg.cmd_data.new_moderator + ' > .taracot-chat-moderator').show();
        $('#taracot_chat_uo' + msg.cmd_data.new_moderator + ' > .taracot-chat-user').hide();
    }
    // Remove moderator flag
    if (msg.cmd_index == 2) {
        $('#taracot_chat_uo' + msg.cmd_data.new_moderator + ' > .taracot-chat-moderator').hide();
        $('#taracot_chat_uo' + msg.cmd_data.new_moderator + ' > .taracot-chat-user').show();
    }
    // Change nickname
    if (msg.cmd_index == 5) {
        $('#taracot_chat_uo' + msg.cmd_data.username + ' > span > .taracot-chat-nickname').html(msg.cmd_data.nickname);
        $('#taracot_chat_cn' + msg.cmd_data.username + ' > a > .taracot-chat-tab-nickname').html(msg.cmd_data.nickname);
    }
    // Redirect banned user
    if (msg.cmd_index == 6)
        if (msg.cmd_data.user_ban == current_username)
            location.href = "/chat?rnd=" + Math.random().toString().replace('.', '');
        // Clear screen
    if (msg.cmd_index == 8)
        $('.taracot-chat-box > div:not(:last)').remove();
};

var _process_emoticons = function(msg) {
    for (var emoticon in emotes)
        for (var i = 0; i < emotes[emoticon].length; i++)
            msg = msg.replace(emotes[emoticon][i], '<div class="taracot-chat-face-' + emoticon + '"></div>', "g");
    return msg;
};

var _publish_msg = function(channel, username, timestamp, msg, data) {
    var ca = '.taracot-chat-box',
        dt;
    if (moment(timestamp).format('D') != moment().format('D') && Date.now() > timestamp) {
        dt = moment(timestamp).format('L LT');
    } else {
        dt = moment(timestamp).format('LT');
    }
    if (channel) ca += '-' + channel;
    var username_color = '#000',
        nickname = username;
    if (data) {
        if (data.color) username_color = data.color;
        if (data.nickname) nickname = data.nickname;
    }
    msg = _process_emoticons(msg);
    $(ca).append('<div class="taracot-chat-msg"><b style="color:' + username_color + '">' + nickname + ':&nbsp;</b><div class="taracot-chat-msg-timestamp taracot-chat-msg-timestamp-normal uk-float-right">' + dt + '</div>' + msg + '</div>');
    $('.taracot-chat-box-area').scrollTop(1000000);
    _chat_box_cleanup();
};

var _publish_system_msg = function(username, timestamp, msg, danger) {
    var dt;
    if (moment(timestamp).format('D') != moment().format('D') && Date.now() > timestamp) {
        dt = moment(timestamp).format('L LT');
    } else {
        dt = moment(timestamp).format('LT');
    }
    var badge_class = 'uk-badge-warning',
        danger_flag = '';
    if (danger) {
        badge_class = 'uk-badge-danger';
        danger_flag = '-danger';
    }
    var html = '<div class="taracot-chat-system-msg' + danger_flag + '"><div class="uk-badge ' + badge_class + ' taracot-chat-msg-timestamp uk-float-right">' + dt + '</div>' + msg + '</div>';
    $('.taracot-chat-box').append(html);
    if (channels[username]) $('.taracot-chat-box-' + username).append(html);
    $('.taracot-chat-box-area').scrollTop(1000000);
    _chat_box_cleanup();
};

var _publish_cmd = function(username, cmd_index, cmd_data, timestamp) {
    var dt;
    if (moment(timestamp).format('D') != moment().format('D') && Date.now() > timestamp) {
        dt = moment(timestamp).format('L LT');
    } else {
        dt = moment(timestamp).format('LT');
    }
    var msg = S(_lang_vars.cmd_list[cmd_index]).template(cmd_data).s,
        html = '<div class="taracot-chat-system-cmd"><div class="uk-badge uk-badge-warning taracot-chat-msg-timestamp uk-float-right">' + dt + '</div>' + msg + '</div>';
    if (username == current_username) {
        $('.taracot-chat-box-area').append(html);
    } else {
        $('.taracot-chat-box').append(html);
    }
    $('.taracot-chat-box-area').scrollTop(1000000);
    _chat_box_cleanup();
};

var _create_channel = function(channel, _nickname) {
    if (!channel || !channel.length || channels[channel]) return;
    channels[channel] = true;
    $('#taracot_chat_box_sw').append('<li id="taracot_chat_cn' + channel + '"><a href=""><i class="uk-icon-envelope taracot-support-unread" style="display:none"></i><span class="taracot-chat-tab-nickname">' + (_nickname || channel) + '</span>&nbsp;<i class="uk-icon-close taracot-chat-tab-close" rel="' + channel + '"></i></a></li>');
    $('#taracot_chat_box_tabs').append('<li><div class="taracot-chat-box-area taracot-chat-box-' + channel + '"></div></li>');
    $('.taracot-chat-tab-close').unbind();
    $('.taracot-chat-tab-close').click(_close_channel_handler);
};

var _add_online_user = function(username, nickname, mod) {
    if (!nickname) nickname = username;
    var mod_style = '',
        usr_style = ' style="display:none"';
    if (!mod) {
        mod_style = ' style="display:none"';
        usr_style = '';
    }
    $('.taracot-chat-users-online').prepend('<div id="taracot_chat_uo' + username + '" class="taracot-chat-user-online"><span class="taracot-chat-moderator"' + mod_style + '><img src="/modules/chat/images/crown.png" style="width:16px;height:16px" alt="">&nbsp;</span><span class="taracot-chat-user"' + usr_style + '><img src="/modules/chat/images/user.png" style="width:16px;height:16px" alt="">&nbsp;</span><span data-uk-tooltip="{pos:\'right\',delay:800}" title="' + username + '"><span class="taracot-chat-nickname">' + nickname + '</span></span></div>');
};

var _online_user_rebind = function() {
    $('.taracot-chat-user-online').unbind();
    $('.taracot-chat-user-online').click(_online_user_click_handler);
};

var _online_user_click_handler = function() {
    var username = $(this).attr('id').replace(/^taracot_chat_uo/, ''),
        nickname = $('#' + $(this).attr('id') + ' > span > .taracot-chat-nickname').html();
    if (username == current_username) return;
    _create_channel(username, nickname);
    $('#taracot_chat_cn' + username + ' > a').click();
    $('.taracot-chat-box-area').height($('.taracot-chat-box').height());
};

var _del_online_user = function(username) {
    $('#taracot_chat_uo' + username).remove();
};

var _chat_box_cleanup = function() {
    var _areas = $.find('.taracot-chat-box-area');
    for (var ai in _areas)
        if ($(_areas[ai]).children('div').length > max_history_items)
            $(_areas[ai]).children('div').eq(0).remove();
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

var _post_msg = function(msg) {
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
                    _publish_msg(data.msg_data.channel, data.msg_data.username, data.msg_data.timestamp, data.msg_data.message, data.msg_data.data);
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

var _post_cmd = function(cmd) {
    $('#taracot_chat_reply').attr('disabled', true);
    $.ajax({
        type: 'POST',
        url: '/chat/ajax/cmd',
        data: {
            cmd: cmd
        },
        dataType: "json",
        success: function(data) {
            if (data && data.status == 1) {
                $('#taracot_chat_reply').val('');
                if (!last_message_timestamp || last_message_timestamp < data.cmd_timestamp) {
                    last_message_timestamp = data.cmd_timestamp;
                    _publish_cmd(current_username, data.cmd_index, data.cmd_data, data.cmd_timestamp);
                    _process_cmd(data);
                }
            } else {
                _publish_system_msg(undefined, Date.now(), data.error || _lang_vars.ajax_failed, true);
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
                        _publish_msg(current_channel, messages[mi].username, messages[mi].timestamp, messages[mi].message, data.users_data[messages[mi].username]);
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
    if (e.which == 13) {
        $('#taracot_chat_reply').removeClass('uk-form-danger');
        var msg = $.trim($('#taracot_chat_reply').val());
        if (!msg || msg.length < 2) return $('#taracot_chat_reply').addClass('uk-form-danger');
        if (msg.match(/^\//)) {
            msg = msg.replace(/\s+/g, ' ').replace(/^\//, '');
            _post_cmd(msg);
        } else {
            _post_msg(msg);
        }
        return false;
    }
};

var _restore_history_messages = function() {
    Object.keys(messages_data).forEach(function(channel) {
        history_loaded[channel] = 1;
        var messages = messages_data[channel];
        if (channel && channel.length && !channels[channel]) {
            var nickname;
            if (chat_users_data[channel] && chat_users_data[channel].nickname) nickname = chat_users_data[channel].nickname;
            _create_channel(channel, nickname);
        }
        for (var mi in messages) {
            if (messages[mi].type == 'u') _publish_msg(channel, messages[mi].username, messages[mi].timestamp, messages[mi].message, chat_users_data[messages[mi].username]);
            if (messages[mi].type == 'c') _publish_cmd(messages[mi].username, messages[mi].cmd, messages[mi].cmd_data, messages[mi].timestamp);
        }
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
    _online_user_rebind();
    _chatbox_resize();
    for (var ui in users_online) {
        var nickname = '',
            mod_flag = '';
        if (chat_users_data[users_online[ui]]) {
            nickname = chat_users_data[users_online[ui]].nickname || '';
            mod_flag = chat_users_data[users_online[ui]].mod_flag || false;
        }
        _add_online_user(users_online[ui], nickname, mod_flag);
    }
    _restore_history_messages();
    _init_socket_io();
    $('#taracot_chat_reply').attr('disabled', false);
    $('#taracot_chat_reply').focus();
});
