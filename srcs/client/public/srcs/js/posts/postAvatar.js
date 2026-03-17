
// Set avatar src with default
function setAvatarSrc(img, src) {
  img.src = src;

  // If avatar fails to load, use default avatar
  img.onerror = () => {
    img.src = "assets/profile/default-avatar.png";
  };
}

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

// Refresh avatar of logged-in user
function refreshAllUserAvatars(username, previousUsername = null) {
  if (!username) {
    return;
  }

  const avatarUrl = buildAvatarUrl(username, Date.now());
  const matchingUsernames = new Set(
    [username, previousUsername].filter(Boolean),
  );

  const headerAvatar = document.getElementById("user-avatar-img");
  if (headerAvatar) {
    setAvatarSrc(headerAvatar, avatarUrl);
  }

  const profileAvatar = document.getElementById("profile-avatar-preview");
  if (profileAvatar) {
    setAvatarSrc(profileAvatar, avatarUrl);
  }

  // Post avatars that belong to this user
  document.querySelectorAll("[id^='post-avatar-']").forEach((img) => {
    const postHeader = img.closest(".post-header");
    const aliasElement = postHeader?.querySelector(".post-alias");
    const aliasRaw =
      aliasElement?.dataset?.rawAlias || aliasElement?.textContent?.trim();
    if (aliasElement && aliasRaw && matchingUsernames.has(aliasRaw)) {
      setAvatarSrc(img, avatarUrl);
    }
  });

  // Add comment avatars that belong to this user
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

function refreshAllUsername(oldUsername, newUsername) {
  if (!oldUsername || !newUsername) {
    return;
  }

  // Dashboard username
  const dashboardUsername = document.getElementById("dashboard-username");
  if (
    dashboardUsername &&
    dashboardUsername.textContent.trim() === oldUsername
  ) {
    dashboardUsername.textContent = newUsername;
  }

  // Post aliases that belong to this user
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

  // Comment authors that belong to this user
  document.querySelectorAll(".comment-author").forEach((el) => {
    if (el.textContent.trim() === oldUsername) {
      el.textContent = newUsername;
    }
  });
}
