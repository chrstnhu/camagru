// Clear the draft gallery UI
function clearDraftGalleryUI(draftGallery, confirmActions) {
  draftGallery.innerHTML = "";
  draftGallery.style.display = "none";
  if (confirmActions) {
    confirmActions.style.display = "none";
  }
  if (photo) {
    photo.removeAttribute("src");
    photo.style.display = "none";
  }
}

// Create a thumbnail element for a draft
function createDraftThumbnail(draft, index, isSelected, onClick) {
  const thumb = document.createElement("img");
  thumb.src = draft.previewDataUrl;
  thumb.alt = `Capture draft ${index + 1}`;
  thumb.className = "capture-draft-item";
  if (isSelected) {
    thumb.classList.add("is-selected");
  }
  thumb.addEventListener("click", onClick);
  return thumb;
}

// Updates the photo preview to show the currently selected draft
function updateSelectedDraftPreview() {
  if (!photo) {
    return;
  }

  const selectedDraft = getSelectedDraft();
  if (!selectedDraft) {
    photo.removeAttribute("src");
    photo.style.display = "none";
    return;
  }

  photo.src = selectedDraft.previewDataUrl;
  photo.style.display = "block";
}

// Renders the gallery of photo capture drafts in the UI
function renderCaptureDraftGallery() {
  const draftGallery = document.getElementById("capture-draft-gallery");
  const confirmActions = document.getElementById("capture-confirm-actions");
  if (!draftGallery) {
    return;
  }
  draftGallery.innerHTML = "";
  if (!window._captureDrafts || window._captureDrafts.length === 0) {
    clearDraftGalleryUI(draftGallery, confirmActions);
    return;
  }

  // Show the draft gallery and confirm actions
  draftGallery.style.display = "grid";
  if (confirmActions) {
    confirmActions.style.display = "flex";
  }

  // Add thumbnails for each draft, marking the selected one
  window._captureDrafts.forEach((draft, index) => {
    const isSelected = index === window._selectedCaptureDraftIndex;
    const thumb = createDraftThumbnail(draft, index, isSelected, () => {
      window._selectedCaptureDraftIndex = index;
      updateSelectedDraftPreview();
      renderCaptureDraftGallery();
    });
    draftGallery.appendChild(thumb);
  });
}

// Returns the currently selected draft object, or null if none
function getSelectedDraft() {
  if (
    !window._captureDrafts ||
    window._selectedCaptureDraftIndex < 0 ||
    window._selectedCaptureDraftIndex >= window._captureDrafts.length
  ) {
    return null;
  }

  return window._captureDrafts[window._selectedCaptureDraftIndex] || null;
}

// Adds a new draft to the drafts array and updates the gallery
function addCaptureDraft(draft) {
  if (!window._captureDrafts) {
    window._captureDrafts = [];
  }

  window._captureDrafts.push(draft);
  if (window._captureDrafts.length > 10) {
    window._captureDrafts.shift();
  }

  window._selectedCaptureDraftIndex = window._captureDrafts.length - 1;
  updateSelectedDraftPreview();

  if (photo) {
    photo.classList.add("photo-taken");
    setTimeout(() => photo.classList.remove("photo-taken"), 500);
  }

  renderCaptureDraftGallery();
}

// Removes the currently selected draft from the drafts array and updates the gallery
function removeSelectedDraft() {
  if (
    !window._captureDrafts ||
    window._selectedCaptureDraftIndex < 0 ||
    window._selectedCaptureDraftIndex >= window._captureDrafts.length
  ) {
    return false;
  }

  window._captureDrafts.splice(window._selectedCaptureDraftIndex, 1);

  if (window._captureDrafts.length === 0) {
    window._selectedCaptureDraftIndex = -1;
  } else {
    window._selectedCaptureDraftIndex = Math.min(
      window._selectedCaptureDraftIndex,
      window._captureDrafts.length - 1,
    );
  }

  updateSelectedDraftPreview();
  renderCaptureDraftGallery();
  return true;
}
