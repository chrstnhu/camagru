// Handles the rendering and selection of photo effects in the UI
function handleEffectSelection() {
  const effectsContainer = document.getElementById("effects-container");
  if (!effectsContainer) {
    return;
  }

  const effects = [
    { name: "summerHat", img: "assets/photosEffects/summerHat.png" },
    { name: "bubble", img: "assets/photosEffects/bubble.png" },
    { name: "snow", img: "assets/photosEffects/snow.png" },
    { name: "light", img: "assets/photosEffects/light.png" },
    { name: "confettis", img: "assets/photosEffects/confettis.png" },
    { name: "decorSun", img: "assets/photosEffects/decorSun.png" },
    { name: "decorXmas", img: "assets/photosEffects/decorXmas.png" },
    { name: "happyBirthday", img: "assets/photosEffects/happyBirthday.png" },
    { name: "decorLego", img: "assets/photosEffects/decorLego.png" },
    { name: "filterCamera", img: "assets/photosEffects/filterCamera.png" },
    { name: "filterVignette", img: "assets/photosEffects/filterVignette.png" },
  ];

  effectsContainer.innerHTML = "";
  effects.forEach((effect) => createEffectElement(effect, effectsContainer));
}

// Ensures the effect has a data URL (base64) for use in overlays
async function ensureEffectDataUrl(effect) {
  if (effect.dataUrl) {
    return effect.dataUrl;
  }

  const response = await fetch(effect.img);
  const blob = await response.blob();

  effect.dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  return effect.dataUrl;
}

// Creates a DOM element for a photo effect and adds it to the container
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

// Clears the currently selected effect and disables related UI
function clearCurrentEffect(uploadEffectPreview, addToDraft) {
  selectedEffect = null;
  cameraEffect.src = "";
  cameraEffect.style.display = "none";
  startBtn.disabled = true;
  startBtn.classList.add("is-disabled");

  if (uploadEffectPreview) {
    uploadEffectPreview.style.display = "none";
  }
  if (addToDraft) {
    addToDraft.disabled = true;
  }
}

// Applies the selected effect to the preview and enables related UI
function applySelectedEffect(effect, uploadEffectPreview, addToDraft) {
  selectedEffect = effect;
  cameraEffect.src = effect.img;
  cameraEffect.style.display = "block";
  startBtn.disabled = false;
  startBtn.classList.remove("is-disabled");

  if (uploadEffectPreview && window._uploadedImageData) {
    uploadEffectPreview.src = effect.img;
    uploadEffectPreview.style.display = "block";
  }
  if (addToDraft && window._uploadedImageData) {
    addToDraft.disabled = false;
  }
}

// Toggles the selection of a photo effect, updating the UI and preview
async function toggleEffectSelection(effectDiv, effect) {
  const alreadySelected = effectDiv.classList.contains("is-selected");

  document
    .querySelectorAll(".effect")
    .forEach((el) => el.classList.remove("is-selected"));

  const uploadEffectPreview = document.getElementById("upload-effect-preview");
  const addToDraft = document.getElementById("add-to-draft");

  if (alreadySelected) {
    clearCurrentEffect(uploadEffectPreview, addToDraft);
    return;
  }

  effectDiv.classList.add("is-selected");

  try {
    await ensureEffectDataUrl(effect);
    applySelectedEffect(effect, uploadEffectPreview, addToDraft);
  } catch (error) {
    console.error("Failed to load effect image:", error);
    clearCurrentEffect(uploadEffectPreview, addToDraft);
    effectDiv.classList.remove("is-selected");
    showErrorAlert("Failed to load selected effect");
    return;
  }
}
