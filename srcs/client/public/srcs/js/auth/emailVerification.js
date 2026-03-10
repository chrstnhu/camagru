// Email verification page for SPA
function showEmailVerificationPage(status, reason = null) {
  console.log("📧 Showing email verification page...", status, reason);

  // Hide main content
  const mainContent = document.querySelector(".main-content");
  if (mainContent) {
    mainContent.style.display = "none";
  }

  // Remove existing verification page if present
  const existingPage = document.getElementById("verification-page");
  if (existingPage) {
    existingPage.remove();
  }

  // Create verification page container
  const verificationPage = document.createElement("div");
  verificationPage.id = "verification-page";
  verificationPage.classList.add("verification-page");

  // Create content container
  const container = document.createElement("div");
  container.classList.add("verification-container");

  if (status === "success") {
    // Success case
    container.innerHTML = `
      <div class="verification-icon success">
        <i class="fas fa-check-circle"></i>
      </div>
      <h1 class="verification-title">
        Email Verified Successfully!
      </h1>
      <p class="verification-message">
        Your email address has been confirmed. You can now log in to your Camagru account and start sharing photos!
      </p>
      <button class="verification-btn">
        Go to Login
      </button>
      <p class="verification-countdown">
        Redirecting in <span id="countdown">5</span> seconds...
      </p>
    `;

    // Setup button click handler
    const btn = container.querySelector(".verification-btn");
    btn.addEventListener("click", function () {
      closeVerificationPage();
      window.activateLoginPopup();
    });

    // Auto redirect with countdown
    let countdown = 5;
    const countdownInterval = setInterval(() => {
      countdown--;
      const countdownSpan = document.getElementById("countdown");
      if (countdownSpan) {
        countdownSpan.textContent = countdown;
      }
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        closeVerificationPage();
        window.activateLoginPopup();
      }
    }, 1000);
  } else if (status === "error") {
    // Error case
    let errorMessage = "Email verification failed.";

    if (reason === "no_code") {
      errorMessage = "No verification code was provided.";
    } else if (reason === "invalid_code") {
      errorMessage = "The verification code is invalid or has expired.";
    }

    container.innerHTML = `
      <div class="verification-icon error">
        <i class="fas fa-times-circle"></i>
      </div>
      <h1 class="verification-title">
        Verification Failed
      </h1>
      <p class="verification-message">
        ${errorMessage}<br><br>
        Please check your email for a new verification link or contact support if the problem persists.
      </p>
      <button class="verification-btn">
        Return to Home
      </button>
    `;

    // Setup button click handler
    const btn = container.querySelector(".verification-btn");
    btn.addEventListener("click", function () {
      closeVerificationPage();
    });
  } else {
    // Unknown status
    container.innerHTML = `
      <div class="verification-icon error">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h1 class="verification-title">
        Unknown Status
      </h1>
      <p class="verification-message">
        Something went wrong. Please try again.
      </p>
      <button class="verification-btn">
        Return to Home
      </button>
    `;

    const btn = container.querySelector(".verification-btn");
    btn.addEventListener("click", function () {
      closeVerificationPage();
    });
  }

  verificationPage.appendChild(container);
  document.body.appendChild(verificationPage);

  // Clean URL parameters
  window.history.replaceState({}, document.title, window.location.pathname);
}

function closeVerificationPage() {
  const verificationPage = document.getElementById("verification-page");
  if (verificationPage) {
    verificationPage.remove();
  }

  // Show main content again
  const mainContent = document.querySelector(".main-content");
  if (mainContent) {
    mainContent.style.display = "";
  }
}
