// Updates the toggle button and icon state for comments
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

// Helper to bind toggle event for comments section
function bindCommentsToggleEvent(
  commentsToggleBtn,
  commentsBody,
  commentsSection,
  commentsContainer,
  postId,
  index,
) {
  if (commentsToggleBtn.dataset.bound === "true") return;
  commentsToggleBtn.dataset.bound = "true";
  commentsToggleBtn.addEventListener("click", async () => {
    const isHidden = commentsBody.classList.contains("comments-body-hidden");
    if (isHidden) {
      showCommentsSection(commentsBody, commentsToggleBtn);
      if (commentsSection.dataset.loaded !== "true") {
        await loadComments(postId, commentsContainer, index);
        commentsSection.dataset.loaded = "true";
      }
    } else {
      hideCommentsSection(commentsBody, commentsToggleBtn);
    }
  });
}

// Helper to show comments section
function showCommentsSection(commentsBody, commentsToggleBtn) {
  commentsBody.classList.remove("comments-body-hidden");
  updateCommentsToggleState(commentsToggleBtn, true);
}

// Helper to hide comments section
function hideCommentsSection(commentsBody, commentsToggleBtn) {
  commentsBody.classList.add("comments-body-hidden");
  updateCommentsToggleState(commentsToggleBtn, false);
}

// Helper to bind add comment button event
function bindAddCommentBtn(
  addCommentBtn,
  commentInput,
  commentsContainer,
  postId,
  index,
) {
  if (addCommentBtn.dataset.bound === "true") return;
  addCommentBtn.dataset.bound = "true";
  addCommentBtn.addEventListener("click", function () {
    addComment(postId, commentInput, commentsContainer, index);
  });
}

// Helper to bind comment input keypress event
function bindCommentInput(
  commentInput,
  addCommentBtn,
  commentsContainer,
  postId,
  index,
) {
  if (commentInput.dataset.bound === "true") return;
  commentInput.dataset.bound = "true";
  commentInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addComment(postId, commentInput, commentsContainer, index);
    }
  });
}

// Initializes the comments section for a post, sets up event listeners (refactored)
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
    // console.error("Comments section elements not found for post ID:", postId);
    return;
  }

  bindCommentsToggleEvent(
    commentsToggleBtn,
    commentsBody,
    commentsSection,
    commentsContainer,
    postId,
    index,
  );

  if (addCommentBtn && commentInput) {
    bindAddCommentBtn(
      addCommentBtn,
      commentInput,
      commentsContainer,
      postId,
      index,
    );
    bindCommentInput(
      commentInput,
      addCommentBtn,
      commentsContainer,
      postId,
      index,
    );
  }
}

// Initializes the comments count display for a post
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

// Loads comments for a post from the API and renders them
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

// Updates the comments count display for a post
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

// Adds a new comment to a post via the API and updates the UI
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
    // console.log("Error adding comment:", error);
    showErrorAlert("Failed to add comment. Please try again.");
  }
}

// Creates a DOM element for a comment, including delete button if owner
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

// Deletes a comment via the API and updates the UI
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
    // console.log("Error deleting comment:", error);
    showErrorAlert("Failed to delete comment. Please try again.");
  }
}
