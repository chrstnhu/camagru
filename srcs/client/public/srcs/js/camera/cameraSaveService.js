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
        typeof initializepostsData === "function"
      ) {
        await initializepostsData();
      }

      if (
        myPostsSection &&
        myPostsSection.style.display !== "none" &&
        typeof initializeMyPosts === "function"
      ) {
        await initializeMyPosts({ force: true });
      }

      if (myPostsSection) {
        delete myPostsSection.dataset.initialized;
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
