(function($) {
	$.fn.getSelected = function(o) {
		var str = [];
		$('.' + o).each(function() {
			var id = $(this).attr('id');
			str.push(id);
		});
		return str;
	};
	$.fn.shifty = function(o) {
		var o = $.extend({
			className: 'selected',
			select: function() {},
			unselect: function() {}
		}, o);
		elems = $(this);
		last = null;
		var className = o.className;
		return $(this).each(function() {
			var block = $(this);
			this.onselectstart = function() {
				return false;
			};
			block.unbind('click').css({
				'-moz-user-select': '',
				'-webkit-user-select': '',
				'user-select': ''
			});
			block.click(function(e) {
				if (!e.ctrlKey && !e.shiftKey) {
					if (typeof _dragdrop_action_taken != 'undefined' && _dragdrop_action_taken) {
						_dragdrop_action_taken = false;
						return;
					}
					elems.removeClass(className);
					$(this).addClass(className);
					o.unselect(elems);
					o.select($(this));
					last = elems.index($(this));
				}
				if (e.ctrlKey) {
					block.toggleClass(className);
					last = elems.index(block);
					o.unselect(elems);
					o.select(elems.filter('.' + className));
				}
				if (e.shiftKey) {
					first = elems.index(block);
					if (first < last) {
						elems.filter(':gt(' + (first - 1) + ')').addClass(className);
						elems.filter(':lt(' + first + '),:gt(' + last + ')').removeClass(className);
					} else {
						elems.filter(':gt(' + last + ')').addClass(className);
						elems.filter(':lt(' + last + '),:gt(' + first + ')').removeClass(className);
					}
					o.unselect(elems);
					o.select(elems.filter('.' + className));
				}
			});
		});
	};
})(jQuery);
