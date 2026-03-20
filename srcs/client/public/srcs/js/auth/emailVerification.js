// Hides the main content and removes verification page
function prepareVerificationPage() {
  const mainContent = document.querySelector(".main-content");
  if (mainContent) {
    mainContent.style.display = "none";
  }

  const existingPage = document.getElementById("verification-page");
  if (existingPage) {
    existingPage.remove();
  }
}

// Renders the success message when email verification is successful
function renderSuccessContent(container) {
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
}

// Renders the error message when email verification fails with reason
function renderErrorContent(container, reason) {
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
}

// Renders a generic error message for unknown verification status
function renderUnknownContent(container) {
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
}

// Closes the verification page and restores the main content
function closeVerificationPage() {
  const verificationPage = document.getElementById("verification-page");
  if (verificationPage) {
    verificationPage.remove();
  }

  const mainContent = document.querySelector(".main-content");
  if (mainContent) {
    mainContent.style.display = "";
  }
}

// Binds the close action to the button
function bindCloseBtn(container) {
  const btn = container.querySelector(".verification-btn");
  if (!btn) {
    return;
  }

  btn.addEventListener("click", () => {
    closeVerificationPage();
  });
}

// Binds the success actions (countdown auto-redirect and button click)
function bindSuccessActions(container) {
  const btn = container.querySelector(".verification-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      closeVerificationPage();
    });
  }

  // Start countdown to auto-redirect to login page
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
    }
  }, 1000);
}

// Displays the email verification page, with status (success, error, unknown)
function showEmailVerificationPage(status, reason = null) {
  prepareVerificationPage();

  const verificationPage = document.createElement("div");
  verificationPage.id = "verification-page";
  verificationPage.classList.add("verification-page");

  const container = document.createElement("div");
  container.classList.add("verification-container");

  if (status === "success") {
    renderSuccessContent(container);
    bindSuccessActions(container);
  } else if (status === "error") {
    renderErrorContent(container, reason);
    bindCloseBtn(container);
  } else {
    renderUnknownContent(container);
    bindCloseBtn(container);
  }

  verificationPage.appendChild(container);
  document.body.appendChild(verificationPage);
  window.history.replaceState({}, document.title, window.location.pathname);
}
