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
      showSuccessAlert("Photo captured! You can save it to your drafts.");
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

// Clean up when navigating away
window.addEventListener("beforeunload", stopWebcam);
