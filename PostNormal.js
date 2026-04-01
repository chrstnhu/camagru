// Common functions shared between post.js and myPhotos.js

var objJson = [];
let postsPerPage = 2;
let currentPage = 1;

// Show custom confirmation popup
function showConfirmPopup(title, message) {
  return new Promise((resolve) => {
    // Remove existing popup if any
    const existingOverlay = document.getElementById("confirm-popup-overlay");
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "confirm-popup-overlay";
    overlay.className = "confirm-popup-overlay";

    // Create popup HTML
    overlay.innerHTML = `
      <div class="confirm-popup">
        <div class="confirm-popup-header">
          <i class="fa-solid fa-triangle-exclamation" style="color: #e74c3c"></i>
          <h3>${title}</h3>
        </div>
        <div class="confirm-popup-msg">
          ${message}
        </div>
        <div class="confirm-popup-btn">
          <button class="confirm-popup-btn confirm-popup-btn-cancel" id="confirm-cancel-btn">
            <i class="fa-solid fa-times"></i> Cancel
          </button>
          <button class="confirm-popup-btn confirm-popup-btn-confirm" id="confirm-ok-btn" style="background: #e74c3c">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Animate in
    setTimeout(() => overlay.classList.add("is-active"), 10);

    // Handle buttons
    const cancelBtn = document.getElementById("confirm-cancel-btn");
    const okBtn = document.getElementById("confirm-ok-btn");

    const cleanup = (result) => {
      overlay.classList.remove("is-active");
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 300);
    };

    cancelBtn.addEventListener("click", () => cleanup(false));
    okBtn.addEventListener("click", () => cleanup(true));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup(false);
    });
  });
}

async function refreshDeletedImageViews() {
  invalidatePostViews();

  if (typeof loadCameraGallery === "function") {
    try {
      await loadCameraGallery();
    } catch (error) {
      console.error("Error refreshing camera gallery:", error);
    }
  }

  const gallerySection = document.getElementById("gallery");
  if (
    gallerySection &&
    gallerySection.style.display !== "none" &&
    typeof window.initpostsData === "function"
  ) {
    await window.initpostsData();
  }

  const myPostsSection = document.getElementById("my-posts");
  if (
    myPostsSection &&
    myPostsSection.style.display !== "none" &&
    typeof initMyPosts === "function"
  ) {
    await initMyPosts();
  }
}

function invalidatePostViews() {
  window._galleryNeedsRefresh = true;
  window._myPostsNeedsRefresh = true;
  window._lastGalleryUser = null;
}

function escapeHTML(value) {
  const text = value == null ? "" : String(value);
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function removePostCardByImageId(containerId, imageId) {
  const selector = `#${containerId} .post[data-image-id="${imageId}"]`;
  const postElement = document.querySelector(selector);
  if (!postElement) {
    return false;
  }

  postElement.remove();

  return true;
}

function refreshMyPostsAfterLocalDelete() {
  const gallery = document.getElementById("my-photos-gallery");
  const paginationNav = document.getElementById("myposts-pagination");
  const remainingPosts = gallery ? gallery.querySelectorAll(".post").length : 0;

  if (remainingPosts === 0 && gallery) {
    gallery.innerHTML =
      '<p style="text-align: center; padding: 2rem; color: #666;">No posts yet. Go to Camera to publish your first photo!</p>';
    if (paginationNav) {
      paginationNav.style.display = "none";
      const ul = paginationNav.querySelector("ul");
      if (ul) {
        ul.innerHTML = "";
      }
    }
    return true;
  }

  const mode = localStorage.getItem("myPostsFeedDisplayMode") || "pagination";
  if (
    mode === "pagination" &&
    paginationNav &&
    typeof initMyPostsPagination === "function"
  ) {
    const activePage = Number(
      paginationNav.querySelector("li.page.is-active")?.dataset?.page || 1,
    );
    initMyPostsPagination(6, activePage);
    paginationNav.style.display = "block";
  }
}

async function deleteUserImageById(imageId, options = {}) {
  try {
    const response = await fetch(`/api/images/${imageId}`, {
      method: "DELETE",
      headers: await getJsonHeaders(),
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        await handleUnauthorizedResponse("Please login to delete photos");
        return false;
      }

      showErrorAlert(result.error || "Failed to delete photo");
      return false;
    }

    showSuccessAlert("Photo deleted successfully");

    const removedFromMyPosts = removePostCardByImageId(
      "my-photos-gallery",
      imageId,
    );

    if (removedFromMyPosts) {
      refreshMyPostsAfterLocalDelete();
    }

    if (removedFromMyPosts) {
      window._myPostsNeedsRefresh = false;
      window._galleryNeedsRefresh = true;
      window._lastGalleryUser = null;
      return true;
    }

    await refreshDeletedImageViews();
    return true;
  } catch (error) {
    console.error("Error deleting photo:", error);
    showErrorAlert("Error deleting photo");
    return false;
  }
}

// Update post with user data
async function updateUserPost(user_post, index) {
  try {
    const userAlias = user_post.alias;
    const aliasElement = document.getElementById(`post-alias-${index}`);
    const avatarElement = document.getElementById(`post-avatar-${index}`);
    const postElement = document.querySelector(`[data-post-index="${index}"]`);
    const isCompact = postElement?.dataset.compact === "true";

    if (aliasElement) {
      const ownerSession = getUserSession();
      const isMyPost =
        ownerSession &&
        ownerSession.logged_in &&
        Number(ownerSession.user_id) === Number(user_post.user_id);

      aliasElement.dataset.rawAlias = userAlias;
      aliasElement.dataset.ownerId = String(user_post.user_id || "");
      aliasElement.innerHTML = isMyPost
        ? `${userAlias} <i class="fa-solid fa-child-reaching" style="color: #486EE3;"></i>`
        : userAlias;
    }

    if (avatarElement) {
      const avatarPath = buildAvatarUrl(userAlias);
      avatarElement.src = avatarPath;
      avatarElement.onerror = () => {
        avatarElement.src = "assets/profile/default-avatar.png";
      };
    }

    if (!isCompact) {
      initLikeBtn(
        user_post.id,
        index,
        user_post.is_liked,
        user_post.likes_count,
      );
    }

    initCommentsSection(user_post.id, index);

    initDeletePostBtn(user_post, index);
  } catch (error) {
    // console.log("Error updating user post:", error);
    console.error("Error updating post with user data:", error);
  }
}

function initDeletePostBtn(user_post, index) {
  const session = getUserSession();
  const isOwner =
    session &&
    session.logged_in &&
    Number(session.user_id) === Number(user_post.user_id);

  if (!isOwner || !user_post.image_id) {
    return;
  }

  const deleteBtn = document.getElementById(`post-delete-btn-${index}`);
  if (!deleteBtn || deleteBtn.dataset.bound === "true") {
    return;
  }

  deleteBtn.dataset.bound = "true";
  deleteBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const confirmDelete = await showConfirmPopup(
      "Delete Photo",
      "Are you sure you want to delete this photo? This action cannot be undone.",
    );

    if (!confirmDelete) {
      return;
    }

    const isMyPostsCard = String(index).startsWith("my-posts-");
    await deleteUserImageById(user_post.image_id, {
      localPostIndex: isMyPostsCard ? index : null,
    });
  });
}

