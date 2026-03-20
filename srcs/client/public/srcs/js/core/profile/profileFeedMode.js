// Sets the feed mode button styles based on the current mode
function setFeedModeBtn(infiniteBtnId, paginationBtnId, mode) {
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

// Configure feed mode for a section
const FEED_MODE_CONFIG = {
  gallery: {
    storageKey: window.PROFILE_GALLERY_FEED_MODE_STORAGE_KEY,
    infiniteBtn: "gallery-mode-infinite",
    paginationBtn: "gallery-mode-pagination",
    sectionId: "gallery",
    refreshFlag: "_galleryNeedsRefresh",
    refreshFn: () => window.initPostsData && window.initPostsData(),
  },
  myposts: {
    storageKey: window.PROFILE_MY_POSTS_FEED_MODE_STORAGE_KEY,
    infiniteBtn: "myposts-mode-infinite",
    paginationBtn: "myposts-mode-pagination",
    sectionId: "my-posts",
    refreshFlag: "_myPostsNeedsRefresh",
    refreshFn: () =>
      typeof initMyPosts === "function" && initMyPosts({ force: true }),
  },
};

// Applies the selected feed mode (infinite or pagination) to a section and refreshes it
async function applySectionFeedMode(section, mode) {
  const normalizedMode = mode === "pagination" ? "pagination" : "infinite";
  const config =
    FEED_MODE_CONFIG[section === "gallery" ? "gallery" : "myposts"];
  if (!config) {
    return;
  }

  localStorage.setItem(config.storageKey, normalizedMode);
  setFeedModeBtn(config.infiniteBtn, config.paginationBtn, normalizedMode);
  window[config.refreshFlag] = true;
  const sectionElem = document.getElementById(config.sectionId);
  if (sectionElem && sectionElem.style.display !== "none") {
    await config.refreshFn();
  }
}
