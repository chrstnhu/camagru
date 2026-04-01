
// Handles the login form submission, validates input, and processes login
async function loginCheck(event) {
  if (event) {
    event.preventDefault();
  }

  const email = document.getElementById("login-email")?.value;
  const password = document.getElementById("login-password")?.value;

  if (!email || !password) {
    return showInfoAlert("Please enter both email and password");
  }

  try {
    const response = await sendLoginRequest(email, password);

    if (!response.ok) {
      return handleApiError(response);
    }

    const data = await response.json();
    const userData = data.user || data;

    await finalizeLogin(userData, email);
  } catch (error) {
    handleLoginNetworkError(error);
  }
}

// Sends the login request to the backend API
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

// Handles API errors from the login request and displays appropriate messages
async function handleApiError(response) {
  let errorMessage;
  try {
    const errorData = await response.json();
    errorMessage =
      errorData.error || "Login failed. Please check your credentials.";

    // Handle specific error cases based on status code and message content
    if (response.status === 400) {
      return showInfoAlert("Identifiants incorrects. Please try again.") ;
    }
    if (response.status === 403) {
      if (/csrf/i.test(errorMessage)) {
        window.csrfToken = null;
        return showInfoAlert("Session expired. Please try logging in again.");
      }

      if (/verify your email/i.test(errorMessage)) {
        return showInfoAlert(
          "Please verify your email address before logging in. Check your inbox!",
        );
      }
    }
  } catch (e) {
    const errorText = await response.text();
    errorMessage = `Server error (${response.status}): ${response.statusText}`;
  }
  return showErrorAlert(errorMessage);
}

// Sets the user session cookie and updates UI after successful login
async function finalizeLogin(userData, email) {
  const syncedSession = await refreshServerSession();
  const finalUser =
    syncedSession.logged_in && syncedSession.user
      ? syncedSession.user
      : { ...userData, email: userData.email || email };

  setUserSessionCookie(finalUser);
  updateUIAfterLogin(finalUser);

  // Clear login form fields
  document.getElementById("login-email").value = "";
  document.getElementById("login-password").value = "";

  showSuccessAlert(`Welcome back, ${userData.username}!`);
  navigateTo("gallery", true);
}

// Handles network errors during login and displays error messages
function handleLoginNetworkError(error) {
  if (error instanceof SyntaxError && error.message.includes("JSON")) {
    return showErrorAlert(
      "Server error. Please contact support or try again later.",
    );
  }
  return showErrorAlert("Connection error. Please try again.");
}

// Switches between login and register forms
function toggleAuthForm(showLoginForm) {
  const loginSection = document.getElementById("login-section");
  const registerSection = document.getElementById("register-section");
  const loginBtns = document.querySelectorAll(".login-component-btn");
  const registerBtns = document.querySelectorAll(".register-component-btn");

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

// Shows the login form by default
function showLogin() {
  toggleAuthForm(true);
}

// Shows the registration form
function showRegister() {
  toggleAuthForm(false);
}

// Sets up the password visibility toggle for the login form
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
