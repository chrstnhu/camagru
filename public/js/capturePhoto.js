// https://developer.mozilla.org/en/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos

// Variables to track webcam state
let webcamInitialized = false;
let stream = null;

let video,
  canvas,
  photo,
  startButton,
  cameraSection,
  cameraEffect,
  photoGallery;
let width = 320; // Photo width (height will be calculated proportionally)
let height = 0; // Will be calculated based on video stream
let streaming = false;
let photoCount = 0; // Counter for photo IDs

// Test mode variables
let testMode = false;
let simulationCanvas = null;

// Main initialization when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("📷 CapturePhoto.js loaded");

  // Get DOM elements
  video = document.getElementById("video");
  canvas = document.getElementById("canvas");
  photo = document.getElementById("photo");
  startButton = document.getElementById("start-button");
  cameraEffect = document.getElementById("camera-effect");
  cameraSection = document.getElementById("camera");

  // Create or get photo gallery container
  photoGallery = document.getElementById("photo-gallery");
  if (!photoGallery) {
    // Create gallery if it doesn't exist
    const resultSection = photo.parentElement;
    photoGallery = document.createElement("div");
    photoGallery.id = "photo-gallery";
    photoGallery.className = "camera__result__gallery";

    // Replace single photo with gallery
    photo.style.display = "none";
    resultSection.appendChild(photoGallery);
  }

  // Set up event listeners
  document.addEventListener("cameraViewActivated", () => {
    initializeWebcam();
    handleEffectSelection();
  });

  // Initialize webcam if camera section is visible
  if (cameraSection && cameraSection.style.display === "block") {
    initializeWebcam();
  }

  // Set up capture button if it exists
  if (startButton) {
    startButton.addEventListener("click", (ev) => {
      takePicture();
      ev.preventDefault();

      // Animate the capture button
      startButton.classList.add("camera__button--clicked");
      setTimeout(() => {
        startButton.classList.remove("camera__button--clicked");
      }, 200);
    });
  }

  if (cameraEffect) {
    // Remove any inline styles that might interfere with CSS positioning
    cameraEffect.removeAttribute("style");
    // Add specific dimensions while letting CSS handle positioning
    cameraEffect.style.width = "100px";
    cameraEffect.style.height = "80px";
  }

  // Initialize with blank photo gallery
  if (canvas && photoGallery) {
    clearPhotoGallery();
  }
  handleEffectSelection();
});

// Initialize webcam
function initializeWebcam() {
  if (webcamInitialized) {
    console.log("📷 Webcam already initialized");
    return;
  }

  console.log("📷 Initializing webcam...");

  // Check if elements exist
  if (!video || !canvas || !photo || !startButton) {
    console.error("❌ Required DOM elements not found");
    return;
  }

  // Add loading indicator
  if (cameraSection) {
    cameraSection.classList.add("camera__container--loading");
  }

  // Request webcam access
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((videoStream) => {
      stream = videoStream;
      video.srcObject = stream;
      video.play();
      webcamInitialized = true;
      console.log("📷 Webcam access granted");
    })
    .catch((err) => {
      console.error(`❌ Webcam access error: ${err}`);
    });

  // Set up canplay event handler
  video.addEventListener("canplay", (ev) => {
    if (!streaming) {
      // Calculate proportional height with 3:2 ratio
      height = (width * 2) / 3;

      // Set dimensions
      video.setAttribute("width", width);
      video.setAttribute("height", height);
      canvas.setAttribute("width", width);
      canvas.setAttribute("height", height);

      streaming = true;
      console.log("Video ready to display with 3:2 ratio");
    }
  });
}

// Clear photo gallery (remove all photos)
function clearPhotoGallery() {
  if (photoGallery) {
    photoGallery.innerHTML = "";
    photoCount = 0;
    console.log("📷 Photo gallery cleared");
  }
}

// Add a new photo to the gallery
function addPhotoToGallery(dataUrl) {
  if (!photoGallery) return;

  photoCount++;
  const photoItem = document.createElement("div");
  photoItem.className = "camera__result__photo-item";

  const img = document.createElement("img");
  img.src = dataUrl;
  img.alt = `Captured photo ${photoCount}`;
  img.className = "camera__result__image camera__result__image--taken";
  img.id = `photo-${photoCount}`;

  // Remove animation class after animation
  setTimeout(() => {
    img.classList.remove("camera__result__image--taken");
  }, 500);

  photoItem.appendChild(img);
  photoGallery.appendChild(photoItem);

  // Scroll to latest photo
  photoGallery.scrollTop = photoGallery.scrollHeight;

  console.log(`📷 Photo ${photoCount} added to gallery`);
}

// Take a picture
function takePicture() {
  const context = canvas.getContext("2d");

  if (width && height) {
    canvas.width = width;
    canvas.height = height;

    // Draw video image onto canvas
    context.drawImage(video, 0, 0, width, height);

    // Load and draw effect image onto canvas
    // const image = new Image();
    // image.src = "assets/photosEffects/summerHat.png";

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

      // Add photo to gallery instead of replacing single photo
      addPhotoToGallery(dataUrl);

      console.log("📷 Photo with effect captured at center position");
    };

    // * Need to save photo in database
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
    console.log("📷 Webcam stopped");
  }
}

function handleEffectSelection() {
  console.warn("🎨 Setting up effects...");
  const effectsContainer = document.getElementById("effects-container");
  if (!effectsContainer) {
    console.error("❌ Effects container not found");
    return;
  }

  const effects = [
    { name: "summerHat", img: "assets/photosEffects/summerHat.png" },
    { name: "confettis", img: "assets/photosEffects/confettis.png" },
  ];

  effectsContainer.innerHTML = "";

  effects.forEach((effect) => {
    console.log("Creating effect:", effect.name, effect.img);
    const effectDiv = document.createElement("div");
    effectDiv.classList.add("camera__effects__item");
    effectDiv.addEventListener("click", (ev) => {
      ev.preventDefault();
      cameraEffect.src = effect.img;
      cameraEffect.alt = effect.name;
      console.log(`🎨 Effect selected: ${effect.name}`);
    });

    const img = document.createElement("img");
    img.src = effect.img;
    img.alt = effect.name;
    img.title = effect.name;

    // Debug to see if images load
    img.onload = () => {
      console.log(`✅ Image loaded: ${effect.name}`);
    };
    img.onerror = () => {
      console.error(`❌ Loading error: ${effect.img}`);
    };

    effectDiv.appendChild(img);
    effectsContainer.appendChild(effectDiv);
  });

  console.log("✅ Effects setup complete");
}

// Clean up when navigating away
window.addEventListener("beforeunload", stopWebcam);
