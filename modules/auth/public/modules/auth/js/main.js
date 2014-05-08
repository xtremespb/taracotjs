$('#auth_username').focus();
$('#auth_login').click(function() {
	$.ajax({
        type: 'POST',
        url: '/auth/process',
        data: {
            username: $('#auth_username').val(),
            password: $('#auth_password').val()
        },
        dataType: "json",
        success: function (data) {
        },
        error: function () {
        }
    })
});