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
			if (currentDropTarget) {
				currentDropTarget.onLeave();
			}
			if (newTarget) {
				newTarget.onEnter();
			}
			currentDropTarget = newTarget;
		}
		return false;
	}

	function mouseUp() {
		if (!dragObject) { // (1)
			mouseDownAt = null;
		} else {
			// (2)
			if (currentDropTarget) {
				currentDropTarget.accept(dragObject);
				dragObject.onDragSuccess(currentDropTarget);
			} else {
				dragObject.onDragFail();
			}
			dragObject = null;
		}
		// (3)
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
		if (navigator.userAgent.match('MSIE') || navigator.userAgent.match('Gecko')) {
			var x = e.clientX,
				y = e.clientY;
		} else {
			var x = e.pageX,
				y = e.pageY;
		}
		dragObject.hide();
		var elem = document.elementFromPoint(x, y)
		dragObject.show();
		while (elem) {
			if (elem.dropTarget && elem.dropTarget.canAccept(dragObject)) {
				return elem.dropTarget;
			}
			elem = elem.parentNode;
		}
		return null;
	}

	function addDocumentEventHandlers(e) {
		document.onmousemove = mouseMove;
		document.onmouseup = mouseUp;
		document.onclick = function() {} ; 
		document.ondragstart = document.body.onselectstart = function () {
			return false
		};		
		e.stopPropagation();
	}

	function removeDocumentEventHandlers() {
		document.onmousemove = document.onmouseup = document.ondragstart = document.body.onselectstart = null;
	}
	return {
		makeDraggable: function (element) {
			element.onmousedown = mouseDown;
		}
	}
}());

/* DropTarget class */

function DropTarget(element) {	
	element.dropTarget = this;	
	this.canAccept = function(dragObject) {
		return true;
	};	
	this.accept = function(dragObject) {
		this.onLeave();
		dragObject.hide();
	};
	this.onLeave = function() {
		element.className =  '';
	};
	this.onEnter = function() {
		// element.className = 'taracot-droptarget';
	};
	this.toString = function() {
		return element.id;
	};
}

/* DragObject class */

function DragObject(element) {
	element.dragObject = this;

	dragMaster.makeDraggable(element);

	var rememberPositions = {};
	var mouseOffset;

	this.onDragStart = function (offset) {
		var nodes = getByClass('taracot-files-item'), i=-1, node;
		while (node=nodes[++i]) {
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
		if (!element.getAttribute('class').match('taracot-files-item-selected')) element.setAttribute('class', element.getAttribute('class') + ' taracot-files-item-selected');		
		var nodes_sel = getByClass('taracot-files-item-selected'), i=-1, node_sel;
		var c = 0;
		while (node_sel=nodes_sel[++i]) {			
			if (node_sel.id != element.id) {
				node_sel.style.position = 'absolute';
				node_sel.style.top = y - mouseOffset.y + ((c+1) * 2) + 'px';
				node_sel.style.left = x - mouseOffset.x + ((c+1) * 2) + 'px';
				node_sel.style.zIndex = i+1;
				c++;
			}
		}
		element.style.top = y - mouseOffset.y + ((c+1) * 2)+ 'px';
		element.style.left = x - mouseOffset.x + ((c+1) * 2) + 'px';		
		element.style.zIndex = 5000;
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
		};
	};

	this.toString = function () {
		return element.id;
	};
}

