// Forgot Password Popup
function showForgotPasswordPopup() {
  const popup = document.createElement("div");
  popup.className = "auth-container active-popup";
  popup.id = "forgot-password-popup";

  popup.innerHTML = `
    <span class="icon-close" onclick="closeForgotPasswordPopup()">
      <i class="fa-solid fa-xmark"></i>
    </span>
    <div class="header-login-container">
      <h2>Reset Password</h2>
      <p class="password-reset-description">Enter your email to receive a password reset link</p>
    </div>
    <form id="forgot-password-form" class="password-reset-form" onsubmit="handleForgotPassword(event)">
      <div class="login-inputs">
        <label>Email Address</label>
        <div class="input-with-icon">
          <i class="fa-solid fa-envelope input-icon"></i>
          <input 
            type="email" 
            id="forgot-email" 
            class="input-info" 
            placeholder="Enter your email" 
            required
          />
        </div>
      </div>
      <button class="submit-btn" type="submit">Send Reset Link</button>
      <div class="login-register password-reset-back">
        <p><a href="#" onclick="event.preventDefault(); closeForgotPasswordPopup(); activateLoginPopup();">Back to Login</a></p>
      </div>
    </form>
  `;

  document.body.appendChild(popup);

  // Add overlay
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay active";
  overlay.id = "forgot-password-overlay";
  overlay.onclick = closeForgotPasswordPopup;
  document.body.insertBefore(overlay, popup);
}

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
      headers: { "Content-Type": "application/json" },
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

// Reset password form (when user clicks link in email)
function showResetPasswordForm(token) {
  const popup = document.createElement("div");
  popup.className = "auth-container active-popup";
  popup.id = "reset-password-popup";

  popup.innerHTML = `
    <span class="icon-close" onclick="closeResetPasswordPopup()">
      <i class="fa-solid fa-xmark"></i>
    </span>
    <div class="header-login-container">
      <h2>Set New Password</h2>
      <p class="password-reset-description">Enter your new password</p>
    </div>
    <form id="reset-password-form" class="password-reset-form" onsubmit="handleResetPassword(event, '${token}')">
      <div class="login-inputs">
        <label>New Password</label>
        <div class="input-with-icon">
          <i class="fa-solid fa-lock input-icon"></i>
          <input 
            type="password" 
            id="new-password" 
            class="input-info" 
            placeholder="Enter new password" 
            required
            minlength="8"
          />
          <i class="fa-solid fa-eye eye-icon" onclick="togglePasswordVisibility('new-password', this)"></i>
        </div>
        <label>Confirm Password</label>
        <div class="input-with-icon">
          <i class="fa-solid fa-lock input-icon"></i>
          <input 
            type="password" 
            id="confirm-password" 
            class="input-info" 
            placeholder="Confirm new password" 
            required
            minlength="8"
          />
          <i class="fa-solid fa-eye eye-icon" onclick="togglePasswordVisibility('confirm-password', this)"></i>
        </div>
      </div>
      <button class="submit-btn" type="submit">Reset Password</button>
    </form>
  `;

  document.body.appendChild(popup);

  // Add overlay
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay active";
  overlay.id = "reset-password-overlay";
  overlay.onclick = closeResetPasswordPopup;
  document.body.insertBefore(overlay, popup);
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: newPassword }),
    });

    const data = await response.json();

    if (response.ok) {
      closeResetPasswordPopup();
      showSuccessAlert(data.message);
      setTimeout(() => {
        activateLoginPopup();
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
