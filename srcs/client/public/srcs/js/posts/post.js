let currentLoadedPage = 1;
let isLoading = false;
let hasMorePosts = true;
const INFINITE_SCROLL_BATCH_SIZE = 10;
const PAGINATION_PAGE_SIZE = 8;
const GALLERY_FEED_MODE_STORAGE_KEY = "galleryFeedDisplayMode";
const INITIAL_RENDER_BATCH_SIZE = 8;
const IDLE_RENDER_BATCH_SIZE = 4;

// Runs a callback when the browser is idle, or after a short timeout fallback
function runWhenIdle(callback) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback, { timeout: 100 });
    return;
  }

  setTimeout(() => {
    callback({ timeRemaining: () => 0, didTimeout: true });
  }, 0);
}

// Renders posts in batches to avoid blocking the UI, using idle time
function renderPostsInBatches(postsData, startIndex = 0) {
  return new Promise((resolve) => {
    const total = postsData.length;

    if (total === 0) {
      resolve();
      return;
    }

    let cursor = 0;

    const renderChunk = (size) => {
      const end = Math.min(cursor + size, total);
      for (; cursor < end; cursor++) {
        const postData = postsData[cursor];
        const transformedPost = {
          id: postData.id,
          image_id: postData.image_id,
          user_id: postData.user_id,
          alias: postData.alias,
          avatar:
            postData.image_data ||
            postData.image_path ||
            "assets/profile/photo1.jpg",
          caption: postData.caption || "",
          created_at: postData.created_at,
          likes_count: postData.likes_count || 0,
          comments_count: postData.comments_count || 0,
          is_liked: postData.is_liked || false,
        };

        generatepostHTML(transformedPost, startIndex + cursor);
      }
    };

    renderChunk(INITIAL_RENDER_BATCH_SIZE);

    const renderRemaining = () => {
      if (cursor >= total) {
        resolve();
        return;
      }

      runWhenIdle(() => {
        renderChunk(IDLE_RENDER_BATCH_SIZE);
        renderRemaining();
      });
    };

    renderRemaining();
  });
}

// Returns the current display (infinite or pagination)
function getFeedDisplayMode() {
  const session = getUserSession();
  if (!session || !session.logged_in) {
    return "pagination";
  }

  const savedMode = localStorage.getItem(GALLERY_FEED_MODE_STORAGE_KEY);
  return savedMode === "infinite" ? "infinite" : "pagination";
}

// Checks if the gallery is in infinite scroll mode
function isInfiniteScrollMode() {
  return getFeedDisplayMode() === "infinite";
}

// Initializes the gallery posts data, sets up pagination or infinite scroll
async function initPostsData() {
  window._galleryNeedsRefresh = false;
  window.objJson = [];
  currentLoadedPage = 1;
  hasMorePosts = true;

  const postComponent = document.getElementById("post-component");
  if (postComponent) {
    postComponent.innerHTML = "";
  }

  const paginationNav = document.getElementById("classic-pagination");

  if (isInfiniteScrollMode()) {
    await loadMorePosts();
    setupInfiniteScroll();
    if (paginationNav) {
      paginationNav.style.display = "none";
      const paginationList = paginationNav.querySelector("ul");
      if (paginationList) {
        paginationList.innerHTML = "";
      }
    }
  } else {
    await loadAllPostsForPagination();
    if (paginationNav) {
      paginationNav.style.display = "block";
    }

    setTimeout(() => {
      initPagination(PAGINATION_PAGE_SIZE, 1);
    }, 100);
  }
}

// Renders a batch of posts, starting at the current objJson length
async function renderPosts(postsData) {
  const startIndex = window.objJson.length;
  await renderPostsInBatches(postsData, startIndex);
}

// Loads more posts for infinite scroll mode, appending them to the gallery
async function loadMorePosts() {
  if (isLoading || !hasMorePosts) {
    return;
  }

  isLoading = true;

  try {
    const response = await fetch(
      `/api/posts?limit=${INFINITE_SCROLL_BATCH_SIZE}&page=${currentLoadedPage}`,
    );
    const data = await response.json();

    if (response.ok && data.posts) {
      console.log(
        `Loaded page ${currentLoadedPage}:`,
        data.posts.length,
        "posts",
      );

      if (data.posts.length === 0) {
        hasMorePosts = false;
        return;
      }

      await renderPosts(data.posts);

      currentLoadedPage++;

      if (data.posts.length < INFINITE_SCROLL_BATCH_SIZE) {
        hasMorePosts = false;
      }
    }
  } catch (error) {
    console.error("Error loading posts:", error);
  } finally {
    isLoading = false;
  }
}

// Loads all posts for pagination mode, fetching all pages and rendering them
async function loadAllPostsForPagination() {
  if (isLoading) {
    return;
  }

  isLoading = true;
  hasMorePosts = true;

  try {
    const firstResponse = await fetch(
      `/api/posts?limit=${PAGINATION_PAGE_SIZE}&page=1`,
    );
    const firstData = await firstResponse.json();

    if (!firstResponse.ok || !firstData.posts) {
      hasMorePosts = false;
      return;
    }

    await renderPosts(firstData.posts);

    const totalPages = Number(firstData.total_pages || 1);
    if (totalPages <= 1) {
      hasMorePosts = false;
      currentLoadedPage = 2;
      return;
    }

    const remainingRequests = [];
    for (let page = 2; page <= totalPages; page++) {
      remainingRequests.push(
        fetch(`/api/posts?limit=${PAGINATION_PAGE_SIZE}&page=${page}`).then(
          async (response) => {
            const data = await response.json();
            if (!response.ok || !data.posts) {
              return [];
            }
            return data.posts;
          },
        ),
      );
    }

    const remainingPages = await Promise.all(remainingRequests);

    for (const posts of remainingPages) {
      if (posts.length > 0) {
        await renderPosts(posts);
      }
    }

    hasMorePosts = false;
    currentLoadedPage = totalPages + 1;
  } catch (error) {
    console.error("Error loading posts for pagination:", error);
  } finally {
    isLoading = false;
  }
}

// BONUS - Sets up the infinite scroll
function setupInfiniteScroll() {
  if (window._postsInfiniteScrollBound) {
    return;
  }

  window._postsInfiniteScrollBound = true;
  window.addEventListener("scroll", () => {
    if (!isInfiniteScrollMode()) {
      return;
    }

    const gallerySection = document.getElementById("gallery");
    if (!gallerySection || gallerySection.style.display === "none") {
      return;
    }

    let size = window.innerHeight + window.scrollY;
    let height = document.body.offsetHeight - 500;

    if (size >= height) {
      loadMorePosts();
    }
  });
}

// Loads example fallback data for the gallery if API is unavailable
function loadFallbackData() {
  console.log("Loading fallback data...");

  const exampleUserData = [
    {
      id: 1,
      alias: "TestUser",
      avatar: "assets/profile/photo1.jpg",
      caption: "Test post",
    },
    {
      id: 2,
      alias: "AnotherUser",
      avatar: "assets/profile/photo2.jpg",
      caption: "Another test",
    },
  ];

  exampleUserData.forEach((userData, index) => {
    generatepostHTML(userData, index);
  });
}

window.initPostsData = initPostsData;
