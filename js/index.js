window.addEventListener('load', onload);

function onload() {
  const aspectRatio_16_9 = 1.77778;
  const aspectRatio_4_3 = 1.33334;
  const canvasDiv = document.getElementById('canvasDiv');
  const inputVideo = document.getElementById('inputVideo');
  // const testImage = document.getElementById('testimg');
  const mainDiv = document.getElementById('main');
  const canvasPaint = document.getElementById('canvasPaint');
  const zoomInBtn = document.getElementById('ZoomIn');
  const zoomOutBtn = document.getElementById('ZoomOut');
  const mouseActionChange = document.getElementById('MoveOrDraw');
  // const playVideo = document.getElementById('playVideo');
  const startRecorder = document.getElementById('startRecorder');
  const stopRecorder = document.getElementById('stopRecorder');
  const selectCamera_1 = document.getElementById('selectCamera_1');
  const recoderPaintCheck = document.getElementById('recoderCheck');
  const recorderDot = document.getElementById('recorderDot');
  const clearCanvas = document.getElementById('clearCanvas');
  const colorPicker = document.getElementById('colorPicker');
  const lineSize = document.getElementById('lineWidth');
  const drawStates = document.getElementById('drawStates');
  const undoBtn = document.getElementById('undo');
  const redoBtn = document.getElementById('redo');

  const drawCtx = canvasPaint.getContext('2d');
  const drawScreen = new screenInfo();

  let drawMode = 'brush';
  let currentRatio = aspectRatio_16_9;
  let zoomRatio = 1.0;
  let zoomCounter = 0;
  let reszieTimeOutEvent = null;

  window.addEventListener('resize', () => {
    // eslint-disable-next-line no-use-before-define
    setDisplaySize(currentRatio);
    // eslint-disable-next-line no-use-before-define
    onResizeEnd();
  });

  setDisplaySize(currentRatio);

  getUserMedia().catch(err => {
    // location.reload();
    console.log(err);
  });

  function onResizeEnd() {
    if (reszieTimeOutEvent) clearTimeout(reszieTimeOutEvent);
    reszieTimeOutEvent = setTimeout(() => {
      console.log('resizeEnd');
    }, 1000);
  }

  /**
   * set container display size
   * set canvas display size
   */
  function setDisplaySize(aspectRatio) {
    const main = mainDiv;
    const canvasParentWidth = main.getBoundingClientRect().width;
    const canvasParentHeight = main.getBoundingClientRect().height;
    const ratio = parseFloat((canvasParentWidth / canvasParentHeight).toFixed(5));

    if (ratio > aspectRatio) {
      // full height width follow ratio
      canvasDiv.style.height = `${canvasParentHeight}px`;
      canvasDiv.style.width = `${canvasDiv.getBoundingClientRect().height * aspectRatio}px`;
    } else if (ratio < aspectRatio) {
      // full width height follow ratio
      canvasDiv.style.width = `${canvasParentWidth}px`;
      canvasDiv.style.height = `${canvasDiv.getBoundingClientRect().width / aspectRatio}px`;
    } else if (ratio === aspectRatio) {
      // width == height
      canvasDiv.style.height = `${canvasParentHeight}px`;
      canvasDiv.style.width = `${canvasParentWidth}px`;
    }

    canvasPaint.style.width = `${canvasDiv.getBoundingClientRect().width}px`;
    canvasPaint.style.height = `${canvasDiv.getBoundingClientRect().height}px`;

    // console.log('----------------------------------')
    // console.log('mainEle', main.getBoundingClientRect().width, main.getBoundingClientRect().height)
    // console.log('canvasEle', canvasDiv.getBoundingClientRect().width, canvasDiv.getBoundingClientRect().height)
    // console.log('canvasStyle', canvasDiv.style.width, canvasDiv.style.height)
    // console.log('----------------------------------')
  }

  function setBrushStyle() {
    drawCtx.strokeStyle = colorPicker.value;
    drawCtx.lineWidth = lineSize.value;
    drawCtx.lineJoin = 'round';
    drawCtx.lineCap = 'round';
  }

  /**
   * manage canvas screen action
   */
  function screenInfo() {
    drawCtx.clearRect(0, 0, canvasPaint.width, canvasPaint.height)
    this.canvasStack = [];
    this.step = -1;

    this.init = () => {
      drawCtx.clearRect(0, 0, canvasPaint.width, canvasPaint.height)
      this.canvasStack = [];
      this.step = -1;
      this.pushScreen();
    };

    this.setlineWidth = (lineWidth) => {
      drawCtx.lineWidth = lineWidth;
    };

    this.setColorHex = (colorHex) => {
      drawCtx.strokeStyle = colorHex;
    };
    // convert canvas to dataUrl save to array
    this.pushScreen = () => {
      // eslint-disable-next-line no-plusplus
      this.step++;
      if (this.step < this.canvasStack.length) {
        this.canvasStack.length = this.step;
      }
      this.canvasStack.push(canvasPaint.toDataURL('image/png'));
    };
    this.pushScreen();

    this.drawScreen = (dataUrl) => {
      const img = new Image();
      img.addEventListener("load", function () {
        drawCtx.clearRect(0, 0, canvasPaint.width, canvasPaint.height)
        drawCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvasPaint.width, canvasPaint.height)
      }, false);
      img.src = dataUrl;
    };

    this.undoScreen = () => {
      if (this.step > 0) {
        this.step--;
        this.drawScreen(this.canvasStack[this.step])
      }
    };

    this.redoScreeb = () => {
      if (this.step < this.canvasStack.length - 1) {
        this.step++
        this.drawScreen(this.canvasStack[this.step])
      }
    };
  }

  /**
   * get video device
   */
  async function getDeviceList() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = [];
    devices.forEach((device) => {
      if (device.kind === 'videoinput') {
        const tempOption = document.createElement('option');
        tempOption.text = device.label;
        tempOption.value = device.deviceId;
        selectCamera_1.appendChild(tempOption);
        videoDevices.push(device);
      }
    });
    return videoDevices;
  }

  /**
   * get video device display camera deivice
   */
  async function getUserMedia(deviceId, deiveName) {
    const constraints = {
      audio: false,
      video: {},
    };

    let devices = [];

    // custom device okiocam parms
    const setOkiocamConstraints = (id) => {
      constraints.video.deviceId = id;
      constraints.video.width = {min: 800, ideal: 1280, max: 1920};
      constraints.video.height = {min: 600, ideal: 720, max: 1080};
      constraints.video.frameRate = {min: 24, ideal: 24, max: 30};
    };

    // other deicve webcam parms
    const setOthercamConstraints = (id) => {
      constraints.video.deviceId = id;
      constraints.video.width = {min: 640, ideal: 800, max: 1920};
      constraints.video.height = {min: 360, ideal: 600, max: 1080};
      constraints.video.frameRate = {ideal: 30, max: 30};
      constraints.video.aspectRatio = 1.777777778;
    };

    // select change device
    if (deiveName) {
      if (deiveName.split(' ')[0] === 'OKIOCAM' && deviceId) {
        setOkiocamConstraints(deviceId);
      }

      if (deiveName.split(' ')[0] !== 'OKIOCAM' && deviceId) {
        setOthercamConstraints(deviceId);
      }
    }

    // frist init video
    if (!deviceId && !deiveName) {
      devices = await getDeviceList();
      console.log(devices);
      console.log(devices.length && devices[0].label === '');
      // device is OKIOCAM
      if (devices[0].label.split(' ')[0] === 'OKIOCAM') {
        setOkiocamConstraints(devices[0].deviceId);
      } else {
        setOthercamConstraints(devices[0].deviceId);
      }
    }

    const videoStream = await navigator.mediaDevices.getUserMedia(constraints);

    // frist access camera is reload
    if (devices.length && devices[0].label === '') {
      location.reload();
    }

    const videoStreamWidth = videoStream.getVideoTracks()[0].getSettings().width;
    const videoStreamHeight = videoStream.getVideoTracks()[0].getSettings().height;
    const videoStreamRatio = videoStream.getVideoTracks()[0].getSettings().aspectRatio.toFixed(5);

    canvasPaint.width = videoStreamWidth;
    canvasPaint.height = videoStreamHeight;

    if (videoStreamRatio === '1.33333') {
      currentRatio = aspectRatio_4_3;
    }

    if (videoStreamRatio === '1.77778') {
      currentRatio = aspectRatio_16_9;
    }

    handleStream(inputVideo, videoStream);
    mergeStream(videoStream);
    setBrushStyle();
    setDisplaySize(currentRatio);
    subscribeMouseEvent();
    drawScreen.init();

    return true;
  }

  /**
   * display video stream in video element
   */
  function handleStream(inputElement, mediaStream) {
    if (inputElement.srcObject) {
      const stream = inputElement.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => {
        track.stop();
      });
      inputElement.srcObject = null;
    }

    inputElement.srcObject = mediaStream;
    inputElement.onloadedmetadata = () => {
      inputElement.play();
    };
  }

  /**
   * if recorder canvas checked is true
   * mix canavs stream and video stream
   */
  function mergeStream(mediaStream) {
    if (recoderPaintCheck.checked) {
      const canvasStream = canvasPaint.captureStream(30);
      const recorderWidth = mediaStream.getVideoTracks()[0].getSettings().width;
      const recorderHeight = mediaStream.getVideoTracks()[0].getSettings().height;

      mediaStream.fullcanvas = true;
      mediaStream.width = recorderWidth;
      mediaStream.height = recorderHeight;
      mediaStream.top = 0;
      mediaStream.left = 0;

      canvasStream.width = recorderWidth;
      canvasStream.height = recorderHeight;
      canvasStream.top = 0;
      canvasStream.left = 0;

      // eslint-disable-next-line no-undef
      const mixer = new MultiStreamsMixer([mediaStream, canvasStream]);
      mixer.frameInterval = 1000 / 30;
      mixer.startDrawingFrames();

      const mixStream = mixer.getMixedStream();
      handleRecorder(mixStream);
    } else {
      handleRecorder(mediaStream);
    }
  }

  function handleRecorder(mediaStream) {
    let chunks = [];
    const canvasRecorder = new MediaRecorder(mediaStream, {mimeType: 'video/webm;codecs=VP8'});

    canvasRecorder.ondataavailable = (e) => {
      const blob = new Blob([e.data], {type: 'video/webm'});

      chunks.push(blob);
    };

    canvasRecorder.onstop = () => {
      console.log('stop');
      recorderDot.classList.remove('dot');
      recoderPaintCheck.disabled = false;

      const totalVideo = new Blob(chunks, {type: 'video/webm'});

      console.log(totalVideo);

      let link = document.createElement("a")
      link.href = URL.createObjectURL(totalVideo)
      link.setAttribute("download", "")
      link.click()

      console.log(URL.createObjectURL(totalVideo));

      chunks = [];
    };

    startRecorder.onclick = () => {
      console.log('start');
      recorderDot.classList.add('dot');

      recoderPaintCheck.disabled = true;
      canvasRecorder.start(1000);
    };

    stopRecorder.onclick = () => {
      canvasRecorder.stop();
    };
  }

  /**
   * subscribe mouse Event
   */
  function subscribeMouseEvent() {
    resetTopLeftScale();
    // When true, moving the mouse draws on the canvas or drag video and canvas
    let pointStack = [];
    let isDrawing = false;
    let isDraging = false;
    let AstartX = 0;
    let AstartY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let maxLeft = 0;
    let maxTop = 0;
    let prev = 0;
    let drawGap = 4;// 繪製的 mosue move 座標間隔

    function mouseDown(e) {
      e.stopPropagation();
      // move video and canvas
      if (mouseActionChange.dataset.moveevent === '0' && zoomRatio > 1.0) {
        maxLeft = ((canvasDiv.getBoundingClientRect().width * zoomRatio) - canvasDiv.getBoundingClientRect().width) / 2;
        maxTop = ((canvasDiv.getBoundingClientRect().height * zoomRatio) - canvasDiv.getBoundingClientRect().height) / 2;
        AstartX = e.offsetX;
        AstartY = e.offsetY;
        isDraging = true;

      }
      // draw canvas to video
      if (mouseActionChange.dataset.moveevent === '1') {
        let ratio = getRatio();
        AstartX = e.offsetX;
        AstartY = e.offsetY;
        isDrawing = true;
        pointStack.push({x: AstartX * ratio, y: AstartY * ratio});
      }
    }

    function mouseMove(e) {
      e.stopPropagation();
      if (isDrawing === true) {
        drawCanvasLine(drawCtx, AstartX, AstartY, e.offsetX, e.offsetY);
        AstartX = e.offsetX;
        AstartY = e.offsetY;
        canvasDiv.style.cursor = 'pointer';
      }
      if (isDraging === true) {
        offsetX = e.offsetX - AstartX;
        offsetY = e.offsetY - AstartY;
        if (inputVideo.style.left) {
          offsetX += parseInt(inputVideo.style.left, 10);
          if (offsetX >= maxLeft) {
            offsetX = maxLeft;
          }
          if (offsetX <= maxLeft * -1) {
            offsetX = maxLeft * -1;
          }
        }

        if (inputVideo.style.top) {
          offsetY += parseInt(inputVideo.style.top, 10);
          if (offsetY >= maxTop) {
            offsetY = maxTop;
          }
          if (offsetY <= maxTop * -1) {
            offsetY = maxTop * -1;
          }
        }
        canvasDiv.style.cursor = 'pointer';
        moveVideoAndCanvas(offsetX, offsetY);
      }
    }

    function mouseUp(e) {
      e.stopPropagation();
      if (isDrawing === true) {
        drawCanvasLine(drawCtx, AstartX, AstartY, e.offsetX, e.offsetY);
        AstartX = 0;
        AstartY = 0;
        isDrawing = false;
        isDraging = false;

        // 繪製剩下的points
        if(prev !== pointStack.length &&　pointStack.length > prev){
          drawPoints(pointStack.slice(prev, pointStack.length), drawCtx);
        }

        // drawCtx.lineWidth = 3;
        // drawCtx.strokeStyle = 'black';
        // drawScreen.pushScreen();
        // drawCtx.clearRect(0, 0, canvasPaint.width, canvasPaint.height)
        // drawPoints(pointStack,drawCtx);
        // drawScreen.drawScreen(drawScreen.canvasStack[drawScreen.step])
        drawScreen.pushScreen();
        pointStack = [];
        prev = 0;
      }
      if (isDraging === true) {
        AstartX = 0;
        AstartY = 0;
        offsetX = 0;
        offsetY = 0;
        isDrawing = false;
        isDraging = false;
      }
      canvasDiv.style.cursor = '';
    }

    function mouseOut(e) {
      e.stopPropagation();
      if (isDrawing === true) {
        isDrawing = false;
        isDraging = false;
      }
      if (isDraging === true) {
        isDrawing = false;
        isDraging = false;
      }
      canvasDiv.style.cursor = '';
    }

    function drawPoints(points, ctx) {
      // draw a basic circle instead
      if (points.length < drawGap) {
        var b = points[0];
        ctx.beginPath();
        ctx.arc(b.x, b.y, ctx.lineWidth / 2, 0, Math.PI * 2, !0), ctx.closePath();
        return
      }
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      // draw a bunch of quadratics, using the average of two points as the control point
      let i;
      for (i = 1; i < points.length - 2; i++) {
        var c = (points[i].x + points[i + 1].x) / 2,
          d = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, c, d)
      }
      ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
      ctx.stroke();
    }

    function drawCanvasLine(drawLineCtx, x1, y1, x2, y2) {
      const canvasPoint = {
        X1: x1,
        X2: x2,
        Y1: y1,
        Y2: y2,
      };
      const ratio = getRatio();
      canvasPoint.X1 *= ratio;
      canvasPoint.X2 *= ratio;
      canvasPoint.Y1 *= ratio;
      canvasPoint.Y2 *= ratio;

      if (drawMode === 'brush') {

        // draw normal line
        // drawLineCtx.lineWidth = 6;
        // drawLineCtx.strokeStyle = 'black';
        // drawLineCtx.beginPath();
        // drawLineCtx.moveTo(canvasPoint.X1, canvasPoint.Y1);
        // drawLineCtx.lineTo(canvasPoint.X2, canvasPoint.Y2);
        // drawLineCtx.stroke();
        // drawLineCtx.closePath();

        pointStack.push({x: canvasPoint.X2, y: canvasPoint.Y2});
        let drawSmoothLine = () => {
          if (pointStack.length % drawGap === 0) {
            // drawLineCtx.lineWidth = 6;
            // drawLineCtx.strokeStyle = 'white';
            let currentEnd = pointStack.length;
            let currentStart = prev;
            if (prev !== 0) {
              currentStart -= 1;
            }
            // smooth line
            drawPoints(pointStack.slice(currentStart, currentEnd), drawLineCtx);
            // 會從上一個線段的倒數第2個點開始接續 drawGap-1
            // 會從上一個線段的倒數第1個點開始接續 drawGap
            prev += drawGap;
          }
        }
        drawSmoothLine();
      }
      if (drawMode === 'eraser') {
        drawLineCtx.save();
        drawLineCtx.beginPath();
        drawLineCtx.arc(canvasPoint.X1, canvasPoint.Y1, drawLineCtx.lineWidth * 1.3, 0, Math.PI * 2, false);
        drawLineCtx.arc(canvasPoint.X2, canvasPoint.Y2, drawLineCtx.lineWidth * 1.3, 0, Math.PI * 2, false);
        drawLineCtx.clip();
        drawLineCtx.clearRect(0, 0, drawLineCtx.canvas.width, drawLineCtx.canvas.height)
        drawLineCtx.restore();
        // drawLineCtx.clearRect(canvasPoint.X1 - lineWidth, canvasPoint.Y1 - lineWidth, 20 * 1.5, 20 * 1.5)
        // drawLineCtx.clearRect(canvasPoint.X2 - lineWidth, canvasPoint.Y2 - lineWidth, 20 * 1.5, 20 * 1.5)
      }
    }

    function moveVideoAndCanvas(offsetX, offsetY) {
      inputVideo.style.left = `${offsetX}px`;
      inputVideo.style.top = `${offsetY}px`;
      canvasPaint.style.left = `${offsetX}px`;
      canvasPaint.style.top = `${offsetY}px`;
    }

    function getRatio() {
      let ratio = canvasPaint.width / parseInt(canvasPaint.getBoundingClientRect().width, 10);
      ratio *= zoomRatio;
      return ratio;
    }

    canvasDiv.onmousedown = null;
    canvasDiv.onmousemove = null;
    canvasDiv.onmouseup = null;
    canvasDiv.onmouseout = null;

    canvasDiv.onmousedown = (e) => {
      mouseDown(e);
    };
    canvasDiv.onmousemove = (e) => {
      mouseMove(e);
    };
    canvasDiv.onmouseup = (e) => {
      mouseUp(e);
    };
    canvasDiv.onmouseout = (e) => {
      mouseOut(e);
    };

    clearCanvas.onclick = () => {
      drawScreen.init()
      // drawCtx.clearRect(0, 0, canvasPaint.width, canvasPaint.height);
    };
  }

  /**
   * zoom in and out action set inputvideo and canvasPaint element top left scale
   */
  function zoomSetTopLeftScale(left, top) {
    inputVideo.style.left = `${left}px`;
    inputVideo.style.top = `${top}px`;
    canvasPaint.style.left = `${left}px`;
    canvasPaint.style.top = `${top}px`;
    inputVideo.style.transform = `scale(${zoomRatio})`;
    canvasPaint.style.transform = `scale(${zoomRatio})`;
  }

  /**
   * reset inputvideo and canvasPaint element top left scale
   */
  function resetTopLeftScale() {
    zoomRatio = 1.0;
    zoomCounter = 0;
    inputVideo.style.top = `${0}px`;
    inputVideo.style.left = `${0}px`;
    canvasPaint.style.top = `${0}px`;
    canvasPaint.style.left = `${0}px`;
    inputVideo.style.transform = `scale(${zoomRatio})`;
    canvasPaint.style.transform = `scale(${zoomRatio})`;
  }

  function zoomIn() {
    if (zoomRatio < 2.5) {
      zoomRatio += 0.1;

      const currentLeft = parseFloat(inputVideo.style.left);
      const newLeft = ((currentLeft * 1) / zoomCounter) + currentLeft;
      const currentTop = parseFloat(inputVideo.style.top);
      const newTop = ((currentTop * 1) / zoomCounter) + currentTop;

      // set inputVideo and canvasPaint offset
      zoomSetTopLeftScale(newLeft, newTop);
      zoomCounter += 1;
    }
  }

  zoomInBtn.onclick = () => {
    zoomIn();
  };

  function zoomOut() {
    if (zoomRatio > 1.0) {
      zoomRatio -= 0.1;

      const currentLeft = parseFloat(inputVideo.style.left);
      const newLeft = ((currentLeft * -1) / zoomCounter) + currentLeft;
      const currentTop = parseFloat(inputVideo.style.top);
      const newTop = ((currentTop * -1) / zoomCounter) + currentTop;

      // set inputVideo and canvasPaint offset
      zoomSetTopLeftScale(newLeft, newTop, zoomRatio);
      zoomCounter -= 1;

      if (zoomRatio === 1) {
        resetTopLeftScale();
      }
    }
  }

  zoomOutBtn.onclick = () => {
    zoomOut();
  };

  mouseActionChange.onclick = () => {
    if (mouseActionChange.dataset.moveevent === '1') {
      // move
      // myMouseAction.mouseHoldLeftButton = 'isDrawing'
      mouseActionChange.innerHTML = 'DrawType';
      mouseActionChange.dataset.moveevent = '0';
    } else {
      // draw
      // myMouseAction.mouseHoldLeftButton = 'isDraging'
      mouseActionChange.innerHTML = 'MoveType';
      mouseActionChange.dataset.moveevent = '1';
    }
  };

  function changeCamera() {
    const id = this.options[this.selectedIndex].value;
    const name = this.options[this.selectedIndex].text;
    // eslint-disable-next-line no-console
    getUserMedia(id, name).catch((err) => {
      console.log(err);
    });
  }

  selectCamera_1.onchange = changeCamera;

  recoderPaintCheck.onchange = () => {
    mergeStream(inputVideo.srcObject);
  };

  colorPicker.onchange = () => {
    setBrushStyle();
  };

  lineSize.onchange = () => {
    setBrushStyle();
  };

  drawStates.onclick = () => {
    if (drawStates.checked) {
      drawMode = 'eraser';
    } else {
      drawMode = 'brush';
    }
  };

  undoBtn.onclick = () => {
    drawScreen.undoScreen();
  };

  redoBtn.onclick = () => {
    drawScreen.redoScreeb();
  };

  $('#colorPicker').spectrum({
    type: "color",
    showPalette: "false",
    showPaletteOnly: "true",
    togglePaletteOnly: "true",
    hideAfterPaletteSelect: "true",
    showInput: "true",
    color: "#2894FF",
    // palette: [
    //     ["red", "Blue", "Yellow"],
    //     ["black", "green", "gray","pink"]
    // ]
  });

}

/* eslint-disable no-use-before-define */
/* eslint-disable new-cap */
/* eslint-disable no-tabs */
/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */