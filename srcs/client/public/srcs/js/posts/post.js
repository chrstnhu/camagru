// Initialize posts data from API
let currentLoadedPage = 1;
let isLoading = false;
let hasMorePosts = true;

// BONUS : true = infinite scroll, false = normal pagination
const USE_INFINITE_SCROLL = true;

async function initializepostsData() {
  window.objJson = [];
  currentLoadedPage = 1;
  hasMorePosts = true;

  await loadMorePosts();

  // Setup infinite scroll or pagination classique
  if (USE_INFINITE_SCROLL) {
    setupInfiniteScroll();
    document.getElementById("classic-pagination").style.display = "none";
  } else {
    // Normal Pagination
    setTimeout(() => {
      initializePagination(10, 1);
    }, 100);
  }
}

async function loadMorePosts() {
  if (isLoading || !hasMorePosts) return;

  isLoading = true;

  try {
    const response = await fetch(
      `/api/posts?limit=10&page=${currentLoadedPage}`,
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

      // Generate post HTML for each post from API
      data.posts.forEach((postData, index) => {
        const transformedPost = {
          id: postData.id,
          alias: postData.alias,
          avatar: postData.image_path || "assets/profile/photo1.jpg",
          // avatar: commentAvatar || "assets/profile/photo1.jpg",
          caption: postData.caption || "",
          created_at: postData.created_at,
          likes_count: postData.likes_count || 0,
          is_liked: postData.is_liked || false,
        };

        generatepostHTML(transformedPost, window.objJson.length);
      });

      currentLoadedPage++;

      if (data.posts.length < 10) {
        hasMorePosts = false;
      }
    }
  } catch (error) {
    console.error("Error loading posts:", error);
  } finally {
    isLoading = false;
  }
}

// BONUS - Post with infinite scroll
function setupInfiniteScroll() {
  window.addEventListener("scroll", () => {
    let size = window.innerHeight + window.scrollY;
    let height = document.body.offsetHeight - 500;

    if (size >= height) {
      loadMorePosts();
    }
  });
}

// Fallback function with example data
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

// Initialize the posts when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializepostsData();
});
