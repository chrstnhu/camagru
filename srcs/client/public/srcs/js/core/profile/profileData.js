window.PROFILE_GALLERY_FEED_MODE_STORAGE_KEY = "galleryFeedDisplayMode";
window.PROFILE_MY_POSTS_FEED_MODE_STORAGE_KEY = "myPostsFeedDisplayMode";
window._profileAvatarData = null;

// Loads the user profile from the server and updates the UI
function loadUserProfile() {
  fetch("/api/user/status")
    .then((response) => response.json())
    .then((data) => {
      if (data.logged_in && data.user) {
        updateProfileFields(data.user);
        updateFeedModeBtn();
        updateAvatarPreview(data.user.username);
      }
    })
    .catch((error) => {
      // console.error("Error loading profile:", error);
      showErrorAlert("An error occurred while loading profile data. Please try again.");
    });
}

// Updates the profile form fields with the given user data
function updateProfileFields(user) {
  document.getElementById("profile-username").value = user.username || "";
  document.getElementById("profile-email").value = user.email || "";
  document.getElementById("profile-password").value = "";
  document.getElementById("profile-confirm-password").value = "";
  const notificationCheckbox = document.getElementById("profile-notif-enabled");
  if (notificationCheckbox) {
    notificationCheckbox.checked = !!user.notification_enabled;
  }
}

// Updates the feed mode buttons for gallery and my posts based on current settings
function updateFeedModeBtn() {
  setFeedModeBtn(
    "gallery-mode-infinite",
    "gallery-mode-pagination",
    localStorage.getItem(window.PROFILE_GALLERY_FEED_MODE_STORAGE_KEY) ||
      "pagination",
  );
  setFeedModeBtn(
    "myposts-mode-infinite",
    "myposts-mode-pagination",
    localStorage.getItem(window.PROFILE_MY_POSTS_FEED_MODE_STORAGE_KEY) ||
      "pagination",
  );
}

// Updates the avatar preview image when the username changes
function updateAvatarPreview(username) {
  const avatarPreview = document.getElementById("profile-avatar-preview");
  if (avatarPreview && username) {
    const avatarUrl =
      typeof buildAvatarUrl === "function"
        ? buildAvatarUrl(username, Date.now())
        : `/api/avatar/${encodeURIComponent(username)}?ts=${Date.now()}`;
    avatarPreview.src = avatarUrl;
    avatarPreview.onerror = () => {
      avatarPreview.src = "assets/profile/default-avatar.png";
    };
  }
}

// Handles email verification success message on DOM load
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const verified = urlParams.get("verified");

  if (verified === "1") {
    showSuccessAlert("Email verified successfully! You can now log in.");
    window.history.replaceState({}, document.title, "/");
  }
});
