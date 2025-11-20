let postsPerPage = 6;
let currentPage = 1;

// Simple post Component
async function updateUserpost(user_post, index) {
  console.log("Updating user post for:", user_post);
  try {
    // Get user data
    const userAlias = user_post.alias || "Guest";

    // Update post elements
    const aliasElement = document.getElementById(`post-alias-${index}`);
    const avatarElement = document.getElementById(`post-avatar-${index}`);

    if (aliasElement) aliasElement.textContent = userAlias;

    // Update avatar
    if (avatarElement) {
      const timestamp = Date.now();
      const avatarPath = `/api/avatar/${userAlias}?ts=${timestamp}`;
      avatarElement.src = avatarPath;
      avatarElement.onerror = () => {
        avatarElement.src = user_post.avatar || "assets/profile/photo1.jpg";
      };
    }

    initializeLikeButton(user_post.id, index);
    initializeCommentsSection(user_post.id, index);
  } catch (error) {
    console.log("Error updating user post:", error);
    setDefaultpostValues();
  }
}

// Like Button Functionality
function initializeLikeButton(userId, index) {
  const likeButton = document.getElementById(`like-button-${index}`);
  const likeCount = document.getElementById(`like-count-${index}`);

  if (!likeButton || !likeCount) return;

  // Get current like status from localStorage
  const likeKey = `liked_${userId}`;
  const isLiked = localStorage.getItem(likeKey) === "true";
  const currentLikes = parseInt(localStorage.getItem(`likes_${userId}`)) || 0;

  // Update UI
  updateLikeButton(likeButton, isLiked);
  likeCount.textContent = currentLikes;

  // Add click event
  likeButton.addEventListener("click", function () {
    const currentLikedState = localStorage.getItem(likeKey) === "true";
    const currentLikesCount =
      parseInt(localStorage.getItem(`likes_${userId}`)) || 0;

    const newLikedState = !currentLikedState;
    const newLikeCount = newLikedState
      ? currentLikesCount + 1
      : Math.max(0, currentLikesCount - 1);

    // Update localStorage
    localStorage.setItem(likeKey, newLikedState.toString());
    localStorage.setItem(`likes_${userId}`, newLikeCount.toString());

    // Update UI
    updateLikeButton(likeButton, newLikedState);
    likeCount.textContent = newLikeCount;
  });
}

function updateLikeButton(button, isLiked) {
  const heart = button.querySelector("i");
  if (isLiked) {
    heart.className = "fa-solid fa-heart";
    heart.style.color = "red";
    button.classList.add("post__like__button--liked");
  } else {
    heart.className = "fa-regular fa-heart";
    heart.style.color = "gray";
    button.classList.remove("post__like__button--liked");
  }
}

// Comments Section Functionality
function initializeCommentsSection(userId, index) {
  const commentsContainer = document.getElementById(
    `comments-container-${index}`
  );
  const commentInput = document.getElementById(`comment-input-${index}`);
  const addCommentBtn = document.getElementById(`add-comment-btn-${index}`);

  if (!commentsContainer || !commentInput || !addCommentBtn) return;

  loadComments(userId, commentsContainer, index);

  addCommentBtn.addEventListener("click", function () {
    addComment(userId, commentInput, commentsContainer, index);
  });

  commentInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addComment(userId, commentInput, commentsContainer, index);
    }
  });
}

// Load comments from localStorage
function loadComments(userId, container, postIndex) {
  const commentsKey = `comments_${userId}`;
  const comments = JSON.parse(localStorage.getItem(commentsKey)) || [];

  container.innerHTML = "";

  comments.forEach((comment, index) => {
    const commentElement = createCommentElement(
      comment,
      index,
      userId,
      postIndex
    );
    container.appendChild(commentElement);
  });
  updateCommentsCount(comments.length, postIndex);
}

// Update the comments count in the specific post
function updateCommentsCount(count, postIndex) {
  const postElement = document.querySelector(
    `[data-user-id] .post__comments__title`
  );
  const commentsContainer = document.getElementById(
    `comments-container-${postIndex}`
  );

  if (commentsContainer) {
    const commentsTitle = commentsContainer.parentElement.querySelector(
      ".post__comments__title"
    );
    if (commentsTitle) {
      commentsTitle.textContent = `Comments (${count})`;
    }
  }
}

// Add a new comment
function addComment(userId, input, container, postIndex, avatar) {
  const text = input.value.trim();
  if (!text) return;

  const comment = {
    id: Date.now(),
    text: text,
    author: "Actual User", // * Need to replace with actual user name
    timestamp: new Date().toLocaleString(),
    avatar: "assets/profile/photo1.jpg", // * Need to replace with actual user avatar
  };

  // Save to localStorage
  const commentsKey = `comments_${userId}`;
  const comments = JSON.parse(localStorage.getItem(commentsKey)) || [];
  comments.unshift(comment); // Add to objJson for pagination (make sure objJson is accessible)
  if (typeof window.objJson !== "undefined") {
    window.objJson.push({
      postId: userId,
      comment: input,
      index: postIndex,
    });
  }

  localStorage.setItem(commentsKey, JSON.stringify(comments));

  // Add comment on top of the list
  const commentElement = createCommentElement(comment, 0, userId, postIndex);
  container.prepend(commentElement);

  // Clear input
  input.value = "";

  updateCommentsCount(comments.length, postIndex);
}

