function setFeedModeButtons(infiniteBtnId, paginationBtnId, mode) {
  const infiniteBtn = document.getElementById(infiniteBtnId);
  const paginationBtn = document.getElementById(paginationBtnId);

  if (!infiniteBtn || !paginationBtn) {
    return;
  }

  const isPagination = mode === "pagination";
  infiniteBtn.style.background = isPagination ? "#e5e7eb" : "#5784BA";
  infiniteBtn.style.color = isPagination ? "#1f2937" : "white";
  paginationBtn.style.background = isPagination ? "#5784BA" : "#e5e7eb";
  paginationBtn.style.color = isPagination ? "white" : "#1f2937";
}

async function applySectionFeedMode(section, mode) {
  const normalizedMode = mode === "pagination" ? "pagination" : "infinite";

  if (section === "gallery") {
    localStorage.setItem(
      window.PROFILE_GALLERY_FEED_MODE_STORAGE_KEY,
      normalizedMode,
    );
    setFeedModeButtons(
      "profile-gallery-mode-infinite",
      "profile-gallery-mode-pagination",
      normalizedMode,
    );

    window._galleryNeedsRefresh = true;
    const gallerySection = document.getElementById("gallery");
    if (
      gallerySection &&
      gallerySection.style.display !== "none" &&
      typeof window.initializepostsData === "function"
    ) {
      await window.initializepostsData();
    }
    return;
  }

  localStorage.setItem(
    window.PROFILE_MY_POSTS_FEED_MODE_STORAGE_KEY,
    normalizedMode,
  );
  setFeedModeButtons(
    "profile-myposts-mode-infinite",
    "profile-myposts-mode-pagination",
    normalizedMode,
  );

  window._myPostsNeedsRefresh = true;
  const myPostsSection = document.getElementById("my-posts");
  if (
    myPostsSection &&
    myPostsSection.style.display !== "none" &&
    typeof initializeMyPosts === "function"
  ) {
    await initializeMyPosts({ force: true });
  }
}
