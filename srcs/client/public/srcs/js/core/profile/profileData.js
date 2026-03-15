window.PROFILE_GALLERY_FEED_MODE_STORAGE_KEY = "galleryFeedDisplayMode";
window.PROFILE_MY_POSTS_FEED_MODE_STORAGE_KEY = "myPostsFeedDisplayMode";
window._profileAvatarData = null;

function loadUserProfile() {
  fetch("/api/user/status")
    .then((response) => response.json())
    .then((data) => {
      if (data.logged_in && data.user) {
        document.getElementById("profile-username").value =
          data.user.username || "";
        document.getElementById("profile-email").value = data.user.email || "";
        document.getElementById("profile-password").value = "";
        document.getElementById("profile-confirm-password").value = "";

        const notificationCheckbox = document.getElementById(
          "profile-notification-enabled",
        );
        if (notificationCheckbox) {
          notificationCheckbox.checked = Boolean(
            data.user.notification_enabled,
          );
        }

        setFeedModeButtons(
          "profile-gallery-mode-infinite",
          "profile-gallery-mode-pagination",
          localStorage.getItem(window.PROFILE_GALLERY_FEED_MODE_STORAGE_KEY) ||
            "pagination",
        );
        setFeedModeButtons(
          "profile-myposts-mode-infinite",
          "profile-myposts-mode-pagination",
          localStorage.getItem(window.PROFILE_MY_POSTS_FEED_MODE_STORAGE_KEY) ||
            "pagination",
        );

        const avatarPreview = document.getElementById("profile-avatar-preview");
        if (avatarPreview && data.user.username) {
          const avatarUrl =
            typeof buildAvatarUrl === "function"
              ? buildAvatarUrl(data.user.username, Date.now())
              : `/api/avatar/${encodeURIComponent(data.user.username)}?ts=${Date.now()}`;
          avatarPreview.src = avatarUrl;
          avatarPreview.onerror = () => {
            avatarPreview.src = "assets/profile/default-avatar.png";
          };
        }
      }
    })
    .catch((error) => {
      console.error("Error loading profile:", error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const verified = urlParams.get("verified");

  if (verified === "1") {
    showSuccessAlert("Email verified successfully! You can now log in.");
    window.history.replaceState({}, document.title, "/");
  }
});
