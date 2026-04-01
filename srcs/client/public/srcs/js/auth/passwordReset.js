
// Shows the reset password form and sets up its event listeners
function showResetPasswordForm(token) {
  if (!mountTemplate("reset-password-template")) {
    return;
  }

  const overlay = document.getElementById("reset-password-overlay");
  const closeBtn = document.querySelector("[data-close-reset-password]");
  const form = document.getElementById("reset-password-form");

  if (overlay) {
    overlay.addEventListener("click", closeResetPasswordPopup);
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeResetPasswordPopup);
  }

  document.querySelectorAll("[data-password-target]").forEach((icon) => {
    icon.addEventListener("click", () => {
      togglePasswordVisibility(icon.dataset.passwordTarget, icon);
    });
  });

  if (form) {
    form.addEventListener("submit", (event) => {
      handleResetPassword(event, token);
    });
  }
}

// Handles the reset password form submission and updates the password
async function handleResetPassword(event, token) {
  event.preventDefault();

  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (newPassword !== confirmPassword) {
    return showErrorAlert("Passwords do not match!");
  }

  if (newPassword.length < 8) {
    return showErrorAlert("Password must be at least 8 characters long!");
  }

  try {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: await getJsonHeaders(),
      body: JSON.stringify({ token, password: newPassword }),
    });

    const data = await response.json();

    if (response.ok) {
      closeResetPasswordPopup();
      showSuccessAlert(data.message);
      setTimeout(() => {
        if (typeof showLogin === "function") {
          showLogin();
        }
      }, 1500);
    } else {
      showErrorAlert(data.error || "Failed to reset password");
    }
  } catch (error) {
    // console.error("Reset password error:", error);
    showErrorAlert("Network error. Please try again.");
  }
}

// Toggles the visibility of a password input field
function togglePasswordVisibility(inputId, icon) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

// Closes the reset password popup and overlay, and clears the URL
function closeResetPasswordPopup() {
  const popup = document.getElementById("reset-password-popup");
  const overlay = document.getElementById("reset-password-overlay");
  if (popup) {
    popup.remove();
  }
  if (overlay) {
    overlay.remove();
  }
  window.history.replaceState({}, document.title, window.location.pathname);
}

// Checks for password reset or error in the URL on DOM load and shows the appropriate UI
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.get("reset") === "form") {
    const token = urlParams.get("token");
    if (token) {
      showResetPasswordForm(token);
    }
  } else if (urlParams.get("reset") === "error") {
    const reason = urlParams.get("reason");
    let message = "Password reset failed.";

    if (reason === "no_token") {
      message = "No reset token provided.";
    } else if (reason === "invalid_token") {
      message = "Invalid or expired reset token.";
    }

    showErrorAlert(message);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});