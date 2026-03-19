// Renders the capture draft gallery based on current drafts and selection
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

// Clears the draft gallery and hides related UI elements
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

// Shows the draft gallery and confirm actions UI elements
function showDraftGalleryUI(draftGallery, confirmActions) {}

// Creates a thumbnail element for a capture draft, marking it as selected if applicable
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

// Helpers for image upload and preview
function setUploadPreviewDisplay(e) {
  const placeholder = document.getElementById("upload-placeholder");
  const previewWrapper = document.getElementById("upload-preview-wrapper");
  const previewImg = document.getElementById("upload-preview");
  const uploadEffectPreview = document.getElementById("upload-effect-preview");
  const addToDraftBtn = document.getElementById("add-to-draft");
  if (placeholder) {
    placeholder.style.display = "none";
  }
  if (previewWrapper) {
    previewWrapper.style.display = "inline-block";
  }
  if (previewImg) {
    previewImg.src = e.target.result;
  }
  if (uploadEffectPreview && selectedEffect) {
    uploadEffectPreview.src = selectedEffect.img;
    uploadEffectPreview.style.display = "block";
  }
  if (addToDraftBtn) {
    addToDraftBtn.disabled = !selectedEffect;
  }
}

function storeUploadedImageData(e, img) {
  window._uploadedImageData = {
    src: e.target.result,
    width: img.width,
    height: img.height,
  };
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  if (!file.type.startsWith("image/")) {
    return showErrorAlert("Please select a valid image file");
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      storeUploadedImageData(e, img);
      setUploadPreviewDisplay(e);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  if (event.target.value) {
    event.target.value = "";
  }
}

function drawEffectOnCanvas(
  previewContext,
  effectImage,
  imgData,
  effectWidth,
  effectHeight,
  normalizedBaseDataUrl,
) {
  const posX = (imgData.width - effectWidth) / 2;
  const posY = (imgData.height - effectHeight) / 2;
  previewContext.drawImage(effectImage, posX, posY, effectWidth, effectHeight);
  addCaptureDraft({
    rawDataUrl: normalizedBaseDataUrl,
    previewDataUrl: previewContext.canvas.toDataURL("image/png"),
    effectDataUrl: selectedEffect.dataUrl,
    effectWidth,
    effectHeight,
  });
  resetUploadPreview();
}

function saveUploadedPhoto() {
  if (!window._uploadedImageData) {
    return showErrorAlert("Please upload an image first");
  }
  if (!selectedEffect) {
    return showErrorAlert("Please select an effect first");
  }
  const imgData = window._uploadedImageData;
  const { effectWidth, effectHeight } = getUploadEffectDimensions();
  const previewCanvas = document.createElement("canvas");
  previewCanvas.width = imgData.width;
  previewCanvas.height = imgData.height;
  const previewContext = previewCanvas.getContext("2d");
  const baseImage = new Image();
  const effectImage = new Image();
  baseImage.onload = () => {
    previewContext.drawImage(baseImage, 0, 0, imgData.width, imgData.height);
    const normalizedBaseDataUrl = previewCanvas.toDataURL("image/png");
    effectImage.onload = () => {
      drawEffectOnCanvas(
        previewContext,
        effectImage,
        imgData,
        effectWidth,
        effectHeight,
        normalizedBaseDataUrl,
      );
    };
    effectImage.onerror = () => {
      showErrorAlert("Failed to prepare uploaded photo");
    };
    effectImage.src = selectedEffect.dataUrl;
  };
  baseImage.onerror = () => {
    showErrorAlert("Failed to read uploaded image");
  };
  baseImage.src = imgData.src;
}

// Resets the upload preview to its initial state
function resetUploadPreview() {
  window._uploadedImageData = null;
  const placeholder = document.getElementById("upload-placeholder");
  const previewWrapper = document.getElementById("upload-preview-wrapper");
  const uploadEffectPreview = document.getElementById("upload-effect-preview");
  const addToDraftBtn = document.getElementById("add-to-draft");

  if (placeholder) {
    placeholder.style.display = "flex";
  }
  if (previewWrapper) {
    previewWrapper.style.display = "none";
  }
  if (uploadEffectPreview) {
    uploadEffectPreview.style.display = "none";
  }
  if (addToDraftBtn) {
    addToDraftBtn.disabled = true;
  }
}
