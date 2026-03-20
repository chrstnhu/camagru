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

  // Get the rendered size of the preview and effect elements
  const previewSize = getRenderedSize(previewImg, 320, 240);
  const overlaySize = getRenderedSize(uploadEffectPreview, 100, 80);

  const widthRatio = uploadedImage.width / Math.max(previewSize.width, 1);
  const heightRatio = uploadedImage.height / Math.max(previewSize.height, 1);

  return {
    effectWidth: Math.max(1, Math.round(overlaySize.width * widthRatio)),
    effectHeight: Math.max(1, Math.round(overlaySize.height * heightRatio)),
  };
}

// Helper: Build the request body for saving an image
function buildImageRequestBody(dataUrl, options = {}) {
  if (options.effectDataUrl) {
    return {
      base_image_data: dataUrl,
      effect_image_data: options.effectDataUrl,
      effect_width: options.effectWidth,
      effect_height: options.effectHeight,
      caption: options.caption || "",
    };
  } else {
    return {
      image_data: dataUrl,
      caption: options.caption || "",
    };
  }
}

// Handle a successful image save response
async function handleImageSaveSuccess(data) {
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
    typeof initpostsData === "function"
  ) {
    await initpostsData();
  }

  if (
    myPostsSection &&
    myPostsSection.style.display !== "none" &&
    typeof initMyPosts === "function"
  ) {
    await initMyPosts({ force: true });
  }

  if (myPostsSection) {
    delete myPostsSection.dataset.initd;
  }
}

// Saves an image (with effect) to the backend database
async function saveImageToDatabase(dataUrl, options = {}) {
  try {
    const requestBody = buildImageRequestBody(dataUrl, options);
    const response = await fetch("/api/images", {
      method: "POST",
      headers: await getJsonHeaders(),
      body: JSON.stringify(requestBody),
    });
    const data = await response.json();
    if (data.success) {
      await handleImageSaveSuccess(data);
    } else {
      showErrorAlert("Failed to save photo: " + data.error);
    }
  } catch (error) {
    showErrorAlert("Error saving photo");
  }
}