// Comments Section
function updateCommentsToggleState(commentsToggleBtn, isExpanded) {
  if (!commentsToggleBtn) {
    return;
  }

  commentsToggleBtn.setAttribute(
    "aria-expanded",
    isExpanded ? "true" : "false",
  );

  const toggleAction = commentsToggleBtn.querySelector(
    ".comments-toggle-action",
  );

  const toggleIcon = commentsToggleBtn.querySelector(".comments-toggle-icon");

  if (toggleAction) {
    toggleAction.textContent = isExpanded ? "Hide" : "Open";
  }

  if (toggleIcon) {
    toggleIcon.classList.toggle("is-open", isExpanded);
  }
}

function initCommentsSection(postId, index) {
  const commentsSection = document.getElementById(`comments-section-${index}`);
  const commentsBody = document.getElementById(`comments-body-${index}`);
  const commentsToggleBtn = document.getElementById(
    `comments-toggle-btn-${index}`,
  );
  const commentsContainer = document.getElementById(
    `comments-container-${index}`,
  );
  const commentInput = document.getElementById(`comment-input-${index}`);
  const addCommentBtn = document.getElementById(`add-comment-btn-${index}`);

  if (
    !commentsSection ||
    !commentsBody ||
    !commentsToggleBtn ||
    !commentsContainer
  ) {
    console.error("Comments section elements not found for post ID:", postId);
    return;
  }

  if (commentsToggleBtn.dataset.bound !== "true") {
    commentsToggleBtn.dataset.bound = "true";
    commentsToggleBtn.addEventListener("click", async () => {
      const isHidden = commentsBody.classList.contains("comments-body-hidden");

      if (isHidden) {
        commentsBody.classList.remove("comments-body-hidden");
        updateCommentsToggleState(commentsToggleBtn, true);

        if (commentsSection.dataset.loaded !== "true") {
          await loadComments(postId, commentsContainer, index);
          commentsSection.dataset.loaded = "true";
        }
      } else {
        commentsBody.classList.add("comments-body-hidden");
        updateCommentsToggleState(commentsToggleBtn, false);
      }
    });
  }

  if (addCommentBtn && commentInput) {
    if (addCommentBtn.dataset.bound !== "true") {
      addCommentBtn.dataset.bound = "true";
      addCommentBtn.addEventListener("click", function () {
        addComment(postId, commentInput, commentsContainer, index);
      });
    }

    if (commentInput.dataset.bound !== "true") {
      commentInput.dataset.bound = "true";
      commentInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          addComment(postId, commentInput, commentsContainer, index);
        }
      });
    }
  }
}

