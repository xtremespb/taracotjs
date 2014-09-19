$.loadingIndicator();

$('#btn_post_save').click(function() {
    var post_title = $('#post_title').val();
    var post_area = $('#post_area').val();
    var post_keywords = $('#post_keywords').val();
    var post_content = $('#post_content').bbcode();
    var post_draft = false;
    if ($("#post_draft").is(':checked')) post_draft = true;
    var post_comments = false;
    if ($("#post_comments").is(':checked')) post_comments = true;
    // Check values
    $('.taracot_blog_post_field').each(function() {
        $(this).removeClass('uk-form-danger');
    });
    $('#post_form_err').hide();
    if (!post_title || post_title > 100) {
        $('#post_title').addClass('uk-form-danger');
        $('#post_title').focus();
        $('#post_form_err').html(_lang_vars.invalid_title);
        return $('#post_form_err').show();
    }
    if (!post_area) {
        $('#post_area').addClass('uk-form-danger');
        $('#post_area').focus();
    }
    if (!post_keywords || post_keywords > 250) {
        $('#post_keywords').addClass('uk-form-danger');
        $('#post_keywords').focus();
        $('#post_form_err').html(_lang_vars.invalid_keywords);
        return $('#post_form_err').show();
    }
    if (!post_content) {
        $('#post_content').addClass('uk-form-danger');
        $('#post_content').focus();
        $('#post_form_err').html(_lang_vars.invalid_content);
        return $('#post_form_err').show();
    }
    // End of value check
    var post_id;
    if (blog_data) post_id = blog_data._id;
    $.loadingIndicator('show');
    $.ajax({
        type: 'POST',
        url: '/blog/post/save',
        dataType: "json",
        data: {
            post_id: post_id,
            post_title: post_title,
            post_area: post_area,
            post_keywords: post_keywords,
            post_content: post_content,
            post_draft: post_draft,
            post_comments: post_comments
        },
        success: function(data) {
            $.loadingIndicator('hide');
            if (data.status == 1) {

            } else {
            	$('#post_form_err').html(_lang_vars.ajax_failed);
            	if (data.error) $('#post_form_err').html(data.error);
            	$('#post_form_err').show();
            	$(window).scrollTop($("#post_form_err").offset().top);
            }
        },
        error: function() {
            $.loadingIndicator('hide');
            $('#post_form_err').html(_lang_vars.ajax_failed);
            $('#post_form_err').show();
            $(window).scrollTop($("#post_form_err").offset().top);
        }
    });
});

$(document).ready(function() {
    var wbbOpt = {};
    $("#post_content").wysibb(wbbOpt);
    if (typeof blog_data != 'undefined') {
        $('#blog_head').html(_lang_vars.edit_post);
    }
    $('#post_title').focus();
});
