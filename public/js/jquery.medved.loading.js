;
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
            $('body').append('<div id="_taracot-loading-modal" class="uk-modal"><div class="uk-modal-dialog uk-modal-dialog-frameless" style="background:0;box-shadow:0 0 0px rgba(0,0,0,0);position:absolute;top:50%;left:50%;margin-top:-50px;margin-left:-50px;width:100px;height:100px;"><div id="_taracot_loader_image"></div></div></div>');
            _taracot_loading_modal = $.UIkit.modal("#_taracot-loading-modal", {
                bgclose: false,
                keyboard: false
            });
            new _image_loader(cImageSrc, _start_animation);
        },
        show: function() {
            $('#_taracot-loading-modal').show();
            _taracot_loading_modal.show();
        },
        hide: function() {
            _taracot_loading_modal.hide();
            $('#_taracot-loading-modal').hide();
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

    $.loadingIndicator = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' doesn\'t exists');
        }
    };

})(jQuery);
