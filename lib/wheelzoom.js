class wheelZoom {

	constructor(containerElement, videoElement, canvasElement) {
		this.currentTop = 0;
		this.currentLeft = 0;
		this.currentZoomLevel = 1;
		this.currentWidth = 0;
		this.currentHeight = 0;
		this.zoomStep = 0.1;
		this.offsetXratio = 0;
		this.offsetYratio = 0;
		this.containerElement = containerElement ? containerElement : null;
		this.videoElement = videoElement ? videoElement : null;
		this.canvasElement = canvasElement ? canvasElement : null;
		this.referenceElement = this.videoElement;
		this.elementList = [];
		this.isDraging = false;
		this.isDrawing = false;
		this.mouseHoldLeftButton = 'isDraging'
		this.previousMouseMoveEvent = null;
		this.appendElement(null);
		this.checkElement();
		this.reset();
	}

	appendElement(element) {
		if (element === null && typeof this.elementList[0] === 'undefined') {
			this.elementList.push({ type: 'container', element: this.containerElement })
			this.elementList.push({ type: 'mover', element: this.videoElement })
			this.elementList.push({ type: 'mover', element: this.canvasElement })
		}

		if (element)
			this.elementList.push({ type: 'mover', element: element })

	}

	checkElement() {
		if (this.elementList[0].element === null || this.elementList[1].element === null)
			console.log('constructor input error')
	}

	setContext2D() {
		this.drawCtx = this.canvasElement.getContext('2d')
		this.drawCtx.strokeStyle = 'red';
		this.drawCtx.lineWidth = 6;
		this.drawCtx.lineJoin = 'round';
		this.drawCtx.lineCap = 'round';
	}

	resetCurrentPosition() {
		this.currentZoomLevel = 1;
		this.currentWidth = this.containerElement.getBoundingClientRect().width;
		this.currentHeight = this.containerElement.getBoundingClientRect().height;
		this.currentTop = 0;
		this.currentLeft = 0;
	}

	setPositionInsideContainer() {
		const valueInBorders = (value, min, max) => Math.min(Math.max(value, min), max);

		this.currentTop = valueInBorders(this.currentTop,
			this.containerElement.clientHeight - this.currentHeight, 0);
		this.currentLeft = valueInBorders(this.currentLeft,
			this.containerElement.clientWidth - this.currentWidth, 0);
	}

	setCurrentPosition() {
		this.setPositionInsideContainer();
		this.elementList.forEach(item => {
			if (item.type === 'mover' && item.element) {
				item.element.style.top = `${this.currentTop}px`;
				item.element.style.left = `${this.currentLeft}px`;
				item.element.style.width = `${this.currentWidth}px`;
				item.element.style.height = `${this.currentHeight}px`;
			}
		});
		// this.videoElement.style.top = `${this.currentTop}px`;
		// this.videoElement.style.left = `${this.currentLeft}px`;
		// this.videoElement.style.width = `${this.currentWidth}px`;
		// this.videoElement.style.height = `${this.currentHeight}px`;
		// this.canvasElement.style.top = `${this.currentTop}px`;
		// this.canvasElement.style.left = `${this.currentLeft}px`;
		// this.canvasElement.style.width = `${this.currentWidth}px`;
		// this.canvasElement.style.height = `${this.currentHeight}px`;
	}

	getEventAxisPositionOnDiv(element, e) {
		const elementWidth = element.clientWidth;
		const elementHeight = element.clientHeight;

		var elementRect = element.getBoundingClientRect();
		var elementX = e.clientX - elementRect.left;

		// console.log(e.clientX, elementRect.left);
		var elementY = e.clientY - elementRect.top;
		// console.log(elementY);
		const elementXPart = elementX / elementWidth;
		// console.log(elementXPart);
		const elementYPart = elementY / elementHeight;

		return { elementXPart, elementYPart };
	}

	getZoomPositionRatio(e) {
		const { elementXPart: xPart, elementYPart: yPart } = this.getEventAxisPositionOnDiv(this.referenceElement, e);
		const { elementXPart: containerXPart, elementYPart: containerYPart } = this.getEventAxisPositionOnDiv(this.containerElement, e);
		return { xPart, yPart, containerXPart, containerYPart }
	}

	displayPositionResult(xPart, yPart, containerXPart, containerYPart, containerWidth, containerHeight) {

		this.currentWidth = containerWidth * this.currentZoomLevel;
		this.currentHeight = containerHeight * this.currentZoomLevel;

		this.currentTop = -(this.currentHeight * yPart.toFixed(3) - containerHeight * containerYPart.toFixed(3));
		this.currentLeft = -(this.currentWidth * xPart.toFixed(3) - containerWidth * containerXPart.toFixed(3));

		this.offsetXratio = containerXPart.toFixed(3) * 100;
		this.offsetYratio = containerYPart.toFixed(3) * 100;

		if (this.currentWidth <= containerWidth || this.currentHeight <= containerHeight) {
			this.resetCurrentPosition();
		}

		this.setCurrentPosition();

	}

	zoom(action) {
		const containerWidth = this.containerElement.clientWidth;
		const containerHeight = this.containerElement.clientHeight;
		const containerLeft = this.containerElement.getBoundingClientRect().left;
		const containerTop = this.containerElement.getBoundingClientRect().top;

		// clientX and clientY is containerElement center x and center y 
		const zoomEvt = {
			clientX: (containerWidth / 2) + containerLeft,
			clientY: (containerHeight / 2) + containerTop
		}

		const { xPart: xPart, yPart: yPart, containerXPart: containerXPart, containerYPart: containerYPart } = this.getZoomPositionRatio(zoomEvt)

		if (action === 'In' || action === 'in')
			this.currentZoomLevel += this.zoomStep;
		if (action === 'Out' || action === 'out')
			this.currentZoomLevel -= this.zoomStep;

		this.displayPositionResult(xPart, yPart, containerXPart, containerYPart, containerWidth, containerHeight)
	}

	mouseWheel(e) {
		e.preventDefault();

		const containerWidth = this.containerElement.clientWidth;
		const containerHeight = this.containerElement.clientHeight;

		const { xPart: xPart, yPart: yPart, containerXPart: containerXPart, containerYPart: containerYPart } = this.getZoomPositionRatio(e);

		if (e.deltaY < 0) {
			this.currentZoomLevel += this.zoomStep;
		} else {
			this.currentZoomLevel -= this.zoomStep;
		}

		this.displayPositionResult(xPart, yPart, containerXPart, containerYPart, containerWidth, containerHeight)
	}

	mouseDown(e) {
		e.preventDefault();

		if (this.mouseHoldLeftButton === 'isDraging') {
			this.isDraging = true;
		}

		if (this.mouseHoldLeftButton === 'isDrawing' && this.canvasElement) {
			this.isDrawing = true;
			this.setContext2D();
		}

		this.previousMouseMoveEvent = e;
	}

	mouseMove(e) {
		e.preventDefault();
		if (this.isDraging) {
			this.currentTop += e.pageY - this.previousMouseMoveEvent.pageY;
			this.currentLeft += e.pageX - this.previousMouseMoveEvent.pageX;
			this.previousMouseMoveEvent = e;
			this.setCurrentPosition();
		}
		if (this.isDrawing) {
			let drawCanvasLine = () => {
				const canvasPoint = {
					X1: this.previousMouseMoveEvent.offsetX,
					X2: e.offsetX,
					Y1: this.previousMouseMoveEvent.offsetY,
					Y2: e.offsetY,
				};

				let ratio = this.canvasElement.width / this.currentWidth;
				console.log(this.canvasElement.width)
				console.log(this.currentWidth)
				console.log(this.currentZoomLevel)
				ratio *= this.currentZoomLevel;

				canvasPoint.X1 *= ratio;
				canvasPoint.X2 *= ratio;
				canvasPoint.Y1 *= ratio;
				canvasPoint.Y2 *= ratio;

				this.drawCtx.beginPath();
				this.drawCtx.moveTo(canvasPoint.X1, canvasPoint.Y1);
				this.drawCtx.lineTo(canvasPoint.X2, canvasPoint.Y2);
				this.drawCtx.stroke();
				this.drawCtx.closePath();
			}
			drawCanvasLine();
			this.previousMouseMoveEvent = e;
		}
	}

	subscribeMosueEvent() {
		this.containerElement.onwheel = (e) => { this.mouseWheel(e) };
		this.containerElement.onmousedown = (e) => { this.mouseDown(e) };
		this.containerElement.onmousemove = (e) => { this.mouseMove(e) };
		this.containerElement.onmouseup = () => { this.isDraging = false; this.isDrawing = false; };
		this.containerElement.onmouseout = () => { this.isDraging = false; this.isDrawing = false; };
	}

	unsubscribeMosueEvent() {
		this.containerElement.onwheel = null;
		this.containerElement.onmousedown = null;
		this.containerElement.onmousemove = null;
		this.containerElement.onmouseup = null;
		this.containerElement.onmouseout = null;
	}

	reset() {
		this.resetCurrentPosition()
		this.setCurrentPosition()
	}

}

export { wheelZoom }