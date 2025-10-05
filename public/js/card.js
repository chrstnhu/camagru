// Simple Card Component
async function updateUserCard(user_card, index) {
  try {
    // Get user data
    const userAlias = user_card.alias || "Guest";

    // Update card elements
    const aliasElement = document.getElementById(`card-alias-${index}`);
    const avatarElement = document.getElementById(`card-avatar-${index}`);

    if (aliasElement) aliasElement.textContent = userAlias;

    // Update avatar
    if (avatarElement) {
      const timestamp = Date.now();
      const avatarPath = `/api/avatar/${userAlias}?ts=${timestamp}`;
      avatarElement.src = avatarPath;
      avatarElement.onerror = () => {
        avatarElement.src = user_card.avatar || "assets/profile/photo1.jpg";
      };
    }

    initializeLikeButton(user_card.id, index);
    initializeCommentsSection(user_card.id, index);
  } catch (error) {
    console.log("Error updating user card:", error);
    setDefaultCardValues();
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
    button.classList.add("liked");
  } else {
    heart.className = "fa-regular fa-heart";
    heart.style.color = "gray";
    button.classList.remove("liked");
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
function loadComments(userId, container, cardIndex) {
  const commentsKey = `comments_${userId}`;
  const comments = JSON.parse(localStorage.getItem(commentsKey)) || [];

  container.innerHTML = "";

  comments.forEach((comment, index) => {
    const commentElement = createCommentElement(
      comment,
      index,
      userId,
      cardIndex
    );
    container.appendChild(commentElement);
  });
  updateCommentsCount(comments.length, cardIndex);
}

// Update the comments count in the specific card
function updateCommentsCount(count, cardIndex) {
  const cardElement = document.querySelector(`[data-user-id] .comments-title`);
  const commentsContainer = document.getElementById(
    `comments-container-${cardIndex}`
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
function addComment(userId, input, container, cardIndex) {
  const text = input.value.trim();
  if (!text) return;

  const comment = {
    id: Date.now(),
    text: text,
    author: "Actual User", // Replace with actual user name
    timestamp: new Date().toLocaleString(),
    avatar: "assets/profile/photo1.jpg", // Replace with actual user avatar
  };

  // Save to localStorage
  const commentsKey = `comments_${userId}`;
  const comments = JSON.parse(localStorage.getItem(commentsKey)) || [];
  comments.unshift(comment);
  localStorage.setItem(commentsKey, JSON.stringify(comments));

  // Add to UI (top of the list)
  const commentElement = createCommentElement(
    comment,
    0,
    userId,
    cardIndex
  );
  container.prepend(commentElement);

  // Clear input
  input.value = "";

  updateCommentsCount(comments.length, cardIndex);
}

// Create a comment DOM element
function createCommentElement(comment, commentIndex, userId, cardIndex) {
  const div = document.createElement("div");
  div.className = "comment-item_${userId}";
  div.innerHTML = `
    <div class="comment-content comment-content_${userId}">
        <div class="comment-avatar-wrapper">
          <img src="${comment.avatar}" alt="Avatar" class="card-avatar">
          <div class="comment-info">
          <div class="comment-author">${comment.author}</div>
          <div class="comment-timestamp">${comment.timestamp}</div>
          <p class="comment-text">${comment.text}</p>
          </div>
        </div>
        <button onclick="deleteComment(${userId}, ${commentIndex}, ${cardIndex})" class="delete-comment-btn">
          <i class="fa-solid fa-trash"></i>
        </button>
    </div>
  `;
  return div;
}

// Delete a comment
function deleteComment(userId, commentIndex, cardIndex) {
  const commentsKey = `comments_${userId}`;
  const comments = JSON.parse(localStorage.getItem(commentsKey)) || [];
  comments.splice(commentIndex, 1);
  localStorage.setItem(commentsKey, JSON.stringify(comments));

  // Reload comments
  const container = document.getElementById(`comments-container-${cardIndex}`);
  loadComments(userId, container, cardIndex);
}

// Generate Card HTML with unique IDs
function generateCardHTML(user_card, index) {
  const cardComponent = document.getElementById("card-component");
  if (!cardComponent) return;

  const cardHTML = `
    <div class="card" data-user-id="${user_card.id}">
      <!-- Card Header -->
      <div class="card-header">
        <img id="card-avatar-${index}" 
             src="${user_card.avatar}" 
             alt="Photo" 
             class="card-avatar">
        <h2 id="card-alias-${index}" class="card-alias">${user_card.alias}</h2>
      </div>
        <div>
            <img
             src="${user_card.avatar}" 
             alt="Photo" 
             class="card-photo">
        </div>
      <!-- Like Section -->
      <div class="like-section">
        <button id="like-button-${index}" class="like-button">
          <i class="fa-regular fa-heart"></i>
          <span>Like</span>
        </button>
        <span id="like-count-${index}" class="like-count">0</span>
      </div>

      <!-- Comments Section -->
      <div class="comments-section">
        <h4 class="comments-title">Comments (0)</h4>

        <!-- Add Comment -->
        <div class="add-comment">
            <div class="add-comment-container">
            <img src="${user_card.avatar}" alt="Avatar" class="card-avatar">
                <div class="comment-input-container comment-input-wrapper">
                    <textarea id="comment-input-${index}" 
                    placeholder="Add a comment..." 
                    class="comment-input"
                    rows="2"></textarea>
                    <button id="add-comment-btn-${index}" class="add-comment-btn-inside">
                    <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Comments List -->
        <div id="comments-container-${index}" class="comments-list">
          <!-- Comments will be dynamically added here -->
        </div>
      </div>
    </div>
  `;

  // Create a div element for the card and append it
  const cardElement = document.createElement("div");
  cardElement.innerHTML = cardHTML;
  cardComponent.appendChild(cardElement.firstElementChild);
}

// Set default values in case of error
function setDefaultCardValues() {
  const aliasElement = document.getElementById("card-alias");
  if (aliasElement) aliasElement.textContent = "Guest";
}

// Initialize the cards
document.addEventListener("DOMContentLoaded", function () {
  // Clear existing cards first
  const cardComponent = document.getElementById("card-component");
  if (cardComponent) {
    cardComponent.innerHTML = "";
  }

  // Exemple - need to replace with real data
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
  ];

  // Generate and initialize each card
  exampleUserData.forEach((userData, index) => {
    generateCardHTML(userData, index);
    updateUserCard(userData, index);
  });
});
