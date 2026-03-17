// Renders the gallery of photo capture drafts in the UI
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

// Saves the currently selected photo draft to the database
async function saveSelectedDraft() {
  const selectedDraft = getSelectedDraft();
  if (!selectedDraft) {
    showErrorAlert("Please select a photo to save");
    return false;
  }

  const { rawDataUrl, effectDataUrl, effectWidth, effectHeight } =
    selectedDraft;

  await saveImageToDatabase(rawDataUrl, {
    effectDataUrl,
    effectWidth,
    effectHeight,
  });

  removeSelectedDraft();
  showSucessAlert("Photo saved successfully!");
  return true;
}

// Sets the latest camera image in the photo element and updates its aspect ratio
function setLatestCameraImage(dataUrl) {
  if (!photo) {
    return;
  }

  photo.onload = () => {
    if (photo.naturalWidth && photo.naturalHeight) {
      photo.style.aspectRatio = `${photo.naturalWidth} / ${photo.naturalHeight}`;
    }
  };

  photo.src = dataUrl;
  photo.style.display = "block";
}

// Returns the rendered size of an element, or fallback values if not available
function getRenderedSize(element, fallbackWidth, fallbackHeight) {
  if (!element) {
    return {
      width: fallbackWidth,
      height: fallbackHeight,
    };
  }

  const rect = element.getBoundingClientRect();
  return {
    width: rect.width || fallbackWidth,
    height: rect.height || fallbackHeight,
  };
}

// Calculates the effect overlay dimensions for uploaded images
function getUploadEffectDimensions() {
  const previewImg = document.getElementById("upload-preview");
  const uploadEffectPreview = document.getElementById("upload-effect-preview");
  const uploadedImage = window._uploadedImageData;

  if (!uploadedImage) {
    return {
      effectWidth: 100,
      effectHeight: 80,
    };
  }

  const previewSize = getRenderedSize(previewImg, 320, 240);
  const overlaySize = getRenderedSize(uploadEffectPreview, 100, 80);

  const widthRatio = uploadedImage.width / Math.max(previewSize.width, 1);
  const heightRatio = uploadedImage.height / Math.max(previewSize.height, 1);

  return {
    effectWidth: Math.max(1, Math.round(overlaySize.width * widthRatio)),
    effectHeight: Math.max(1, Math.round(overlaySize.height * heightRatio)),
  };
}

// Saves an image with effect to the backend database
async function saveImageToDatabase(dataUrl, options = {}) {
  try {
    const requestBody = options.effectDataUrl
      ? {
          base_image_data: dataUrl,
          effect_image_data: options.effectDataUrl,
          effect_width: options.effectWidth,
          effect_height: options.effectHeight,
          caption: options.caption || "",
        }
      : {
          image_data: dataUrl,
          caption: options.caption || "",
        };

    const response = await fetch("/api/images", {
      method: "POST",
      headers: await getJsonHeaders(),
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    if (data.success) {
      console.log("✅ Image saved to database:", data.image_id);
      if (typeof invalidatePostViews === "function") {
        invalidatePostViews();
      }

      const myPostsSection = document.getElementById("my-posts");

      if (data.image_data) {
        setLatestCameraImage(data.image_data);
      }

      const gallerySection = document.getElementById("gallery");
      if (
        gallerySection &&
        gallerySection.style.display !== "none" &&
        typeof initPostsData === "function"
      ) {
        await initPostsData();
      }

      if (
        myPostsSection &&
        myPostsSection.style.display !== "none" &&
        typeof initMyPosts === "function"
      ) {
        await initMyPosts({ force: true });
      }

      if (myPostsSection) {
        delete myPostsSection.dataset.init;
      }
    } else {
      console.error("❌ Failed to save image:", data.error);
      showErrorAlert("Failed to save photo: " + data.error);
    }
  } catch (error) {
    console.error("❌ Error saving image:", error);
    showErrorAlert("Error saving photo");
  }
}

// Store uploaded image data for later saving
window._uploadedImageData = null;

// Handles image upload from file input and prepares preview
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  // Check if file is an image
  if (!file.type.startsWith("image/")) {
    return showErrorAlert("Please select a valid image file");
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      // Store image data
      window._uploadedImageData = {
        src: e.target.result,
        width: img.width,
        height: img.height,
      };

      // Show preview
      const placeholder = document.getElementById("upload-placeholder");
      const previewWrapper = document.getElementById("upload-preview-wrapper");
      const previewImg = document.getElementById("upload-preview");
      const uploadEffectPreview = document.getElementById(
        "upload-effect-preview",
      );
      const uploadSaveBtn = document.getElementById("upload-save-btn");

      if (placeholder) {
        placeholder.style.display = "none";
      }
      if (previewWrapper) {
        previewWrapper.style.display = "inline-block";
      }
      if (previewImg) {
        previewImg.src = e.target.result;
      }

      // Show effect on preview if one is selected
      if (uploadEffectPreview && selectedEffect) {
        uploadEffectPreview.src = selectedEffect.img;
        uploadEffectPreview.style.display = "block";
      }

      // Enable save button only if effect is selected
      if (uploadSaveBtn) {
        uploadSaveBtn.disabled = !selectedEffect;
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);

  // Reset input so same file can be re-selected
  if (event.target.value) {
    event.target.value = "";
  }
}

// Saves the uploaded photo with effect to the gallery
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
      const posX = (imgData.width - effectWidth) / 2;
      const posY = (imgData.height - effectHeight) / 2;
      previewContext.drawImage(
        effectImage,
        posX,
        posY,
        effectWidth,
        effectHeight,
      );

      addCaptureDraft({
        rawDataUrl: normalizedBaseDataUrl,
        previewDataUrl: previewCanvas.toDataURL("image/png"),
        effectDataUrl: selectedEffect.dataUrl,
        effectWidth,
        effectHeight,
      });

      resetUploadPreview();
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
  const uploadSaveBtn = document.getElementById("upload-save-btn");

  if (placeholder) {
    placeholder.style.display = "flex";
  }
  if (previewWrapper) {
    previewWrapper.style.display = "none";
  }
  if (uploadEffectPreview) {
    uploadEffectPreview.style.display = "none";
  }
  if (uploadSaveBtn) {
    uploadSaveBtn.disabled = true;
  }
}
