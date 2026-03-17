// Sets the avatar image source, erroring to default
function setAvatarSrc(img, src) {
  img.src = src;

  img.onerror = () => {
    img.src = "assets/profile/default-avatar.png";
  };
}

// Builds the avatar URL for a given username
function buildAvatarUrl(username, version) {
  if (!username) {
    return "assets/profile/default-avatar.png";
  }
  if (!window._avatarCacheVersion) {
    window._avatarCacheVersion = Date.now();
  }
  const cacheVersion = version || window._avatarCacheVersion;
  return `/api/avatar/${encodeURIComponent(username)}?ts=${cacheVersion}`;
}

// Refreshes all avatar images in the UI for the given username
function refreshAllUserAvatars(username, previousUsername = null) {
  const avatarUrl = buildAvatarUrl(username, Date.now());
  const matchingUsernames = new Set(
    [username, previousUsername].filter(Boolean),
  );

  // Update header avatar
  const headerAvatar = document.getElementById("user-avatar-img");
  if (headerAvatar) {
    setAvatarSrc(headerAvatar, avatarUrl);
  }

  // Update profile avatar
  const profileAvatar = document.getElementById("profile-avatar-preview");
  if (profileAvatar) {
    setAvatarSrc(profileAvatar, avatarUrl);
  }

  // Update post avatars that belong to this user
  document.querySelectorAll("[id^='post-avatar-']").forEach((img) => {
    const postHeader = img.closest(".post-header");
    const aliasElement = postHeader?.querySelector(".post-alias");
    const aliasRaw =
      aliasElement?.dataset?.rawAlias || aliasElement?.textContent?.trim();
    if (aliasElement && aliasRaw && matchingUsernames.has(aliasRaw)) {
      setAvatarSrc(img, avatarUrl);
    }
  });

  // Update comment avatars that belong to this user
  document.querySelectorAll(".add-comment-avatar").forEach((img) => {
    setAvatarSrc(img, avatarUrl);
  });

  document.querySelectorAll(".comment-avatar-wrapper").forEach((wrapper) => {
    const authorEl = wrapper.querySelector(".comment-author");
    const avatarImg = wrapper.querySelector(".post-avatar");
    if (
      authorEl &&
      avatarImg &&
      matchingUsernames.has(authorEl.textContent.trim())
    ) {
      setAvatarSrc(avatarImg, avatarUrl);
    }
  });
}

// Refreshes all username displays in the UI after a username change
function refreshAllUsername(oldUsername, newUsername) {
  if (!oldUsername || !newUsername) {
    return;
  }

  // Update dashboard username
  const dashboardUsername = document.getElementById("dashboard-username");
  if (
    dashboardUsername &&
    dashboardUsername.textContent.trim() === oldUsername
  ) {
    dashboardUsername.textContent = newUsername;
  }

  // Update post aliases that belong to this user
  document.querySelectorAll(`[id^='post-alias-']`).forEach((el) => {
    const rawAlias = el.dataset.rawAlias || el.textContent.trim();
    if (rawAlias === oldUsername) {
      const session = getUserSession();
      const isCurrentUser =
        session &&
        session.logged_in &&
        Number(session.user_id) === Number(el.dataset.ownerId);

      el.dataset.rawAlias = newUsername;
      el.innerHTML = isCurrentUser
        ? `${newUsername} <i class="fa-solid fa-child-reaching" style="color: #486EE3;"></i>`
        : newUsername;
    }
  });

  // Update comment authors that belong to this user
  document.querySelectorAll(".comment-author").forEach((el) => {
    if (el.textContent.trim() === oldUsername) {
      el.textContent = newUsername;
    }
  });
}