function initCommentsCount(postIndex, count) {
  const safeCount = Number(count) || 0;
  const commentsSection = document.getElementById(
    `comments-section-${postIndex}`,
  );

  if (commentsSection) {
    commentsSection.dataset.count = String(safeCount);
  }

  const commentsToggleCount = document.getElementById(
    `comments-toggle-count-${postIndex}`,
  );
  if (commentsToggleCount) {
    commentsToggleCount.textContent = `(${safeCount})`;
  }
}

async function loadComments(postId, container, postIndex) {
  try {
    const response = await fetch(`/api/posts/${postId}/comments`);
    const data = await response.json();

    container.innerHTML = "";

    if (data.comments && data.comments.length > 0) {
      data.comments.forEach((comment, index) => {
        // Use the comment author's avatar
        const commentAvatar = buildAvatarUrl(comment.username);

        const formattedComment = {
          id: comment.id,
          text: comment.comment_text,
          author: comment.username,
          timestamp: new Date(comment.created_at).toLocaleString(),
          avatar: commentAvatar,
        };
        const commentElement = createCommentElement(
          formattedComment,
          index,
          postId,
          postIndex,
        );
        container.appendChild(commentElement);
      });
      updateCommentsCount(data.comments.length, postIndex);
    } else {
      container.innerHTML =
        '<p class="comments-empty-state">No comments yet. Be the first to comment.</p>';
      updateCommentsCount(0, postIndex);
    }
  } catch (error) {
    console.error("Error loading comments:", error);
    container.innerHTML =
      '<p class="comments-empty-state">Unable to load comments right now.</p>';
    updateCommentsCount(0, postIndex);
  }
}

// Update comments count display
function updateCommentsCount(count, postIndex) {
  const commentsContainer = document.getElementById(
    `comments-container-${postIndex}`,
  );

  if (commentsContainer) {
    const commentsSection = commentsContainer.closest(".comments-section");
    const commentsToggleCount = document.getElementById(
      `comments-toggle-count-${postIndex}`,
    );

    if (commentsSection) {
      commentsSection.dataset.count = String(Number(count) || 0);
    }

    if (commentsToggleCount) {
      commentsToggleCount.textContent = `(${Number(count) || 0})`;
    }
  }
}

