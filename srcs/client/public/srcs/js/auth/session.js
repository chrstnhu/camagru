// Session and Profile Management

// Update UI after successful login
function updateUIAfterLogin(userData) {
  // Show user profile
  const userProfile = document.getElementById("user-profile");
  if (userProfile) {
    userProfile.style.display = "flex";
  }

  // Active camera menu
  const camera = document.getElementById("camera-nav");
  if (camera) {
    camera.classList.remove("disabled");
    camera.style.opacity = "1";
    camera.style.cursor = "pointer";
    camera.onclick = () => navigateTo("camera-section", true);
  }

  // Active My Photos menu
  const myPostsNav = document.getElementById("my-posts-nav");
  if (myPostsNav) {
    myPostsNav.classList.remove("disabled");
    myPostsNav.style.opacity = "1";
    myPostsNav.style.cursor = "pointer";
    myPostsNav.onclick = () => navigateTo("my-posts", true);
  }

  // Store username globally for other scripts
  window.currentUser = userData;

  refreshAllUserAvatars(userData.username);
}

// Get user session from cookie
function getUserSession() {
  const cookies = document.cookie.split("; ");
  const sessionCookie = cookies.find((cookie) =>
    cookie.startsWith("user_session="),
  );

  if (sessionCookie) {
    try {
      const sessionData = sessionCookie.split("=")[1];
      const parsedData = JSON.parse(decodeURIComponent(sessionData));
      // console.log("Parsed session data:", parsedData);
      return parsedData;
    } catch (error) {
      console.error("❌ Error parsing session cookie:", error);
      return null;
    }
  }
  return null;
}

// Logout function
async function logout() {
  // Clear session cookie and user
  document.cookie = "user_session=; path=/; max-age=0";
  window.currentUser = null;

  // // Reset header avatar to default
  // const avatarImg = document.getElementById("user-avatar-img");
  // if (avatarImg) {
  //   avatarImg.src = "assets/profile/default-avatar.png";
  // }

  // Update UI
  const userProfile = document.getElementById("user-profile");
  if (userProfile) {
    userProfile.style.display = "none";
  }

  // Desactivate my photos menu
  const myPostsNav = document.getElementById("my-posts-nav");
  if (myPostsNav) {
    myPostsNav.classList.add("disabled");
    myPostsNav.style.opacity = "0.5";
    myPostsNav.style.cursor = "not-allowed";
    myPostsNav.onclick = (e) => {
      e.preventDefault();
      showErrorAlert("Please login to access your photos");
    };
  }

  const camera = document.getElementById("camera-nav");
  if (camera) {
    camera.classList.add("disabled");
    camera.style.opacity = "0.5";
    camera.style.cursor = "not-allowed";
    camera.onclick = (e) => {
      e.preventDefault();
      showErrorAlert("Please login to access camera");
    };
  }
  
  navigateTo("home", true);
  updateHomeDashboard();
}

// Function to update home page dashboard based on login status
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

// Setup profile dropdown hover/click behavior
function setupProfileDropdown() {
  const profileBox = document.querySelector(".user-profile");
  const profileAvatar = document.querySelector(".user-avatar");
  if (!profileBox || !profileAvatar) return;

  profileBox.addEventListener("mouseenter", () =>
    profileBox.classList.add("show"),
  );
  profileBox.addEventListener("mouseleave", () =>
    profileBox.classList.remove("show"),
  );
  profileAvatar.addEventListener("click", (e) => {
    e.stopPropagation();
    profileBox.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!profileBox.contains(e.target)) {
      profileBox.classList.remove("show");
    }
  });
}

// Check if user is already logged in on page load
document.addEventListener("DOMContentLoaded", () => {
  const session = getUserSession();
  if (session && session.logged_in) {
    updateUIAfterLogin(session);
  }
  updateHomeDashboard();
  setupProfileDropdown();
});
