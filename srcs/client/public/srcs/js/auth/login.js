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

  loginBtns.forEach((btn) => btn.classList.toggle("is-active", showLoginForm));
  registerBtns.forEach((btn) =>
    btn.classList.toggle("is-active", !showLoginForm),
  );
}

// Show login form by default
function showLogin() {
  toggleAuthForm(true);
}

// Show registration form
function showRegister() {
  toggleAuthForm(false);
}

// Update UI after successful login
async function handleApiError(response) {
  let errorMessage;
  try {
    const errorData = await response.json();
    errorMessage =
      errorData.error || "Login failed. Please check your credentials.";

    if (response.status === 403) {
      if (/csrf/i.test(errorMessage)) {
        window.csrfToken = null;
        return showErrorAlert("Session expired. Please try logging in again.");
      }

      if (/verify your email/i.test(errorMessage)) {
        return showErrorAlert(
          "Please verify your email address before logging in. Check your inbox!",
        );
      }
    }
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

async function sendLoginRequest(email, password) {
  return fetch("/api/auth/login", {
    method: "POST",
    headers: await getJsonHeaders(),
    body: JSON.stringify({
      email: email,
      password: password,
    }),
  });
}

// Set user session cookie after successful login
async function finalizeLogin(userData, email) {
  const syncedSession = await refreshServerSession();
  const finalUser =
    syncedSession.logged_in && syncedSession.user
      ? syncedSession.user
      : {
          ...userData,
          email: userData.email || email,
        };

  setUserSessionCookie(finalUser);
  updateUIAfterLogin(finalUser);

  // Clear login form fields
  document.getElementById("login-email").value = "";
  document.getElementById("login-password").value = "";

  showSuccessAlert(`Welcome back, ${userData.username}!`);
  navigateTo("gallery", true);
}

function handleLoginNetworkError(error) {
  console.error("Network error:", error);

  if (error instanceof SyntaxError && error.message.includes("JSON")) {
    return showErrorAlert(
      "Server error. Please contact support or try again later.",
    );
  }

  return showErrorAlert("Connection error. Please try again.");
}

// Handle login from page form
async function loginCheck(event) {
  if (event) {
    event.preventDefault();
  }

  const email = document.getElementById("login-email")?.value;
  const password = document.getElementById("login-password")?.value;
  
  if (!email || !password) {
    return showErrorAlert("Please enter both email and password");
  }

  try {
    const response = await sendLoginRequest(email, password);

    if (!response.ok) {
      return handleApiError(response);
    }

    const data = await response.json();
    const userData = data.user || data;

    console.log("Login successful:", data);
    console.log("User data:", userData);

    await finalizeLogin(userData, email);
  } catch (error) {
    handleLoginNetworkError(error);
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
