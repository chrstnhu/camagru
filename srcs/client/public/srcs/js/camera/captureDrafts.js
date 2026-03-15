function renderCaptureDraftGallery() {
  const draftGallery = document.getElementById("capture-draft-gallery");
  const confirmActions = document.getElementById("capture-confirm-actions");

  if (!draftGallery) {
    return;
  }

  draftGallery.innerHTML = "";

  if (!window._captureDrafts || window._captureDrafts.length === 0) {
    draftGallery.style.display = "none";
    if (confirmActions) {
      confirmActions.style.display = "none";
    }
    if (photo) {
      photo.removeAttribute("src");
      photo.style.display = "none";
    }
    return;
  }

  draftGallery.style.display = "grid";
  if (confirmActions) {
    confirmActions.style.display = "flex";
  }

  window._captureDrafts.forEach((draft, index) => {
    const thumb = document.createElement("img");
    thumb.src = draft.previewDataUrl;
    thumb.alt = `Capture draft ${index + 1}`;
    thumb.className = "capture-draft-item";

    if (index === window._selectedCaptureDraftIndex) {
      thumb.classList.add("is-selected");
    }

    thumb.addEventListener("click", () => {
      window._selectedCaptureDraftIndex = index;
      updateSelectedDraftPreview();
      renderCaptureDraftGallery();
    });

    draftGallery.appendChild(thumb);
  });
}

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
