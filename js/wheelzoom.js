class whellEvent {

	constructor(containerElement, videoElement, canvasElement) {
		this.currentTop = 0;
		this.currentLeft = 0;
		this.currentZoomLevel = 0;
		this.currentWidth = 0;
		this.currentHeight = 0;
		this.zoomStep = 0.1;
		this.offsetXratio = 0;
		this.offsetYratio = 0;
		this.containerElement = containerElement ? containerElement : null;
		this.videoElement = videoElement ? videoElement : null;
		this.canvasElement = canvasElement ? canvasElement : null;
		this.referenceCalcElement = this.videoElement
		this.elementList = []
		this.appendElement(null)
		this.checkElement()
	}

	appendElement(element) {

		if (element === null) {
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

	resetCurrentPosition() {
		this.currentZoomLevel = 1;
		this.currentWidth = this.containerElement.clientWidth;
		this.currentHeight = this.containerElement.clientHeight;
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
				console.log(item)
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

	getMouseRatio(e) {
		const { elementXPart: xPart, elementYPart: yPart } = this.getEventAxisPositionOnDiv(this.referenceCalcElement, e);
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

		// clientX and clientY is containerElement center x and center y 
		const e = {
			clientX: (this.containerElement.clientWidth / 2) + this.containerElement.getBoundingClientRect().left,
			clientY: (this.containerElement.clientHeight / 2) + this.containerElement.getBoundingClientRect().top
		}
		const { xPart: xPart, yPart: yPart, containerXPart: containerXPart, containerYPart: containerYPart } = this.getMouseRatio(e)
		const containerWidth = this.containerElement.clientWidth;
		const containerHeight = this.containerElement.clientHeight;

		if (action === 'In' || action === 'in')
			this.currentZoomLevel += this.zoomStep;
		if (action === 'Out' || action === 'out')
			this.currentZoomLevel -= this.zoomStep;

		this.displayPositionResult(xPart, yPart, containerXPart, containerYPart, containerWidth, containerHeight)
	}

	mouseWheel(e) {

		e.preventDefault();

		const { xPart: xPart, yPart: yPart, containerXPart: containerXPart, containerYPart: containerYPart } = this.getMouseRatio(e);
		const containerWidth = this.containerElement.clientWidth;
		const containerHeight = this.containerElement.clientHeight;

		if (e.deltaY < 0) {
			this.currentZoomLevel += this.zoomStep;
		} else {
			this.currentZoomLevel -= this.zoomStep;
		}

		this.displayPositionResult(xPart, yPart, containerXPart, containerYPart, containerWidth, containerHeight)

	}

	reset() {

		this.resetCurrentPosition()
		this.setCurrentPosition()

	}

}

export { whellEvent }