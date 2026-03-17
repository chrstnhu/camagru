// Shows a success alert 
function showSuccessAlert(message) {
  showAlert("success", message);
}

// Shows an error alert 
function showErrorAlert(message) {
  showAlert("error", message);
}

// Counter for unique alert IDs
let alertIdCounter = 0;

// Shows an alert of success or error with the message
function showAlert(type, message) {
  const container = document.getElementById("alert-container");
  if (!container) {
    return;
  }

  // Create unique ID for this alert
  const alertId = `alert-${alertIdCounter++}`;

  // Create alert element
  const alertBox = document.createElement("div");
  alertBox.className = "alert-box";
  alertBox.id = alertId;

  // Create alert content
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert is-${type}`;

  const icon = document.createElement("i");
  icon.className =
    type === "success"
      ? "fa-solid fa-circle-check"
      : "fa-solid fa-circle-xmark";

  const messageSpan = document.createElement("span");
  messageSpan.textContent = message;

  alertDiv.appendChild(icon);
  alertDiv.appendChild(messageSpan);
  alertBox.appendChild(alertDiv);

  container.appendChild(alertBox);

  alertBox.addEventListener("click", () => {
    removeAlert(alertId);
  });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    removeAlert(alertId);
  }, 5000);
}

// Removes a specific alert with a fade-out animation
function removeAlert(alertId) {
  const alertBox = document.getElementById(alertId);
  if (!alertBox) {
    return;
  }

  alertBox.classList.add("is-removing");

  setTimeout(() => {
    if (alertBox.parentNode) {
      alertBox.parentNode.removeChild(alertBox);
    }
  }, 300);
}

// Removes all alerts immediately (legacy compatibility)
function hideAllAlertsImmediately() {
  const container = document.getElementById("alert-container");
  if (container) {
    container.innerHTML = "";
  }
}
