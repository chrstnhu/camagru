// Checks the validity of the current and new password fields
function checkPassword(currentPassword, password, confirmPassword) {
  if (!currentPassword) {
    showErrorAlert("Please enter your current password!");
    return false;
  }

  if (!password) {
    showErrorAlert("Please enter a new password!");
    return false;
  }

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
      "Password must contain at least 1 uppercase, 1 lowercase and 1 number!",
    );
    return false;
  }
  return true;
}

// Clears the password fields in the profile form
function clearPasswordFields() {
  document.getElementById("profile-current-password").value = "";
  document.getElementById("profile-password").value = "";
  document.getElementById("profile-confirm-password").value = "";
}

// Handles the password update form submission and updates the password via API
async function submitPasswordForm(e) {
  e.preventDefault();
  const current = document.getElementById("profile-current-password").value;
  const password = document.getElementById("profile-password").value;
  const confirm = document.getElementById("profile-confirm-password").value;

  if (!checkPassword(current, password, confirm)) {
    return;
  }

  try {
    const response = await fetch("/api/user/profile/password", {
      method: "POST",
      headers: await getJsonHeaders(),
      body: JSON.stringify({
        current_password: current,
        new_password: password,
      }),
    });
    const data = await response.json();
    if (!response.ok)
      return showErrorAlert(data.error || "Failed to update password");
    clearPasswordFields();
    showSuccessAlert("Password updated successfully!");
  } catch (error) {
    // console.error("Error updating password:", error);
    showErrorAlert("Network error. Please try again.");
  }
}

// Binds the password form submit event on DOM load
document.addEventListener("DOMContentLoaded", () => {
  const profileForm = document.getElementById("profile-form-password");
  if (profileForm) {
    profileForm.addEventListener("submit", submitPasswordForm);
  }
});
