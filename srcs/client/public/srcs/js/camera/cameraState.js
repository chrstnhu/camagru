// Webcam state
window.webcamInit = false;
window.stream = null;
window.selectedEffect = null;

// DOM elements
window.video = null;
window.canvas = null;
window.photo = null;
window.startBtn = null;
window.cameraSection = null;
window.cameraEffect = null;
window._captureDrafts = [];
window._selectedCaptureDraftIndex = -1;
window._uploadedImageData = null;

// Photo dimensions
window.width = 320;
window.height = 0;
window.cameraActivated = false;

// Photo ID counter
window.photoID = 0;

// Returns the logged-in user ID from the session, or null if not logged in
function getLoggedInUserId() {
  const session = getUserSession();
  if (session && session.logged_in) {
    return session.user_id || session.id;
  }
  return null;
}
