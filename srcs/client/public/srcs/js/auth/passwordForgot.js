// Shows the forgot password popup and sets up its event listeners
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
      if (typeof showLogin === "function") {
        showLogin();
      }
    });
  }

  if (form) {
    form.addEventListener("submit", handleForgotPassword);
  }
}

// Handles the forgot password form submission and sends the reset email
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
    // console.error("Forgot password error:", error);
    showErrorAlert("Network error. Please try again.");
  }
}

// Mounts a template from the DOM by its ID and appends it to the body
function mountTemplate(templateId) {
  const template = document.getElementById(templateId);
  if (!template) {
    // console.error(`Template not found: ${templateId}`);
    return false;
  }

  document.body.appendChild(template.content.cloneNode(true));
  return true;
}

// Closes the forgot password popup and overlay
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