function deletePhoto() {
  // Create delete button for this photo
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.innerHTML = "<i class='fa-solid fa-trash'></i>";
  deleteBtn.setAttribute("aria-label", "Delete photo");

  // Add click handler with database deletion
  deleteBtn.addEventListener("click", async (ev) => {
    ev.stopPropagation();
    const confirmDelete = await showConfirmPopup(
      "Delete Photo",
      "Are you sure you want to delete this photo? This action cannot be undone.",
    );
    if (confirmDelete) {
      try {
        // Delete from database
        const response = await fetch(`/api/images/${imageData.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });

        const result = await response.json();

        if (response.ok && result.success) {
          gallery.removeChild(photoItem);
          console.log("🗑️ Photo deleted from database and gallery");

          showSuccessAlert("Photo deleted successfully");

          // Check if gallery is now empty
          if (gallery.children.length === 0) {
            gallery.innerHTML =
              '<p style="text-align: center; padding: 2rem; color: #666;">No photos yet. Go to Camera to capture your first photo!</p>';
          }
        } else {
          console.error("❌ Failed to delete photo:", result.error);
          showErrorAlert("Failed to delete photo: " + result.error);
        }
      } catch (error) {
        console.error("❌ Error deleting photo:", error);
        showErrorAlert("Error deleting photo");
      }
    }
  });
}

// Initialize posts data from API
async function initializeMyPosts() {
  window.objJson = [];

  try {
    const session = getUserSession();

    if (!session || !session.user_id || !session.logged_in) {
      console.error("User not logged in or user data not available");
      return showErrorAlert("Please login to see your photos");
    }

    const userId = session.user_id;
    const username = session.username;
    console.log("Fetching photos for user:", username, "ID:", userId);

    // Fetch user's images from API
    const response = await fetch(`/api/images/user/${userId}`);
    const data = await response.json();

    if (response.ok && data.images) {
      console.log("Images loaded from API:", data.images.length);

      const gallery = document.getElementById("my-photos-gallery");
      if (!gallery) {
        console.error("Gallery container not found");
        return showErrorAlert("Gallery not available");
      }

      // Clear existing content
      gallery.innerHTML = "";

      // Check if user has photos
      if (data.images.length === 0) {
        gallery.innerHTML =
          '<p style="text-align: center; padding: 2rem; color: #666;">No photos yet. Go to Camera to capture your first photo!</p>';
        return;
      }

      // Add each image to the gallery
      data.images.forEach((imageData) => {
        const photoItem = document.createElement("div");
        photoItem.className = "gallery-photo-item";

        const img = document.createElement("img");
        img.src = imageData.image_data;
        img.alt = imageData.caption || "Captured photo";
        img.className = "gallery-photo";

        deletePhoto();

        photoItem.appendChild(img);
        photoItem.appendChild(deleteBtn);

        // Add caption if exists
        if (imageData.caption) {
          const caption = document.createElement("p");
          caption.className = "gallery-caption";
          caption.textContent = imageData.caption;
          photoItem.appendChild(caption);
        }

        gallery.appendChild(photoItem);
      });

      console.log(
        "Gallery initialized:",
        data.images.length,
        "photos displayed",
      );
    } else {
      console.log("No images found for this user");
    }
  } catch (error) {
    console.error("Error loading posts:", error);
    showErrorAlert("Failed to load your photos");
  }
}

// Initialize when navigating to my-posts section
document.addEventListener("DOMContentLoaded", function () {
  const observer = new MutationObserver(function (mutations) {
    const myPostsSection = document.getElementById("my-posts");
    // Section is visible, always reload to get latest photos
    if (myPostsSection && myPostsSection.style.display !== "none") {
      initializeMyPosts();
    }
  });

  const myPostsSection = document.getElementById("my-posts");
  if (myPostsSection) {
    observer.observe(myPostsSection, {
      attributes: true,
      attributeFilter: ["style"],
    });
  }
});

// Show upload photo modal
function showUploadPhotoModal() {
  const session = getUserSession();
  if (!session || !session.logged_in) {
    return showErrorAlert("Please login to upload photos");
  }

  // Create modal overlay
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay active";
  overlay.id = "upload-photo-overlay";

  // Create modal
  const modal = document.createElement("div");
  modal.className = "auth-container active-popup";
  modal.id = "upload-photo-modal";
  modal.style.cssText =
    "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10000; max-width: 500px; width: 90%;";

  modal.innerHTML = `
    <span class="icon-close" onclick="closeUploadPhotoModal()">
      <i class="fa-solid fa-xmark"></i>
    </span>
    <div class="header-login-container">
      <i class="fa-solid fa-upload" style="margin-right: 0.5rem;"></i>
      <h2>Upload Photo</h2>
    </div>
    <form id="upload-photo-form" style="margin-top: 20px;" onsubmit="handlePhotoUpload(event)">
      <div class="login-inputs">
        <label>Select Photo</label>
        <input 
          type="file" 
          id="upload-photo-input" 
          accept="image/*"
          required
          style="padding: 10px; border: 1px solid #ccc; border-radius: 8px; width: 100%;"
        />
        <div id="upload-preview" style="margin-top: 15px; text-align: center; display: none;">
          <img id="upload-preview-img" style="max-width: 100%; max-height: 300px; border-radius: 8px;" />
        </div>
        <label style="margin-top: 15px;">Caption (optional)</label>
        <textarea 
          id="upload-caption" 
          class="input-info" 
          placeholder="Add a caption for your photo..."
          rows="3"
          style="resize: vertical; padding: 10px; font-family: inherit;"
        ></textarea>
      </div>
      <button class="submit-btn" type="submit" style="margin-top: 20px;">
        <i class="fa-solid fa-check" style="margin-right: 8px;"></i>
        Upload Photo
      </button>
    </form>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  // Setup preview
  const input = document.getElementById("upload-photo-input");
  input.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const preview = document.getElementById("upload-preview");
        const img = document.getElementById("upload-preview-img");
        img.src = event.target.result;
        preview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

  overlay.onclick = closeUploadPhotoModal;
}

// Close upload photo modal
function closeUploadPhotoModal() {
  const modal = document.getElementById("upload-photo-modal");
  const overlay = document.getElementById("upload-photo-overlay");
  if (modal) modal.remove();
  if (overlay) overlay.remove();
}

// Handle photo upload
async function handlePhotoUpload(event) {
  event.preventDefault();

  const fileInput = document.getElementById("upload-photo-input");
  const caption = document.getElementById("upload-caption").value;
  const file = fileInput.files[0];

  if (!file) {
    return showErrorAlert("Please select a photo");
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return showErrorAlert("Please select a valid image file");
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return showErrorAlert("Image size must be less than 10MB");
  }

  // Read file as base64
  const reader = new FileReader();
  reader.onload = async function (e) {
    const imageData = e.target.result;

    try {
      const response = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_data: imageData,
          caption: caption || "",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("✅ Photo uploaded successfully:", data.image_id);

        closeUploadPhotoModal();

        showSuccessAlert("Photo uploaded successfully!");

        // Refresh My Posts gallery
        setTimeout(() => {
          initializeMyPosts();
        }, 500);
      } else {
        console.error("❌ Failed to upload photo:", data.error);
        showErrorAlert("Failed to upload photo: " + data.error);
      }
    } catch (error) {
      console.error("❌ Error uploading photo:", error);
      showErrorAlert("Error uploading photo. Please try again.");
    }
  };

  reader.readAsDataURL(file);
}
