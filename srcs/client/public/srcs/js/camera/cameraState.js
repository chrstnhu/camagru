// Camera State - Shared variables for all camera modules
// This file must be loaded first before other camera files

// Webcam state
window.webcamInitialized = false;
window.stream = null;
window.selectedEffect = null;

// DOM elements
window.video = null;
window.canvas = null;
window.photo = null;
window.startBtn = null;
window.cameraSection = null;
window.cameraEffect = null;
window.photoGallery = null;

// Photo dimensions
window.width = 320;
window.height = 0;
window.cameraActivated = false;

// Photo ID counter
window.photoID = 0;

// Helper function to get logged in user ID from session
function getLoggedInUserId() {
  const session = getUserSession();
  if (session && session.logged_in) {
    return session.user_id || session.id;
  }
  return null;
}

console.log("📷 Camera state initialized");
