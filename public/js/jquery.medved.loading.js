(function($) {

    var options = jQuery.extend({}, options),
        cSpeed = 9,
        cWidth = 100,
        cHeight = 100,
        cTotalFrames = 12,
        cFrameWidth = 100,
        cImageSrc = '/images/loading.png',
        cImageTimeout = false,
        cIndex = 0,
        cXpos = 0,
        cPreloaderTimeout = false,
        SECONDS_BETWEEN_FRAMES = 0,
        _taracot_loading_modal;

    var methods = {
        init: function(_options) {
            $('body').append('<div id="_taracot_loader_image_wrap" style="position:fixed;top:0;left:0;background:rgba(0,0,0,0.6);z-index:999;width:100%;height:100%;display:none;"><div id="_taracot_loader_image"></div></div>');
            new _image_loader(cImageSrc, _start_animation);
            $(window).resize(_center_loader);
        },
        show: function() {
            _center_loader();
            $('#_taracot_loader_image_wrap').show();
            _disable_scroll();
        },
        hide: function() {
            $('#_taracot_loader_image_wrap').hide();
            _enable_scroll();
        }
    };

    function _start_animation() {
        document.getElementById('_taracot_loader_image').style.backgroundImage = 'url(' + cImageSrc + ')';
        document.getElementById('_taracot_loader_image').style.width = cWidth + 'px';
        document.getElementById('_taracot_loader_image').style.height = cHeight + 'px';
        FPS = Math.round(100 / cSpeed);
        SECONDS_BETWEEN_FRAMES = 1 / FPS;
        cPreloaderTimeout = setTimeout(_continue_animation, SECONDS_BETWEEN_FRAMES / 1000);
    }

    function _continue_animation() {
        cXpos += cFrameWidth;
        cIndex += 1;
        if (cIndex >= cTotalFrames) {
            cXpos = 0;
            cIndex = 0;
        }
        if (document.getElementById('_taracot_loader_image')) document.getElementById('_taracot_loader_image').style.backgroundPosition = (-cXpos) + 'px 0';
        cPreloaderTimeout = setTimeout(_continue_animation, SECONDS_BETWEEN_FRAMES * 1000);
    }

    function _stop_animation() {
        clearTimeout(cPreloaderTimeout);
        cPreloaderTimeout = false;
    }

    function _image_loader(s, fun) {
        clearTimeout(cImageTimeout);
        cImageTimeout = 0;
        genImage = new Image();
        genImage.onload = function() {
            cImageTimeout = setTimeout(fun, 0);
        };
        genImage.src = s;
    }

    function _center_loader() {
        var top = ($(window).height() - $('#_taracot_loader_image').outerHeight()) / 2;
        var left = ($(window).width() - $('#_taracot_loader_image').outerWidth()) / 2;
        $('#_taracot_loader_image').css({
            position: 'absolute',
            margin: 0,
            top: (top > 0 ? top : 0) + 'px',
            left: (left > 0 ? left : 0) + 'px'
        });
    }

    $.loadingIndicator = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' doesn\'t exists');
        }
    };

    // scroll-related functions

    // left: 37, up: 38, right: 39, down: 40,
    // spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
    var keys = [37, 38, 39, 40];

    function preventDefault(e) {
        e = e || window.event;
        if (e.preventDefault)
            e.preventDefault();
        e.returnValue = false;
    }

    function keydown(e) {
        for (var i = keys.length; i--;) {
            if (e.keyCode === keys[i]) {
                preventDefault(e);
                return;
            }
        }
    }

    function wheel(e) {
        preventDefault(e);
    }

    function _disable_scroll() {
        if (window.addEventListener) {
            window.addEventListener('DOMMouseScroll', wheel, false);
        }
        window.onmousewheel = document.onmousewheel = wheel;
        document.onkeydown = keydown;
    }

    function _enable_scroll() {
        if (window.removeEventListener) {
            window.removeEventListener('DOMMouseScroll', wheel, false);
        }
        window.onmousewheel = document.onmousewheel = document.onkeydown = null;
    }

})(jQuery);
