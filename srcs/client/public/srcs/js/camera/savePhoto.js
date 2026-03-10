// Clear photo gallery (remove all photos)
function clearPhotoGallery() {
  if (photoGallery) {
    photoGallery.innerHTML = "";
    photoID = 0;
  }
}

// Add a new photo to the gallery
function addPhotoToGallery(dataUrl) {
  if (!photoGallery) return;

  photoID++;
  const photoItem = document.createElement("div");
  photoItem.className = "photo-item";

  const img = document.createElement("img");
  img.src = dataUrl;
  img.alt = `Captured photo ${photoID}`;
  img.className = "photo-image photo-taken";
  img.id = `photo-${photoID}`;

  // Remove animation class after animation
  setTimeout(() => {
    img.classList.remove("photo-taken");
  }, 500);

  photoItem.appendChild(img);
  photoGallery.appendChild(photoItem);

  // Scroll gallery photo
  photoGallery.insertBefore(photoItem, photoGallery.firstChild);
  photoGallery.scrollTop = 0;

  console.log(`📷 Photo ${photoID} added to gallery`);

  // Check if user is logged in before saving
  const userId = getLoggedInUserId();
  if (!userId) {
    console.warn("User not logged in");
    showErrorAlert("Please login to save your photos");
    return;
  }

  saveImageToDatabase(dataUrl);
}

// Save image to database
function saveImageToDatabase(dataUrl) {
  fetch("/api/images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_data: dataUrl,
      caption: "",
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log("✅ Image saved to database:", data.image_id);

        // Refresh page if it exists
        const myPostsSection = document.getElementById("my-posts");
        if (myPostsSection) {
          delete myPostsSection.dataset.initialized;
        }
      } else {
        console.error("❌ Failed to save image:", data.error);
        showErrorAlert("Failed to save photo: " + data.error);
      }
    })
    .catch((error) => {
      console.error("❌ Error saving image:", error);
      showErrorAlert("Error saving photo");
    });
}

// Store uploaded image data for later saving
window._uploadedImageData = null;

// Handle image upload from file input
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

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

// Save uploaded photo with effect to gallery
function saveUploadedPhoto() {
  if (!window._uploadedImageData) {
    return showErrorAlert("Please upload an image first");
  }
  if (!selectedEffect) {
    return showErrorAlert("Please select an effect first");
  }

  const imgData = window._uploadedImageData;
  const img = new Image();
  img.onload = function () {
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = (img.height / img.width) * width;

    // Draw the uploaded image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Apply effect
    const effectImg = new Image();
    effectImg.src = selectedEffect.img;
    effectImg.onload = function () {
      const effectWidth = parseInt(cameraEffect.style.width) || 100;
      const effectHeight = parseInt(cameraEffect.style.height) || 80;

      const posX = (canvas.width - effectWidth) / 2;
      const posY = (canvas.height - effectHeight) / 2;

      ctx.drawImage(effectImg, posX, posY, effectWidth, effectHeight);

      const dataUrl = canvas.toDataURL("image/png");
      addPhotoToGallery(dataUrl);

      // Reset upload preview
      resetUploadPreview();
    };
  };
  img.src = imgData.src;
}

// Reset upload preview to initial state
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
