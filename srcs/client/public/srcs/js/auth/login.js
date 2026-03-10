// Switch between login and register forms
function toggleAuthForm(showLoginForm) {
  const loginSection = document.getElementById("login-section");
  const registerSection = document.getElementById("register-section");
  const loginBtns = document.querySelectorAll(".login-component-button");
  const registerBtns = document.querySelectorAll(".register-component-button");

  if (loginSection) {
    loginSection.style.display = showLoginForm ? "block" : "none";
  }
  if (registerSection) {
    registerSection.style.display = showLoginForm ? "none" : "block";
  }

  loginBtns.forEach((btn) => btn.classList.toggle("active", showLoginForm));
  registerBtns.forEach((btn) => btn.classList.toggle("active", !showLoginForm));
}

// Show login form by default
function showLogin() {
  toggleAuthForm(true);
}

// Show registration form
function showRegister() {
  toggleAuthForm(false);
}

async function handleApiError(response) {
  if (response.status === 403) {
    return showErrorAlert(
      "Please verify your email address before logging in. Check your inbox!",
    );
  }

  let errorMessage;
  try {
    const errorData = await response.json();
    errorMessage =
      errorData.error || "Login failed. Please check your credentials.";
  } catch (e) {
    const errorText = await response.text();
    console.error(
      "Server returned non-JSON response:",
      errorText.substring(0, 200),
    );
    errorMessage = `Server error (${response.status}): ${response.statusText}`;
  }
  console.error("Login failed:", errorMessage);
  return showErrorAlert(errorMessage);
}

// Store user session in cookie
function saveUserSession(userData, email) {
  document.cookie = `user_session=${JSON.stringify({
    user_id: userData.id || userData.user_id,
    username: userData.username,
    email: userData.email || email,
    logged_in: true,
  })}; path=/; max-age=3600`;
}

// Handle login from page form
async function loginCheck(event) {
  if (event) event.preventDefault();

  const email = document.getElementById("login-email")?.value;
  const password = document.getElementById("login-password")?.value;

  if (!email || !password) {
    showErrorAlert("Please enter both email and password");
    return;
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    // Special handling for 403 (email not verified)
    if (!response.ok) {
      await handleApiError(response);
      return;
    }

    const data = await response.json();
    const userData = data.user || data;

    console.log("Login successful:", data);
    console.log("User data:", userData);

    saveUserSession(userData, email);
    updateUIAfterLogin({
      username: userData.username,
      email: userData.email || email,
    });

    // Clear form
    document.getElementById("login-email").value = "";
    document.getElementById("login-password").value = "";

    // Show success message
    showSuccessAlert(`Welcome back, ${userData.username}!`);
    navigateTo("gallery", true);
  } catch (error) {
    console.error("Network error:", error);
    // Check if error is due to HTML response instead of JSON
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      showErrorAlert(
        "Server error. Please contact support or try again later.",
      );
    } else {
      showErrorAlert("Connection error. Please try again.");
    }
  }
}

// Setup password visibility toggle for login form
function setupLoginPasswordToggle() {
  const loginPasswordInput = document.getElementById("login-password");
  const loginEyeIcon = document.getElementById("login-password-eye");

  if (loginPasswordInput && loginEyeIcon) {
    loginEyeIcon.addEventListener("click", function () {
      if (loginPasswordInput.type === "password") {
        loginPasswordInput.type = "text";
        loginEyeIcon.classList.remove("fa-eye");
        loginEyeIcon.classList.add("fa-eye-slash");
      } else {
        loginPasswordInput.type = "password";
        loginEyeIcon.classList.remove("fa-eye-slash");
        loginEyeIcon.classList.add("fa-eye");
      }
    });
  }
}

// Update UI after successful login
document.addEventListener("DOMContentLoaded", () => {
  setupLoginPasswordToggle();

  // Check for email verification status in URL
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.get("verified") === "success") {
    showEmailVerificationPage("success");
  } else if (urlParams.get("verified") === "error") {
    const reason = urlParams.get("reason");
    showEmailVerificationPage("error", reason);
  }
});
