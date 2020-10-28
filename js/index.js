/* eslint-disable no-undef */
/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
/* eslint-disable max-len */
// eslint-disable-next-line no-use-before-define

import { whellEvent } from "./wheelzoom.js"

window.addEventListener('load', onload);

function onload() {

  const aspectRatio_16_9 = 1.77778;
  const aspectRatio_4_3 = 1.33334;
  let currentRatio = aspectRatio_16_9;

  const canvasDiv = document.getElementById('canvasDiv');
  const inputVideo = document.getElementById('inputVideo');
  const testImage = document.getElementById('testimg')

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
  let zoomRatio = 1.0;
  let zoomCounter = 0;
  let reszieTimeOutEvent = null;

  var myWheel = new whellEvent(canvasDiv, inputVideo)

  myWheel.containerElement.onwheel = function (e) {
    myWheel.mouseWheel(e)
  }

  window.addEventListener('resize', () => {
    setDisplaySize(currentRatio);
    myWheel.reset();

    if (reszieTimeOutEvent) clearTimeout(reszieTimeOutEvent);

    reszieTimeOutEvent = setTimeout(() => {
      registerMouseEvent();
      console.log('resizeEnd');
    }, 1500);

  });

  getUserMedia().catch((err) => { console.log(err); });

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
      constraints.video.width = { min: 1280, ideal: 1920, max: 1920 };
      constraints.video.height = { min: 720, ideal: 1080, max: 1080 };
      constraints.video.frameRate = { min: 24, ideal: 30, max: 30 };
    };

    // other deicve webcam parms
    const setOthercamConstraints = (id) => {
      constraints.video.deviceId = id;
      constraints.video.width = { min: 640, ideal: 1920, max: 1920 };
      constraints.video.height = { min: 360, ideal: 1080, max: 1080 };
      constraints.video.frameRate = { ideal: 30, max: 30 };
      constraints.video.aspectRatio = 1.777777778;
    };

    // select change device
    if (deiveName) {
      if (deiveName.split(' ')[0] === 'OKIOCAM' && deviceId) { setOkiocamConstraints(deviceId); }

      if (deiveName.split(' ')[0] !== 'OKIOCAM' && deviceId) { setOthercamConstraints(deviceId); }
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
    if (devices.length && devices[0].label === '') { location.reload(); }

    const videoStreamWidth = videoStream.getVideoTracks()[0].getSettings().width;
    const videoStreamHeight = videoStream.getVideoTracks()[0].getSettings().height;
    const videoStreamRatio = videoStream.getVideoTracks()[0].getSettings().aspectRatio.toFixed(5);

    canvasPaint.width = videoStreamWidth;
    canvasPaint.height = videoStreamHeight;

    if (videoStreamRatio === '1.33333') { currentRatio = aspectRatio_4_3; }

    if (videoStreamRatio === '1.77778') { currentRatio = aspectRatio_16_9; }

    setDisplaySize(currentRatio);
    handleStream(inputVideo, videoStream);
    mergeStream(videoStream);
    registerMouseEvent();
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
      console.log('canvasStream');
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

      const mixer = new MultiStreamsMixer([mediaStream, canvasStream]);
      mixer.frameInterval = 30;
      mixer.startDrawingFrames();

      const mixStream = mixer.getMixedStream();
      // handleRecorder(mixStream);
    } else {
      handleRecorder(mediaStream);
    }
  }

  function handleRecorder(mediaStream) {
    let chunks = [];
    const canvasRecorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm;codecs=VP8' });

    canvasRecorder.ondataavailable = (e) => {
      const blob = new Blob([e.data], { type: 'video/webm' });

      chunks.push(blob);
    };

    canvasRecorder.onstop = () => {
      console.log('stop');
      recorderDot.classList.remove('dot');
      recoderPaintCheck.disabled = false;

      const totalVideo = new Blob(chunks, { type: 'video/webm' });

      console.log(totalVideo);

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

  function registerMouseEvent() {
    resetTopLeftScale();

    const drawCtx = canvasPaint.getContext('2d');
    drawCtx.strokeStyle = 'red';
    drawCtx.lineWidth = 6;
    drawCtx.lineJoin = 'round';
    drawCtx.lineCap = 'round';

    // When true, moving the mouse draws on the canvas or drag video and canvas
    let isDrawing = false;
    let isDraging = false;
    let AstartX = 0;
    let AstartY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let maxLeft = 0;
    let maxTop = 0;

    function mouseDown(e) {
      e.stopPropagation();

      // move video and canvas
      if (mouseActionChange.dataset.moveevent === '0' && zoomRatio > 1.0) {

        maxLeft = ((canvasDiv.getBoundingClientRect().width * zoomRatio) - canvasDiv.getBoundingClientRect().width) / 2;

        maxTop = ((canvasDiv.getBoundingClientRect().height * zoomRatio) - canvasDiv.getBoundingClientRect().height) / 2;

        // maxLeft = (inputVideo.getBoundingClientRect().width - canvasDiv.getBoundingClientRect().width) / 2;
        // maxTop = (inputVideo.getBoundingClientRect().height - canvasDiv.getBoundingClientRect().height) / 2;

        AstartX = e.offsetX;
        AstartY = e.offsetY;
        isDraging = true;
      }

      // draw canvas to video
      if (mouseActionChange.dataset.moveevent === '1') {
        AstartX = e.offsetX;
        AstartY = e.offsetY;
        isDrawing = true;
      }

      canvasDiv.style.cursor = 'pointer';
    }

    function mouseMove(e) {
      e.stopPropagation();
      if (isDrawing === true) {
        drawCanvasLine(drawCtx, AstartX, AstartY, e.offsetX, e.offsetY);
        AstartX = e.offsetX;
        AstartY = e.offsetY;
      }

      if (isDraging === true) {
        offsetX = e.offsetX - AstartX;
        offsetY = e.offsetY - AstartY;

        if (inputVideo.style.left) {
          offsetX += parseInt(inputVideo.style.left, 10);

          if (offsetX >= maxLeft) { offsetX = maxLeft; }

          if (offsetX <= maxLeft * -1) { offsetX = maxLeft * -1; }
        }

        if (inputVideo.style.top) {
          offsetY += parseInt(inputVideo.style.top, 10);

          if (offsetY >= maxTop) { offsetY = maxTop; }

          if (offsetY <= maxTop * -1) { offsetY = maxTop * -1; }
        }

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
      }

      if (isDraging === true) {
        AstartX = 0;
        AstartY = 0;
        offsetX = 0;
        offsetY = 0;
        isDrawing = false;
        isDraging = false;
      }
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

    // eslint-disable-next-line padded-blocks
    function drawCanvasLine(drawLineCtx, x1, y1, x2, y2) {

      const canvasPoint = {
        X1: x1,
        X2: x2,
        Y1: y1,
        Y2: y2,
      };

      let ratio = canvasPaint.width / parseInt(canvasPaint.getBoundingClientRect().width, 10);

      ratio *= zoomRatio;

      canvasPoint.X1 *= ratio;
      canvasPoint.X2 *= ratio;
      canvasPoint.Y1 *= ratio;
      canvasPoint.Y2 *= ratio;

      drawLineCtx.beginPath();
      drawLineCtx.moveTo(canvasPoint.X1, canvasPoint.Y1);
      drawLineCtx.lineTo(canvasPoint.X2, canvasPoint.Y2);
      drawLineCtx.stroke();
      drawLineCtx.closePath();
    }

    // eslint-disable-next-line no-shadow
    function moveVideoAndCanvas(offsetX, offsetY) {
      inputVideo.style.left = `${offsetX}px`;
      inputVideo.style.top = `${offsetY}px`;
      canvasPaint.style.left = `${offsetX}px`;
      canvasPaint.style.top = `${offsetY}px`;

      // testImage.style.left = `${offsetX}px`;
      // testImage.style.top = `${offsetY}px`;
    }

    canvasDiv.onmousedown = null;
    canvasDiv.onmousemove = null;
    canvasDiv.onmouseup = null;
    canvasDiv.onmouseout = null;

    canvasDiv.onmousedown = mouseDown;
    canvasDiv.onmousemove = mouseMove;
    canvasDiv.onmouseup = mouseUp;
    canvasDiv.onmouseout = mouseOut;

    clearCanvas.onclick = () => {
      drawCtx.clearRect(0, 0, canvasPaint.width, canvasPaint.height);
    };
  }

  /**
    * zoom in and out action set inputvideo and canvasPaint element top left scale
    *
    */
  function zoomSetTopLeftScale(left, top) {
    inputVideo.style.left = `${left}px`;
    inputVideo.style.top = `${top}px`;
    canvasPaint.style.left = `${left}px`;
    canvasPaint.style.top = `${top}px`;
    inputVideo.style.transform = `scale(${zoomRatio})`;
    canvasPaint.style.transform = `scale(${zoomRatio})`;

    // testImage.style.left = `${left}px`;
    // testImage.style.top = `${top}px`;
    // testImage.style.transform = `scale(${zoomRatio})`;
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

    // testImage.style.left = `${0}px`;
    // testImage.style.top = `${0}px`;
    // testImage.style.transform = `scale(${zoomRatio})`;

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
  zoomInBtn.onclick = () => { myWheel.zoom('In') };

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

      if (zoomRatio === 1) { resetTopLeftScale(); }
    }
  }
  zoomOutBtn.onclick = () => { myWheel.zoom('Out') };

  mouseActionChange.onclick = () => {
    if (mouseActionChange.dataset.moveevent === '1') {
      mouseActionChange.innerHTML = 'DrawType';
      mouseActionChange.dataset.moveevent = '0';
    } else {
      mouseActionChange.innerHTML = 'MoveType';
      mouseActionChange.dataset.moveevent = '1';
    }
  };

  function changeCamera() {
    getUserMedia(this.options[this.selectedIndex].value, this.options[this.selectedIndex].text).catch((err) => { console.log(err); });
  }

  selectCamera_1.onchange = changeCamera;

  recoderPaintCheck.onchange = () => {
    mergeStream(inputVideo.srcObject);
  };

}
