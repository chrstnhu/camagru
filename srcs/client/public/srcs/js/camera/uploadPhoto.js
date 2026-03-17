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
      window._uploadedImageData = {
        src: e.target.result,
        width: img.width,
        height: img.height,
      };

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

      if (uploadEffectPreview && selectedEffect) {
        uploadEffectPreview.src = selectedEffect.img;
        uploadEffectPreview.style.display = "block";
      }

      if (uploadSaveBtn) {
        uploadSaveBtn.disabled = !selectedEffect;
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);

  if (event.target.value) {
    event.target.value = "";
  }
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
