var comment_parent = '';
if (!$('#taracot_comment_form').is(':visible')) $('.taracot-comment-reply-link').hide();
$.loadingIndicator();

$('#btn_post_comment').click(function() {
    var comment = $('#post_comment_text').val().replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
    $('#post_comment_text').removeClass('uk-form-danger');
    $('.taracot-post-comment-error').html('');
    if (!comment || comment.length < 2 || comment.length > 2048) return $('#post_comment_text').addClass('uk-form-danger');
    $('#btn_post_comment').hide();
    $('#btn_post_comment_loading').show();
    $.ajax({
        type: 'POST',
        url: '/blog/post/comment',
        dataType: "json",
        data: {
            post_id: post_id,
            comment_parent: comment_parent,
            comment_text: comment
        },
        success: function(data) {
            $('#btn_post_comment').show();
            $('#btn_post_comment_loading').hide();
            if (data.status == 1) {
                $('#post_comment_text').val('');
                if (comment_parent) $('#comment_' + comment_parent).show();
                $('#taracot_comment_form_wrap').show();
                $('#taracot_comment_form').detach().appendTo($('#taracot_comment_form_wrap'));
                $('#comment_new').hide();
                if (data.comment_html && data.comment_id) {
                    if (comment_parent) {
                        var _save_margin = '',
                            _set = false;
                        $("#taracot_comments_flow > .taracot-comment").each(function() {
                            if (_set) return;
                            var id = $(this).attr('id').replace('taracot_comment_', '');
                            if (id == comment_parent) return _save_margin = $(this).css('margin-left');
                            if ($(this).css('margin-left') <= _save_margin) {
                                var _margin = parseInt(_save_margin.replace('px', '')) + 15;
                                data.comment_html = data.comment_html.replace(/\[set_margin\]/, _margin);
                                $(this).before(data.comment_html);
                                _set = true;
                            }
                        });
                        if (!_set) {
                            var _margin = parseInt(_save_margin.replace('px', '')) + 15;
                            data.comment_html = data.comment_html.replace(/\[set_margin\]/, _margin);
                            $('#taracot_comments_flow').append(data.comment_html);
                        }
                    } else {
                        $('#taracot_comments_flow').append(data.comment_html);
                    }
                    $('html,body').animate({
                        scrollTop: $('#taracot_comment_' + data.comment_id).offset().top - 50
                    }, 200, function() {
                        $('#taracot_comment_' + data.comment_id).animate({
                            opacity: 0
                        }, 100, function() {
                            $('#taracot_comment_' + data.comment_id).animate({
                                opacity: 1
                            }, 300);
                        });
                    });
                    $('#btn_post_comment').hover();
                    $('#post_comment_text').hover();
                }
                comment_parent = '';
                $('.taracot-comment-reply-link').unbind();
                $('.taracot-comment-reply-link').click(taracot_comment_reply_link_handler);
            } else {
                var _msg = _lang_vars.ajax_failed;
                if (data.error) _msg = data.error;
                $('.taracot-post-comment-error').html(_msg);
                $('#post_comment_text').focus();
            }
        },
        error: function() {
            $('#btn_post_comment').show();
            $('#btn_post_comment_loading').hide();
            $('.taracot-post-comment-error').html(_lang_vars.ajax_failed);
            $('#post_comment_text').focus();
        }
    });
});

var taracot_comment_reply_link_handler = function() {
    var _comment_id = $(this).attr('id').replace('comment_', '');
    $('#taracot_comment_form').detach().appendTo($('#comment_' + _comment_id).parent());
    if (comment_parent) $('#comment_' + comment_parent).show();
    $('#comment_' + _comment_id).hide();
    comment_parent = _comment_id;
    $('#post_comment_text').removeClass('uk-form-danger');
    $('#post_comment_text').val('');
    $('#post_comment_text').focus();
    $('#comment_new').show();
    $('#taracot_comment_form_wrap').hide();
};

$('.taracot-comment-new-link').click(function() {
    if (comment_parent) $('#comment_' + comment_parent).show();
    $('#taracot_comment_form_wrap').show();
    $('#taracot_comment_form').detach().appendTo($('#taracot_comment_form_wrap'));
    $('#comment_new').hide();
    comment_parent = '';
});

var taracot_comment_delete_handler = function() {
    if (!confirm(_lang_vars.comment_delete_confirm)) return;
    var comment_id = $(this).attr('id').replace('comment_delete_', '');
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/blog/post/comment/delete',
        dataType: "json",
        data: {
            comment_id: comment_id
        },
        success: function(data) {
            $.loadingIndicator('hide');
            if (data.status == 1) {
                $('#taracot_comment_' + comment_id).html(_lang_vars.comment_deleted);
                $('#taracot_comment_' + comment_id).addClass('taracot-comment-deleted');
            } else {
                if (data.error) return alert(data.error);
                alert(_lang_vars.ajax_failed);
            }
        },
        error: function() {
            $.loadingIndicator('hide');
            alert(_lang_vars.ajax_failed);
        }
    });
};

$('.taracot-comment-reply-link').click(taracot_comment_reply_link_handler);
$('.taracot-comment-delete').click(taracot_comment_delete_handler);

$('#post_comment_text').keydown(function(e) {
    if (e.ctrlKey && e.keyCode == 13) {
        e.preventDefault();
        $('#btn_post_comment').click();
    }
});