// Add a new comment
async function addComment(postId, input, container, postIndex) {
  const text = input.value.trim();
  if (!text) {
    return;
  }

  // Check if the user is logged in
  const session = getUserSession();
  if (!session || !session.user_id || !session.logged_in) {
    return showErrorAlert("Please login to add comments");
  }

  try {
    const response = await fetch(`/api/posts/${postId}/comment`, {
      method: "POST",
      headers: await getJsonHeaders(),
      body: JSON.stringify({ text: text }),
    });

    const data = await response.json();

    if (response.ok) {
      invalidatePostViews();
      const commentsSection = container.closest(".comments-section");
      const commentsBody = document.getElementById(
        `comments-body-${postIndex}`,
      );
      const commentsToggleBtn = document.getElementById(
        `comments-toggle-btn-${postIndex}`,
      );

      if (commentsSection) {
        commentsSection.dataset.loaded = "true";
      }

      if (commentsBody) {
        commentsBody.classList.remove("comments-body-hidden");
      }

      if (commentsToggleBtn) {
        updateCommentsToggleState(commentsToggleBtn, true);
      }

      await loadComments(postId, container, postIndex);
      input.value = "";
    } else {
      if (response.status === 401) {
        await handleUnauthorizedResponse("Please login to add comments");
      } else {
        showErrorAlert(data.error || "Failed to add comment");
      }
    }
  } catch (error) {
    showErrorAlert("Failed to add comment. Please try again.");
  }
}

// Create comment HTML element
function createCommentElement(comment, commentIndex, postId, postIndex) {
  const div = document.createElement("div");
  div.className = `comment-item_${postId}`;

  const session = getUserSession();
  const isOwner =
    session && session.logged_in && session.username === comment.author;

  div.innerHTML = `
    <div class="comment-content comment-content_${postId}">
        <div class="comment-avatar-wrapper">
          <img src="${comment.avatar}" alt="Avatar" class="post-avatar"
              onerror="this.onerror=null; this.src='assets/profile/default-avatar.png'">
          <div class="comment-info">
          <div class="comment-author"></div>
          <div class="comment-timestamp">${comment.timestamp}</div>
          <p class="comment-text"></p>
          </div>
        </div>
        ${
          isOwner
            ? `<btn onclick="deleteMyComment(${postId}, ${comment.id}, ${postIndex})" class="delete-comment-btn">
          <i class="fa-solid fa-trash"></i>
        </btn>`
            : ""
        }
    </div>
  `;

  // Set text content safely (prevents XSS)
  div.querySelector(".comment-author").textContent = comment.author;
  div.querySelector(".comment-text").textContent = comment.text;

  return div;
}

// Delete comment
async function deleteMyComment(postId, commentId, postIndex) {
  const session = getUserSession();
  if (!session || !session.user_id || !session.logged_in) {
    return showErrorAlert("Please login to delete comments");
  }

  const confirmed = await showConfirmPopup(
    "Delete Comment",
    "Are you sure you want to delete this comment? This action cannot be undone.",
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
      headers: await getJsonHeaders(),
    });

    const data = await response.json();

    if (response.ok) {
      invalidatePostViews();
      const container = document.getElementById(
        `comments-container-${postIndex}`,
      );
      await loadComments(postId, container, postIndex);
    } else {
      if (response.status === 401) {
        await handleUnauthorizedResponse("Please login to delete comments");
        return;
      }

      if (response.status === 403) {
        showErrorAlert("You can only delete your own comments");
      } else {
        showErrorAlert(data.error || "Failed to delete comment");
      }
    }
  } catch (error) {
    showErrorAlert("Failed to delete comment. Please try again.");
  }
}

