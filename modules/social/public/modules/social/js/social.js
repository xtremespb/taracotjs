$.loadingIndicator();

var _search_people_skip,
    _search_people_query = '',
    _search_in_progress = false,
    _inv_skip,
    _inv_in_progress = false,
    _friends_list_skip,
    _friends_list_in_progress = false,
    _send_msg_flag = false,
    _current_msg_id,
    _history_handler_disable = false,
    _nav_startup = false,
    _nav_current_page = '',
    _chat_data_me = {},
    _chat_data_pn = {};

var _search_people = function(query, skip) {
    if (_search_in_progress) return;
    _search_in_progress = true;
    if (!skip) skip = 0;
    if (skip === 0) $('#search_for_people_res').html('');
    $('#search_for_people_res').append('<div class="taracot_ajax_progress_indicator uk-margin-top"><img src="/modules/social/images/loading_16x16.gif">&nbsp;' + _lang_vars.loading_data + '</div>');
    $.ajax({
        type: 'POST',
        url: '/social/user/friends/search',
        dataType: "json",
        data: {
            query: query,
            skip: skip
        },
        success: function(data) {
            $('.taracot_ajax_progress_indicator').remove();
            _search_in_progress = false;
            if (data.status == 1) {
                if (data.items && data.items.length) {
                    for (var i = 0; i < data.items.length; i++) {
                        var name = data.items[i].realname || data.items[i].username;
                        var regdate_text = '';
                        if (!data.items[i].regdate) regdate_text = _lang_vars.unknown_regdate;
                        if (!regdate_text) regdate_text = moment(data.items[i].regdate).lang(current_locale).fromNow();
                        $('#search_for_people_res').append('<div class="taracot-user-search-card" id="taracot_user_card_' + data.items[i].username.toLowerCase() + '"><header class="uk-comment-header"><img class="uk-comment-avatar" src="' + data.items[i].avatar + '" alt=""><div class="taracot-social-username">' + name + '</div><div class="uk-comment-meta">' + _lang_vars.regdate + ': ' + regdate_text + '</div></header></div>');
                    }
                } else {
                    _search_people_skip = undefined;
                }
                $('.taracot-user-search-card').unbind();
                $('.taracot-user-search-card').click(taracot_user_search_card_handler);
            } else {
                $('#search_for_people_res').html(_lang_vars.ajax_failed);
                if (data.error) $('#search_for_people_res').html(data.error);
            }
        },
        error: function() {
            $('.taracot_ajax_progress_indicator').remove();
            $('#search_for_people_res').html(_lang_vars.ajax_failed);
            _search_in_progress = false;
        }
    });
};

var _load_inv = function(skip) {
    if (_inv_in_progress) return;
    _inv_in_progress = true;
    if (!skip) skip = 0;
    if (skip === 0) $('#inv_res').html('');
    $('#inv_res').append('<div class="taracot_ajax_progress_indicator uk-margin-top"><img src="/modules/social/images/loading_16x16.gif">&nbsp;' + _lang_vars.loading_data + '</div>');
    $.ajax({
        type: 'POST',
        url: '/social/user/friends/inv',
        dataType: "json",
        data: {
            skip: skip
        },
        success: function(data) {
            $('.taracot_ajax_progress_indicator').remove();
            _inv_in_progress = false;
            if (data.status == 1) {
                if (data.items && data.items.length) {
                    for (var i = 0; i < data.items.length; i++) {
                        var name = data.items[i].realname || data.items[i].username;
                        var regdate_text = '';
                        if (!data.items[i].regdate) regdate_text = _lang_vars.unknown_regdate;
                        if (!regdate_text) regdate_text = moment(data.items[i].regdate).lang(current_locale).fromNow();
                        $('#inv_res').append('<div class="taracot-user-search-card" id="taracot_user_card_' + data.items[i].username.toLowerCase() + '"><header class="uk-comment-header"><img class="uk-comment-avatar" src="' + data.items[i].avatar + '" alt=""><div class="taracot-social-username">' + name + '</div><div class="uk-comment-meta">' + _lang_vars.regdate + ': ' + regdate_text + '</div></header></div>');
                    }
                } else {
                    _inv_skip = undefined;
                }
                $('.taracot-user-search-card').unbind();
                $('.taracot-user-search-card').click(taracot_user_search_card_handler);
            } else {
                $('#inv_res').html(_lang_vars.ajax_failed);
                if (data.error) $('#inv_res').html(data.error);
            }
        },
        error: function() {
            $('.taracot_ajax_progress_indicator').remove();
            $('#inv_res').html(_lang_vars.ajax_failed);
            _inv_in_progress = false;
        }
    });
};

