// https://developer.mozilla.org/en/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos

// Current mode: 'camera' or 'upload'
window.currentCameraMode = "camera";

// Hides the initial state of the photo and effect preview
function hideInitialCaptureState() {
  if (photo) {
    photo.style.display = "none";
  }

  if (cameraEffect) {
    cameraEffect.style.display = "none";
  }
}

// Sets up camera view initialization and event listeners for camera activation
function setupCameraViewInitialization() {
  document.addEventListener("cameraViewActivated", () => {
    if (currentCameraMode === "camera") {
      initWebcam();
    }
    handleEffectSelection();
  });

  if (cameraSection && cameraSection.style.display === "block") {
    initWebcam();
  }
}

// Sets up upload input, drag-and-drop, and add-to-draft handlers
function setupUploadHandlers() {
  const uploadInput = document.getElementById("upload-image");
  if (uploadInput) {
    uploadInput.addEventListener("change", handleImageUpload);
  }

  const dropZone = document.getElementById("upload-drop-zone");
  if (dropZone) {
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("dragover");
    });
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      const file = e.dataTransfer.files[0];
      if (file) {
        handleImageUpload({ target: { files: [file] } });
      }
    });
  }

  const addToDraft = document.getElementById("add-to-draft");
  if (addToDraft) {
    addToDraft.addEventListener("click", saveUploadedPhoto);
  }
}

// Sets up the capture button, enabling photo capture with effect
function setupCaptureBtn() {
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.classList.add("is-disabled");

    startBtn.addEventListener("click", (ev) => {
      ev.preventDefault();

      // Only allow capture if an effect is selected
      if (!selectedEffect) {
        showInfoAlert("Please select an effect before taking a picture!");
        return;
      }

      takePicture();

      startBtn.classList.add("is-clicked");
      setTimeout(() => {
        startBtn.classList.remove("is-clicked");
      }, 200);
    });
  }
}

// Sets up actions for saving and retaking photo drafts
function setupCaptureDraftActions() {
  const confirmSaveBtn = document.getElementById("confirm-save-btn");
  if (confirmSaveBtn) {
    confirmSaveBtn.addEventListener("click", async () => {
      await saveSelectedDraft();
    });
  }

  // Handle retake button
  const retakeBtn = document.getElementById("retake-btn");
  if (retakeBtn) {
    retakeBtn.addEventListener("click", () => {
      removeSelectedDraft();
    });
  }
}

// Initializes camera, upload, and capture UI on DOM load
document.addEventListener("DOMContentLoaded", () => {
  // console.log("📷 CapturePhoto.js loaded");

  video = document.getElementById("video");
  canvas = document.getElementById("canvas");
  photo = document.getElementById("photo");
  startBtn = document.getElementById("start-btn");
  cameraEffect = document.getElementById("camera-effect");
  cameraSection = document.getElementById("camera");

  hideInitialCaptureState();
  setupCameraViewInitialization();
  setupUploadHandlers();
  setupCaptureBtn();
  setupCaptureDraftActions();
  handleEffectSelection();
});

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

// Stops the webcam and releases media resources
function stopWebcam() {
  if (stream) {
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
    webcamInit = false;
  }
}

// Clean up when navigating away
window.addEventListener("beforeunload", stopWebcam);
