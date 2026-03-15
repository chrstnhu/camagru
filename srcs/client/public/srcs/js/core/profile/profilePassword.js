// Handle profile form submission
document.addEventListener("DOMContentLoaded", () => {
  const profileForm = document.getElementById("profile-form-password");

  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const currentPassword = document.getElementById(
        "profile-current-password",
      ).value;
      const password = document.getElementById("profile-password").value;
      const confirmPassword = document.getElementById(
        "profile-confirm-password",
      ).value;

      if (!currentPassword) {
        return showErrorAlert("Please enter your current password!");
      }

      if (!password) {
        return showErrorAlert("Please enter a new password!");
      }

      if (password !== confirmPassword) {
        return showErrorAlert("Passwords do not match!");
      }

      if (password.length < 8) {
        return showErrorAlert("Password must be at least 8 characters long!");
      }

      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);

      if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        return showErrorAlert(
          "Password must contain at least one uppercase letter, one lowercase letter, and one number!",
        );
      }

      try {
        const response = await fetch("/api/user/profile/password", {
          method: "POST",
          headers: await getJsonHeaders(),
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return showErrorAlert(data.error || "Failed to update password");
        }

        // Clear password fields
        document.getElementById("profile-current-password").value = "";
        document.getElementById("profile-password").value = "";
        document.getElementById("profile-confirm-password").value = "";
        showSuccessAlert("Password updated successfully!");
      } catch (error) {
        console.error("Error updating password:", error);
        showErrorAlert("Network error. Please try again.");
      }
    });
  }
});
