// Define navigateTo function first and make it globally available
function navigateTo(viewId, push) {
  console.log("🚀 Navigating to:", viewId, "push =", push);

  const views = ['login', 'sign-in', 'login-fail', 'home'];
  const target = document.getElementById(viewId);

  console.log("🎯 Target element:", target);

  if (target) {
    // Hide all views first
    views.forEach(v => {
      const view = document.getElementById(v);
      if (view) {
        console.log(`👁️ Hiding view: ${v}`);
        view.style.display = 'none';
      }
    });

    // Show the target view
    console.log(`✅ Showing view: ${viewId}`);
    target.style.display = 'block';
  } else {
    console.error(`❌ Target element '${viewId}' not found!`);
  }

  // Navigate to the target view
  if (push) {
    history.pushState({ viewId: viewId }, '', `#${viewId}`);
  }
}

// Make navigateTo available globally immediately
window.navigateTo = navigateTo;
console.log("✅ navigateTo function registered globally");

function initializeLoginPages() {
  console.log('📢 Initializing login page...');
  const login = document.getElementById('login');

  if (login) {
    console.log('📢 Login container found, clearing and adding form');
    login.innerHTML = '';

    // Create login form
    const loginFormElement = document.createElement('div');
    loginFormElement.innerHTML = `
      <div class="auth-container">
        <div class="header-login-container" style="width: 98%; margin-bottom: 0.rem;">
            <i class="fa-solid fa-user-lock" style="margin-right: 0.5rem; font-size: 0.875rem;"></i>
            <h2>Please login</h2>
        </div>
        <div class="auth-section">
            <div class="auth-form-section">
                <form class="login-window" id="login-window" onsubmit="auth_check(event)">
                    <div class="login-inputs">
                        <div class="input-with-icon">
                        <i class="fa-solid fa-at input-icon"></i>
                            <input 
                              class="inputInfo" 
                              id="username" 
                              type="text" 
                              name="username" 
                              placeholder="Enter your username" 
                              required
                            />
                        </div>
                        <div class="input-with-icon">
                        <i class="fa-solid fa-lock input-icon"></i>
                            <input class="inputInfo" 
                            id="password" 
                            type="password" 
                            name="password" 
                            placeholder="Enter your password" 
                            required
                            />
                            <i class="fa-solid fa-eye eye-icon" id="password-eye"></i>
                        </div>
                    </div>
                    <div class="login-buttons">
                        <button class="button-return" onclick="navigateTo('home', true)" type="button">Return</button>
                        <button class="button2" type="submit">Login</button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    `;

    // Add the form to the login container
    login.appendChild(loginFormElement);

    // Add eye icon functionality for password visibility
    addEyesIcon('password');
  }

  // Setup avatar preview
  function setupAvatarPreview(formElement) {
    // Add event listener for avatar preview
    const avatarInput = formElement.querySelector('#create_avatar');
    const avatarPreview = formElement.querySelector('#user-avatar-preview');
    const avatarContainer = formElement.querySelector('.avatar-container');

    if (avatarInput && avatarPreview && avatarContainer) {
      // Click on avatar container to open file selector
      avatarContainer.addEventListener('click', function () {
        avatarInput.click();
      });

      // Handle file selection
      avatarInput.addEventListener('change', function (e) {
        const target = e.target;
        if (target.files && target.files[0]) {
          const reader = new FileReader();
          reader.onload = function (e) {
            if (e.target?.result) {
              avatarPreview.src = e.target.result;
            }
          };
          reader.readAsDataURL(target.files[0]);
        } else {
          // Reset to default image if no file selected
          avatarPreview.src = 'assets/img/default.png';
        }
      });

      // Upload avatar
    }
  }

  function initializeSignInPages() {
    const signIn = document.getElementById('sign-in');

    if (signIn) {
      signIn.innerHTML = '';

      // Create sign in form
      const signInFormElement = document.createElement('div');
      signInFormElement.innerHTML = `
    <div class="auth-container">
      <div class="header-login-container" style="width: 98%;">
        <i class="fa-solid fa-user-plus" style="margin-right: 0.5rem; font-size: 0.875rem;"></i>
        <h2>Create Account</h2>
      </div>
    
      <form class="login-window" id="create-user-window" onsubmit="create_user(event)">
      <div class="signup-container">
        <div class="auth-section">
          <div class="auth-image-section">
            <div class="avatar-section">
              <div class="avatar-container">
                <img id="user-avatar-preview" src="assets/img/default.png" alt="" class="avatar-image" title="Click to upload image" />
              </div>
              <div class="avatar-text">
                <p class="avatar-title">Profile Picture</p>
                <p class="avatar-subtitle">Click on image to upload</p>
              </div>
            </div>
          </div>
          <div class="auth-form-section">
            <div class="signup-inputs">
              <div class="input-with-icon">
                <input class="inputInfo" id="create_username" type="text" name="username" placeholder="Enter your username" data-i18n-placeholder="username" required/>
                  <i class="fa-solid fa-at input-icon"></i>
              </div>
              <div class="input-with-icon">
                <input class="inputInfo" id="create_password" type="password" name="password" placeholder="Create a password" data-i18n-placeholder="password" required/>
                <i class="fa-solid fa-lock input-icon"></i>
                <i class="fa-solid fa-eye eye-icon" id="create_password-eye"></i>
              </div>
              <div class="input-with-icon">
                <input class="inputInfo" id="create_alias" type="text" name="alias" placeholder="Choose your alias" data-i18n-placeholder="alias" required/>
                <i class="fa-solid fa-user input-icon"></i>
              </div>
              <input type="file" id="create_avatar" name="create_avatar" accept="image/png" style="display: none;" aria-describedby="avatar-help"/>
            </div>
          </div>
        </div>
              
        <div class="signup-buttons">
          <button class="button-return" type="button" onclick="return_from_sign_in(event)">Return</button>
          <button class="button2" type="submit" >Sign up</button>
        </div>
        </form>
      </div>
    </div>
    `;

      const formElement = signInFormElement.firstElementChild;
      if (formElement) {
        signIn.appendChild(formElement);

        setupAvatarPreview(formElement);

        addEyesIcon('create_password');
      }
    }
  }

  function initializeLoginFailPages() {
    const loginFail = document.getElementById('login-fail');

    if (loginFail) {
      loginFail.innerHTML = '';

      // Create login fail form
      const loginFailFormElement = document.createElement('div');
      loginFailFormElement.innerHTML = `
      <div class="auth-container">
        <div class="header-container" style="width: 98%; margin-bottom: 0;">
            <i class="fa-solid fa-exclamation-triangle" style="margin-right: 0.5rem; font-size: 0.875rem; color: #ef4444;"></i>
            <h2 style="color: #dc2626;">Login Failed</h2>
        </div>
        <div class="auth-section">
            <div class="auth-form-section">
                <form class="login-window" id="login-fail-window" onsubmit="login_fail(event)">
                    <div class="login-fail-content">
                        <div class="login-fail-message">
                            <p class="error-message">Login failed, please retry!</p>
                        </div>
                    </div>
                    <div class="login-fail-buttons">
                        <button class="button2" onclick="return_to_login(event)" type="button">Retry</button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    `;

      const formElement = loginFailFormElement.firstElementChild;
      if (formElement) {
        loginFail.appendChild(formElement);
      }
    }
  }

  // Initialize all auth pages
  console.log('📢 AuthPages: Initializing all auth pages...');
  initializeSignInPages();
  initializeLoginFailPages();
  console.log('📢 AuthPages: All auth pages initialized');

  // Cleanup function to reset the sign-in page
  function resetSignInPage() {
    const avatarPreview = document.querySelector('#user-avatar-preview');
    const avatarInput = document.querySelector('#create_avatar');
    const usernameInput = document.querySelector('#create_username');
    const passwordInput = document.querySelector('#create_password');
    const aliasInput = document.querySelector('#create_alias');

    // Clear the file input
    if (avatarPreview) {
      avatarPreview.src = 'assets/img/default.png';
    }

    if (avatarInput) {
      avatarInput.value = '';
    }

    if (usernameInput) {
      usernameInput.value = '';
    }

    if (passwordInput) {
      passwordInput.value = '';
    }

    if (aliasInput) {
      aliasInput.value = '';
    }
  }

  // Function to add eye icon for password visibility 
  function addEyesIcon(inputId) {
    console.log(`👁️ Setting up eye icon for: ${inputId}`);
    const passwordInput = document.getElementById(inputId);
    const eyeIcon = document.getElementById(`${inputId}-eye`);

    console.log('Password input:', passwordInput);
    console.log('Eye icon:', eyeIcon);

    if (passwordInput && eyeIcon) {
      eyeIcon.addEventListener('click', function () {
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          eyeIcon.className = 'fa-solid fa-eye-slash eye-icon';
        } else {
          passwordInput.type = 'password';
          eyeIcon.className = 'fa-solid fa-eye eye-icon';
        }
      });
      console.log('✅ Eye icon event listener added');
    } else {
      console.log('❌ Could not find password input or eye icon');
    }
  }
}

// Popstate navigation
window.addEventListener('popstate', (event) => {
  const viewId = (event.state && event.state.viewId) || location.hash?.substring(1) || 'home';

  if (document.getElementById(viewId)) {
    navigateTo(viewId, false);
  }
});

// Initial load navigation
window.addEventListener('DOMContentLoaded', () => {
  const viewId = location.hash?.substring(1) || 'home';

  // Initialize login pages first
  initializeLoginPages();

  if (document.getElementById(viewId)) {
    navigateTo(viewId, false);
  }
});

// Helper functions for navigation - Global scope
window.return_from_sign_in = function (event) {
  event.preventDefault();
  navigateTo('login', true);
};

window.return_to_login = function (event) {
  event.preventDefault();
  navigateTo('login', true);
};

window.auth_check = function (event) {
  event.preventDefault();
  console.log('Login attempt');
  navigateTo('login-fail', true);
};

window.create_user = function (event) {
  event.preventDefault();
  console.log('User creation attempt');
  navigateTo('login', true);
};

window.login_fail = function (event) {
  event.preventDefault();
  navigateTo('login', true);
};
