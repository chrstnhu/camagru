// https://developer.mozilla.org/en/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos
// All camera state variables are defined in cameraState.js

// Current mode: 'camera' or 'upload'
window.currentCameraMode = "camera";

document.addEventListener("DOMContentLoaded", () => {
  console.log("📷 CapturePhoto.js loaded");

  // Get DOM elements
  video = document.getElementById("video");
  canvas = document.getElementById("canvas");
  photo = document.getElementById("photo");
  startBtn = document.getElementById("start-btn");
  cameraEffect = document.getElementById("camera-effect");
  cameraSection = document.getElementById("camera");
  photoGallery = document.getElementById("photo-gallery");

  // Create gallery if it doesn't exist
  if (!photoGallery) {
    const resultSection = photo.parentElement;
    photoGallery = document.createElement("div");
    photoGallery.id = "photo-gallery";
    photoGallery.className = "photo-gallery";
    photo.style.display = "none";
    resultSection.appendChild(photoGallery);
  }

  // Set up event listeners
  document.addEventListener("cameraViewActivated", () => {
    if (currentCameraMode === "camera") {
      initializeWebcam();
    }
    handleEffectSelection();
  });

  // Initialize webcam if camera section is visible
  if (cameraSection && cameraSection.style.display === "block") {
    initializeWebcam();
  }

  // Handle image upload
  const uploadInput = document.getElementById("upload-image");
  if (uploadInput) {
    uploadInput.addEventListener("change", handleImageUpload);
  }

  // Handle drag & drop on upload zone
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

  // Handle upload save button
  const uploadSaveBtn = document.getElementById("upload-save-btn");
  if (uploadSaveBtn) {
    uploadSaveBtn.addEventListener("click", saveUploadedPhoto);
  }

  // Set up capture button
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.classList.add("disabled");

    startBtn.addEventListener("click", (ev) => {
      ev.preventDefault();

      // Only allow capture if an effect is selected
      if (!selectedEffect) {
        alert("Please select an effect before taking a picture!");
        return;
      }

      takePicture();

      startBtn.classList.add("clicked");
      setTimeout(() => {
        startBtn.classList.remove("clicked");
      }, 200);
    });
  }

  // Initially hide the effect
  if (cameraEffect) {
    cameraEffect.style.display = "none";
  }

  // Initialize with blank photo
  if (canvas && photoGallery) {
    clearPhotoGallery();
  }
  handleEffectSelection();
});

// Switch to Camera mode
function switchToCamera() {
  currentCameraMode = "camera";

  document
    .querySelectorAll(".camera-toggle-btn")
    .forEach((b) => b.classList.add("active"));
  document
    .querySelectorAll(".upload-toggle-btn")
    .forEach((b) => b.classList.remove("active"));

  document.getElementById("camera-mode").style.display = "flex";
  document.getElementById("upload-mode").style.display = "none";

  initializeWebcam();
}

// Switch to Upload mode
function switchToUpload() {
  currentCameraMode = "upload";

  document
    .querySelectorAll(".upload-toggle-btn")
    .forEach((b) => b.classList.add("active"));
  document
    .querySelectorAll(".camera-toggle-btn")
    .forEach((b) => b.classList.remove("active"));

  document.getElementById("upload-mode").style.display = "flex";
  document.getElementById("camera-mode").style.display = "none";

  stopWebcam();
}

// Initialize webcam
function initializeWebcam() {
  if (webcamInitialized) {
    console.log("📷 Webcam already initialized");
    return;
  }

  console.log("📷 Initializing webcam...");

  // Check if elements exist
  if (!video || !canvas || !photo || !startBtn) {
    console.error("❌ Required DOM elements not found");
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
      webcamInitialized = true;
      console.log("📷 Webcam access granted");
    })
    .catch((err) => {
      console.error(`❌ Webcam access error: ${err}`);
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

// Take a picture
function takePicture() {
  const context = canvas.getContext("2d");

  if (width && height) {
    canvas.width = width;
    canvas.height = height;

    // Draw video image onto canvas
    context.drawImage(video, 0, 0, width, height);

    // Load effect from selected effect
    const image = new Image();
    image.src = cameraEffect.src;

    image.onload = function () {
      // Read effect dimensions from style or use defaults
      const effectWidth = parseInt(cameraEffect.style.width) || 100;
      const effectHeight = parseInt(cameraEffect.style.height) || 80;

      // Calculate position to center the effect (same as CSS transform)
      const posX = (width - effectWidth) / 2;
      const posY = (height - effectHeight) / 2;

      // Draw the image with the same dimensions as cameraEffect and centered
      context.drawImage(image, posX, posY, effectWidth, effectHeight);

      const dataUrl = canvas.toDataURL("image/png");
      addPhotoToGallery(dataUrl);
      console.log("📷 Photo with effect captured at center position");
    };
  } else {
    console.log("❌ Cannot take picture - video not ready");
  }
}

// Clean up resources when leaving the page
function stopWebcam() {
  if (stream) {
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
    webcamInitialized = false;
    console.log("Stop webcam");
  }
}

// Clean up when navigating away
window.addEventListener("beforeunload", stopWebcam);
