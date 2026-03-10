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
    setTimeout(() => overlay.classList.add("active"), 10);

    // Handle buttons
    const cancelBtn = document.getElementById("confirm-cancel-btn");
    const okBtn = document.getElementById("confirm-ok-btn");

    const cleanup = (result) => {
      overlay.classList.remove("active");
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

// Update post with user data
async function updateUserPost(user_post, index) {
  console.log("Updating user post for:", user_post);
  try {
    const userAlias = user_post.alias;
    const aliasElement = document.getElementById(`post-alias-${index}`);
    const avatarElement = document.getElementById(`post-avatar-${index}`);

    if (aliasElement) aliasElement.textContent = userAlias;

    if (avatarElement) {
      const timestamp = Date.now();
      const avatarPath = `/api/avatar/${userAlias}?ts=${timestamp}`;
      avatarElement.src = avatarPath;
      avatarElement.onerror = () => {
        avatarElement.src = "assets/profile/default-avatar.png";
      };
    }

    initializeLikeBtn(user_post.id, index);
    initializeCommentsSection(user_post.id, index);
  } catch (error) {
    console.log("Error updating user post:", error);
  }
}

// Like button functionality
async function initializeLikeBtn(postId, index) {
  const likeBtn = document.getElementById(`like-btn-${index}`);
  const likeCount = document.getElementById(`like-count-${index}`);

  if (!likeBtn || !likeCount) return;

  const session = getUserSession();
  const isLoggedIn = session && session.logged_in;

  await loadLikeStatus(postId, likeBtn, likeCount, isLoggedIn);

  if (isLoggedIn) {
    likeBtn.addEventListener("click", async function () {
      await toggleLike(postId, likeBtn, likeCount);
    });
  } else {
    likeBtn.addEventListener("click", function () {
      showErrorAlert("Please login to like posts");
    });
  }
}

// Load like status from API
async function loadLikeStatus(postId, likeBtn, likeCount, isLoggedIn) {
  try {
    const response = await fetch(`/api/posts/${postId}/likes`);
    const data = await response.json();

    if (response.ok) {
      // Only show red heart if user is logged in
      updateLikeBtn(likeBtn, isLoggedIn ? data.is_liked : false);
      likeCount.textContent = data.likes_count;
    }
  } catch (error) {
    console.error("Error loading like status:", error);
    updateLikeBtn(likeBtn, false);
    likeCount.textContent = "0";
  }
}

// Toggle like status
async function toggleLike(postId, likeBtn, likeCount) {
  const session = getUserSession();
  if (!session || !session.user_id || !session.logged_in) {
    showErrorAlert("Please login to like posts");
    return;
  }

  try {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (response.ok) {
      updateLikeBtn(likeBtn, data.is_liked);
      likeCount.textContent = data.likes_count;
    } else {
      if (response.status === 401) {
        showErrorAlert("Please login to like posts");
      } else {
        showErrorAlert(data.error || "Failed to toggle like");
      }
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    showErrorAlert("Network error. Please try again.");
  }
}

// Update like button appearance
function updateLikeBtn(btn, isLiked) {
  const heart = btn.querySelector("i");
  if (isLiked) {
    heart.className = "fa-solid fa-heart";
    heart.style.color = "red";
    btn.classList.add("liked");
  } else {
    heart.className = "fa-regular fa-heart";
    heart.style.color = "gray";
    btn.classList.remove("liked");
  }
}

// Comments Section
function initializeCommentsSection(postId, index) {
  const commentsContainer = document.getElementById(
    `comments-container-${index}`,
  );
  const commentInput = document.getElementById(`comment-input-${index}`);
  const addCommentBtn = document.getElementById(`add-comment-btn-${index}`);

  if (!commentsContainer || !commentInput || !addCommentBtn) {
    console.error("Comments section elements not found for post ID:", postId);
    return;
  }

  loadComments(postId, commentsContainer, index);

  addCommentBtn.addEventListener("click", function () {
    addComment(postId, commentInput, commentsContainer, index);
  });

  commentInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addComment(postId, commentInput, commentsContainer, index);
    }
  });
}

