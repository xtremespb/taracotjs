/* dragMaster class */

var dragMaster = (function () {
	var dragObject;
	var mouseDownAt;
	var currentDropTarget;

	function mouseDown(e) {
		e = fixEvent(e);
		if (e.which != 1) return;
		mouseDownAt = {
			x: e.pageX,
			y: e.pageY,
			element: this
		};
		addDocumentEventHandlers(e);
		return false;
	}

	function mouseMove(e) {
		e = fixEvent(e);
		if (mouseDownAt) {
			if (Math.abs(mouseDownAt.x - e.pageX) < 5 && Math.abs(mouseDownAt.y - e.pageY) < 5) {
				return false;
			}
			// Start drag
			var elem = mouseDownAt.element;
			// Current drag object
			dragObject = elem.dragObject;
			// Get relative coordinates of drag start
			var mouseOffset = getMouseOffset(elem, mouseDownAt.x, mouseDownAt.y);
			mouseDownAt = null;
			dragObject.onDragStart(mouseOffset);

		}
		dragObject.onDragMove(e.pageX, e.pageY);
		var newTarget = getCurrentTarget(e);
		if (currentDropTarget != newTarget) {
			if (newTarget) {
				newTarget.onEnter();
			}
			currentDropTarget = newTarget;
		}
		return false;
	}

	function mouseUp() {
		if (!dragObject) {
			mouseDownAt = null;
		} else {
			if (currentDropTarget) {
				dragObject.onDragSuccess(currentDropTarget);
				currentDropTarget.accept(dragObject);
				_dragdrop_action_taken = false;
			} else {
				dragObject.onDragFail();
			}
			dragObject = null;
		}
		removeDocumentEventHandlers();
	}

	function getMouseOffset(target, x, y) {
		var docPos = getOffset(target);
		return {
			x: x - docPos.left,
			y: y - docPos.top
		};
	}

	function getCurrentTarget(e) {
		var x, y;
		if (navigator.userAgent.match('MSIE') || navigator.userAgent.match('Gecko')) {
			x = e.clientX;
			y = e.clientY;
		} else {
			x = e.pageX;
			y = e.pageY;
		}
		dragObject.hide();
		var elem = document.elementFromPoint(x, y);
		dragObject.show();
		while (elem) {
			if (elem.dropTarget && elem.dropTarget.canAccept(dragObject)) return elem.dropTarget;
			elem = elem.parentNode;
		}
		return null;
	}

	function addDocumentEventHandlers(e) {
		document.onmousemove = mouseMove;
		document.onmouseup = mouseUp;
		document.ondragstart = document.body.onselectstart = function () {
			return false;
		};
		e.stopPropagation();
	}

	function removeDocumentEventHandlers() {
		document.onmousemove = document.onmouseup = document.ondragstart = document.body.onselectstart = null;
	}
	return {
		makeDraggable: function (element) {
			element.onmousedown = mouseDown;
			document.onclick = function() {} ;
		}
	};
}());

/* DropTarget class */

function DropTarget(element) {
	this.canAccept = function(dragObject) {
		return true;
	};
	this.accept = function(dragObject) {
		this.onLeave();
		dragObject.onDragFail();
	};
	this.onLeave = function() {
	};
	this.onEnter = function() {
	};
	this.toString = function() {
		return element.id;
	};
	element.dropTarget = this;
}

/* DragObject class */

function DragObject(element) {
	element.dragObject = this;

	dragMaster.makeDraggable(element);

	var rememberPositions = {};
	var mouseOffset;

	this.onDragStart = function (offset) {
		var nodes = getByClass('taracot-files-item'), i=-1, node;
		if (!getByClass('taracot-files-item-selected').length) element.click();
		if (!element.getAttribute('class').match('taracot-files-item-selected')) {
			element.setAttribute('class', element.getAttribute('class') + ' taracot-files-item-selected');
			var id = element.id.replace('taracot_file_', '');
			document.getElementById('taracot_el_'+id).setAttribute('class', document.getElementById('taracot_el_'+id).getAttribute('class').replace(/taracot.fade.elipsis/, ''));
		}
		while (node = nodes[++i]) {
			rememberPositions[node.id] = {
				top: node.style.top,
				left: node.style.left,
				position: node.style.position,
				class: node.getAttribute('class'),
				zindex: node.style.zIndex
			};
		}
		element.style.position = 'absolute';
		mouseOffset = offset;
	};

	this.hide = function () {
		element.style.display = 'none';
	};

	this.show = function () {
		element.style.display = '';
	};

	this.onDragMove = function (x, y) {
		var nodes_sel = getByClass('taracot-files-item-selected'), i=-1, node_sel;
		while (node_sel=nodes_sel[++i]) {
			if (node_sel.id != element.id) {
				node_sel.style.display = 'none';
			}
		}
		if (i > 1) {
			var bdg = getByClass('uk-badge', element);
			if (bdg && bdg.length) {
				bdg = bdg[0];
				bdg.innerHTML = i;
				bdg.style.display = 'block';
			}
		}
		element.style.top = y - mouseOffset.y + 'px';
		element.style.left = x - mouseOffset.x + 'px';
		element.style.zIndex = 500;
	};

	this.onDragSuccess = function (dropTarget) {
	};

	this.onDragFail = function () {
		var nodes = getByClass('taracot-files-item'), i=-1, node;
		while (node=nodes[++i]) {
			node.style.top = rememberPositions[node.id].top;
			node.style.left = rememberPositions[node.id].left;
			node.style.position = rememberPositions[node.id].position;
			node.style.zIndex = rememberPositions[node.id].zindex;
			node.setAttribute('class', rememberPositions[node.id].class);
			node.style.display = 'inline-block';
			var bdg = getByClass('uk-badge', element);
			if (bdg && bdg.length) {
				bdg = bdg[0];
				bdg.innerHTML = i;
				bdg.style.display = 'none';
			}
		}
		if (typeof _dragdrop_action_taken != 'undefined') {
			_dragdrop_action_taken = true;
		}
	};

	this.toString = function () {
		return element.id;
	};
}