var _load_friends_list = function(skip) {
    if (_friends_list_in_progress) return;
    _friends_list_in_progress = true;
    if (!skip) skip = 0;
    if (skip === 0) $('#friends_list_res').html('');
    $('#friends_list_res').append('<div class="taracot_ajax_progress_indicator uk-margin-top"><img src="/modules/social/images/loading_16x16.gif">&nbsp;' + _lang_vars.loading_data + '</div>');
    $.ajax({
        type: 'POST',
        url: '/social/user/friends/list',
        dataType: "json",
        data: {
            skip: skip
        },
        success: function(data) {
            $('.taracot_ajax_progress_indicator').remove();
            _friends_list_in_progress = false;
            if (data.status == 1) {
                if (data.items && data.items.length) {
                    for (var i = 0; i < data.items.length; i++) {
                        var name = data.items[i].realname || data.items[i].username;
                        var regdate_text = '';
                        if (!data.items[i].regdate) regdate_text = _lang_vars.unknown_regdate;
                        if (!regdate_text) regdate_text = moment(data.items[i].regdate).lang(current_locale).fromNow();
                        $('#friends_list_res').append('<div class="taracot-user-search-card" id="taracot_user_card_' + data.items[i].username.toLowerCase() + '"><header class="uk-comment-header"><img class="uk-comment-avatar" src="' + data.items[i].avatar + '" alt=""><div class="taracot-social-username">' + name + '</div><div class="uk-comment-meta">' + _lang_vars.regdate + ': ' + regdate_text + '</div></header></div>');
                    }
                } else {
                    _friends_list_skip = undefined;
                }
                $('.taracot-user-search-card').unbind();
                $('.taracot-user-search-card').click(taracot_user_search_card_handler);
            } else {
                $('#friends_list_res').html(_lang_vars.ajax_failed);
                if (data.error) $('#friends_list_res').html(data.error);
            }
        },
        error: function() {
            $('.taracot_ajax_progress_indicator').remove();
            $('#friends_list_res').html(_lang_vars.ajax_failed);
            _friends_list_in_progress = false;
        }
    });
};

var _load_conv_list = function() {
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/social/user/messages/conversations',
        dataType: "json",
        success: function(data) {
            $.loadingIndicator('hide');
            if (data.status == 1) {
                $('#conv_list_res').html('');
                if (data.conversations) {
                    for (var i = 0; i < data.conversations.length; i++) {
                        $('#conv_list_res').append('<div class="taracot-btn-send-msg taracot-conv-card" id="btn_send_msg_' + data.conversations[i].user_id + '"><header class="uk-comment-header"><img class="uk-comment-avatar" src="' + data.conversations[i].avatar + '" alt=""><div class="taracot-social-username">' + data.conversations[i].name + '</div><div class="uk-comment-meta">' + _lang_vars.last_timestamp + ': ' + data.conversations[i].last_timestamp + ', ' + _lang_vars.total_msg + ': ' + data.conversations[i].msg_count + '</div></header></div>');
                    }
                    $('.taracot-btn-send-msg').unbind();
                    $('.taracot-btn-send-msg').click(taracot_btn_send_msg_handler);
                }
            } else {
                $('#conv_list_res').html(_lang_vars.ajax_failed);
                if (data.error) $('#conv_list_res').html(data.error);
            }
        },
        error: function() {
            $.loadingIndicator('hide');
            $('#conv_list_res').html(_lang_vars.ajax_failed);
            _conv_list_in_progress = false;
        }
    });
};