async function loadComments(postId, container, postIndex) {
  try {
    const response = await fetch(`/api/posts/${postId}/comments`);
    const data = await response.json();

    container.innerHTML = "";

    if (data.comments && data.comments.length > 0) {
      data.comments.forEach((comment, index) => {
        // Use the comment author's avatar
        const ts = Date.now();
        const commentAvatar = `/api/avatar/${comment.username}?ts=${ts}`;

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
      updateCommentsCount(0, postIndex);
    }
  } catch (error) {
    console.error("Error loading comments:", error);
    updateCommentsCount(0, postIndex);
  }
}

// Update comments count display
function updateCommentsCount(count, postIndex) {
  const commentsContainer = document.getElementById(
    `comments-container-${postIndex}`,
  );

  if (commentsContainer) {
    const commentsTitle =
      commentsContainer.parentElement.querySelector(".comments-title");
    if (commentsTitle) {
      commentsTitle.textContent = `Comments (${count})`;
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text }),
    });

    const data = await response.json();

    if (response.ok) {
      await loadComments(postId, container, postIndex);
      input.value = "";
    } else {
      if (response.status === 401) {
        showErrorAlert("Please login to add comments");
      } else {
        showErrorAlert(data.error || "Failed to add comment");
      }
    }
  } catch (error) {
    console.log("Error adding comment:", error);
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
    showErrorAlert("Please login to delete comments");
    return;
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
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (response.ok) {
      const container = document.getElementById(
        `comments-container-${postIndex}`,
      );
      await loadComments(postId, container, postIndex);
    } else {
      if (response.status === 403) {
        showErrorAlert("You can only delete your own comments");
      } else {
        showErrorAlert(data.error || "Failed to delete comment");
      }
    }
  } catch (error) {
    console.log("Error deleting comment:", error);
    showErrorAlert("Failed to delete comment. Please try again.");
  }
}

// Generate post HTML
function generatepostHTML(user_post, index) {
  console.log("Generating post HTML for:", user_post);
  const postComponent = document.getElementById("post-component");
  if (!postComponent) return;

  const session = getUserSession();
  const isOwner = session && session.logged_in && session.username;

  const ts = Date.now();
  let commentAvatar = `assets/profile/default-avatar.png`;
  if (isOwner) {
    commentAvatar = `/api/avatar/${session.username}?ts=${ts}`;
  }

  const postHTML = `
    <div class="post" data-user-id="${user_post.id}">
      <div class="post-header">
        <img id="post-avatar-${index}" 
            src="${user_post.avatar}" 
            alt="Photo" 
            class="post-avatar"
            onerror="this.onerror=null; this.src='assets/profile/default-avatar.png'">
        <h2 id="post-alias-${index}" class="post-alias">${user_post.alias}</h2>
      </div>
        <div>
            <img
            src="${user_post.avatar}" 
            alt="Photo" 
            class="post-photo">
        </div>
      <div class="like-section">
        <btn id="like-btn-${index}" class="like-btn">
          <i class="fa-regular fa-heart"></i>
          <span>Like</span>
        </btn>
        <span id="like-count-${index}" class="like-count">0</span>
      </div>

      <div class="comments-section">
        <h4 class="comments-title">Comments (0)</h4>

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

        <div id="comments-container-${index}" class="comments-list">
        </div>
      </div>
    </div>
  `;

  if (typeof window.objJson !== "undefined") {
    window.objJson.push({
      adName: user_post.alias,
      postHTML: postHTML,
      userData: user_post,
      index: index,
    });
  }

  postComponent.innerHTML += postHTML;

  setTimeout(() => {
    updateUserPost(user_post, index);
  }, 10);
}

// Set avatar src with default
function setAvatarSrc(img, src) {
  img.src = src;

  // If avatar fails to load, use default avatar
  img.onerror = () => {
    img.src = "assets/profile/default-avatar.png";
  };
}

// Refresh avatar of logged-in user
function refreshAllUserAvatars(username) {
  if (!username) {
    return;
  }

  const ts = Date.now();
  const newAvatarUrl = `/api/avatar/${username}?ts=${ts}`;

  const headerAvatar = document.getElementById("user-avatar-img");
  if (headerAvatar) {
    setAvatarSrc(headerAvatar, newAvatarUrl);
  }

  const profileAvatar = document.getElementById("profile-avatar-preview");
  if (profileAvatar) {
    setAvatarSrc(profileAvatar, newAvatarUrl);
  }

  // Post avatars that belong to this user
  document.querySelectorAll("[id^='post-avatar-']").forEach((img) => {
    if (img.src && img.src.includes(`/api/avatar/${username}`)) {
      setAvatarSrc(img, newAvatarUrl);
    }
  });

  // Add comment avatars that belong to this user
  document.querySelectorAll(".add-comment-avatar").forEach((img) => {
    setAvatarSrc(img, newAvatarUrl);
  });

  document.querySelectorAll(".comment-avatar-wrapper").forEach((wrapper) => {
    const authorEl = wrapper.querySelector(".comment-author");
    const avatarImg = wrapper.querySelector(".post-avatar");
    if (authorEl && avatarImg && authorEl.textContent.trim() === username) {
      setAvatarSrc(avatarImg, newAvatarUrl);
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
    if (el.textContent.trim() === oldUsername) {
      el.textContent = newUsername;
    }
  });

  // Comment authors that belong to this user
  document.querySelectorAll(".comment-author").forEach((el) => {
    if (el.textContent.trim() === oldUsername) {
      el.textContent = newUsername;
    }
  });
}
