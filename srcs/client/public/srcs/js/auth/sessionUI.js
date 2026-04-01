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
      showInfoAlert("Please login to access your photos");
    };
  }

  const camera = document.getElementById("camera-nav");
  if (camera) {
    camera.classList.add("is-disabled");
    camera.style.opacity = "0.5";
    camera.style.cursor = "not-allowed";
    camera.onclick = (e) => {
      e.preventDefault();
      showInfoAlert("Please login to access camera");
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
      // console.error("Session sync error:", error);
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
