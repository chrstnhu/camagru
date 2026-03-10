function updatePageView(viewId, target) {
  if (viewId === "my-posts") {
    const postComponent = target.querySelector(".post-component");
    if (postComponent) {
      postComponent.innerHTML = "";
    }
    initializeMyPosts();
  }

  // Gallery section - reload only if user changed
  if (viewId === "gallery") {
    const session = getUserSession();
    const currentUser = session?.username || null;
    if (window._lastGalleryUser !== currentUser) {
      const postComponent = document.getElementById("post-component");
      if (postComponent) {
        postComponent.innerHTML = "";
      }
      initializepostsData();
      window._lastGalleryUser = currentUser;
    }
  }

  if (viewId === "home") {
    updateHomeDashboard();
  }

  if (viewId === "profile") {
    loadUserProfile();
  }
}

// Define navigateTo
function navigateTo(viewId, push) {
  console.log("🚀 Navigating to:", viewId, "push =", push);

  const views = [
    "login-fail",
    "home",
    "camera-section",
    "gallery",
    "myPhotos",
    "my-posts",
    "profile",
  ];

  // Routes that require authentication
  const protectedRoutes = ["my-posts", "profile", "camera-section"];

  // Check if route requires authentication
  if (protectedRoutes.includes(viewId)) {
    const session = getUserSession();
    if (!session || !session.logged_in) {
      console.warn("🔒 Access denied: not logged in for route", viewId);
      history.replaceState({ viewId: "home" }, "", "#home");
      navigateTo("home", false);
      showErrorAlert("Please login to access this page");
      return;
    }
  }

  const target = document.getElementById(viewId);

  console.log("🎯 Target element:", target);

  if (target) {
    // Hide all views
    views.forEach((v) => {
      const view = document.getElementById(v);
      if (view) {
        view.style.display = "none";
      }
    });

    // Show the target view
    target.style.display = "block";

    updatePageView(viewId, target);

    // camera section - dispatch custom event
    if (viewId === "camera-section") {
      const event = new CustomEvent("cameraViewActivated");
      document.dispatchEvent(event);
    }
  } else {
    console.error(`❌ Target element '${viewId}' not found!`);
    history.replaceState({ viewId: "home" }, "", "#home");
    showErrorAlert("Page not found");
    navigateTo("home", false);
  }

  // Navigate to the target view
  if (push) {
    history.pushState({ viewId: viewId }, "", `#${viewId}`);
  }
}

// Handle browser back/forward buttons
window.addEventListener("popstate", (event) => {
  if (event.state && event.state.viewId) {
    navigateTo(event.state.viewId, false);
  } else {
    navigateTo("home", false);
  }
});

// Handle hash change (when user types a new hash in the URL bar)
window.addEventListener("hashchange", () => {
  const hash = window.location.hash.replace("#", "");
  if (hash) {
    navigateTo(hash, false);
  }
});

// Handle direct URL access with hash on page load
document.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash.replace("#", "");
  if (hash) {
    // Delay to let session initialization complete first
    setTimeout(() => {
      navigateTo(hash, false);
    }, 300);
  } else {
    navigateTo("home", false);
  }
});
