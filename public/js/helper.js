// Taracot helper functions

function submitOnEnter(e) {
    var keycode;
    if (window.event) keycode = window.event.keyCode;
    else if (e) keycode = (e.keyCode ? e.keyCode : e.which);
    else return false;
    if (keycode == 13) {
        if (window.previousKeyCode) {
            // down=40,up=38,pgdn=34,pgup=33
            if (window.previousKeyCode == 33 || window.previousKeyCode == 34 ||
                window.previousKeyCode == 39 || window.previousKeyCode == 40) {
                window.previousKeyCode = keycode;
                return false;
            }
        }
        return true;
    } else {
        window.previousKeyCode = keycode;
        return false;
    }
}

(function($) {
    $.queryString = (function(a) {
        if (a === "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i) {
            var p = a[i].split('=');
            if (p.length != 2) continue;
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
        return b;
    })(window.location.search.substr(1).split('&'));
})(jQuery);
