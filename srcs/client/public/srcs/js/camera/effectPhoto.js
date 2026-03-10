// Handle effect selection
function handleEffectSelection() {
  const effectsContainer = document.getElementById("effects-container");
  if (!effectsContainer) return;

  const effects = [
    { name: "summerHat", img: "assets/photosEffects/summerHat.png" },
    { name: "confettis", img: "assets/photosEffects/confettis.png" },
  ];

  effectsContainer.innerHTML = "";
  effects.forEach((effect) => createEffectElement(effect, effectsContainer));
}

// Create effect element
function createEffectElement(effect, container) {
  const effectDiv = document.createElement("div");
  effectDiv.classList.add("effect");

  effectDiv.addEventListener("click", (ev) => {
    ev.preventDefault();
    toggleEffectSelection(effectDiv, effect);
  });

  const img = document.createElement("img");
  img.src = effect.img;
  img.alt = effect.name;
  img.title = effect.name;

  effectDiv.appendChild(img);
  container.appendChild(effectDiv);
}

// Toggle effect selection
function toggleEffectSelection(effectDiv, effect) {
  const alreadySelected = effectDiv.classList.contains("selected");

  document
    .querySelectorAll(".effect")
    .forEach((el) => el.classList.remove("selected"));

  const uploadEffectPreview = document.getElementById("upload-effect-preview");
  const uploadSaveBtn = document.getElementById("upload-save-btn");

  if (alreadySelected) {
    selectedEffect = null;
    cameraEffect.src = "";
    cameraEffect.style.display = "none";
    startBtn.disabled = true;
    startBtn.classList.add("disabled");

    // Hide effect on upload preview
    if (uploadEffectPreview) {
      uploadEffectPreview.style.display = "none";
    }
    if (uploadSaveBtn) {
      uploadSaveBtn.disabled = true;
    }
    return;
  }

  effectDiv.classList.add("selected");
  selectedEffect = effect;
  cameraEffect.src = effect.img;
  cameraEffect.style.display = "block";
  startBtn.disabled = false;
  startBtn.classList.remove("disabled");

  // Show effect on upload preview if image is uploaded
  if (uploadEffectPreview && window._uploadedImageData) {
    uploadEffectPreview.src = effect.img;
    uploadEffectPreview.style.display = "block";
  }
  if (uploadSaveBtn && window._uploadedImageData) {
    uploadSaveBtn.disabled = false;
  }
}
