// https://developer.mozilla.org/en/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos

// Variables to track webcam state
let webcamInitialized = false;
let stream = null;

let video, canvas, photo, startButton, cameraSection, cameraEffect;
let width = 320; // Photo width (height will be calculated proportionally)
let height = 0; // Will be calculated based on video stream
let streaming = false;

// Main initialization when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("📷 CapturePhoto.js loaded");

  // Get DOM elements
  video = document.getElementById("video");
  canvas = document.getElementById("canvas");
  photo = document.getElementById("photo");
  startButton = document.getElementById("start-button");
  cameraEffect = document.getElementById("camera-effect");

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
      startButton.classList.add("clicked");
      setTimeout(() => {
        startButton.classList.remove("clicked");
      }, 200);
    });
  }

  if (cameraEffect) {
    cameraEffect.src = "assets/photosEffects/summerHat.png";
    cameraEffect.alt = "Camera Effect";
    cameraEffect.style.display = "block";
    cameraEffect.style.position = "absolute";
    cameraEffect.style.width = "100px";
    cameraEffect.style.height = "80px";
    cameraEffect.style.top = "50%";
    cameraEffect.style.left = "50%";
    cameraEffect.style.transform = "translate(-50%, -50%)";
  }

  // Initialize with blank photo
  if (canvas && photo) {
    clearPhoto();
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
    cameraSection.classList.add("loading");
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
      // Calculate proportional height
      height = video.videoHeight / (video.videoWidth / width);

      // Set dimensions
      video.setAttribute("width", width);
      video.setAttribute("height", height);
      canvas.setAttribute("width", width);
      canvas.setAttribute("height", height);

      streaming = true;
      console.log("Video ready to display");
    }
  });
}

// Clear photo (set to blank)
function clearPhoto() {
  const context = canvas.getContext("2d");
  context.fillStyle = "#aaaaaa";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const data = canvas.toDataURL("image/png");
  photo.setAttribute("src", data);
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
    const image = new Image();
    image.src = "assets/photosEffects/summerHat.png";

    image.onload = function () {
      // Read effect dimensions from style or use defaults
      const effectWidth = parseInt(cameraEffect.style.width) || 100;
      const effectHeight = parseInt(cameraEffect.style.height) || 80;

      // Calculate position to center the effect
      const posX = (width - effectWidth) / 2;
      const posY = (height - effectHeight) / 2;

      // Draw the image with the same dimensions as cameraEffect and centered
      context.drawImage(image, posX, posY, effectWidth, effectHeight);

      const dataUrl = canvas.toDataURL("image/png");
      photo.setAttribute("src", dataUrl);

      photo.classList.add("photo-taken");
      setTimeout(() => {
        photo.classList.remove("photo-taken");
      }, 500);

      console.log("📷 Photo with effect captured");
    };

    // * Need to save photo in database
  } else {
    clearPhoto();
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
    effectDiv.classList.add("effect");

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
