window.addEventListener('load', onload)

function onload() {

    const aspectRatio_16_9 = 1.77778
    const aspectRatio_4_3 = 1.33334
    var currentRatio = aspectRatio_16_9
    var currentWidth = null, currentHeight = null

    var canvasDiv = document.getElementById("canvasDiv")
    var recorderDot = document.getElementById("recorderDot")

    var inputVideo = document.getElementById("inputVideo")
    var secondVideo = document.getElementById("secondVideo")
    var mainDiv = document.getElementById("main")
    var canvasPaint = document.getElementById("canvasPaint")
    var zoomIn = document.getElementById("ZoomIn")
    var zoomOut = document.getElementById("ZoomOut")
    var move_or_draw = document.getElementById("MoveOrDraw")
    var playVideo = document.getElementById("playVideo")
    var startRecorder = document.getElementById("startRecorder")
    var stopRecorder = document.getElementById("stopRecorder")
    var secondCamera = document.getElementById("secondCamera")
    var selectCamera_1 = document.getElementById("selectCamera_1")
    var selectCamera_2 = document.getElementById("selectCamera_2")

    var zoomRatio = 1.0

    var size = { width: 1920, height: 1080 }

    var reszieTimeOutEvent = null

    window.addEventListener("resize", function () {

        setDisplaySize(currentRatio)

        if (reszieTimeOutEvent) clearTimeout(reszieTimeOutEvent)

        reszieTimeOutEvent = setTimeout(() => {
            registerMouseEvent()
            console.log('resizeEnd')
        }, 1500)

    })

    initialVideo()

    function fract(num) {
        return parseFloat((num - Math.trunc(num)).toFixed(10))
    }

    function setDisplaySize(aspectRatio) {

        let main = mainDiv;
        let canvasParentWidth = main.getBoundingClientRect().width;
        let canvasParentHeight = main.getBoundingClientRect().height;

        let ratio = parseFloat((canvasParentWidth / canvasParentHeight).toFixed(5));

        // full height width follow ratio
        if (ratio > aspectRatio) {
            canvasDiv.style.height = canvasParentHeight + 'px';
            canvasDiv.style.width = canvasDiv.getBoundingClientRect().height * aspectRatio + 'px';
        }
        // full width height follow ratio
        else if (ratio < aspectRatio) {
            canvasDiv.style.width = canvasParentWidth + 'px';
            canvasDiv.style.height = canvasDiv.getBoundingClientRect().width / aspectRatio + 'px';
        }
        // width == height
        else if (ratio === aspectRatio) {
            canvasDiv.style.height = canvasParentHeight + 'px';
            canvasDiv.style.width = canvasParentWidth + 'px';
        }

        canvasPaint.style.width = canvasDiv.getBoundingClientRect().width + 'px'
        canvasPaint.style.height = canvasDiv.getBoundingClientRect().height + 'px'

        // console.log('----------------------------------')
        // console.log('mainEle', main.getBoundingClientRect().width, main.getBoundingClientRect().height)
        // console.log('canvasEle', canvasDiv.getBoundingClientRect().width, canvasDiv.getBoundingClientRect().height)
        // console.log('canvasStyle', canvasDiv.style.width, canvasDiv.style.height)
        // console.log('----------------------------------')
    }

    function initialVideo() {

        let fristInit = true
        let currentStreamArray = []

        async function getDeviceList() {

            let devices = await navigator.mediaDevices.enumerateDevices()
            let videoDevices = [];

            console.log(devices)
            devices.forEach(function (device) {
                if (device.kind == 'videoinput') {
                    let tempOption = document.createElement('option')
                    tempOption.text = device.label
                    tempOption.value = device.deviceId
                    selectCamera_1.appendChild(tempOption)
                    selectCamera_2.appendChild(tempOption.cloneNode(true))
                    videoDevices.push(device)
                }
            });
            return videoDevices

        }

        async function displayVideo() {

            let constraints = {
                audio: true,
                video: {}
            }

            // get camera devices list
            let devices = await getDeviceList()

            // device name is null
            if (devices[0].label == '') {
                constraints = {
                    audio: true,
                    video: true
                }
            }

            // device is OKIOCAM
            if (devices[0].label.split(' ')[0] == 'OKIOCAM') {
                constraints.video.width = 1920
                constraints.video.height = 1080
                constraints.video.deviceId = devices[0].deviceId
                constraints.video.frameRate = {
                    max: 30,
                    ideal: 30,
                    min: 24
                }
            }

            try {
                displayCamera_1(constraints)
            } catch (error) {
                console.log(error)
            }

        }

        async function displayCamera_1(constraints) {

            // get media stream
            const videoStream = await navigator.mediaDevices.getUserMedia(constraints)
            const videoStreamWidth = videoStream.getVideoTracks()[0].getSettings().width
            const videoStreamHeight = videoStream.getVideoTracks()[0].getSettings().height
            const videoStreamRatio = videoStream.getVideoTracks()[0].getSettings().aspectRatio.toFixed(5)

            canvasPaint.width = videoStreamWidth
            canvasPaint.height = videoStreamHeight

            if (videoStreamRatio === '1.33333')
                currentRatio = aspectRatio_4_3

            if (videoStreamRatio === '1.77778')
                currentRatio = aspectRatio_16_9

            // registerMouseEvent
            registerMouseEvent()

            // set video and canvas display
            setDisplaySize(currentRatio)

            // get canvas stream
            // const canvasStream = canvasPaint.captureStream(30)

            let constraints2 = {
                audio:false,
                video:{
                    deviceId : '5dcd8b0ee625a9ee2d17f00b5a4527e16ef43938a1959dcec7a6e1c9e21cdbb4'
                }
            }
            const secondStream = await navigator.mediaDevices.getUserMedia(constraints2)

            handleStream(videoStream, 'video')

            mixMediaStream([videoStream, secondStream], videoStreamWidth, videoStreamHeight)
        }

        async function displayCamera_2(constraints) {

        }

        function handleRecorder(mediaStream) {

            let chunks = []
            let canvasRecorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm;codecs=VP8' })

            canvasRecorder.ondataavailable = function (e) {

                const blob = new Blob([e.data], { 'type': 'video/webm' })

                chunks.push(blob)
            }

            canvasRecorder.onstop = function (e) {

                recorderDot.classList.remove('dot')

                let totalVideo = new Blob(chunks, { 'type': 'video/webm' })

                console.log(totalVideo)
                console.log(URL.createObjectURL(totalVideo))

            }

            startRecorder.onclick = () => {
                console.log('start')
                recorderDot.classList.add('dot')
                canvasRecorder.start(1000)
            }

            stopRecorder.onclick = () => {

                console.log('stop')
                canvasRecorder.stop()
            }

        }

        function handleStream(mediaStream, type) {

            if (type === 'video') {

                if (inputVideo.srcObject) {
                    const stream = inputVideo.srcObject;
                    const tracks = stream.getTracks();
                    tracks.forEach(function (track) {
                        track.stop();
                    });
                    inputVideo.srcObject = null;
                }

                inputVideo.srcObject = mediaStream;
                inputVideo.onloadedmetadata = function (e) {
                    inputVideo.play();
                };

            }

        }

        function mixMediaStream(streamArray, width, height) {

            let mixStreamVideo = document.getElementById("mixStreamVideo")

            let counter = 1;

            

            streamArray[0].fullcanvas = true;
            streamArray[0].width = width
            streamArray[0].height = height
            streamArray[0].top = 0
            streamArray[0].left = 0
            
            streamArray[1].fullcanvas = false;
            streamArray[1].width = width / 1.55
            streamArray[1].height = height / 1.55;
            streamArray[1].top = height * 0.04
            streamArray[1].left = width * 0.04


            const mixer = new MultiStreamsMixer([streamArray[0], streamArray[1]]);

            mixer.frameInterval = 30;
            mixer.startDrawingFrames();

            const mixStream = mixer.getMixedStream()

            if (mixStreamVideo.srcObject) {
                const stream = mixStreamVideo.srcObject;
                const tracks = stream.getTracks();
                tracks.forEach(function (track) {
                    track.stop();
                });
                mixStreamVideo.srcObject = null;
            }

            mixStreamVideo.srcObject = mixStream;
            mixStreamVideo.onloadedmetadata = function (e) {
                mixStreamVideo.play();
            };

            document.getElementById("switchCamera").onclick = function () {
                
                mixer.resetVideoStreams()

                if (counter % 2 == 1) {
                    streamArray[1].fullcanvas = true;
                    streamArray[1].width = width
                    streamArray[1].height = height
                    streamArray[1].top = 0
                    streamArray[1].left = 0

                    streamArray[0].fullcanvas = false;
                    streamArray[0].width = width / 1.55
                    streamArray[0].height = height / 1.55;
                    streamArray[0].top = height * 0.04
                    streamArray[0].left = width * 0.04
                }

                if (counter % 2 == 0) {
                    streamArray[0].fullcanvas = true;
                    streamArray[0].width = width
                    streamArray[0].height = height
                    streamArray[0].top = 0
                    streamArray[0].left = 0

                    streamArray[1].fullcanvas = false;
                    streamArray[1].width = width / 1.55
                    streamArray[1].height = height / 1.55;
                    streamArray[1].top = height * 0.04
                    streamArray[1].left = width * 0.04
                }


                // mixer.resetVideoStreams([streamArray[0], streamArray[1]])

                counter += 1;
            }

            handleRecorder(mixStream)
        }

        displayVideo()

        secondCamera.onclick = function () {

            let camera2Div = document.getElementById('camera2Div')

            if (camera2Div.style.display == 'none') {
                camera2Div.style.display = 'inline-block'
            } else {
                camera2Div.style.display = 'none'
            }
        }

        selectCamera_1.onchange = function () {
        }

        selectCamera_2.onchange = function () {
        }

    }

    function registerMouseEvent() {

        reSetTopLeftScale();

        let drawCtx = canvasPaint.getContext('2d');
        drawCtx.strokeStyle = 'red';
        drawCtx.lineWidth = 5;
        var rectWidth = canvasPaint.width;
        var rectHeight = canvasPaint.height;

        drawCtx.beginPath();
		drawCtx.rect(0,0,rectWidth,rectHeight);
		drawCtx.stroke();
		drawCtx.closePath();				
        drawCtx.strokeRect(0,0,rectWidth,rectHeight);
        
        // drawCtx.beginPath();
        // drawCtx.moveTo(10, 10);
        // drawCtx.lineTo(10, rectHeight - 10);
        // drawCtx.moveTo(10, rectHeight - 10);
        // drawCtx.lineTo(rectWidth - 10, rectHeight - 10);
        // drawCtx.moveTo(rectWidth - 10, rectHeight - 10);
        // drawCtx.lineTo(rectWidth - 10, 10);
        // drawCtx.moveTo(rectWidth - 10, 10);
        // drawCtx.lineTo(10, 10);
        // drawCtx.stroke();
        // drawCtx.closePath();

        // When true, moving the mouse draws on the canvas or drag video and canvas
        let isDrawing = false, isDraging = false;
        let AstartX = 0, AstartY = 0;
        let offsetX = 0, offsetY = 0;
        let maxLeft = 0, maxTop = 0;

        function mouseDown(e) {
            e.stopPropagation()
            canvasDiv.style.cursor = 'pointer'
            // move video and canvas
            if (move_or_draw.dataset.moveevent === '0' && zoomRatio > 1.0) {

                maxLeft = (inputVideo.getBoundingClientRect().width - canvasDiv.getBoundingClientRect().width) / 2
                maxTop = (inputVideo.getBoundingClientRect().height - canvasDiv.getBoundingClientRect().height) / 2

                AstartX = e.offsetX;
                AstartY = e.offsetY;
                isDraging = true;
            }

            // draw canvas to video
            if (move_or_draw.dataset.moveevent === '1') {
                AstartX = e.offsetX;
                AstartY = e.offsetY;
                isDrawing = true;
            }

        }

        function mouseMove(e) {
            e.stopPropagation()
            if (isDrawing === true) {
                drawCanvasLine(drawCtx, AstartX, AstartY, e.offsetX, e.offsetY);
                AstartX = e.offsetX;
                AstartY = e.offsetY;
            }

            if (isDraging === true) {

                offsetX = e.offsetX - AstartX;
                offsetY = e.offsetY - AstartY;

                if (inputVideo.style.left) {
                    offsetX = offsetX + parseInt(inputVideo.style.left)

                    if (offsetX >= maxLeft)
                        offsetX = maxLeft

                    if (offsetX <= maxLeft * -1)
                        offsetX = maxLeft * -1
                }

                if (inputVideo.style.top) {
                    offsetY = offsetY + parseInt(inputVideo.style.top)

                    if (offsetY >= maxTop)
                        offsetY = maxTop

                    if (offsetY <= maxTop * -1)
                        offsetY = maxTop * -1
                }

                moveVideoAndCanvas(offsetX, offsetY)

            }

        }

        function mouseUp(e) {
            e.stopPropagation()
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
            e.stopPropagation()
            if (isDrawing === true) {
                isDrawing = false;
                isDraging = false;
            }

            if (isDraging === true) {
                isDrawing = false;
                isDraging = false;
            }

        }

        function drawCanvasLine(drawCtx, x1, y1, x2, y2) {

            let ratio = canvasPaint.width / parseInt(canvasPaint.getBoundingClientRect().width);
            ratio *= zoomRatio;

            x1 *= ratio;
            y1 *= ratio;
            x2 *= ratio;
            y2 *= ratio;

            drawCtx.beginPath();
            drawCtx.moveTo(x1, y1);
            drawCtx.lineTo(x2, y2);
            drawCtx.stroke();
            drawCtx.closePath();

        }

        function moveVideoAndCanvas(offsetX, offsetY) {

            inputVideo.style.left = offsetX + 'px'
            inputVideo.style.top = offsetY + 'px'
            canvasPaint.style.left = offsetX + 'px'
            canvasPaint.style.top = offsetY + 'px'

        }

        canvasDiv.onmousedown = null;
        canvasDiv.onmousemove = null;
        canvasDiv.onmouseup = null;
        canvasDiv.onmouseout = null;

        canvasDiv.onmousedown = mouseDown;
        canvasDiv.onmousemove = mouseMove;
        canvasDiv.onmouseup = mouseUp;
        canvasDiv.onmouseout = mouseOut;

    }

    /**
    * in zoom action set inputvideo and canvasPaint element top left scale
    */
    function zoomSetTopLeftScale(newLeft, newTop, zoomRatio) {

        inputVideo.style.left = newLeft + 'px';
        inputVideo.style.top = newTop + 'px';
        inputVideo.style.transform = "scale(" + zoomRatio + ")";
        canvasPaint.style.left = newLeft + 'px';
        canvasPaint.style.top = newTop + 'px';
        canvasPaint.style.transform = "scale(" + zoomRatio + ")";

    }

    /**
     * reset inputvideo and canvasPaint element top left scale
     */
    function reSetTopLeftScale() {
        zoomRatio = 1.0;
        inputVideo.style.top = "0px";
        inputVideo.style.left = "0px";
        canvasPaint.style.top = "0px";
        canvasPaint.style.left = "0px";
        inputVideo.style.transform = "scale(" + zoomRatio + ")";
        canvasPaint.style.transform = "scale(" + zoomRatio + ")";
    }

    zoomIn.onclick = () => {

        let ratio = fract(zoomRatio) * 10

        if (zoomRatio < 1.9) {

            zoomRatio += 0.1;
            let currentLeft = parseFloat(inputVideo.style.left)
            let newLeft = (currentLeft * 1 / ratio) + currentLeft
            let currentTop = parseFloat(inputVideo.style.top)
            let newTop = (currentTop * 1 / ratio) + currentTop

            // set inputVideo and canvasPaint offset
            zoomSetTopLeftScale(newLeft, newTop, zoomRatio)
        }

    }

    zoomOut.onclick = () => {

        let ratio = fract(zoomRatio) * 10

        if (zoomRatio > 1.0)
            zoomRatio -= 0.1;

        if (zoomRatio == 1) {

            reSetTopLeftScale()

        }
        else {

            let currentLeft = parseFloat(inputVideo.style.left)
            let newLeft = (currentLeft * -1 / ratio) + currentLeft

            let currentTop = parseFloat(inputVideo.style.top)
            let newTop = (currentTop * -1 / ratio) + currentTop

            // set inputVideo and canvasPaint
            zoomSetTopLeftScale(newLeft, newTop, zoomRatio)

        }

    }

    move_or_draw.onclick = () => {

        if (move_or_draw.dataset.moveevent === '1') {
            move_or_draw.innerHTML = 'DrawType';
            move_or_draw.dataset.moveevent = '0';
        }
        else {
            move_or_draw.innerHTML = 'MoveType';
            move_or_draw.dataset.moveevent = '1'
        }

    }

}