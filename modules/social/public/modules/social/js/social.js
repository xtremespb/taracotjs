$.loadingIndicator();

var _search_people_skip = 0,
	_search_people_query = '',
    _search_in_progress = false,
    _inv_skip = 0,
    _inv_in_progress = false;

var _search_people = function(query, skip) {
    if (_search_in_progress) return;
    _search_in_progress = true;
    if (!skip) skip = 0;
    if (skip === 0) $('#search_for_people_res').html('');
    $('#search_for_people_res').append('<div class="taracot_ajax_progress_indicator uk-margin-top"><img src="/modules/social/images/loading_16x16.gif">&nbsp;' + _lang_vars.loading_data + '</div>');
    $.ajax({
        type: 'POST',
        url: '/social/friends/search',
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
        url: '/social/user/friendship/inv',
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

var search_for_people_handler = function() {
    $('#search_for_people_query').removeClass('uk-form-danger');
    var query = $('#search_for_people_query').val();
    if (query) query = query.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
    if (!query) return $('#search_for_people_query').addClass('uk-form-danger');
    _search_people_skip = 0;
    _search_people_query = query;
    _search_people(_search_people_query);
};

var taracot_user_search_card_handler = function() {
    var username = $(this).attr('id').replace('taracot_user_card_', '');
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/social/user/data',
        dataType: "json",
        data: {
            user: username
        },
        success: function(data) {
            $.loadingIndicator('hide');
            if (data.status == 1) {
                $('#switcher_area_search').click();
                $('#search_for_people_form_wrap').hide();
                var name = data.user.realname || data.user.username;
                var regdate_text = '';
                if (!data.user.regdate) regdate_text = _lang_vars.unknown_regdate;
                if (!regdate_text) regdate_text = moment(data.user.regdate).lang(current_locale).fromNow();
                var buttons = '';
                if (current_user.id != data.user._id) {
                    if (data.friendship && data.friendship == '0') buttons += '<button class="uk-button uk-button-small taracot-btn-add-friend" id="btn_add_friend_' + data.user._id + '"><i class="uk-icon-plus"></i>&nbsp;' + _lang_vars.add_friend + '</button>';
                    if (data.friendship && data.friendship == '1') buttons += '<span class="uk-badge uk-badge-success>' + _lang_vars.friendship_estb + '</span>';
                    if (data.friendship && data.friendship == '2') buttons += '<button class="uk-button uk-button-small" disabled="true"><i class="uk-icon-plus"></i>&nbsp;' + _lang_vars.friendship_request_sent + '</button>';
                    if (data.friendship && data.friendship == '3') buttons += '<button class="uk-button uk-button-small uk-button-success taracot-btn-accept-friend" id="btn_accept_friend_' + data.user._id + '"><i class="uk-icon-plus"></i>&nbsp;' + _lang_vars.friendship_request_recv + '</button>';
                }
                if (buttons) buttons = '<div class="uk-margin-top">' +  buttons + '</div>';
                $('.search_for_people_user_wrap').html('<div class="uk-grid"><div class="taracot-mypage-avatar-wrap"><img src="' + data.user.avatar + '" alt="" class="taracot-mypage-avatar"></div><div class="uk-grid-9-10 taracot-mypage-userdata-wrap"><div class="taracot_social_header" id="taracot_social_my_page">' + name + '</div><div>' + _lang_vars.regdate + ': ' + regdate_text + '</div>' + buttons + '</div></div>');
                $('.search_for_people_user_wrap').show();
                $('.taracot-btn-add-friend').unbind();
                $('.taracot-btn-add-friend').click(taracot_btn_add_friend_handler);
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
            if (data.status == 1) {
                $('#search_for_people_form_wrap').hide();
                var name = data.user.realname || data.user.username;
                var regdate_text = '';
                if (!data.user.regdate) regdate_text = _lang_vars.unknown_regdate;
                if (!regdate_text) regdate_text = moment(data.user.regdate).lang(current_locale).fromNow();
                var buttons = '';
                if (current_user.id != data.user._id) buttons += '<button class="uk-button uk-button-small taracot-btn-add-friend" id="btn_add_friend_' + data.user._id + '"><i class="uk-icon-plus"></i>&nbsp;' + _lang_vars.add_friend + '</button>';
                if (buttons) buttons = '<div class="uk-margin-top">' +  buttons + '</div>';
                $('.search_for_people_user_wrap').html('<div class="uk-grid"><div class="taracot-mypage-avatar-wrap"><img src="' + data.user.avatar + '" alt="" class="taracot-mypage-avatar"></div><div class="uk-grid-9-10 taracot-mypage-userdata-wrap"><div class="taracot_social_header" id="taracot_social_my_page">' + name + '</div><div>' + _lang_vars.regdate + ': ' + regdate_text + '</div>' + buttons + '</div></div>');
                $('.search_for_people_user_wrap').show();
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

$('.taracot-btn-add-friend').click(taracot_btn_add_friend_handler);

// Catch switcher events

$('[data-uk-switcher]').on('uk.switcher.show', function(event, area){
    if ($(area).attr('id') === 'switcher_area_inv') {
        $('.search_for_people_user_wrap').html('');
        _inv_skip = 0;
        _load_inv(0);
    }
    if ($(area).attr('id') === 'switcher_area_search') {
        $('.search_for_people_user_wrap').hide();
        $('#search_for_people_form_wrap').show();
    }
});

// Scroll

$(window).scroll(function() {
   if($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
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
   }
});