// Create a comment DOM element
function createCommentElement(comment, commentIndex, userId, postIndex) {
  const div = document.createElement("div");
  div.className = "post__comment__item";
  div.innerHTML = `
    <div class="post__comment__content">
        <div class="post__comment__avatar__wrapper">
          <img src="${comment.avatar}" alt="Avatar" class="post__comment__avatar">
          <div class="post__comment__info">
          <div class="post__comment__author">${comment.author}</div>
          <div class="post__comment__timestamp">${comment.timestamp}</div>
          <p class="post__comment__text">${comment.text}</p>
          </div>
        </div>
        <button onclick="deleteComment(${userId}, ${commentIndex}, ${postIndex})" class="post__comment__delete">
          <i class="fa-solid fa-trash"></i>
        </button>
    </div>
  `;
  return div;
}

// Delete a comment
function deleteComment(userId, commentIndex, postIndex) {
  const commentsKey = `comments_${userId}`;
  const comments = JSON.parse(localStorage.getItem(commentsKey)) || [];
  comments.splice(commentIndex, 1);
  localStorage.setItem(commentsKey, JSON.stringify(comments));

  // Reload comments
  const container = document.getElementById(`comments-container-${postIndex}`);
  loadComments(userId, container, postIndex);
}

var objJson = [];

// Generate post HTML with unique IDsg
function generatepostHTML(user_post, index) {
  console.log("Generating post HTML for:", user_post);
  const postComponent = document.getElementById("post-component");
  if (!postComponent) return;

  const postHTML = `
    <div class="post post--hidden" data-user-id="${user_post.id}">
      <!-- post Header -->
      <div class="post__header">
        <img id="post-avatar-${index}" 
            src="${user_post.avatar}" 
            alt="Photo" 
            class="post__comment__avatar" style="width:40px; height:40px;">
        <h2 id="post-alias-${index}" class="post__alias">${user_post.alias}</h2>
      </div>
      <!-- Post Image -->
      <div class="post__photo__container">
        <img
          src="${user_post.photo || user_post.avatar}" 
          alt="Post by ${user_post.alias}" 
          class="post__photo">
      </div>
      <!-- Like Section -->
      <div class="post__like">
        <button id="like-button-${index}" class="post__like__button">
          <i class="fa-regular fa-heart"></i>
          <span>Like</span>
        </button>
        <span id="like-count-${index}" class="post__like__count">0</span>
      </div>

      <!-- Comments Section -->
      <div class="post__comments">
        <h4 class="post__comments__title">Comments (0)</h4>

        <!-- Add Comment -->
        <div class="post__comment">
            <div class="post__comment__container">
            <div class="post__comment__input__container post__comment__input__wrapper">
                  <textarea id="comment-input-${index}" 
                  placeholder="Add a comment..." 
                  class="post__comment__input"
                  rows="2"></textarea>
                  <img src="${
                    user_post.avatar
                  }" alt="Avatar" class="post__avatar">
                  <button id="add-comment-btn-${index}" class="post__comment__button">
                  <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Comments List -->
        <div id="comments-container-${index}" class="post__comments__list">
          <!-- Comments will be dynamically added here -->
        </div>
      </div>
    </div>
  `;

  // Pagination system in objJson
  if (typeof window.objJson !== "undefined") {
    window.objJson.push({
      adName: user_post.alias,
      postHTML: postHTML,
      userData: user_post,
      index: index,
    });
  }

  // Insert post in the DOM
  postComponent.innerHTML += postHTML;

  // Initialiser les fonctionnalités après insertion dans le DOM
  setTimeout(() => {
    updateUserpost(user_post, index);
  }, 10);
}

// Set default values in case of error
function setDefaultpostValues() {
  const aliasElement = document.getElementById("post-alias");
  if (aliasElement) aliasElement.textContent = "Guest";
}

// Initialize posts data for pagination
function initializepostsData() {
  // Initialize global objJson array
  window.objJson = [];

  // Exemple - * need to replace with real data
  const exampleUserData = [
    {
      id: 1,
      alias: "TestUser",
      avatar: "assets/profile/photo1.jpg",
    },
    {
      id: 2,
      alias: "AnotherUser",
      avatar: "assets/profile/photo2.jpg",
    },
    {
      id: 3,
      alias: "PhotoLover",
      avatar: "assets/profile/photo3.jpg",
    },
    {
      id: 4,
      alias: "Artist",
      avatar: "assets/profile/photo1.jpg",
    },
    {
      id: 5,
      alias: "How do you do that",
      avatar: "assets/profile/photo1.jpg",
    },
    {
      id: 6,
      alias: "Creative",
      avatar: "assets/profile/photo2.jpg",
    },
    {
      id: 7,
      alias: "Bob",
      avatar: "assets/profile/photo1.jpg",
    },
    {
      id: 8,
      alias: "Youpi",
      avatar: "assets/profile/photo3.jpg",
    },
  ];

  // Generate post HTML for each user but don't display them yet
  exampleUserData.forEach((userData, index) => {
    generatepostHTML(userData, index);
  });

  console.log("posts initialized:", window.objJson.length, "posts ready");

  // Wait a short delay to ensure posts are in the DOM
  setTimeout(() => {
    const postsInDOM = document.querySelectorAll(".post");
    console.log("Posts found in the DOM:", postsInDOM.length);

    // Initialize pagination after all posts are created
    if (typeof initializePagination === "function") {
      initializePagination(postsPerPage, currentPage);
    }
  }, 50);
}

// Initialize the posts when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializepostsData();
});
