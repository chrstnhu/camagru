// Clears all fields and resets the register form
function clearRegisterForm() {
  document.getElementById("register-username").value = "";
  document.getElementById("register-email").value = "";
  document.getElementById("register-password").value = "";
  document.getElementById("register-confirm-password").value = "";
  document.getElementById("terms-agreement").checked = false;

  // Reset avatar preview
  const avatarPreview = document.getElementById("register-avatar-preview");
  if (avatarPreview) {
    avatarPreview.src = "assets/profile/default-avatar.png";
  }
  const avatarInput = document.getElementById("register-avatar");
  if (avatarInput) {
    avatarInput.value = "";
  }
  window._registerAvatarData = null;
}

// Checks if the password and confirmation match
function checkPasswordMatch(password, confirmPassword) {
  if (password !== confirmPassword) {
    showErrorAlert("Passwords do not match!");
    return false;
  }

  if (password.length < 8) {
    showErrorAlert("Password must be at least 8 characters long!");
    return false;
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    showErrorAlert(
      "Password must contain at least 1 uppercase , 1 lowercase and 1 number!",
    );
    return false;
  }
  return true;
}

// Validates the username and email format on the client side
function validateRegisterIdentity(username, email) {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  if (!usernameRegex.test(username)) {
    showErrorAlert(
      "Username must be 3-20 characters with only letters, numbers, _ and -.",
    );
    return false;
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    showInfoAlert("Please enter a valid email address!");
    return false;
  }

  return true;
}

// Runs all client-side validations for the registration form
function checkClientSideValidation(
  username,
  email,
  password,
  confirmPassword,
  termsAgreed,
) {
  if (!username || !email || !password || !confirmPassword) {
    showInfoAlert("Please fill in all fields!");
    return false;
  }

  if (!validateRegisterIdentity(username, email)) {
    return false;
  }

  if (!checkPasswordMatch(password, confirmPassword)) {
    return false;
  }

  if (!termsAgreed) {
    showErrorAlert("You must agree to the terms and conditions!");
    return false;
  }

  return true;
}

// Sends the registration request to the backend API
async function sendRegisterRequest(username, email, password) {
  return fetch("/api/auth/register", {
    method: "POST",
    headers: await getJsonHeaders(),
    body: JSON.stringify({
      username: username,
      email: email,
      password: password,
      avatar_data: window._registerAvatarData || null,
    }),
  });
}

// Handles API errors from the registration request and displays appropriate messages
async function handleRegisterApiError(response) {
  let errorMessage;

  try {
    const errorData = await response.json();
    errorMessage = errorData.error || `Server error: ${response.status}`;
  } catch (e) {
    const errorText = await response.text();
    // console.error(
    //   "Server returned non-JSON response:",
    //   errorText.substring(0, 200),
    // );
    errorMessage = `Server error (${response.status}): ${response.statusText}`;
  }

  return showErrorAlert(errorMessage);
}

// Handles the registration form submission, validates input, and processes registration
async function registerCheck(event) {
  if (event) {
    event.preventDefault();
  }

  const username = document.getElementById("register-username")?.value;
  const email = document.getElementById("register-email")?.value;
  const password = document.getElementById("register-password")?.value;
  const confirmPassword = document.getElementById(
    "register-confirm-password",
  )?.value;
  const termsAgreed = document.getElementById("terms-agreement")?.checked;

  if (
    !checkClientSideValidation(
      username,
      email,
      password,
      confirmPassword,
      termsAgreed,
    )
  ) {
    return;
  }

  try {
    const response = await sendRegisterRequest(username, email, password);

    if (!response.ok) {
      return handleRegisterApiError(response);
    }
    clearRegisterForm();
    showSuccessAlert("Account created. Check your email to verify it.");
    showLogin();
  } catch (error) {
    // console.error("Registration error:", error);
    showErrorAlert("Connection error. Please try again.");
  }
}

// Sets up the eye icon toggle for password visibility
function setupEyeToggle(inputId, eyeId) {
  const input = document.getElementById(inputId);
  const eye = document.getElementById(eyeId);
  if (!input || !eye) {
    return;
  }

  eye.addEventListener("click", () => {
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    eye.classList.toggle("fa-eye", !isHidden);
    eye.classList.toggle("fa-eye-slash", isHidden);
  });
}

// Sets up password visibility toggles and real-time password match validation rm
function setupRegisterPasswordToggles() {
  setupEyeToggle("register-password", "register-password-eye");
  setupEyeToggle("register-confirm-password", "register-confirm-password-eye");

  // Real-time password match validation
  const passwordInput = document.getElementById("register-password");
  const confirmInput = document.getElementById("register-confirm-password");

  if (confirmInput && passwordInput) {
    confirmInput.addEventListener("input", () => {
      const mismatch =
        confirmInput.value !== "" && confirmInput.value !== passwordInput.value;
      confirmInput.setCustomValidity(mismatch ? "Passwords do not match" : "");
    });
  }
}

// Initializes the register form and avatar preview on DOM load
document.addEventListener("DOMContentLoaded", () => {
  setupRegisterPasswordToggles();

  const avatarInput = document.getElementById("register-avatar");
  if (avatarInput) {
    avatarInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) {
        return;
      }
      if (!file.type.startsWith("image/")) {
        return showInfoAlert("Please select a valid image file");
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        document.getElementById("register-avatar-preview").src =
          ev.target.result;
        window._registerAvatarData = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
});
