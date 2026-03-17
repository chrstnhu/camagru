// Helper to generate the delete button HTML for a post
function getDeleteBtnHTML(user_post, index, showDeleteBtn, isOwner) {
  if (showDeleteBtn && isOwner && user_post.image_id) {
    return `
      <button
        id="post-delete-btn-${index}"
        class="delete-btn post-delete-btn"
        aria-label="Delete photo"
      >
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
  }
  return "";
}

// Helper to generate the compact meta HTML for a post
function getCompactMetaHTML(user_post, formattedDate, safeCaption) {
  return `
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
      ${safeCaption ? `<p class="post-compact-caption">${safeCaption}</p>` : ""}
    </div>
  `;
}

// Helper to generate the comments section HTML for a post
function getCommentsSectionHTML(
  index,
  commentAvatar,
  initialCommentsCount,
  compact,
) {
  return `
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
}

// Helper to generate the like section HTML for a post
function getLikeSectionHTML(index) {
  return `
    <div class="like-section">
      <btn id="like-btn-${index}" class="like-btn">
        <i class="fa-regular fa-heart"></i>
        <span>Like</span>
      </btn>
      <span id="like-count-${index}" class="like-count">0</span>
    </div>
  `;
}

// Generate post HTML and insert into DOM
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

  // Generate delete button HTML
  const deleteBtnHTML = getDeleteBtnHTML(
    user_post,
    index,
    showDeleteBtn,
    isOwner,
  );

  // Format date and escape caption
  const formattedDate = user_post.created_at
    ? new Date(user_post.created_at).toLocaleDateString()
    : "";
  const safeCaption = escapeHTML(user_post.caption || "");

  // Generate compact meta HTML if needed
  const compactMetaHTML = compact
    ? getCompactMetaHTML(user_post, formattedDate, safeCaption)
    : "";

  // Get initial comments count
  const initialCommentsCount = Number(user_post.comments_count) || 0;

  // Generate comments section HTML
  const commentsSectionHTML = getCommentsSectionHTML(
    index,
    commentAvatar,
    initialCommentsCount,
    compact,
  );

  // Generate like section HTML if not compact
  const fullMetaHTML = compact ? "" : getLikeSectionHTML(index);

  // Build the main post HTML
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

  // Optionally store in window.objJson
  if (storeInObjJson && typeof window.objJson !== "undefined") {
    window.objJson.push({
      adName: user_post.alias,
      postHTML: postHTML,
      userData: user_post,
      index: index,
    });
  }

  // Insert the post HTML into the DOM
  postComponent.insertAdjacentHTML("beforeend", postHTML);

  // Update post UI and initialize comments count
  updateUserPost(user_post, index);
  initCommentsCount(index, initialCommentsCount);
}
