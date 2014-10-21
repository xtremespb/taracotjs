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
    _chat_data_pn = {},
    _counter_friends = 0,
    _counter_inv = 0,
    _flag_messages = false;

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
                        if (!regdate_text) regdate_text = moment(data.items[i].regdate).format('LLL');
                        var _online = '<i class="uk-icon-circle-thin taracot_user_online_circle_' + data.items[i]._id + '"></i>';
                        if (data.items[i].user_online && data.items[i].user_online == '1') _online = '<i class="uk-icon-circle taracot-user-online taracot_user_online_circle_' + data.items[i]._id + '"></i>';
                        $('#search_for_people_res').append('<div class="taracot-user-search-card" id="taracot_user_card_' + data.items[i]._id + '"><header class="uk-comment-header"><img class="uk-comment-avatar" src="' + data.items[i].avatar + '" alt=""><div class="taracot-social-username">' + _online + '&nbsp;' + name + '</div><div class="uk-comment-meta">' + _lang_vars.regdate + ': ' + regdate_text + '</div></header></div>');
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
                        if (!regdate_text) regdate_text = moment(data.items[i].regdate).format('LLL');
                        var _online = '<i class="uk-icon-circle-thin taracot_user_online_circle_' + data.items[i]._id + '"></i>';
                        if (data.items[i].user_online && data.items[i].user_online == '1') _online = '<i class="uk-icon-circle taracot-user-online taracot_user_online_circle_' + data.items[i]._id + '"></i>';
                        $('#inv_res').append('<div class="taracot-user-search-card" id="taracot_user_card_' + data.items[i]._id + '"><header class="uk-comment-header"><img class="uk-comment-avatar" src="' + data.items[i].avatar + '" alt=""><div class="taracot-social-username">' + _online + ' &nbsp;' + name + '</div><div class="uk-comment-meta">' + _lang_vars.regdate + ': ' + regdate_text + '</div></header></div>');
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
                        if (!regdate_text) regdate_text = moment(data.items[i].regdate).format('LLL');
                        var _online = '<i class="uk-icon-circle-thin taracot_user_online_circle_' + data.items[i]._id + '"></i>';
                        if (data.items[i].user_online && data.items[i].user_online == '1') _online = '<i class="uk-icon-circle taracot-user-online taracot_user_online_circle_' + data.items[i]._id + '"></i>';
                        $('#friends_list_res').append('<div class="taracot-user-search-card" id="taracot_user_card_' + data.items[i]._id + '"><header class="uk-comment-header"><img class="uk-comment-avatar" src="' + data.items[i].avatar + '" alt=""><div class="taracot-social-username">' + _online + '&nbsp;' + name + '</div><div class="uk-comment-meta">' + _lang_vars.regdate + ': ' + regdate_text + '</div></header></div>');
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
                if (data.conversations && data.conversations.length) {
                    for (var i = 0; i < data.conversations.length; i++) {
                        var unread_class = '';
                        if (data.conversations[i].unread_flag && data.conversations[i].unread_flag == '1') unread_class = ' taracot-conv-card-unread';
                        var _online = '<i class="uk-icon-circle-thin taracot_user_online_circle_' + data.conversations[i].user_id + '"></i>';
                        if (data.conversations[i].user_online && data.conversations[i].user_online == '1') _online = '<i class="uk-icon-circle taracot-user-online taracot_user_online_circle_' + data.conversations[i].user_id + '"></i>';
                        var _timestamp = moment().format('LLL');
                        if (data.conversations[i].last_tstamp) _timestamp = moment(data.conversations[i].last_tstamp).format('LLL');
                        $('#conv_list_res').append('<div class="taracot-btn-send-msg taracot-conv-card' + unread_class + '" id="btn_send_msg_' + data.conversations[i].user_id + '"><header class="uk-comment-header"><img class="uk-comment-avatar" src="' + data.conversations[i].avatar + '" alt=""><div class="taracot-social-username">' + _online + '&nbsp;' + data.conversations[i].name + '</div><div class="uk-comment-meta">' + _lang_vars.last_timestamp + ': ' + _timestamp + ', ' + _lang_vars.total_msg + ': ' + data.conversations[i].msg_count + '</div></header></div>');
                    }
                    $('.taracot-btn-send-msg').unbind();
                    $('.taracot-btn-send-msg').click(taracot_btn_send_msg_handler);
                } else {
                    $('#conv_list_res').html(_lang_vars.no_conversations);
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

var taracot_user_search_card_handler = function(_par, _uid) {
    var uid = _uid || $(this).attr('id').replace('taracot_user_card_', '');
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/social/user/friends/data',
        dataType: "json",
        data: {
            user: uid
        },
        success: function(data) {
            $.loadingIndicator('hide');
            if (data.status == 1) {
                push_state({
                    mode: 'user',
                    user: uid,
                    nav: _nav_current_page
                }, "?mode=user&user=" + uid);
                $('.search_for_people_user_wrap').hide();
                $('#search_for_people_form_wrap').hide();
                $('.taracot-result-list').hide();
                $('.taracot-social-title').hide();
                var name = data.user.realname || data.user.username;
                var regdate_text = '';
                if (!data.user.regdate) regdate_text = _lang_vars.unknown_regdate;
                if (!regdate_text) regdate_text = moment(data.user.regdate).format('LLL');
                var buttons = '';
                if (current_user.id != data.user._id) {
                    buttons += '<button class="uk-button uk-button-small taracot-btn-send-msg" id="btn_send_msg_' + data.user._id + '"><i class="uk-icon-envelope"></i>&nbsp;' + _lang_vars.send_msg + '</button>&nbsp;';
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
                _counter_inv--;
                _update_nav_counters();
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
                var _online = '<i class="uk-icon-circle-thin taracot-user-online-flag-small taracot_user_online_circle_' + id + '"></i>';
                if (data.user.online && data.user.online == '1') _online = '<i class="uk-icon-circle taracot-user-online taracot-user-online-flag-small taracot_user_online_circle_' + id + '"></i>';
                $('#taracot_messages_title').html('<div class="taracot-relative-wrap"><img src="' + data.user.avatar + '" class="taracot-messages-title-avatar">&nbsp;' + name + _online + '</div>');
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
                    $('.taracot-messaging-area').append(_get_chat_msg_html(mavatar, mname, data.messages[i].tstamp, data.messages[i].msg));
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
        $('#search_for_people_query').removeClass('uk-form-danger');
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
        _flag_messages = false;
        _update_nav_counters();
        _nav_current_page = 'msg';
        push_state({
            mode: 'msg'
        }, "?mode=msg");
        if (_send_msg_flag) return _send_msg_flag = false;
        $('#conv_list_res').show();
        $('#taracot_social_messages_list_wrap').show();
        $('#taracot_social_messages_send_wrap').hide();
        _load_conv_list();
        $('#social_message_text').removeClass('uk-form-danger');
    }
});

$('#social_message_text').typing({
    start: function(event, $elem) {
        $.ajax({
            type: 'POST',
            url: '/social/user/messages/typing',
            dataType: "json",
            data: {
                id: _current_msg_id,
                mode: 'start'
            }
        });
    },
    stop: function(event, $elem) {
        $.ajax({
            type: 'POST',
            url: '/social/user/messages/typing',
            dataType: "json",
            data: {
                id: _current_msg_id,
                mode: 'stop'
            }
        });
    },
    delay: 3000
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
            if (_search_in_progress) return;
            if (_search_people_skip) {
                _search_people_skip++;
            } else {
                _search_people_skip = 1;
            }
            console.log(_search_people_skip);
            _search_people(_search_people_query, _search_people_skip);
        }
        if (typeof _inv_skip != 'undefined') {
            if (_inv_in_progress) return;
            if (_inv_skip) {
                _inv_skip++;
            } else {
                _inv_skip = 1;
            }
            _load_inv(_inv_skip);
        }
        if (typeof _friends_list_skip != 'undefined') {
            if (_friends_list_in_progress) return;
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
    moment.locale(current_locale);
    _counter_friends = _init_friends_count;
    _counter_inv = _init_inv_count;
    _update_nav_counters();
    // Handle Socket.io events
    var socket = io();
    socket.on('connect', function() {
        socket.emit('set_session', current_user.id, current_user.id_hash);
    });
    socket.on('social_new_friend', function(msg) {
        _counter_friends++;
        _update_nav_counters();
        if (_nav_current_page == 'friends' && $('#friends_list_res').is(':visible')) $('#switcher_area_friends').click();
    });
    socket.on('social_new_inv', function(msg) {
        _counter_inv++;
        _update_nav_counters();
    });
    socket.on('social_chat_msg', function(msg) {
        if (_nav_current_page == 'msg' && $('.taracot-messaging-area').is(':visible')) {
            var mavatar, mname;
            if (msg.from == current_user.id) {
                mavatar = _chat_data_me.avatar;
                mname = _chat_data_me.realname || _chat_data_me.username;
            } else {
                mavatar = _chat_data_pn.avatar;
                mname = _chat_data_pn.realname || _chat_data_pn.username;
                $.ajax({
                    type: 'POST',
                    url: '/social/user/messages/markread',
                    dataType: "json",
                    data: {
                        id: _current_msg_id
                    }
                });
            }
            $('.taracot-messaging-area').append(_get_chat_msg_html(mavatar, mname, msg.tstamp, msg.msg));
            if ($('.taracot-messaging-area-typing').is(':visible') && msg.from == current_user.id) {
                $('.taracot-messaging-area-typing').appendTo('.taracot-messaging-area');
            } else {
                $('.taracot-messaging-area-typing').remove();
            }
            $('.taracot-messaging-area').scrollTop(1000000);
        } else {
            _flag_messages = true;
            _update_nav_counters();
            if ($('#conv_list_res').is(':visible')) _load_conv_list();
        }
    });
    socket.on('social_typing', function(msg) {
        if (_nav_current_page == 'msg' && $('.taracot-messaging-area').is(':visible')) {
            $('.taracot-messaging-area-typing').remove();
            if (msg.mod != 'stop') {
                var _name = _chat_data_pn.realname || _chat_data_pn.username;
                $('.taracot-messaging-area').append('<div class="taracot-messaging-area-typing">' + _name + ' ' + _lang_vars.typing_a_message + '...</div>');
            }
            $('.taracot-messaging-area').scrollTop(1000000);
        }
    });
    socket.on('taracot_user_offline', function(msg) {
        if (msg && msg.id) $('.taracot_user_online_circle_' + msg.id).removeClass('uk-icon-circle').addClass('uk-icon-circle-thin').removeClass('taracot-user-online');
        $('.taracot-messaging-area-typing').remove();
    });
    socket.on('taracot_user_online', function(msg) {
        if (msg && msg.id) $('.taracot_user_online_circle_' + msg.id).removeClass('uk-icon-circle-thin').addClass('uk-icon-circle').addClass('taracot-user-online');
    });
});

/*******************************************************************

 Helper functions

********************************************************************/

var _update_nav_counters = function() {
    $('#taracot_notify_friends').hide();
    $('#taracot_notify_inv').hide();
    $('#taracot_notify_msg').hide();
    if (_counter_friends) {
        $('#taracot_notify_friends').html(_counter_friends);
        $('#taracot_notify_friends').show();
    }
    if (_counter_inv) {
        $('#taracot_notify_inv').html(_counter_inv);
        $('#taracot_notify_inv').show();
    }
    if (_flag_messages) $('#taracot_notify_msg').show();
};

var _reset_scrolling_pagination = function() {
    _search_people_skip = undefined;
    _search_in_progress = false;
    _inv_skip = undefined;
    _inv_in_progress = false;
    _friends_list_skip = undefined;
    _friends_list_in_progress = false;
};

var _get_chat_msg_html = function(mavatar, mname, dt, mmsg) {
    var dtx = moment(dt).calendar();
    return '<div class="taracot-social-msg"><div class="taracot-social-msg-avatar"><img src="' + mavatar + '" alt="" class="taracot-social-msg-avatar-image uk-border-rounded"></div><div class="taracot-social-msg-body"><div class="taracot-social-msg-username">' + mname + '</div><div class="taracot-social-msg-meta">' + dtx + '</div><div class="taracot-social-msg-text">' + mmsg + '</div></div></div>';
};
