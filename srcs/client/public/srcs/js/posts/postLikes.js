// Initializes the like button for a post, sets up event listeners and updates UI
async function initLikeBtn(postId, index, initialIsLiked, initialLikeCount) {
  const likeBtn = document.getElementById(`like-btn-${index}`);
  const likeCount = document.getElementById(`like-count-${index}`);

  if (!likeBtn || !likeCount) {
    return;
  }

  const session = getUserSession();
  const isLoggedIn = session && session.logged_in;

  if (typeof initialLikeCount !== "undefined") {
    likeCount.textContent = Number(initialLikeCount) || 0;
    updateLikeBtn(likeBtn, isLoggedIn ? Boolean(initialIsLiked) : false);
  } else {
    await loadLikeStatus(postId, likeBtn, likeCount, isLoggedIn);
  }

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

// Loads the like status for a post from the API and updates the UI
async function loadLikeStatus(postId, likeBtn, likeCount, isLoggedIn) {
  try {
    const response = await fetch(`/api/posts/${postId}/likes`);
    const data = await response.json();

    // Only show red heart if user is logged in
    if (response.ok) {
      updateLikeBtn(likeBtn, isLoggedIn ? data.is_liked : false);
      likeCount.textContent = data.likes_count;
    }
  } catch (error) {
    console.error("Error loading like status:", error);
    updateLikeBtn(likeBtn, false);
    likeCount.textContent = "0";
  }
}

// Toggles the like status for a post and updates the UI
async function toggleLike(postId, likeBtn, likeCount) {
  const session = getUserSession();
  if (!session || !session.user_id || !session.logged_in) {
    return showErrorAlert("Please login to like posts");
  }

  try {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: await getJsonHeaders(),
    });

    const data = await response.json();

    if (response.ok) {
      invalidatePostViews();
      updateLikeBtn(likeBtn, data.is_liked);
      likeCount.textContent = data.likes_count;
    } else {
      if (response.status === 401) {
        await handleUnauthorizedResponse("Please login to like posts");
      } else {
        showErrorAlert(data.error || "Failed to toggle like");
      }
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    showErrorAlert("Network error. Please try again.");
  }
}

// Updates the appearance of the like button based on like status
function updateLikeBtn(btn, isLiked) {
  const heart = btn.querySelector("i");
  if (isLiked) {
    heart.className = "fa-solid fa-heart";
    heart.style.color = "red";
    btn.classList.add("is-liked");
  } else {
    heart.className = "fa-regular fa-heart";
    heart.style.color = "gray";
    btn.classList.remove("is-liked");
  }
}
