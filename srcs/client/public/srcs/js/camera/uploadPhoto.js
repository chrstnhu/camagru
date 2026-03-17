// Validates that the file is an image type
function validateImageFile(file) {
  if (!file) {
    return false;
  }
  if (!file.type.startsWith("image/")) {
    showErrorAlert("Please select a valid image file");
    return false;
  }
  return true;
}

// Resizes the image to fit within 640x480 while maintaining aspect ratio
function resizeImage(img, dataUrl) {
  const maxWidth = 640;
  const maxHeight = 480;

  let { width, height } = img;
  let scale = Math.min(maxWidth / width, maxHeight / height, 1);
  let newWidth = Math.round(width * scale);
  let newHeight = Math.round(height * scale);
  let resizedDataUrl = dataUrl;

  if (scale < 1) {
    const resizeCanvas = document.createElement("canvas");
    resizeCanvas.width = newWidth;
    resizeCanvas.height = newHeight;
    const ctx = resizeCanvas.getContext("2d");
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    resizedDataUrl = resizeCanvas.toDataURL("image/png");
  }
  return { resizedDataUrl, newWidth, newHeight };
}

// Updates the upload preview with the resized image and stores it globally
function updateUploadPreview(resizedDataUrl, newWidth, newHeight) {
  window._uploadedImageData = {
    src: resizedDataUrl,
    width: newWidth,
    height: newHeight,
  };

  const placeholder = document.getElementById("upload-placeholder");
  const previewWrapper = document.getElementById("upload-preview-wrapper");
  const previewImg = document.getElementById("upload-preview");

  if (placeholder) {
    placeholder.style.display = "none";
  }
  if (previewWrapper) {
    previewWrapper.style.display = "inline-block";
  }
  if (previewImg) {
    previewImg.src = resizedDataUrl;
  }
}

// Updates the effect preview overlay based on the selected effect
function updateEffectPreview() {
  const uploadEffectPreview = document.getElementById("upload-effect-preview");
  const uploadSaveBtn = document.getElementById("upload-save-btn");

  if (uploadEffectPreview && selectedEffect) {
    uploadEffectPreview.src = selectedEffect.img;
    uploadEffectPreview.style.display = "block";
  }
  if (uploadSaveBtn) {
    uploadSaveBtn.disabled = !selectedEffect;
  }
}

// Handles image file selection and preview, including resizing and effect preview
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!validateImageFile(file)) {
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const { resizedDataUrl, newWidth, newHeight } = resizeImage(
        img,
        e.target.result,
      );
      updateUploadPreview(resizedDataUrl, newWidth, newHeight);
      updateEffectPreview();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  if (event.target.value) {
    event.target.value = "";
  }
}

// Creates a canvas context for compositing the uploaded image with the selected effect
function createCanvasContext(width, height) {
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  return canvas.getContext("2d");
}

// Draws the effect image centered on the canvas
function drawImageCentered(ctx, img, width, height) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const x = (width - w) / 2;
  const y = (height - h) / 2;

  ctx.drawImage(img, x, y, w, h);

  return { w, h };
}

// Saves the uploaded photo with the selected effect as a draft
function saveUploadedPhoto() {
  if (!window._uploadedImageData)
    return showErrorAlert("Please upload an image first");
  if (!selectedEffect) {
    return showErrorAlert("Please select an effect first");
  }

  const { src, width, height } = window._uploadedImageData;
  const ctx = createCanvasContext(width, height);
  const baseImg = new Image();
  const effectImg = new Image();

  baseImg.onload = () => {
    ctx.drawImage(baseImg, 0, 0, width, height);
    const baseDataUrl = ctx.canvas.toDataURL("image/png");
    effectImg.onload = () => {
      const { w, h } = drawImageCentered(ctx, effectImg, width, height);
      addCaptureDraft({
        rawDataUrl: baseDataUrl,
        previewDataUrl: ctx.canvas.toDataURL("image/png"),
        effectDataUrl: selectedEffect.dataUrl,
        effectWidth: w,
        effectHeight: h,
      });
      resetUploadPreview();
    };
    effectImg.onerror = () =>
      showErrorAlert("Failed to prepare uploaded photo");
    effectImg.src = selectedEffect.dataUrl;
  };
  baseImg.onerror = () => showErrorAlert("Failed to read uploaded image");
  baseImg.src = src;
}

// Resets the upload preview and disables the save button
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
