// Updates the main page view based on the given viewId and target element
function updatePageView(viewId, target) {
  if (viewId === "my-posts") {
    initMyPosts();
  }

  // Gallery section - reload only if user changed
  if (viewId === "gallery") {
    const session = getUserSession();
    const currentUser = session?.username || null;
    const postComponent = document.getElementById("post-component");
    const shouldReloadGallery =
      window._galleryNeedsRefresh === true ||
      window._lastGalleryUser !== currentUser ||
      !postComponent ||
      postComponent.childElementCount === 0;

    if (shouldReloadGallery) {
      const postComponent = document.getElementById("post-component");
      if (postComponent) {
        postComponent.innerHTML = "";
      }
      if (typeof window.initPostsData === "function") {
        window.initPostsData();
      } else {
        console.error("initPostsData is not available on window");
      }
      window._lastGalleryUser = currentUser;
      window._galleryNeedsRefresh = false;
    }
  }

  if (viewId === "home") {
    updateHomeDashboard();
  }

  if (viewId === "profile") {
    loadUserProfile();
  }
}

// Checks if the given route requires authentication and redirects if not logged in
function needAuthentificationRoute(viewId) {
  const protectedRoutes = ["my-posts", "profile", "camera-section"];

  if (protectedRoutes.includes(viewId)) {
    const session = getUserSession();
    if (!session || !session.logged_in) {
      console.warn("🔒 Access denied: not logged in for route", viewId);
      history.replaceState({ viewId: "home" }, "", "#home");
      navigateTo("home", false);
      showErrorAlert("Please login to access this page");
      return false;
    }
  }
  return true;
}

// Navigates to the specified view, manages history, and updates the UI
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

  if (!needAuthentificationRoute(viewId)) {
    return;
  }

  const target = document.getElementById(viewId);

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

// Handles browser back/forward navigation events
window.addEventListener("popstate", (event) => {
  if (event.state && event.state.viewId) {
    navigateTo(event.state.viewId, false);
  } else {
    navigateTo("home", false);
  }
});

// Handles hash changes in the URL bar to navigate to the correct view
window.addEventListener("hashchange", () => {
  const hash = window.location.hash.replace("#", "");
  if (hash) {
    navigateTo(hash, false);
  }
});

// Handles direct URL access with hash on initial page load
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
