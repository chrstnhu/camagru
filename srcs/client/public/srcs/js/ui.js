// Define navigateTo function first and make it globally available
function navigateTo(viewId, push) {
    console.log("🚀 Navigating to:", viewId, "push =", push);

    const views = [
        "login",
        "sign-in",
        "login-fail",
        "home",
        "camera-section",
        "gallery",
        "myPhotos",
    ];
    const target = document.getElementById(viewId);

    console.log("🎯 Target element:", target);

    if (target) {
        // Hide all views first
        views.forEach((v) => {
            const view = document.getElementById(v);
            if (view) {
                view.style.display = "none";
            }
        });

        // Show the target view
        target.style.display = "block";

        // Special handling for camera section - dispatch custom event
        if (viewId === "camera-section") {
            // Create and dispatch a custom event that capturePhoto.js can listen for
            const event = new CustomEvent("cameraViewActivated");
            document.dispatchEvent(event);
        }
    } else {
        console.error(`❌ Target element '${viewId}' not found!`);
    }

    // Navigate to the target view
    if (push) {
        history.pushState({ viewId: viewId }, "", `#${viewId}`);
    }
}

// Make navigateTo available globally immediately
window.navigateTo = navigateTo;