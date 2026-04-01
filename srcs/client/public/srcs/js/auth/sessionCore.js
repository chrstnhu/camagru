window.csrfToken = null;

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
    // console.error("Logout error:", error);
    showErrorAlert("Logout failed. Please try again.");
    return;
  }

  applyLoggedOutState();
  navigateTo("home", true);
  updateHomeDashboard();
}


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
    // console.error("Auth resync error:", error);
    applyLoggedOutState();
    updateHomeDashboard();
  }

  showInfoAlert(
    defaultMessage || "Your session has expired. Please log in again.",
  );
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
      // console.error("❌ Error parsing session cookie:", error);
      showErrorAlert("Session error. Please log in again.");
      return null;
    }
  }
  return null;
}

