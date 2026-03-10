// Load current user data when profile page is shown
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

        // Load avatar
        const avatarPreview = document.getElementById("profile-avatar-preview");
        if (avatarPreview && data.user.username) {
          const ts = Date.now();
          avatarPreview.src = `/api/avatar/${data.user.username}?ts=${ts}`;
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
      };

      try {
        const response = await fetch("/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        const data = await response.json();

        // Upload avatar if changed
        if (response.ok) {
          if (window._profileAvatarData) {
            try {
              await fetch("/api/user/avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  avatar_data: window._profileAvatarData,
                }),
              });
              window._profileAvatarData = null;
              // Update ALL avatars of the logged user across the page
              refreshAllUserAvatars(data.user?.username || updateData.username);
            } catch (err) {
              console.error("Error uploading avatar:", err);
            }
          }

          // Update all usernames across the page if username changed
          const newUsername = data.user?.username || updateData.username;
          if (oldUsername && oldUsername !== newUsername) {
            refreshAllUsername(oldUsername, newUsername);
            // Also refresh avatars since avatar URL depends on username
            refreshAllUserAvatars(newUsername);
          }

          showSuccessAlert("Profile updated successfully!");

          // Update session data
          if (data.user) {
            window.currentUser = data.user;
          }

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