// Generate post HTML
function generatepostHTML(user_post, index, options = {}) {
  const targetId = options.targetId || "post-component";
  const storeInObjJson = options.storeInObjJson !== false;
  const showDeleteBtn = options.showDeleteBtn === true;
  const compact = options.compact === true;
  const postComponent = document.getElementById(targetId);
  if (!postComponent) {
    return;
  }

  const session = getUserSession();
  const isOwner =
    session &&
    session.logged_in &&
    Number(session.user_id) === Number(user_post.user_id);

  const ts = Date.now();
  let commentAvatar = `assets/profile/default-avatar.png`;
  if (session?.logged_in && session?.username) {
    commentAvatar = `/api/avatar/${encodeURIComponent(session.username)}?ts=${ts}`;
  }

  const deleteBtnHTML =
    showDeleteBtn && isOwner && user_post.image_id
      ? `
        <button
          id="post-delete-btn-${index}"
          class="delete-btn post-delete-btn"
          aria-label="Delete photo"
        >
          <i class="fa-solid fa-trash"></i>
        </button>
      `
      : "";

  const formattedDate = user_post.created_at
    ? new Date(user_post.created_at).toLocaleDateString()
    : "";
  const safeCaption = escapeHTML(user_post.caption || "");

  const compactMetaHTML = compact
    ? `
      <div class="post-compact-meta">
        <div class="post-compact-topline">
          ${
            formattedDate
              ? `<p class="post-compact-date">${formattedDate}</p>`
              : ""
          }
          <div class="post-compact-likes">
            <i class="fa-solid fa-heart"></i>
            <span>${user_post.likes_count || 0}</span>
          </div>
        </div>
        ${
          safeCaption
            ? `<p class="post-compact-caption">${safeCaption}</p>`
            : ""
        }
      </div>
    `
    : "";

  const initialCommentsCount = Number(user_post.comments_count) || 0;

  const commentsSectionHTML = `
      <div
        id="comments-section-${index}"
        class="comments-section comments-section-collapsible ${compact ? "comments-section-compact" : ""}"
        data-loaded="false"
        data-count="${initialCommentsCount}"
      >
        <div class="add-comment">
            <div class="add-comment-container">
            <img src="${commentAvatar}" alt="Avatar" class="add-comment-avatar"
                onerror="this.onerror=null; this.src='assets/profile/default-avatar.png'">
                <div class="comment-input-container comment-input-wrapper">
                    <textarea id="comment-input-${index}" 
                    placeholder="Add a comment..." 
                    class="comment-input"
                    rows="2"></textarea>
                    <btn id="add-comment-btn-${index}" class="add-comment-btn-inside">
                    <i class="fa-solid fa-paper-plane"></i>
                    </btn>
                </div>
            </div>
        </div>
        <button
          id="comments-toggle-btn-${index}"
          class="comments-toggle-btn"
          type="button"
          aria-expanded="false"
        >
          <span class="comments-toggle-label">Comments</span>
          <span id="comments-toggle-count-${index}" class="comments-toggle-count">(${initialCommentsCount})</span>
          <span class="comments-toggle-action">Open</span>
          <i class="fa-solid fa-chevron-down comments-toggle-icon"></i>
        </button>

        <div id="comments-body-${index}" class="comments-body comments-body-hidden">
        <div id="comments-container-${index}" class="comments-list">
        </div>
        </div>
      </div>
    `;

  const fullMetaHTML = compact
    ? ""
    : `
      <div class="like-section">
        <btn id="like-btn-${index}" class="like-btn">
          <i class="fa-regular fa-heart"></i>
          <span>Like</span>
        </btn>
        <span id="like-count-${index}" class="like-count">0</span>
      </div>
    `;

  const postHTML = `
    <div class="post ${compact ? "post-compact" : ""}" data-user-id="${user_post.id}" data-image-id="${user_post.image_id || ""}" data-post-index="${index}" data-compact="${compact ? "true" : "false"}">
      ${deleteBtnHTML}
      <div class="post-header">
        <img id="post-avatar-${index}" 
            src="${user_post.avatar}" 
            alt="Photo" 
            class="post-avatar"
            onerror="this.onerror=null; this.src='assets/profile/default-avatar.png'">
        <h2 id="post-alias-${index}" class="post-alias"></h2>
      </div>
        <div class="post-photo-wrapper">
            <img
            src="${user_post.avatar}" 
            alt="Photo" 
            class="post-photo">
        </div>
      ${compactMetaHTML}
      ${fullMetaHTML}
      ${commentsSectionHTML}
    </div>
  `;

  if (storeInObjJson && typeof window.objJson !== "undefined") {
    window.objJson.push({
      adName: user_post.alias,
      postHTML: postHTML,
      userData: user_post,
      index: index,
    });
  }

  postComponent.insertAdjacentHTML("beforeend", postHTML);

  updateUserPost(user_post, index);
  initCommentsCount(index, initialCommentsCount);
}

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
