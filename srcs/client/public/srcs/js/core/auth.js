// Handles user login by sending credentials to the backend
async function login(username, password) {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Show user avatar
      if (typeof updateUIAfterLogin === "function") {
        updateUIAfterLogin({ username: username });
      }
      showSuccessAlert("Login successful!");
      return true;
    } else {
      showErrorAlert(data.error || "Login failed");
      return false;
    }
  } catch (error) {
    // console.error("Login error:", error);
    showErrorAlert("An error occurred during login. Please try again.");
    return false;
  }
}

// Handles user logout by calling the backend and showing an alert
async function logout() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    const data = await response.json();

    if (data.success) {
      showSuccessAlert("Logout successful!");
    }
  } catch (error) {
    // console.error("Logout error:", error);
    showErrorAlert("An error occurred during logout. Please try again.");
  }
}

// Handles user registration by sending data to the backend
async function register(username, email, password) {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (data.success) {
      showSuccessAlert("Registration successful! You can now login.");
      return true;
    } else {
      showErrorAlert(data.error || "Registration failed");
      return false;
    }
  } catch (error) {
    showErrorAlert("Registration error: " + error.message);
    return false;
  }
}

// Checks if the user is logged in and refreshes the session
async function checkUserStatus() {
  try {
    if (typeof refreshServerSession === "function") {
      await refreshServerSession();
    }
  } catch (error) {
    // console.error("Error checking user status:", error);
    showErrorAlert("An error occurred while checking user status. Please try again.");
  }
}

// Retrieves the logged-in user ID from the session cookie
function getLoggedInUserId() {
  const cookies = document.cookie.split("; ");
  const sessionCookie = cookies.find((cookie) =>
    cookie.startsWith("user_session="),
  );

  if (!sessionCookie) {
    return null;
  }

  try {
    const sessionData = sessionCookie.split("=")[1];
    const session = JSON.parse(decodeURIComponent(sessionData));
    return session.user_id || null;
  } catch (error) {
    // console.error("❌ Error parsing session cookie:", error);
    showErrorAlert("An error occurred while parsing session data. Please try again.");
    return null;
  }
}

// Checks user status on DOM load
document.addEventListener("DOMContentLoaded", function () {
  checkUserStatus();
});
