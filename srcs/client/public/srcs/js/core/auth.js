// Check if user is logged in
async function checkUserStatus() {
  try {
    const response = await fetch("/api/user/status");
    const data = await response.json();

    if (data.logged_in) {
      showUserAvatar(data.user ? data.user.username : "User");
    }
  } catch (error) {
    console.error("Error checking user status:", error);
  }
}

// Show user profile and hide login button
function showUserAvatar(username) {
  const userProfile = document.getElementById("user-profile");

  if (userProfile) {
    userProfile.style.display = "block";
  }

  const myPostsNav = document.getElementById("my-posts-nav");
  if (myPostsNav) {
    myPostsNav.onclick = () => navigateTo("my-posts", true);
  }

  fetch("/api/user/avatar")
    .then((response) => response.json())
    .then((data) => {
      if (data.avatar_url) {
        document.getElementById("user-avatar").src = data.avatar_url;
      }
    })
    .catch((error) => {
      console.error("Error fetching avatar:", error);
    });
}

// Handle login
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
      showUserAvatar(data.user.username);
      showSuccessAlert("Login successful!");
      return true;
    } else {
      showErrorAlert(data.error || "Login failed");
      return false;
    }
  } catch (error) {
    console.error("Login error:", error);
    return false;
  }
}

// Handle logout
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
    console.error("Logout error:", error);
  }
}

// Handle registration
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

// Get logged-in user ID from session cookie
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
    console.error("❌ Error parsing session cookie:", error);
    return null;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  checkUserStatus();
});