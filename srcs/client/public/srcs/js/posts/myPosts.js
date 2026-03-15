const MY_POSTS_INFINITE_BATCH_SIZE = 10;
const MY_POSTS_PAGINATION_PAGE_SIZE = 6;
const MY_POSTS_FEED_MODE_STORAGE_KEY = "myPostsFeedDisplayMode";
let myPostsCurrentPage = 1;
let myPostsIsLoading = false;
let myPostsHasMore = true;

function getMyPostsFeedDisplayMode() {
  const savedMode = localStorage.getItem(MY_POSTS_FEED_MODE_STORAGE_KEY);
  return savedMode === "infinite" ? "infinite" : "pagination";
}

function isMyPostsInfiniteMode() {
  return getMyPostsFeedDisplayMode() === "infinite";
}

function filterPostsForCurrentUser(posts, userId) {
  return (posts || []).filter(
    (post) => Number(post.user_id) === Number(userId),
  );
}

function transformPostForMyPosts(postData) {
  return {
    id: postData.id,
    image_id: postData.image_id,
    user_id: postData.user_id,
    alias: postData.alias,
    avatar:
      postData.image_data || postData.image_path || "assets/profile/photo1.jpg",
    caption: postData.caption || "",
    created_at: postData.created_at,
    likes_count: postData.likes_count || 0,
    comments_count: postData.comments_count || 0,
    is_liked: postData.is_liked || false,
  };
}

async function fetchAllMyPosts(userId) {
  const firstResponse = await fetch(
    `/api/posts?author_id=${userId}&limit=10&page=1`,
  );
  const firstData = await firstResponse.json();

  if (!firstResponse.ok) {
    throw new Error(firstData.error || "Failed to load user posts");
  }

  const allPosts = [...(firstData.posts || [])];
  const totalPages = firstData.total_pages || 1;

  if (totalPages <= 1) {
    return allPosts;
  }

  const remainingRequests = [];
  for (let page = 2; page <= totalPages; page++) {
    remainingRequests.push(
      fetch(`/api/posts?author_id=${userId}&limit=10&page=${page}`).then(
        async (response) => {
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to load user posts");
          }
          return data.posts || [];
        },
      ),
    );
  }

  const remainingPosts = await Promise.all(remainingRequests);
  remainingPosts.forEach((posts) => allPosts.push(...posts));

  return filterPostsForCurrentUser(allPosts, userId);
}

function renderMyPosts(posts, startIndex = 0) {
  posts.forEach((postData, offset) => {
    const transformedPost = transformPostForMyPosts(postData);
    generatepostHTML(
      transformedPost,
      `my-posts-${postData.id}-${startIndex + offset}`,
      {
        targetId: "my-photos-gallery",
        storeInObjJson: false,
        showDeleteButton: true,
        compact: false,
      },
    );
  });
}

async function loadMoreMyPosts(userId) {
  if (myPostsIsLoading || !myPostsHasMore) {
    return;
  }

  myPostsIsLoading = true;

  try {
    const response = await fetch(
      `/api/posts?author_id=${userId}&limit=${MY_POSTS_INFINITE_BATCH_SIZE}&page=${myPostsCurrentPage}`,
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load user posts");
    }

    const posts = filterPostsForCurrentUser(data.posts || [], userId);
    if (posts.length === 0) {
      myPostsHasMore = false;
      return;
    }

    const gallery = document.getElementById("my-photos-gallery");
    const startIndex = gallery ? gallery.childElementCount : 0;
    renderMyPosts(posts, startIndex);
    myPostsCurrentPage++;

    if (posts.length < MY_POSTS_INFINITE_BATCH_SIZE) {
      myPostsHasMore = false;
    }
  } catch (error) {
    console.error("Error loading my posts:", error);
    showErrorAlert("Failed to load your photos");
    myPostsHasMore = false;
  } finally {
    myPostsIsLoading = false;
  }
}

