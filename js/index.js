window.addEventListener('load', onload)

function onload() {

    const aspectRatio_16_9 = 1.77778
    const aspectRatio_4_3 = 1.33334
    var currentRatio = aspectRatio_16_9
    var currentWidth = null, currentHeight = null

    var canvasDiv = document.getElementById("canvasDiv")
    var inputVideo = document.getElementById("inputVideo")
    var mainDiv = document.getElementById("main")
    var canvasPaint = document.getElementById("canvasPaint")
    var zoomIn = document.getElementById("ZoomIn")
    var zoomOut = document.getElementById("ZoomOut")
    var move_or_draw = document.getElementById("MoveOrDraw")
    var playVideo = document.getElementById("playVideo")
    var startRecorder = document.getElementById("startRecorder")
    var stopRecorder = document.getElementById("stopRecorder")
    var selectCamera_1 = document.getElementById("selectCamera_1")

    var zoomRatio = 1.0
    var streamArray = []
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

    getUserMedia()

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

    /**
     * get video device
     */
    async function getDeviceList() {
        let devices = await navigator.mediaDevices.enumerateDevices()
        let videoDevices = [];
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

    /**
     * get video device display camera deivice
     */
    async function getUserMedia(deviceId, deiveName) {

        let constraints = {
            audio: false,
            video: {}
        }

        let devices = []

        let set_okiocam_constraints = function (deviceId) {
            constraints.video.width = 1920
            constraints.video.height = 1080
            constraints.video.deviceId = deviceId
            constraints.video.frameRate = {
                max: 30,
                ideal: 30,
                min: 24
            }
        }

        let set_othercam_constraints = function (deviceId) {
            constraints.video.deviceId = deviceId;
        }

        if (deiveName && deiveName.split(' ')[0] == 'OKIOCAM' && deviceId)
            set_okiocam_constraints(deviceId)

        if (deiveName && deiveName.split(' ')[0] != 'OKIOCAM' && deviceId)
            set_othercam_constraints(deviceId)

        // frist init video
        if (!deviceId && !deiveName) {
            devices = await getDeviceList()
            // device is OKIOCAM
            if (devices[0].label.split(' ')[0] == 'OKIOCAM')
                set_okiocam_constraints(devices[0].deviceId)
            else
                set_othercam_constraints(devices[0].deviceId)
        }

        let currentDevice = deiveName || devices[0].label

        try {

            const videoStream = await navigator.mediaDevices.getUserMedia(constraints)
            // frist access camera is reload
            if (devices.length && devices[0].label == '')
                location.reload()

            const videoStreamWidth = videoStream.getVideoTracks()[0].getSettings().width
            const videoStreamHeight = videoStream.getVideoTracks()[0].getSettings().height
            const videoStreamRatio = videoStream.getVideoTracks()[0].getSettings().aspectRatio.toFixed(5)

            canvasPaint.width = videoStreamWidth
            canvasPaint.height = videoStreamHeight

            if (videoStreamRatio === '1.33333')
                currentRatio = aspectRatio_4_3

            if (videoStreamRatio === '1.77778')
                currentRatio = aspectRatio_16_9

            setDisplaySize(currentRatio)
            handleStream(inputVideo, videoStream)
            registerMouseEvent()

        } catch (error) {
            console.log(error)
        }

    }

    /**
     * display video stream in video element
     */
    function handleStream(videoElement, mediaStream) {

        if (videoElement.srcObject) {
            const stream = videoElement.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(function (track) {
                track.stop();
            });
            videoElement.srcObject = null;
        }

        videoElement.srcObject = mediaStream;
        videoElement.onloadedmetadata = function (e) {
            videoElement.play();
        };
    }


    function initialVideo() {

        // async function getUserMedia() {

        //     let constraints = {
        //         audio: true,
        //         video: {}
        //     }

        //     // get camera devices list
        //     let devices = await getDeviceList()

        //     // device name is null
        //     if (devices[0].label == '') {
        //         constraints = {
        //             audio: true,
        //             video: true
        //         }
        //     }

        //     // device name is OKIOCAM
        //     if (devices[0].label.split(' ')[0] == 'OKIOCAM') {
        //         constraints.video.width = 1920
        //         constraints.video.height = 1080
        //         constraints.video.deviceId = devices[0].deviceId
        //         constraints.video.frameRate = {
        //             max: 30,
        //             ideal: 30,
        //             min: 24
        //         }
        //     }

        //     // get media stream
        //     const videoStream = await navigator.mediaDevices.getUserMedia(constraints)
        //     const videoStreamWidth = videoStream.getVideoTracks()[0].getSettings().width
        //     const videoStreamHeight = videoStream.getVideoTracks()[0].getSettings().height
        //     const videoStreamRatio = (videoStreamWidth / videoStreamHeight).toFixed(5)

        //     canvasPaint.width = videoStreamWidth
        //     canvasPaint.height = videoStreamHeight

        //     if (videoStreamRatio === '1.33333')
        //         currentRatio = aspectRatio_4_3

        //     if (videoStreamRatio === '1.77778')
        //         currentRatio = aspectRatio_16_9

        //     registerMouseEvent()

        //     // set video and canvas display
        //     setDisplaySize(currentRatio)

        //     // get canvas stream
        //     const canvasStream = canvasPaint.captureStream(30)

        //     handleStream(videoStream, 'video')

        //     mixMediaStream([videoStream, canvasStream], videoStreamWidth, videoStreamHeight)

        // }

        // function handleRecorder(mediaStream) {

        //     let chunks = []
        //     let canvasRecorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm;codecs=VP9' })

        //     canvasRecorder.ondataavailable = function (e) {

        //         const blob = new Blob([e.data], { 'type': 'video/webm' })

        //         chunks.push(blob)
        //     }

        //     canvasRecorder.onstop = function (e) {

        //         let totalVideo = new Blob(chunks, { 'type': 'video/webm' })

        //         console.log(totalVideo)
        //         console.log(URL.createObjectURL(totalVideo))

        //     }

        //     startRecorder.onclick = () => {
        //         console.log('start')
        //         canvasRecorder.start(1000)
        //     }

        //     stopRecorder.onclick = () => {

        //         console.log('stop')
        //         canvasRecorder.stop()
        //     }

        // }

        // function handleStream(mediaStream, type) {

        //     if (type === 'video') {

        //         if (inputVideo.srcObject) {
        //             const stream = inputVideo.srcObject;
        //             const tracks = stream.getTracks();
        //             tracks.forEach(function (track) {
        //                 track.stop();
        //             });
        //             inputVideo.srcObject = null;
        //         }

        //         inputVideo.srcObject = mediaStream;
        //         inputVideo.onloadedmetadata = function (e) {
        //             inputVideo.play();
        //         };

        //     }

        // }

        // function mixMediaStream(streamArray, width, height) {

        //     // streamArray[0].fullcanvas = true;
        //     streamArray[0].width = width
        //     streamArray[0].height = height

        //     streamArray[1].width = width
        //     streamArray[1].height = height;

        //     streamArray[0].top = 150;
        //     streamArray[0].left = 150;

        //     const mixer = new MultiStreamsMixer([streamArray[0]]);

        //     mixer.frameInterval = 30;
        //     mixer.startDrawingFrames();

        //     const mixStream = mixer.getMixedStream()

        //     handleRecorder(mixStream)

        // }

        // getUserMedia()

    }

    function registerMouseEvent() {

        reSetTopLeftScale();

        let drawCtx = canvasPaint.getContext('2d');
        drawCtx.strokeStyle = 'red';
        drawCtx.lineWidth = 5;

        console.log(drawCtx.strokeStyle)

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

    selectCamera_1.onchange = function () {
        getUserMedia(this.options[this.selectedIndex].value, this.options[this.selectedIndex].text)
    }


}