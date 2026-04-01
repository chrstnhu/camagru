let alertIdCounter = 0;

// Shows an alert of success or error with the message
function showAlert(type, message) {
  const container = document.getElementById("alert-container");
  if (!container) return;
  const alertId = `alert-${alertIdCounter++}`;
  const alertBox = createAlertBox(type, message, alertId);
  container.appendChild(alertBox);
  alertBox.addEventListener("click", () => {
    removeAlert(alertId);
  });
  setTimeout(() => {
    removeAlert(alertId);
  }, 5000);
}

// Shows a success alert
function showSuccessAlert(message) {
  showAlert("success", message);
}

// Shows an error alert
function showErrorAlert(message) {
  showAlert("error", message);
}

// Shows an info alert
function showInfoAlert(message) {
  showAlert("info", message);
}

// Creates an alert box element with the specified type, message, and ID
function createAlertBox(type, message, alertId) {
  const alertBox = document.createElement("div");
  alertBox.className = "alert-box";
  alertBox.id = alertId;
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert is-${type}`;
  const icon = document.createElement("i");
  if (type === "success") {
    icon.className = "fa-solid fa-circle-check";
  } else if (type === "error") {
    icon.className = "fa-solid fa-circle-xmark";
  } else if (type === "info") {
    icon.className = "fa-solid fa-circle-info";
  }
  const messageSpan = document.createElement("span");
  messageSpan.textContent = message;
  alertDiv.appendChild(icon);
  alertDiv.appendChild(messageSpan);
  alertBox.appendChild(alertDiv);
  return alertBox;
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

// Removes a specific alert with a fade-out animation
function removeAlert(alertId) {
  const alertBox = document.getElementById(alertId);
  if (!alertBox) return;
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

// Removes all alerts immediately (legacy compatibility)
function hideAllAlertsImmediately() {
  const container = document.getElementById("alert-container");
  if (container) {
    container.innerHTML = "";
  }
}
