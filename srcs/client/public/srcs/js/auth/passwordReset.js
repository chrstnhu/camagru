function mountTemplate(templateId) {
  const template = document.getElementById(templateId);
  if (!template) {
    console.error(`Template not found: ${templateId}`);
    return false;
  }

  document.body.appendChild(template.content.cloneNode(true));
  return true;
}

function openLoginFromResetFlow() {
  if (typeof window.activateLoginPopup === "function") {
    window.activateLoginPopup();
    return;
  }

  if (typeof showLogin === "function") {
    showLogin();
  }
}

// Close forgot popup
function closeForgotPasswordPopup() {
  const popup = document.getElementById("forgot-password-popup");
  const overlay = document.getElementById("forgot-password-overlay");
  if (popup) {
    popup.remove();
  }
  if (overlay) {
    overlay.remove();
  }
}

// Handle forgot password
async function handleForgotPassword(event) {
  event.preventDefault();

  const email = document.getElementById("forgot-email").value;

  try {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: await getJsonHeaders(),
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      closeForgotPasswordPopup();
      showSuccessAlert(data.message);
    } else {
      showErrorAlert(data.error || "Failed to send reset email");
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    showErrorAlert("Network error. Please try again.");
  }
}

// Forgot Password Popup
function showForgotPasswordPopup() {
  if (!mountTemplate("forgot-password-template")) {
    return;
  }

  const overlay = document.getElementById("forgot-password-overlay");
  const closeBtn = document.querySelector("[data-close-forgot-password]");
  const backToLoginLink = document.querySelector("[data-back-to-login]");
  const form = document.getElementById("forgot-password-form");

  if (overlay) {
    overlay.addEventListener("click", closeForgotPasswordPopup);
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeForgotPasswordPopup);
  }

  if (backToLoginLink) {
    backToLoginLink.addEventListener("click", (event) => {
      event.preventDefault();
      closeForgotPasswordPopup();
      openLoginFromResetFlow();
    });
  }

  if (form) {
    form.addEventListener("submit", handleForgotPassword);
  }
}
function closeResetPasswordPopup() {
  const popup = document.getElementById("reset-password-popup");
  const overlay = document.getElementById("reset-password-overlay");
  if (popup) {
    popup.remove();
  }
  if (overlay) {
    overlay.remove();
  }
  // Clear URL
  window.history.replaceState({}, document.title, window.location.pathname);
}

// Handle reset password form submission
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
        openLoginFromResetFlow();
      }, 1500);
    } else {
      showErrorAlert(data.error || "Failed to reset password");
    }
  } catch (error) {
    console.error("Reset password error:", error);
    showErrorAlert("Network error. Please try again.");
  }
}

// Toggle password visibility
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

// Reset password form (when user clicks link in email)
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

// Check for password reset on page load
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);

  // Check for password reset
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
