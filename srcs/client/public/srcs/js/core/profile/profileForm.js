// Binds event listeners for gallery and sets initial state
function bindGalleryFeedMode() {
  const infiniteBtn = document.getElementById("gallery-mode-infinite");
  const paginationBtn = document.getElementById("gallery-mode-pagination");
  setFeedModeBtn(
    "gallery-mode-infinite",
    "gallery-mode-pagination",
    localStorage.getItem(window.PROFILE_GALLERY_FEED_MODE_STORAGE_KEY) ||
      "pagination",
  );
  if (infiniteBtn) {
    infiniteBtn.addEventListener("click", async () => {
      await applySectionFeedMode("gallery", "infinite");
    });
  }
  if (paginationBtn) {
    paginationBtn.addEventListener("click", async () => {
      await applySectionFeedMode("gallery", "pagination");
    });
  }
}

// Binds event listeners for my posts and sets initial state
function bindMyPostsFeedMode() {
  const infiniteBtn = document.getElementById("myposts-mode-infinite");
  const paginationBtn = document.getElementById("myposts-mode-pagination");
  setFeedModeBtn(
    "myposts-mode-infinite",
    "myposts-mode-pagination",
    localStorage.getItem(window.PROFILE_MY_POSTS_FEED_MODE_STORAGE_KEY) ||
      "pagination",
  );
  if (infiniteBtn) {
    infiniteBtn.addEventListener("click", async () => {
      await applySectionFeedMode("my-posts", "infinite");
    });
  }
  if (paginationBtn) {
    paginationBtn.addEventListener("click", async () => {
      await applySectionFeedMode("my-posts", "pagination");
    });
  }
}

// Binds event listener to avatar input to preview selected image and store data
function bindAvatarPreview() {
  const profileAvatarInput = document.getElementById("profile-avatar-input");
  if (!profileAvatarInput) {
    return;
  }

  profileAvatarInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      return showInfoAlert("Please select a valid image file");
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById("profile-avatar-preview").src = ev.target.result;
      window._profileAvatarData = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Uploads the profile avatar to the server if a new one is selected
async function uploadAvatarIfNeeded() {
  if (!window._profileAvatarData) {
    return true;
  }

  try {
    const avatarResponse = await fetch("/api/user/avatar", {
      method: "POST",
      headers: await getJsonHeaders(),
      body: JSON.stringify({
        avatar_data: window._profileAvatarData,
      }),
    });

    const avatarData = await avatarResponse.json();
    if (!avatarResponse.ok) {
      showErrorAlert(avatarData.error || "Failed to update avatar");
      return false;
    }

    window._profileAvatarData = null;
    return true;
  } catch (err) {
    showErrorAlert("Failed to update avatar");
    return false;
  }
}

// Retrieves the current values from the profile form fields
function getProfileFormData() {
  return {
    username: document.getElementById("profile-username").value.trim(),
    email: document.getElementById("profile-email").value.trim(),
    notification_enabled: document.getElementById("profile-notif-enabled")
      ?.checked,
  };
}

// Validates username and email
function validateProfileForm({ username, email }) {
  if (!username || !email) {
    showErrorAlert("Username and email are required!");
    return false;
  }
  return true;
}

// Syncs the user session after a profile update to get the latest user data
async function syncUserSession(data, updateData) {
  let syncedUser = data.user;

  try {
    const sessionData = await refreshServerSession();
    if (sessionData.logged_in && sessionData.user) {
      syncedUser = sessionData.user;
    }
  } catch (syncError) {
    // console.error("Error refreshing session after profile update:", syncError);
    showErrorAlert("An error occurred while refreshing session data. Please try again.");
  }

  return syncedUser || data.user || updateData;
}

// Updates the UI after a successful profile update
function updateProfileUI(effectiveUser, newUsername, oldUsername) {
  if (effectiveUser) {
    window.currentUser = effectiveUser;
    setUserSessionCookie(effectiveUser);
  }

  refreshAllUserAvatars(effectiveUser?.username || newUsername, oldUsername);

  if (oldUsername && oldUsername !== newUsername) {
    refreshAllUsername(oldUsername, newUsername);
  }

  showSuccessAlert("Profile updated successfully!");
  document.getElementById("profile-password").value = "";
  document.getElementById("profile-confirm-password").value = "";
  loadUserProfile();
}

// Handles the submission of the profile update form, including avatar upload
async function submitProfileForm() {
  const updateData = getProfileFormData();
  if (!validateProfileForm(updateData)) {
    return;
  }

  const session = getUserSession();
  const oldUsername = session?.username || "";

  try {
    const response = await fetch("/api/user/profile", {
      method: "PUT",
      headers: await getJsonHeaders(),
      body: JSON.stringify(updateData),
    });

    const data = await response.json();
    if (!response.ok) {
      showErrorAlert(data.error || "Failed to update profile");
      return;
    }

    const newUsername = data.user?.username || updateData.username;
    let avatarUploaded = true;
    if (window._profileAvatarData) {
      avatarUploaded = await uploadAvatarIfNeeded();
    }

    const effectiveUser = await syncUserSession(data, updateData);
    updateProfileUI(effectiveUser, newUsername, oldUsername);

    if (avatarUploaded) {
      window._profileAvatarData = null;
    }
  } catch (error) {
    showErrorAlert("Network error. Please try again.");
  }
}

// Binds the profile form submit event to handle updates
function bindFormSubmit() {
  const profileForm = document.getElementById("profile-form");
  if (!profileForm) {
    return;
  }

  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await submitProfileForm();
  });
}

// Initializes all profile form bindings and avatar upload button on DOM load
document.addEventListener("DOMContentLoaded", () => {
  bindGalleryFeedMode();
  bindMyPostsFeedMode();
  bindAvatarPreview();
  bindFormSubmit();
});
  