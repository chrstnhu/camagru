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
        <div class="confirm-popup-message">
          ${message}
        </div>
        <div class="confirm-popup-buttons">
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
    typeof window.initializepostsData === "function"
  ) {
    await window.initializepostsData();
  }

  const myPostsSection = document.getElementById("my-posts");
  if (
    myPostsSection &&
    myPostsSection.style.display !== "none" &&
    typeof initializeMyPosts === "function"
  ) {
    await initializeMyPosts();
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
    typeof initializeMyPostsPagination === "function"
  ) {
    const activePage = Number(
      paginationNav.querySelector("li.page.is-active")?.dataset?.page || 1,
    );
    initializeMyPostsPagination(6, activePage);
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
      initializeLikeBtn(
        user_post.id,
        index,
        user_post.is_liked,
        user_post.likes_count,
      );
    }

    initializeCommentsSection(user_post.id, index);

    initializeDeletePostBtn(user_post, index);
  } catch (error) {
    console.log("Error updating user post:", error);
  }
}

function initializeDeletePostBtn(user_post, index) {
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


// Generate post HTML
function generatepostHTML(user_post, index, options = {}) {
  const targetId = options.targetId || "post-component";
  const storeInObjJson = options.storeInObjJson !== false;
  const showDeleteButton = options.showDeleteButton === true;
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

  const deleteButtonHTML =
    showDeleteButton && isOwner && user_post.image_id
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
      ${deleteButtonHTML}
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
  initializeCommentsCount(index, initialCommentsCount);
}