function setupMyPostsInfiniteScroll() {
  if (window._myPostsInfiniteScrollBound) {
    return;
  }

  window._myPostsInfiniteScrollBound = true;
  window.addEventListener("scroll", () => {
    if (!isMyPostsInfiniteMode()) {
      return;
    }

    const myPostsSection = document.getElementById("my-posts");
    if (!myPostsSection || myPostsSection.style.display === "none") {
      return;
    }

    const session = getUserSession();
    if (!session || !session.user_id) {
      return;
    }

    let size = window.innerHeight + window.scrollY;
    let height = document.body.offsetHeight - 500;

    if (size >= height) {
      loadMoreMyPosts(session.user_id);
    }
  });
}

function initializeMyPostsPagination(postPerPage = 6, currentPage = 1) {
  const paginationNav = document.getElementById("myposts-pagination");
  const ul = paginationNav?.querySelector("ul");
  const posts = document.querySelectorAll("#my-photos-gallery .post");

  if (!paginationNav || !ul || posts.length === 0) {
    return;
  }

  const updatePage = (page) => {
    const prevRange = (page - 1) * postPerPage;
    const currRange = page * postPerPage;

    posts.forEach((post, index) => {
      const isVisible = index >= prevRange && index < currRange;
      post.classList.toggle("is-hidden", !isVisible);
    });
  };

  const totalPages = Math.ceil(posts.length / postPerPage);
  const buildPagination = (page) => {
    let li = "";

    li += `<li class="page ${page <= 1 ? "is-hidden" : ""}" data-page="${page - 1}"><span class="icon"> &lt; </span></li>`;

    for (let pageNo = 1; pageNo <= totalPages; pageNo++) {
      li += `<li class="page ${page === pageNo ? "is-active" : ""}" data-page="${pageNo}">${pageNo}</li>`;
    }

    li += `<li class="page ${page >= totalPages ? "is-hidden" : ""}" data-page="${page + 1}"><span class="icon"> &gt; </span></li>`;

    ul.innerHTML = li;

    ul.querySelectorAll("li.page[data-page]").forEach((item) => {
      item.addEventListener("click", () => {
        const nextPage = Number(item.dataset.page);
        if (
          !Number.isFinite(nextPage) ||
          nextPage < 1 ||
          nextPage > totalPages
        ) {
          return;
        }
        updatePage(nextPage);
        buildPagination(nextPage);
      });
    });
  };

  updatePage(currentPage);
  buildPagination(currentPage);
}

async function initializeMyPosts(options = {}) {
  try {
    const session = getUserSession();
    const forceRefresh = options.force === true;

    if (!session || !session.user_id || !session.logged_in) {
      console.error("User not logged in or user data not available");
      return showErrorAlert("Please login to see your photos");
    }

    const userId = session.user_id;
    const username = session.username;
    const gallery = document.getElementById("my-photos-gallery");
    const paginationNav = document.getElementById("myposts-pagination");
    const mode = getMyPostsFeedDisplayMode();

    if (!gallery) {
      console.error("My posts container not found");
      return showErrorAlert("My posts view not available");
    }

    const shouldReuseRenderedView =
      !forceRefresh &&
      window._myPostsNeedsRefresh !== true &&
      window._myPostsUserId === userId &&
      gallery.childElementCount > 0;

    if (shouldReuseRenderedView) {
      return;
    }

    console.log("Fetching posts for user:", username, "ID:", userId);
    gallery.innerHTML = "";

    myPostsCurrentPage = 1;
    myPostsHasMore = true;

    if (paginationNav) {
      const ul = paginationNav.querySelector("ul");
      if (ul) {
        ul.innerHTML = "";
      }
    }

    if (mode === "infinite") {
      if (paginationNav) {
        paginationNav.style.display = "none";
      }

      setupMyPostsInfiniteScroll();
      await loadMoreMyPosts(userId);

      if (gallery.childElementCount === 0) {
        gallery.innerHTML =
          '<p style="text-align: center; padding: 2rem; color: #666;">No posts yet. Go to Camera to publish your first photo!</p>';
      }

      window._myPostsNeedsRefresh = false;
      window._myPostsUserId = userId;
      return;
    }

    const posts = await fetchAllMyPosts(userId);

    if (posts.length === 0) {
      gallery.innerHTML =
        '<p style="text-align: center; padding: 2rem; color: #666;">No posts yet. Go to Camera to publish your first photo!</p>';
      window._myPostsNeedsRefresh = false;
      window._myPostsUserId = userId;
      return;
    }

    renderMyPosts(posts, 0);

    if (paginationNav) {
      paginationNav.style.display = "block";
      initializeMyPostsPagination(MY_POSTS_PAGINATION_PAGE_SIZE, 1);
    }

    window._myPostsNeedsRefresh = false;
    window._myPostsUserId = userId;
    console.log("My posts initialized:", posts.length, "posts displayed");
  } catch (error) {
    console.error("Error loading posts:", error);
    showErrorAlert("Failed to load your photos");
  }
}

