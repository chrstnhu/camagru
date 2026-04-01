// Common functions shared between post.js and myPhotos.js
var objJson = [];
let postsPerPage = 2;
let currentPage = 1;

// Update post with user data, initialize like button and comments section (refactored)
async function updateUserPost(user_post, index) {
  try {
    const postElement = document.querySelector(`[data-post-index="${index}"]`);
    const isCompact = postElement?.dataset.compact === "true";
    updateAliasElement(user_post, index);
    updateAvatarElement(user_post, index);
    
    // Init post interactions (likes, comments, delete) after updating alias and avatar
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
    // console.error("Error updating user post:", error);
    showErrorAlert("An error occurred while updating post data. Please try again.");
  }
}

// Deletes a user image by ID via the API and updates the UI accordingly
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
    showErrorAlert("Error deleting photo");
    return false;
  }
}

// Show custom confirmation popup (refactored)
function showConfirmPopup(title, message) {
  return new Promise((resolve) => {
    // Remove existing popup if any
    const existingOverlay = document.getElementById("confirm-popup-overlay");
    if (existingOverlay) {
      existingOverlay.remove();
    }
    const overlay = createConfirmOverlay(title, message);
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add("is-active"), 10);
    bindConfirmPopupEvents(overlay, resolve);
  });
}

// Refreshes the gallery and my posts views after a photo is deleted (refactored)
async function refreshDeletedImageViews() {
  invalidatePostViews();
  if (typeof loadCameraGallery === "function") {
    try {
      await loadCameraGallery();
    } catch (error) {
      // console.error("Error refreshing camera gallery:", error);
      showErrorAlert("An error occurred while refreshing the gallery. Please try again.");
    }
  }
  await refreshGallerySection();
  await refreshMyPostsSection();
}

// Invalidates the gallery and my posts views
function invalidatePostViews() {
  window._galleryNeedsRefresh = true;
  window._myPostsNeedsRefresh = true;
  window._lastGalleryUser = null;
}

// Removes a post card element from the specified container by matching image ID
function removePostCardByImageId(containerId, imageId) {
  const selector = `#${containerId} .post[data-image-id="${imageId}"]`;
  const postElement = document.querySelector(selector);
  if (!postElement) {
    return false;
  }

  postElement.remove();

  return true;
}

// Refresh the my posts section if visible
async function refreshMyPostsSection() {
  const myPostsSection = document.getElementById("my-posts");
  if (
    myPostsSection &&
    myPostsSection.style.display !== "none" &&
    typeof initMyPosts === "function"
  ) {
    await initMyPosts();
  }
}

// Bind events to the confirm popup overlay
function bindConfirmPopupEvents(overlay, resolve) {
  const cancelBtn = overlay.querySelector("#confirm-cancel-btn");
  const okBtn = overlay.querySelector("#confirm-ok-btn");
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
}

// Refresh the gallery section if visible
async function refreshGallerySection() {
  const gallerySection = document.getElementById("gallery");
  if (
    gallerySection &&
    gallerySection.style.display !== "none" &&
    typeof window.initPostsData === "function"
  ) {
    await window.initPostsData();
  }
}

// Escapes HTML special characters to prevent XSS
function escapeHTML(value) {
  const text = value == null ? "" : String(value);
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Show the empty state message when no posts remain
function showNoPostsMessage(gallery, paginationNav) {
  gallery.innerHTML =
    '<p style="text-align: center; padding: 2rem; color: #666;">No posts yet. Go to Camera to publish your first photo!</p>';
  if (paginationNav) {
    paginationNav.style.display = "none";
    const ul = paginationNav.querySelector("ul");
    if (ul) {
      ul.innerHTML = "";
    }
  }
}

// Refreshes the my posts view after a local deletion
// Checking if pagination needs to be updated (refactored)
function refreshMyPostsAfterLocalDelete() {
  const gallery = document.getElementById("my-photos-gallery");
  const paginationNav = document.getElementById("myposts-pagination");
  const remainingPosts = gallery ? gallery.querySelectorAll(".post").length : 0;

  if (remainingPosts === 0 && gallery) {
    showNoPostsMessage(gallery, paginationNav);
    return true;
  }

  const mode = localStorage.getItem("myPostsFeedMode") || "pagination";
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


// Update the alias element for a post
function updateAliasElement(user_post, index) {
  const userAlias = user_post.alias;
  const aliasElement = document.getElementById(`post-alias-${index}`);
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
}

// Update the avatar element for a post
function updateAvatarElement(user_post, index) {
  const userAlias = user_post.alias;
  const avatarElement = document.getElementById(`post-avatar-${index}`);
  if (avatarElement) {
    const avatarPath = buildAvatarUrl(userAlias);
    avatarElement.src = avatarPath;
    avatarElement.onerror = () => {
      avatarElement.src = "assets/profile/default-avatar.png";
    };
  }
}


// Initializes delete post button, sets up event listener
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

// Create the confirm popup overlay element
function createConfirmOverlay(title, message) {
  const overlay = document.createElement("div");
  overlay.id = "confirm-popup-overlay";
  overlay.className = "confirm-popup-overlay";
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
  return overlay;
}