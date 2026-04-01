// https://developer.mozilla.org/en/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos

// Current mode: 'camera' or 'upload'
window.currentCameraMode = "camera";

// Captures a photo from the webcam, applies the selected effect, and adds a draft
function takePicture() {
  const context = canvas.getContext("2d");

  if (width && height) {
    canvas.width = width;
    canvas.height = height;

    // Draw video frame onto canvas
    context.drawImage(video, 0, 0, width, height);

    const image = new Image();
    image.src = cameraEffect.src;

    image.onload = function () {
      const effectWidth = width;
      const effectHeight = height;

      const posX = (width - effectWidth) / 2;
      const posY = (height - effectHeight) / 2;

      // Raw data for server composition
      const rawDataUrl = canvas.toDataURL("image/png");

      // Draw effect on canvas for client-side preview
      context.drawImage(image, posX, posY, effectWidth, effectHeight);
      const previewDataUrl = canvas.toDataURL("image/png");

      addCaptureDraft({
        rawDataUrl,
        previewDataUrl,
        effectDataUrl: selectedEffect.dataUrl,
        effectWidth,
        effectHeight,
      });
    };
  } else {
    // console.error("Cannot take picture - video not ready");
    showErrorAlert("Unable to capture photo. Please try again.");
  }
}

// Initializes the webcam and sets up video/canvas elements
function initWebcam() {
  if (webcamInit) {
    return;
  }

  // Check if elements exist
  if (!video || !canvas || !photo || !startBtn) {
    return;
  }

  // Request webcam access
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((videoStream) => {
      stream = videoStream;
      video.srcObject = stream;
      return video.play();
    })
    .then(() => {
      webcamInit = true;
    })
    .catch((err) => {
      // console.error(`❌ Webcam access error: ${err}`);
      showErrorAlert("Unable to access webcam. Please allow camera permissions and try again.");
    });

  // Set up canplay event handler
  video.addEventListener("canplay", (ev) => {
    if (!cameraActivated) {
      // Calculate proportional height
      height = video.videoHeight / (video.videoWidth / width);

      // Set dimensions
      video.setAttribute("width", width);
      video.setAttribute("height", height);
      canvas.setAttribute("width", width);
      canvas.setAttribute("height", height);
      cameraActivated = true;
    }
  });
}

// Stops the webcam and releases media resources
function stopWebcam() {
  if (stream) {
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
    webcamInit = false;
  }
}

// Switches to camera mode and initializes webcam
function switchToCamera() {
  currentCameraMode = "camera";

  document
    .querySelectorAll(".camera-toggle-btn")
    .forEach((b) => b.classList.add("is-active"));
  document
    .querySelectorAll(".upload-toggle-btn")
    .forEach((b) => b.classList.remove("is-active"));

  document.getElementById("camera-mode").style.display = "flex";
  document.getElementById("upload-mode").style.display = "none";

  initWebcam();
}

// Switches to upload mode and stops the webcam
function switchToUpload() {
  currentCameraMode = "upload";

  document
    .querySelectorAll(".upload-toggle-btn")
    .forEach((b) => b.classList.add("is-active"));
  document
    .querySelectorAll(".camera-toggle-btn")
    .forEach((b) => b.classList.remove("is-active"));

  document.getElementById("upload-mode").style.display = "flex";
  document.getElementById("camera-mode").style.display = "none";

  stopWebcam();
}

// Hides the initial state of the photo and effect preview
function hideInitialCaptureState() {
  if (photo) {
    photo.style.display = "none";
  }

  if (cameraEffect) {
    cameraEffect.style.display = "none";
  }
}
