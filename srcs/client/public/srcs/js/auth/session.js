window.csrfToken = null;

// Sets the user session cookie with user data
function setUserSessionCookie(userData) {
  document.cookie = `user_session=${encodeURIComponent(
    JSON.stringify({
      user_id: userData.id || userData.user_id,
      username: userData.username,
      email: userData.email,
      notification_enabled: userData.notification_enabled ?? true,
      logged_in: true,
    }),
  )}; path=/; max-age=3600; SameSite=Lax`;
}

// Refreshes the user session cookie and CSRF token from the server
async function refreshServerSession() {
  const response = await fetch("/api/user/status");
  const data = await response.json();

  if (data.csrf_token) {
    window.csrfToken = data.csrf_token;
  }

  if (data.logged_in && data.user) {
    setUserSessionCookie(data.user);
  } else {
    document.cookie = "user_session=; path=/; max-age=0; SameSite=Lax";
  }

  return data;
}

// Returns JSON headers with CSRF token, refreshing session if needed
async function getJsonHeaders() {
  if (!window.csrfToken) {
    await refreshServerSession();
  }

  return {
    "Content-Type": "application/json",
    "X-CSRF-Token": window.csrfToken || "",
  };
}

// Handles unauthorized responses by resyncing session and updating UI
async function handleUnauthorizedResponse(defaultMessage) {
  try {
    const data = await refreshServerSession();
    if (!data.logged_in) {
      applyLoggedOutState();
      updateHomeDashboard();
    }
  } catch (error) {
    console.error("Auth resync error:", error);
    applyLoggedOutState();
    updateHomeDashboard();
  }

  showErrorAlert(
    defaultMessage || "Your session has expired. Please log in again.",
  );
}

// Applies the logged-out state to the UI and clears session data
function applyLoggedOutState() {
  document.cookie = "user_session=; path=/; max-age=0; SameSite=Lax";

  window.currentUser = null;
  window.csrfToken = null;

  const userProfile = document.getElementById("user-profile");
  if (userProfile) {
    userProfile.style.display = "none";
  }

  const myPostsNav = document.getElementById("my-posts-nav");
  if (myPostsNav) {
    myPostsNav.classList.add("is-disabled");
    myPostsNav.style.opacity = "0.5";
    myPostsNav.style.cursor = "not-allowed";
    myPostsNav.onclick = (e) => {
      e.preventDefault();
      showErrorAlert("Please login to access your photos");
    };
  }

  const camera = document.getElementById("camera-nav");
  if (camera) {
    camera.classList.add("is-disabled");
    camera.style.opacity = "0.5";
    camera.style.cursor = "not-allowed";
    camera.onclick = (e) => {
      e.preventDefault();
      showErrorAlert("Please login to access camera");
    };
  }
}

// Updates the UI after a successful login and stores user data
function updateUIAfterLogin(userData) {
  const userProfile = document.getElementById("user-profile");
  if (userProfile) {
    userProfile.style.display = "flex";
  }

  // Active camera menu
  const camera = document.getElementById("camera-nav");
  if (camera) {
    camera.classList.remove("is-disabled");
    camera.style.opacity = "1";
    camera.style.cursor = "pointer";
    camera.onclick = () => navigateTo("camera-section", true);
  }

  // Active My Photos menu
  const myPostsNav = document.getElementById("my-posts-nav");
  if (myPostsNav) {
    myPostsNav.classList.remove("is-disabled");
    myPostsNav.style.opacity = "1";
    myPostsNav.style.cursor = "pointer";
    myPostsNav.onclick = () => navigateTo("my-posts", true);
  }

  // Store username globally for other scripts
  window.currentUser = userData;
  setUserSessionCookie(userData);

  refreshAllUserAvatars(userData.username);
}

// Retrieves the user session from the session cookie
function getUserSession() {
  const cookies = document.cookie.split("; ");
  const sessionCookie = cookies.find((cookie) =>
    cookie.startsWith("user_session="),
  );

  if (sessionCookie) {
    try {
      const sessionData = sessionCookie.split("=")[1];
      const parsedData = JSON.parse(decodeURIComponent(sessionData));
      return parsedData;
    } catch (error) {
      console.error("❌ Error parsing session cookie:", error);
      return null;
    }
  }
  return null;
}

// Logs out the user, clears session, and updates UI
async function logout() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: await getJsonHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      showErrorAlert(data.error || "Logout failed");
      return;
    }
  } catch (error) {
    console.error("Logout error:", error);
    showErrorAlert("Logout failed. Please try again.");
    return;
  }

  applyLoggedOutState();
  navigateTo("home", true);
  updateHomeDashboard();
}

// Updates the home page dashboard based on login status
function updateHomeDashboard() {
  const session = getUserSession();
  const welcomeDashboard = document.getElementById("welcome-dashboard");
  const loginSection = document.getElementById("login-section");
  const registerSection = document.getElementById("register-section");
  const dashboardUsername = document.getElementById("dashboard-username");

  // User is logged in - show dashboard
  if (session && session.logged_in) {
    if (welcomeDashboard && loginSection && registerSection) {
      welcomeDashboard.style.display = "block";
      loginSection.style.display = "none";
      registerSection.style.display = "none";

      if (dashboardUsername) {
        dashboardUsername.textContent = session.username || "User";
      }
    }
  } else {
    if (welcomeDashboard && loginSection) {
      welcomeDashboard.style.display = "none";
      loginSection.style.display = "block";
      if (registerSection) {
        registerSection.style.display = "none";
      }
    }
  }
}

// Sets up the profile dropdown menu hover and click behavior
function setupProfileDropdown() {
  const profileBox = document.querySelector(".user-profile");
  const profileAvatar = document.querySelector(".user-avatar");
  if (!profileBox || !profileAvatar) {
    return;
  }

  profileBox.addEventListener("mouseenter", () =>
    profileBox.classList.add("is-open"),
  );
  profileBox.addEventListener("mouseleave", () =>
    profileBox.classList.remove("is-open"),
  );
  profileAvatar.addEventListener("click", (e) => {
    e.stopPropagation();
    profileBox.classList.toggle("is-open");
  });

  document.addEventListener("click", (e) => {
    if (!profileBox.contains(e.target)) {
      profileBox.classList.remove("is-open");
    }
  });
}

// Checks if user is already logged in and initializes UI on DOM load
document.addEventListener("DOMContentLoaded", () => {
  refreshServerSession()
    .then((data) => {
      if (data.logged_in && data.user) {
        updateUIAfterLogin(data.user);
      } else {
        applyLoggedOutState();
      }
    })
    .catch((error) => {
      console.error("Session sync error:", error);
      const session = getUserSession();
      if (session && session.logged_in) {
        updateUIAfterLogin(session);
      } else {
        applyLoggedOutState();
      }
    })
    .finally(() => {
      updateHomeDashboard();
      setupProfileDropdown();
    });
});