function showUploadPhotoModal() {
  const session = getUserSession();
  if (!session || !session.logged_in) {
    return showErrorAlert("Please login to upload photos");
  }

  const overlay = document.createElement("div");
  overlay.className = "popup-overlay is-active";
  overlay.id = "upload-photo-overlay";

  const modal = document.createElement("div");
  modal.className = "auth-container is-open";
  modal.id = "upload-photo-modal";
  modal.style.cssText =
    "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10000; max-width: 500px; width: 90%;";

  modal.innerHTML = `
    <span class="icon-close" onclick="closeUploadPhotoModal()">
      <i class="fa-solid fa-xmark"></i>
    </span>
    <div class="header-login-container">
      <i class="fa-solid fa-upload" style="margin-right: 0.5rem;"></i>
      <h2>Upload Photo</h2>
    </div>
    <form id="upload-photo-form" style="margin-top: 20px;" onsubmit="handlePhotoUpload(event)">
      <div class="login-inputs">
        <label>Select Photo</label>
        <input 
          type="file" 
          id="upload-photo-input" 
          accept="image/*"
          required
          style="padding: 10px; border: 1px solid #ccc; border-radius: 8px; width: 100%;"
        />
        <div id="upload-preview" style="margin-top: 15px; text-align: center; display: none;">
          <img id="upload-preview-img" style="max-width: 100%; max-height: 300px; border-radius: 8px;" />
        </div>
        <label style="margin-top: 15px;">Caption (optional)</label>
        <textarea 
          id="upload-caption" 
          class="input-info" 
          placeholder="Add a caption for your photo..."
          rows="3"
          style="resize: vertical; padding: 10px; font-family: inherit;"
        ></textarea>
      </div>
      <button class="submit-btn" type="submit" style="margin-top: 20px;">
        <i class="fa-solid fa-check" style="margin-right: 8px;"></i>
        Upload Photo
      </button>
    </form>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  const input = document.getElementById("upload-photo-input");
  input.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const preview = document.getElementById("upload-preview");
        const img = document.getElementById("upload-preview-img");
        img.src = event.target.result;
        preview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

  overlay.onclick = closeUploadPhotoModal;
}

function closeUploadPhotoModal() {
  const modal = document.getElementById("upload-photo-modal");
  const overlay = document.getElementById("upload-photo-overlay");
  if (modal) modal.remove();
  if (overlay) overlay.remove();
}

async function handlePhotoUpload(event) {
  event.preventDefault();

  const fileInput = document.getElementById("upload-photo-input");
  const caption = document.getElementById("upload-caption").value;
  const file = fileInput.files[0];

  if (!file) {
    return showErrorAlert("Please select a photo");
  }

  if (!file.type.startsWith("image/")) {
    return showErrorAlert("Please select a valid image file");
  }

  if (file.size > 10 * 1024 * 1024) {
    return showErrorAlert("Image size must be less than 10MB");
  }

  const reader = new FileReader();
  reader.onload = async function (e) {
    const imageData = e.target.result;

    try {
      const response = await fetch("/api/images", {
        method: "POST",
        headers: await getJsonHeaders(),
        body: JSON.stringify({
          image_data: imageData,
          caption: caption || "",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("✅ Photo uploaded successfully:", data.image_id);
        closeUploadPhotoModal();
        showSuccessAlert("Photo uploaded successfully!");
        invalidatePostViews();

        setTimeout(() => {
          initializeMyPosts({ force: true });
        }, 500);
      } else {
        console.error("❌ Failed to upload photo:", data.error);
        showErrorAlert("Failed to upload photo: " + data.error);
      }
    } catch (error) {
      console.error("❌ Error uploading photo:", error);
      showErrorAlert("Error uploading photo. Please try again.");
    }
  };

  reader.readAsDataURL(file);
}
