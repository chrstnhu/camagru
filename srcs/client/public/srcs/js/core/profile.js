const PROFILE_GALLERY_FEED_MODE_STORAGE_KEY = "galleryFeedDisplayMode";
const PROFILE_MY_POSTS_FEED_MODE_STORAGE_KEY = "myPostsFeedDisplayMode";

function setFeedModeButtons(infiniteBtnId, paginationBtnId, mode) {
  const infiniteBtn = document.getElementById(infiniteBtnId);
  const paginationBtn = document.getElementById(paginationBtnId);

  if (!infiniteBtn || !paginationBtn) {
    return;
  }

  const isPagination = mode === "pagination";
  infiniteBtn.style.background = isPagination ? "#e5e7eb" : "#5784BA";
  infiniteBtn.style.color = isPagination ? "#1f2937" : "white";
  paginationBtn.style.background = isPagination ? "#5784BA" : "#e5e7eb";
  paginationBtn.style.color = isPagination ? "white" : "#1f2937";
}

async function applySectionFeedMode(section, mode) {
  const normalizedMode = mode === "pagination" ? "pagination" : "infinite";

  if (section === "gallery") {
    localStorage.setItem(PROFILE_GALLERY_FEED_MODE_STORAGE_KEY, normalizedMode);
    setFeedModeButtons(
      "profile-gallery-mode-infinite",
      "profile-gallery-mode-pagination",
      normalizedMode,
    );

    window._galleryNeedsRefresh = true;
    const gallerySection = document.getElementById("gallery");
    if (
      gallerySection &&
      gallerySection.style.display !== "none" &&
      typeof window.initializepostsData === "function"
    ) {
      await window.initializepostsData();
    }
    return;
  }

  localStorage.setItem(PROFILE_MY_POSTS_FEED_MODE_STORAGE_KEY, normalizedMode);
  setFeedModeButtons(
    "profile-myposts-mode-infinite",
    "profile-myposts-mode-pagination",
    normalizedMode,
  );

  window._myPostsNeedsRefresh = true;
  const myPostsSection = document.getElementById("my-posts");
  if (
    myPostsSection &&
    myPostsSection.style.display !== "none" &&
    typeof initializeMyPosts === "function"
  ) {
    await initializeMyPosts({ force: true });
  }
}

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
          localStorage.getItem(PROFILE_GALLERY_FEED_MODE_STORAGE_KEY) ||
            "pagination",
        );
        setFeedModeButtons(
          "profile-myposts-mode-infinite",
          "profile-myposts-mode-pagination",
          localStorage.getItem(PROFILE_MY_POSTS_FEED_MODE_STORAGE_KEY) ||
            "pagination",
        );

        // Load avatar
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

// Handle profile form submission
document.addEventListener("DOMContentLoaded", () => {
  const profileForm = document.getElementById("profile-form");
  const galleryInfiniteBtn = document.getElementById(
    "profile-gallery-mode-infinite",
  );
  const galleryPaginationBtn = document.getElementById(
    "profile-gallery-mode-pagination",
  );
  const myPostsInfiniteBtn = document.getElementById(
    "profile-myposts-mode-infinite",
  );
  const myPostsPaginationBtn = document.getElementById(
    "profile-myposts-mode-pagination",
  );

  setFeedModeButtons(
    "profile-gallery-mode-infinite",
    "profile-gallery-mode-pagination",
    localStorage.getItem(PROFILE_GALLERY_FEED_MODE_STORAGE_KEY) || "pagination",
  );
  setFeedModeButtons(
    "profile-myposts-mode-infinite",
    "profile-myposts-mode-pagination",
    localStorage.getItem(PROFILE_MY_POSTS_FEED_MODE_STORAGE_KEY) ||
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

  // Profile avatar preview on file select
  const profileAvatarInput = document.getElementById("profile-avatar-input");
  if (profileAvatarInput) {
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
        document.getElementById("profile-avatar-preview").src =
          ev.target.result;
        window._profileAvatarData = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("profile-username").value.trim();
      const email = document.getElementById("profile-email").value.trim();
      const password = document.getElementById("profile-password").value;
      const confirmPassword = document.getElementById(
        "profile-confirm-password",
      ).value;

      // Validation
      if (!username || !email) {
        return showErrorAlert("Username and email are required!");
      }

      // Save old username before update
      const session = getUserSession();
      const oldUsername = session?.username || "";

      // Prepare update data
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

        // Upload avatar if changed
        if (response.ok) {
          const newUsername = data.user?.username || updateData.username;

          if (window._profileAvatarData) {
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
                return;
              }

              window._profileAvatarData = null;
            } catch (err) {
              console.error("Error uploading avatar:", err);
              showErrorAlert("Failed to update avatar");
              return;
            }
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

          refreshAllUserAvatars(
            effectiveUser?.username || newUsername,
            oldUsername,
          );

          // Update all usernames across the page if username changed
          if (oldUsername && oldUsername !== newUsername) {
            refreshAllUsername(oldUsername, newUsername);
          }

          showSuccessAlert("Profile updated successfully!");

          // Clear password fields
          document.getElementById("profile-password").value = "";
          document.getElementById("profile-confirm-password").value = "";

          loadUserProfile();
        } else {
          showErrorAlert(data.error || "Failed to update profile");
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        showErrorAlert("Network error. Please try again.");
      }
    });
  }
});

// Toggle password visibility
function togglePasswordVisibility(inputId, iconElement) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    iconElement.classList.remove("fa-eye");
    iconElement.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    iconElement.classList.remove("fa-eye-slash");
    iconElement.classList.add("fa-eye");
  }
}

// Check for verified parameter in URL
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const verified = urlParams.get("verified");

  if (verified === "1") {
    showSuccessAlert("Email verified successfully! You can now log in.");
    // Clear URL parameter
    window.history.replaceState({}, document.title, "/");
  }
});
