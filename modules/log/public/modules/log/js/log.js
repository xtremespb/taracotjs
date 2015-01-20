var stack_modal = new UIkit.modal("#stack_dialog"),
    taracot_stack_btn_handler = function() {
        $('#taracot_stacktrace').html($(this).attr('rel'));
        stack_modal.show();
    };
$(document).ready(function() {
    $('.taracot-stack-btn').click(taracot_stack_btn_handler);
});