var search_for_people_handler = function() {
    $('#search_for_people_query').removeClass('uk-form-danger');
    var query = $('#search_for_people_query').val();
    if (query) query = query.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
    if (!query) return $('#search_for_people_query').addClass('uk-form-danger');
    push_state({
        mode: 'search_query',
        query: query
    }, "?mode=search_query&query=" + query);
    _reset_scrolling_pagination();
    _search_people_skip = 0;
    _search_people_query = query;
    _search_people(_search_people_query);
};

var taracot_user_search_card_handler = function(_par, _username) {
    var username = _username || $(this).attr('id').replace('taracot_user_card_', '');
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/social/user/friends/data',
        dataType: "json",
        data: {
            user: username
        },
        success: function(data) {
            $.loadingIndicator('hide');
            if (data.status == 1) {
                push_state({
                    mode: 'user',
                    user: username,
                    nav: _nav_current_page
                }, "?mode=user&user=" + username);
                $('.search_for_people_user_wrap').hide();
                $('#search_for_people_form_wrap').hide();
                $('.taracot-result-list').hide();
                $('.taracot-social-title').hide();
                var name = data.user.realname || data.user.username;
                var regdate_text = '';
                if (!data.user.regdate) regdate_text = _lang_vars.unknown_regdate;
                if (!regdate_text) regdate_text = moment(data.user.regdate).lang(current_locale).fromNow();
                var buttons = '';
                buttons += '<button class="uk-button uk-button-small taracot-btn-send-msg" id="btn_send_msg_' + data.user._id + '"><i class="uk-icon-envelope"></i>&nbsp;' + _lang_vars.send_msg + '</button>&nbsp;';
                if (current_user.id != data.user._id) {
                    if (data.friendship && data.friendship == '0') buttons += '<button class="uk-button uk-button-small taracot-btn-add-friend" id="btn_add_friend_' + data.user._id + '"><i class="uk-icon-plus"></i>&nbsp;' + _lang_vars.add_friend + '</button>';
                    if (data.friendship && data.friendship == '1') buttons += '<div class="uk-badge uk-badge-success uk-badge-notification">' + _lang_vars.friendship_estb + '</div>';
                    if (data.friendship && data.friendship == '2') buttons += '<button class="uk-button uk-button-small" disabled="true"><i class="uk-icon-plus"></i>&nbsp;' + _lang_vars.friendship_request_sent + '</button>';
                    if (data.friendship && data.friendship == '3') buttons += '<button class="uk-button uk-button-small uk-button-success taracot-btn-accept-friend" id="btn_accept_friend_' + data.user._id + '"><i class="uk-icon-plus"></i>&nbsp;' + _lang_vars.friendship_request_recv + '</button>';
                }
                if (buttons) buttons = '<div class="uk-margin-top">' + buttons + '</div>';
                $('.search_for_people_user_wrap').html('<div class="uk-grid"><div class="taracot-mypage-avatar-wrap"><img src="' + data.user.avatar + '" alt="" class="taracot-mypage-avatar"></div><div class="uk-grid-9-10 taracot-mypage-userdata-wrap"><div class="taracot-social-header" id="taracot_social_my_page">' + name + '</div><div>' + _lang_vars.regdate + ': ' + regdate_text + '</div>' + buttons + '</div></div>');
                $('.search_for_people_user_wrap').show();
                $('.taracot-btn-add-friend').unbind();
                $('.taracot-btn-add-friend').click(taracot_btn_add_friend_handler);
                $('.taracot-btn-accept-friend').unbind();
                $('.taracot-btn-accept-friend').click(taracot_btn_accept_friend_handler);
                $('.taracot-btn-send-msg').unbind();
                $('.taracot-btn-send-msg').click(taracot_btn_send_msg_handler);
            } else {
                var _msg = _lang_vars.ajax_failed;
                if (data.error) _msg = data.error;
                $.UIkit.notify({
                    message: _msg,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
            $.loadingIndicator('hide');
            $.UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
};

$('#btn_search_for_people').click(search_for_people_handler);

var taracot_btn_add_friend_handler = function() {
    var id = $(this).attr('id').replace('btn_add_friend_', '');
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/social/user/friendship/request',
        dataType: "json",
        data: {
            id: id
        },
        success: function(data) {
            $.loadingIndicator('hide');
            if (data.status == 1 && data.friend_id) {
                $('.taracot-btn-add-friend').replaceWith('<button class="uk-button uk-button-small" disabled="true"><i class="uk-icon-plus"></i>&nbsp;' + _lang_vars.friendship_request_sent + '</button>');
            } else {
                var _msg = _lang_vars.ajax_failed;
                if (data.error) _msg = data.error;
                $.UIkit.notify({
                    message: _msg,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
            $.loadingIndicator('hide');
            $.UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
};

var taracot_btn_accept_friend_handler = function() {
    var id = $(this).attr('id').replace('btn_accept_friend_', '');
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/social/user/friendship/accept',
        dataType: "json",
        data: {
            id: id
        },
        success: function(data) {
            $.loadingIndicator('hide');
            if (data.status == 1 && data.friend_id) {
                $('.taracot-btn-accept-friend').replaceWith('<div class="uk-badge uk-badge-success uk-badge-notification">' + _lang_vars.friendship_estb + '</div>');
            } else {
                var _msg = _lang_vars.ajax_failed;
                if (data.error) _msg = data.error;
                $.UIkit.notify({
                    message: _msg,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
            $.loadingIndicator('hide');
            $.UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
};

var taracot_btn_send_msg_handler = function(_par, _id) {
    var id = _id || $(this).attr('id').replace('btn_send_msg_', '');
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/social/user/messages/load',
        dataType: "json",
        data: {
            id: id
        },
        success: function(data) {
            $.loadingIndicator('hide');
            if (data.status == 1) {
                _send_msg_flag = true;
                $('.taracot-messaging-area').html('');
                $('#switcher_area_msg').click();
                $('#taracot_social_messages_list_wrap').hide();
                $('#taracot_social_messages_send_wrap').show();
                var name = data.user.realname || data.user.username;
                $('#taracot_messages_title').html('<img src="' + data.user.avatar + '" class="taracot-messages-title-avatar">&nbsp;' + name);
                $('#social_message_text').val('');
                $('#social_message_text').focus();
                push_state({
                    mode: 'send_msg',
                    id: id
                }, "?mode=send_msg&id=" + id);
                _current_msg_id = data.user._id;
                if (data.user) _chat_data_pn = data.user;
                if (data.me) _chat_data_me = data.me;
                for (var i = 0; i < data.messages.length; i++) {
                    var mavatar, mname;
                    if (data.messages[i].u1 == data.me.id) {
                        mavatar = data.me.avatar;
                        mname = data.me.realname || data.me.username;
                    } else {
                        mavatar = data.user.avatar;
                        mname = data.user.realname || data.user.username;
                    }
                    var dt = moment(data.messages[i].timestamp).fromNow(),
                        mmsg = data.messages[i].msg;
                    $('.taracot-messaging-area').append(_get_chat_msg_html(mavatar, mname, dt, mmsg));
                }
                $('.taracot-messaging-area').scrollTop(1000000);
            } else {
                var _msg = _lang_vars.ajax_failed;
                if (data.error) _msg = data.error;
                $.UIkit.notify({
                    message: _msg,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
            }
        },
        error: function() {
            $.loadingIndicator('hide');
            $.UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
        }
    });
};

var taracot_btn_post_msg_handler = function() {
    var msg = $('#social_message_text').val().replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
    $('#social_message_text').removeClass('uk-form-danger');
    if (!msg || msg.length < 2 || msg.length > 1024) return $('#social_message_text').addClass('uk-form-danger');
    $('#btn_send_msg').hide();
    $('#btn_send_msg_loading').show();
    $.ajax({
        type: 'POST',
        url: '/social/user/messages/save',
        dataType: "json",
        data: {
            user_id: _current_msg_id,
            msg: msg
        },
        success: function(data) {
            $('#btn_send_msg').show();
            $('#btn_send_msg_loading').hide();
            if (data.status != 1) {
                var _msg = _lang_vars.ajax_failed;
                if (data.error) _msg = data.error;
                $.UIkit.notify({
                    message: _msg,
                    status: 'danger',
                    timeout: 2000,
                    pos: 'top-center'
                });
                $('#social_message_text').focus();
            } else {
                $('#social_message_text').val('');
                $('#social_message_text').focus();
            }
        },
        error: function() {
            $('#btn_send_msg').show();
            $('#btn_send_msg_loading').hide();
            $.UIkit.notify({
                message: _lang_vars.ajax_failed,
                status: 'danger',
                timeout: 2000,
                pos: 'top-center'
            });
            $('#social_message_text').focus();
        }
    });
};

$('#btn_send_msg').click(taracot_btn_post_msg_handler);

$('#social_message_text').keydown(function(e) {
    if (e.ctrlKey && e.keyCode == 13) {
        e.preventDefault();
        $('#btn_send_msg').click();
    }
});


/*******************************************************************

 Events

********************************************************************/

$('#search_for_people_query').bind('keypress', function(e) {
    if (submitOnEnter(e)) {
        e.preventDefault();
        $('#btn_search_for_people').click();
    }
});

$('[data-uk-switcher]').on('uk.switcher.show', function(event, area) {
    if (!_nav_startup) return _nav_startup = true;
    $('.taracot-social-title').show();
    if ($(area).attr('id') === 'switcher_area_mypage') {
        _nav_current_page = 'mypage';
        push_state({
            mode: 'mypage'
        }, "?mode=mypage");
    }
    if ($(area).attr('id') === 'switcher_area_inv') {
        _nav_current_page = 'inv';
        push_state({
            mode: 'inv'
        }, "?mode=inv");
        $('.taracot-result-list').show();
        $('.search_for_people_user_wrap').html('');
        _reset_scrolling_pagination();
        _inv_skip = 0;
        _load_inv(0);
    }
    if ($(area).attr('id') === 'switcher_area_search') {
        _nav_current_page = 'search';
        push_state({
            mode: 'search'
        }, "?mode=search");
        $('.taracot-result-list').show();
        $('#search_for_people_res').html('');
        $('.search_for_people_user_wrap').hide();
        $('#search_for_people_form_wrap').show();
        $('#search_for_people_query').val('');
        $('#search_for_people_query').focus();
    }
    if ($(area).attr('id') === 'switcher_area_friends') {
        _nav_current_page = 'friends';
        push_state({
            mode: 'friends'
        }, "?mode=friends");
        $('.taracot-result-list').show();
        $('.search_for_people_user_wrap').html('');
        _reset_scrolling_pagination();
        _friends_list_skip = 0;
        _load_friends_list(0);
    }
    if ($(area).attr('id') === 'switcher_area_msg') {
        _nav_current_page = 'msg';
        push_state({
            mode: 'msg'
        }, "?mode=msg");
        if (_send_msg_flag) return _send_msg_flag = false;
        $('#conv_list_res').show();
        $('#taracot_social_messages_list_wrap').show();
        $('#taracot_social_messages_send_wrap').hide();
        _load_conv_list();
    }
});

/*******************************************************************

 History API handler

********************************************************************/

var bind_history = function() {
    History.Adapter.bind(window, 'statechange', function() {
        history_handler();
    });
};

var history_handler = function() {
    if (_history_handler_disable) return;
    var state = History.getState();
    if (state.data.mode) {
        switch (state.data.mode) {
            case 'mypage':
                $('#switcher_area_mypage').click();
                break;
            case 'friends':
                $('#switcher_area_friends').click();
                break;
            case 'inv':
                $('#switcher_area_inv').click();
                break;
            case 'msg':
                $('#switcher_area_msg').click();
                break;
            case 'search':
                $('#switcher_area_search').click();
                break;
            case 'search_query':
                $('#switcher_area_search').click();
                if (state.data.query) {
                    $('#search_for_people_query').val(state.data.query);
                    $('#btn_search_for_people').click();
                }
                break;
            case 'user':
                if (state.data.nav) $('#switcher_area_' + state.data.nav).click();
                if (state.data.user) taracot_user_search_card_handler(undefined, state.data.user);
                break;
            case 'send_msg':
                if (state.data.id) taracot_btn_send_msg_handler(undefined, state.data.id);
                break;
        }
    }
};

var push_state = function(p1, p2) {
    _history_handler_disable = true;
    History.pushState(p1, save_title, p2);
    _history_handler_disable = false;
};

/*******************************************************************

 Scroll handling

********************************************************************/

$(window).scroll(function() {
    if ($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
        if (typeof _search_people_skip != 'undefined') {
            if (_search_people_skip) {
                _search_people_skip++;
            } else {
                _search_people_skip = 1;
            }
            _search_people(_search_people_query, _search_people_skip);
        }
        if (typeof _inv_skip != 'undefined') {
            if (_inv_skip) {
                _inv_skip++;
            } else {
                _inv_skip = 1;
            }
            _load_inv(_inv_skip);
        }
        if (typeof _friends_list_skip != 'undefined') {
            if (_friends_list_skip) {
                _friends_list_skip++;
            } else {
                _friends_list_skip = 1;
            }
            _load_friends_list(_friends_list_skip);
        }
    }
});

/*******************************************************************

 document.ready

********************************************************************/

$(document).ready(function() {
    bind_history();
    history_handler();
    // Handle Socket.io events
    var socket = io();
    socket.on('connect', function() {
        socket.emit('set_session', current_user.id, current_user.id_hash);
    });
    socket.on('social_chat_msg', function(msg) {
        if (_nav_current_page == 'msg' && $('.taracot-social-msg-text').is(':visible')) {
            var mavatar, mname;
            if (msg.from == current_user.id) {
                mavatar = _chat_data_me.avatar;
                mname = _chat_data_me.realname || _chat_data_me.username;
            } else {
                mavatar = _chat_data_pn.avatar;
                mname = _chat_data_pn.realname || _chat_data_pn.username;
            }
            var dt = moment(msg.timestamp).fromNow();
            $('.taracot-messaging-area').append(_get_chat_msg_html(mavatar, mname, dt, msg.msg));
            $('.taracot-messaging-area').scrollTop(1000000);
        }
    });
});

/*******************************************************************

 Helper functions

********************************************************************/

var _reset_scrolling_pagination = function() {
    _search_people_skip = undefined;
    _search_in_progress = false;
    _inv_skip = undefined;
    _inv_in_progress = false;
    _friends_list_skip = undefined;
    _friends_list_in_progress = false;
};

var _get_chat_msg_html = function(mavatar, mname, dt, mmsg) {
    return '<div class="taracot-social-msg"><div class="taracot-social-msg-avatar"><img src="' + mavatar + '" alt="" class="taracot-social-msg-avatar-image uk-border-rounded"></div><div class="taracot-social-msg-body"><div class="taracot-social-msg-username">' + mname + '</div><div class="taracot-social-msg-meta">' + dt + '</div><div class="taracot-social-msg-text">' + mmsg + '</div></div></div>';
};
