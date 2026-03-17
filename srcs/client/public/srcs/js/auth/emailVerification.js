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

function bindCloseButton(container) {
  const btn = container.querySelector(".verification-btn");
  if (!btn) {
    return;
  }

  btn.addEventListener("click", () => {
    closeVerificationPage();
  });
}

function bindSuccessActions(container) {
  const btn = container.querySelector(".verification-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      closeVerificationPage();
      window.activateLoginPopup();
    });
  }

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
}

// Email verification page for SPA
function showEmailVerificationPage(status, reason = null) {
  console.log("📧 Showing email verification page...", status, reason);

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
    bindCloseButton(container);
  } else {
    renderUnknownContent(container);
    bindCloseButton(container);
  }

  verificationPage.appendChild(container);
  document.body.appendChild(verificationPage);
  window.history.replaceState({}, document.title, window.location.pathname);
}
