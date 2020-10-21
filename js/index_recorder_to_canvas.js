window.addEventListener('load', onload)

function onload() {

    const aspectRatio_16_9 = 1.77778
    const aspectRatio_4_3 = 1.33334

    var canvasDiv = document.getElementById("canvasDiv")
    var inputVideo = document.getElementById("inputVideo")
    var mainDiv = document.getElementById("main")
    var canvasPaint = document.getElementById("canvasPaint")
    var zoomIn = document.getElementById("ZoomIn")
    var zoomOut = document.getElementById("ZoomOut")
    var move_or_draw = document.getElementById("MoveOrDraw")
    var playVideo = document.getElementById("playVideo")
    var canvasStream = document.getElementById("canvasStream")
    var streamCtx = canvasStream.getContext("2d");
    var zoomRatio = 1.0;

    canvasPaint.width = 1920;
    canvasPaint.height = 1080;

    canvasStream.width = 1920;
    canvasStream.height = 1080;

    window.addEventListener("resize", function () {
        initCanvas()
        setCanvasStyleSize()
        // annotatorCanvas()
        // onMouseEventCalc()
        resetTopLeftScale()
    })

    initCanvas()
    setCanvasStyleSize()
    // annotatorCanvas()
    // 
    // initVideo()

    let totalLine = []

    function initializeVideo(type) {

        // get device list
        async function getCameraDeviceId() {
            let devices = await navigator.mediaDevices.enumerateDevices()
            let videoDevices = [];
            devices.forEach(function (device) {
                // console.log(device)
                if (device.kind == 'videoinput') {
                    videoDevices.push(device)
                }
            });
            return videoDevices
        }

        // access camera
        async function getUserMedia() {

            let constraints = {
                audio: true,
                video: {}
            }

            let devices = await getCameraDeviceId()

            if (devices[0].label == '') {
                constraints = {
                    audio: true,
                    video: true
                }
            }

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

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

            handleVideoStream(mediaStream)
        }

        // handleVideoStream
        function handleVideoStream(mediaStream) {

            console.log(mediaStream.getVideoTracks()[0].getSettings())

            let streamCtx = null, canvasVideo = null;

            canvasPaint.width = mediaStream.getVideoTracks()[0].getSettings().width;
            canvasPaint.height = mediaStream.getVideoTracks()[0].getSettings().height;
            let c = 100;
            function updateCanvas() {

                // streamCtx.clearRect(0, 0, canvasStream.width, canvasStream.height);

                // totalLine.forEach(ele => {
                //     streamCtx.beginPath();
                //     streamCtx.moveTo(ele.x1, ele.y1);
                //     streamCtx.lineTo(ele.x2, ele.y2);
                //     streamCtx.stroke();
                //     streamCtx.closePath();
                // })


                streamCtx.drawImage(canvasVideo, 0, 0, canvasPaint.width, canvasPaint.height, 0, 0, canvasPaint.width, canvasPaint.height);

                requestAnimationFrame(updateCanvas);
            }

            function readyToPlayVideo() {
                // let stream = canvasPaint.captureStream(30);
                // let inputVideo = document.getElementById('inputVideo')
                // inputVideo.srcObject = stream;
                // inputVideo.onloadedmetadata = function (e) {

                //     canvasPaint.style.display = "none"
                //     inputVideo.style.display = "block"
                //     inputVideo.play();

                //     // streamCtx.lineWidth = '4    '
                //     // document.getElementById("test").onclick = () => {


                //     // }
                // };
                streamCtx = canvasPaint.getContext('2d')
                onMouseEventCalc(streamCtx, canvasVideo)
                requestAnimationFrame(updateCanvas);
            }

            if (type == 'canvas') {

                canvasPaint.style.display = "block"
                inputVideo.style.display = "none"

                let videoToCanvas = function () {

                    canvasVideo = document.createElement('video')

                    if (canvasVideo.srcObject) {
                        const stream = canvasVideo.srcObject;
                        const tracks = stream.getTracks();
                        tracks.forEach(function (track) {
                            track.stop();
                        });
                        canvasVideo.srcObject = null;
                    }

                    canvasVideo.srcObject = mediaStream;
                    canvasVideo.onloadedmetadata = function (e) {
                        canvasVideo.play();
                    };

                    canvasVideo.oncanplay = function (e) {
                        readyToPlayVideo();
                    }

                }

                videoToCanvas()

            }

            if (type == 'video') {

                canvasPaint.style.display = "none"
                inputVideo.style.display = "block"

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

        getUserMedia()

    }

    initializeVideo('canvas')

    function fract(num) {

        return parseFloat((num - Math.trunc(num)).toFixed(10))
    }

    function initCanvas() {

        let aspectRatio = aspectRatio_16_9;
        let main = mainDiv;
        let canvasParentWidth = main.getBoundingClientRect().width;
        let canvasParentHeight = main.getBoundingClientRect().height;

        main.style.width = canvasParentWidth;
        main.style.height = canvasParentHeight;

        let ratio = parseFloat((canvasParentWidth / canvasParentHeight).toFixed(5));

        if (ratio > aspectRatio) {
            canvasDiv.style.height = canvasParentHeight + 'px';
            canvasDiv.style.width = canvasDiv.getBoundingClientRect().height * aspectRatio + 'px';
            // canvasDiv.style.height = canvasParentHeight + 'px';
            // canvasDiv.style.width = canvasParentHeight * aspectRatio + 'px';
        }
        else if (ratio < aspectRatio) {
            canvasDiv.style.width = canvasParentWidth + 'px';
            canvasDiv.style.height = canvasDiv.getBoundingClientRect().width / aspectRatio + 'px';
            // canvasDiv.style.height = canvasParentWidth / aspectRatio + 'px';
            // canvasDiv.style.width = canvasParentWidth + 'px';
        }
        else if (ratio === aspectRatio) {
            console.log('相等')
            canvasDiv.style.height = canvasParentHeight + 'px';
            canvasDiv.style.width = canvasParentWidth + 'px';
        }


    }

    function setCanvasStyleSize() {
        canvasPaint.style.width = canvasDiv.getBoundingClientRect().width + 'px'
        canvasPaint.style.height = canvasDiv.getBoundingClientRect().height + 'px'
    }

    function annotatorCanvas() {

        var drawCtx = canvasPaint.getContext('2d');
        drawCtx.strokeStyle = 'red';
        drawCtx.lineWidth = 5;

        // When true, moving the mouse draws on the canvas
        let isDrawing = false, isDraging = false;
        let AstartX = 0;
        let AstartY = 0;

        let moveElement = null;
        let startX = 0;
        let startY = 0;
        let offsetX = 0;
        let offsetY = 0;

        function down(e) {

            // move video and canvas
            if (move_or_draw.dataset.moveevent === '0' && zoomRatio > 1.0) {

                moveElement = e.target.nextElementSibling;
                console.log(moveElement.offsetX)

                isDraging = true;
            }

            // draw canvas to video
            if (move_or_draw.dataset.moveevent === '1') {

                AstartX = e.offsetX;
                AstartY = e.offsetY;
                isDrawing = true;
            }

        }

        function move(e) {

            if (isDrawing === true) {
                drawLine(drawCtx, AstartX, AstartY, e.offsetX, e.offsetY);
                AstartX = e.offsetX;
                AstartY = e.offsetY;
            }

            if (isDraging === true) {

                // move canvas and video element
                moveVideo(e, moveElement)

            }
        }

        function up(e) {
            if (isDrawing === true) {
                drawLine(drawCtx, AstartX, AstartY, e.offsetX, e.offsetY);
                AstartX = 0;
                AstartY = 0;
                isDrawing = false;
                isDraging = false;
            }
            if (isDraging === true) {

                isDrawing = false;
                isDraging = false;
            }
        }

        function out(e) {

            if (isDrawing === true) {
                isDrawing = false;
                isDraging = false;
            }

            if (isDraging === true) {
                isDrawing = false;
                isDraging = false;
            }

        }

        function removeListen() {
            canvasPaint.removeEventListener('mousedown', down, true);

            canvasPaint.removeEventListener('mousemove', move, true);

            canvasPaint.removeEventListener('mouseup', up, true);

            canvasPaint.removeEventListener('mouseout', out, true);
        }

        removeListen()

        canvasPaint.addEventListener('mousedown', down);

        canvasPaint.addEventListener('mousemove', move);

        canvasPaint.addEventListener('mouseup', up);

        canvasPaint.addEventListener('mouseout', out);

        canvasPaint.addEventListener('click', (e) => {
            // console.log('click');
            // console.log(e);
            // console.log(e.target)
            // console.log(e.target.nextElementSibling)
        });


        function drawLine(drawCtx, x1, y1, x2, y2) {

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

        function moveVideo() {





        }

    }

    function onMouseEventCalc() {

        resetTopLeftScale()

        let drawCtx = canvasPaint.getContext('2d');
        drawCtx.strokeStyle = 'red';
        drawCtx.lineWidth = 5;

        // When true, moving the mouse draws on the canvas or drag video and canvas
        let isDrawing = false, isDraging = false;
        let AstartX = 0, AstartY = 0;
        let offsetX = 0, offsetY = 0;
        let maxLeft = 0, maxTop = 0;

        function mouseDown(e) {


            canvasDiv.style.cursor = 'pointer'
            // move video and canvas
            if (move_or_draw.dataset.moveevent === '0' && zoomRatio > 1.0) {


                if (inputVideo.getBoundingClientRect().width == 0) {
                    maxLeft = (canvasPaint.getBoundingClientRect().width - canvasDiv.getBoundingClientRect().width) / 2
                    maxTop = (canvasPaint.getBoundingClientRect().height - canvasDiv.getBoundingClientRect().height) / 2
                } else {
                    maxLeft = (inputVideo.getBoundingClientRect().width - canvasDiv.getBoundingClientRect().width) / 2
                    maxTop = (inputVideo.getBoundingClientRect().height - canvasDiv.getBoundingClientRect().height) / 2
                }



                AstartX = e.offsetX;

                AstartY = e.offsetY;
                isDraging = true;
            }

            // draw canvas to video
            if (move_or_draw.dataset.moveevent === '1') {

                console.log(e.offsetX)

                AstartX = e.offsetX;
                AstartY = e.offsetY;
                isDrawing = true;
            }

        }

        function mouseMove(e) {

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

            console.log(canvasPaint.width, (parseInt(canvasPaint.style.width)) * zoomRatio)

            let ratio = canvasPaint.width / (parseInt(canvasPaint.getBoundingClientRect().width))
            ratio *= zoomRatio;

            x1 *= ratio;
            y1 *= ratio;
            x2 *= ratio;
            y2 *= ratio;

            totalLine.push({ x1, y1, x2, y2 })

            // drawCtx.beginPath();
            // drawCtx.moveTo(x1, y1);
            // drawCtx.lineTo(x2, y2);
            // drawCtx.stroke();
            // drawCtx.closePath();

        }

        function moveVideoAndCanvas(offsetX, offsetY) {

            inputVideo.style.left = offsetX + 'px'
            inputVideo.style.top = offsetY + 'px'
            canvasPaint.style.left = offsetX + 'px'
            canvasPaint.style.top = offsetY + 'px'

        }

        canvasDiv.addEventListener('mousedown', mouseDown);

        canvasDiv.addEventListener('mousemove', mouseMove);

        canvasDiv.addEventListener('mouseup', mouseUp);

        canvasDiv.addEventListener('mouseout', mouseOut);

    }

    function setTopLeftScale(newLeft, newTop, zoomRatio) {

        inputVideo.style.left = newLeft + 'px';
        inputVideo.style.top = newTop + 'px';
        inputVideo.style.transform = "scale(" + zoomRatio + ")";
        canvasPaint.style.left = newLeft + 'px';
        canvasPaint.style.top = newTop + 'px';
        canvasPaint.style.transform = "scale(" + zoomRatio + ")";

    }

    function resetTopLeftScale() {
        zoomRatio = 1.0;
        inputVideo.style.top = "0px";
        inputVideo.style.left = "0px";
        canvasPaint.style.top = "0px";
        canvasPaint.style.left = "0px";
        inputVideo.style.transform = "scale(" + 1.0 + ")";
        canvasPaint.style.transform = "scale(" + 1.0 + ")";
    }

    function initVideo() {

        let thisVideo;

        function updateCanvas() {

            // streamCtx.clearRect(0, 0, canvasStream.width, canvasStream.height);

            streamCtx.drawImage(thisVideo, 0, 0, 1920, 1080, 0, 0, 1920, 1080)

            requestAnimationFrame(updateCanvas);
        }

        function readyToPlayVideo() {

            let stream = canvasStream.captureStream(30);

            let inputVideo = document.getElementById('inputVideo')

            inputVideo.srcObject = stream;
            inputVideo.onloadedmetadata = function (e) {
                inputVideo.play();
            };

            requestAnimationFrame(updateCanvas);

        }

        function HandleStream(mediaStream) {

            thisVideo = document.createElement('video')

            if (thisVideo.srcObject) {
                const stream = thisVideo.srcObject;
                const tracks = stream.getTracks();
                tracks.forEach(function (track) {
                    track.stop();
                });
                thisVideo.srcObject = null;
            }

            thisVideo.srcObject = mediaStream;
            thisVideo.onloadedmetadata = function (e) {
                thisVideo.play();
            };

            thisVideo.oncanplay = function (e) {
                readyToPlayVideo();
            }

        }

        async function getCameraDeviceId() {
            let devices = await navigator.mediaDevices.enumerateDevices()
            let videoDevices = [];
            devices.forEach(function (device) {
                console.log(device)
                if (device.kind == 'videoinput') {
                    videoDevices.push(device)
                }
            });
            return videoDevices
        }

        async function getUserMedia() {

            let constraints = {
                audio: true,
                video: {}
            }

            let devices = await getCameraDeviceId()

            if (devices[0].label == '') {
                constraints = {
                    audio: true,
                    video: true
                }
            }

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

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

            HandleStream(mediaStream)
        }

        playVideo.onclick = getUserMedia

    }

    zoomIn.onclick = () => {

        let ratio = fract(zoomRatio) * 10

        if (zoomRatio < 1.9)
            zoomRatio += 0.1;


        let currentElement = inputVideo

        if (inputVideo.style.display == 'none')
            currentElement = canvasPaint

        let currentLeft = parseFloat(currentElement.style.left)
        let newLeft = (currentLeft * 1 / ratio) + currentLeft

        let currentTop = parseFloat(currentElement.style.top)
        let newTop = (currentTop * 1 / ratio) + currentTop

        // set inputVideo and canvasPaint
        setTopLeftScale(newLeft, newTop, zoomRatio)

    }

    zoomOut.onclick = () => {

        let ratio = fract(zoomRatio) * 10

        if (zoomRatio > 1.0)
            zoomRatio -= 0.1;

        if (zoomRatio == 1) {

            inputVideo.style.top = "0px";
            inputVideo.style.left = "0px";
            canvasPaint.style.top = "0px";
            canvasPaint.style.left = "0px";
            inputVideo.style.transform = "scale(" + 1.0 + ")";
            canvasPaint.style.transform = "scale(" + 1.0 + ")";

        }
        else {

            let currentElement = inputVideo

            if (inputVideo.style.display == 'none')
                currentElement = canvasPaint

            let currentLeft = parseFloat(currentElement.style.left)
            let newLeft = (currentLeft * -1 / ratio) + currentLeft

            let currentTop = parseFloat(currentElement.style.top)
            let newTop = (currentTop * -1 / ratio) + currentTop

            // set inputVideo and canvasPaint
            setTopLeftScale(newLeft, newTop, zoomRatio)

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