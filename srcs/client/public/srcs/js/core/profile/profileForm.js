function bindProfileFeedModeControls() {
  const galleryInfiniteBtn = document.getElementById(
    "profile-gallery-mode-infinite");
  const galleryPaginationBtn = document.getElementById(
    "profile-gallery-mode-pagination");
  const myPostsInfiniteBtn = document.getElementById(
    "profile-myposts-mode-infinite");
  const myPostsPaginationBtn = document.getElementById(
    "profile-myposts-mode-pagination");

  setFeedModeButtons("profile-gallery-mode-infinite",
    "profile-gallery-mode-pagination",
    localStorage.getItem(window.PROFILE_GALLERY_FEED_MODE_STORAGE_KEY) ||
      "pagination",
  );
  setFeedModeButtons("profile-myposts-mode-infinite",
    "profile-myposts-mode-pagination",
    localStorage.getItem(window.PROFILE_MY_POSTS_FEED_MODE_STORAGE_KEY) ||
      "pagination",
  );

  if (galleryInfiniteBtn) {
    galleryInfiniteBtn.addEventListener("click", async () => {
      await applySectionFeedMode("gallery", "infinite");
    });
  }

  if (galleryPaginationBtn) {
    galleryPaginationBtn.addEventListener("click", async () => {
      await applySectionFeedMode("gallery", "pagination");
    });
  }

  if (myPostsInfiniteBtn) {
    myPostsInfiniteBtn.addEventListener("click", async () => {
      await applySectionFeedMode("my-posts", "infinite");
    });
  }

  if (myPostsPaginationBtn) {
    myPostsPaginationBtn.addEventListener("click", async () => {
      await applySectionFeedMode("my-posts", "pagination");
    });
  }
}

function bindProfileAvatarPreview() {
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
      return showErrorAlert("Please select a valid image file");
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById("profile-avatar-preview").src = ev.target.result;
      window._profileAvatarData = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadProfileAvatarIfNeeded() {
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
    console.error("Error uploading avatar:", err);
    showErrorAlert("Failed to update avatar");
    return false;
  }
}

async function submitProfileUpdateForm() {
  const username = document.getElementById("profile-username").value.trim();
  const email = document.getElementById("profile-email").value.trim();

  if (!username || !email) {
    showErrorAlert("Username and email are required!");
    return;
  }

  const session = getUserSession();
  const oldUsername = session?.username || "";

  const updateData = {
    username: username,
    email: email,
    notification_enabled: document.getElementById(
      "profile-notification-enabled",
    )?.checked,
  };

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
      avatarUploaded = await uploadProfileAvatarIfNeeded();
    }

    let syncedUser = data.user;
    try {
      const sessionData = await refreshServerSession();
      if (sessionData.logged_in && sessionData.user) {
        syncedUser = sessionData.user;
      }
    } catch (syncError) {
      console.error(
        "Error refreshing session after profile update:",
        syncError,
      );
    }

    const effectiveUser = syncedUser || data.user || updateData;

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
    // On ne remet à null que si l'upload a été fait
    if (avatarUploaded) {
      window._profileAvatarData = null;
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    showErrorAlert("Network error. Please try again.");
  }
}

function bindProfileFormSubmit() {
  const profileForm = document.getElementById("profile-form");
  if (!profileForm) {
    return;
  }

  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await submitProfileUpdateForm();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindProfileFeedModeControls();
  bindProfileAvatarPreview();
  bindProfileFormSubmit();
  // Ajout gestionnaire bouton avatar
  const avatarBtn = document.getElementById("profile-avatar-upload-btn");
  if (avatarBtn) {
    avatarBtn.addEventListener("click", async () => {
      const ok = await uploadProfileAvatarIfNeeded();
      if (ok) {
        showSuccessAlert("Avatar mis à jour !");
        loadUserProfile();
      }
    });
  }
});
