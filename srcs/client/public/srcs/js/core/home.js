// Home photo carrousel (2 groups of 6 photos to make infinite loop)
function homePhoto() {
  const homePhoto = document.getElementById("home-photo");

  if (homePhoto) {
    homePhoto.innerHTML = `
                    <div class="home-photo-left carrousel">
                        <div class="group-top">
                            <img src="https://picsum.photos/300/500?random=1" alt="Image 1" class="home-photo-img">
                            <img src="https://picsum.photos/450/300?random=2" alt="Image 2" class="home-photo-img">
                            <img src="https://picsum.photos/400/250?random=3" alt="Image 3" class="home-photo-img">
                            <img src="https://picsum.photos/350/150?random=4" alt="Image 4" class="home-photo-img">
                            <img src="https://picsum.photos/300/200?random=5" alt="Image 5" class="home-photo-img">
                            <img src="https://picsum.photos/300/400?random=6" alt="Image 6" class="home-photo-img">
                        </div>
                        <div class="group-top">
                            <img src="https://picsum.photos/300/500?random=1" alt="Image 1" class="home-photo-img">
                            <img src="https://picsum.photos/450/300?random=2" alt="Image 2" class="home-photo-img">
                            <img src="https://picsum.photos/400/250?random=3" alt="Image 3" class="home-photo-img">
                            <img src="https://picsum.photos/350/150?random=4" alt="Image 4" class="home-photo-img">
                            <img src="https://picsum.photos/300/200?random=5" alt="Image 5" class="home-photo-img">
                            <img src="https://picsum.photos/300/400?random=6" alt="Image 6" class="home-photo-img">
                        </div>
                    </div>
                      
                    <div class="home-photo-right carrousel">
                        <div class="group-bottom">
                            <img src="https://picsum.photos/300/200?random=8" alt="Image 8" class="home-photo-img">
                            <img src="https://picsum.photos/300/500?random=9" alt="Image 9" class="home-photo-img">
                            <img src="https://picsum.photos/300/200?random=10" alt="Image 10" class="home-photo-img">
                            <img src="https://picsum.photos/100/300?random=11" alt="Image 11" class="home-photo-img">
                            <img src="https://picsum.photos/300/200?random=12" alt="Image 12" class="home-photo-img">
                            <img src="https://picsum.photos/200/250?random=13" alt="Image 13" class="home-photo-img">
                            <img src="https://picsum.photos/450/200?random=14" alt="Image 14" class="home-photo-img">
                        </div>
                        <div class="group-bottom">
                            <img src="https://picsum.photos/300/200?random=8" alt="Image 8" class="home-photo-img">
                            <img src="https://picsum.photos/300/500?random=9" alt="Image 9" class="home-photo-img">
                            <img src="https://picsum.photos/300/200?random=10" alt="Image 10" class="home-photo-img">
                            <img src="https://picsum.photos/100/300?random=11" alt="Image 11" class="home-photo-img">
                            <img src="https://picsum.photos/300/200?random=12" alt="Image 12" class="home-photo-img">
                            <img src="https://picsum.photos/200/250?random=13" alt="Image 13" class="home-photo-img">
                            <img src="https://picsum.photos/450/200?random=14" alt="Image 14" class="home-photo-img">
                        </div>
                    </div>
                      
                    <div class="home-photo-left carrousel">
                        <div class="group-top">
                            <img src="https://picsum.photos/300/500?random=15" alt="Image 15" class="home-photo-img">
                            <img src="https://picsum.photos/450/300?random=16" alt="Image 16" class="home-photo-img">
                            <img src="https://picsum.photos/400/250?random=17" alt="Image 17" class="home-photo-img">
                            <img src="https://picsum.photos/350/150?random=18" alt="Image 18" class="home-photo-img">
                            <img src="https://picsum.photos/300/200?random=19" alt="Image 19" class="home-photo-img">
                            <img src="https://picsum.photos/300/400?random=20" alt="Image 20" class="home-photo-img">
                        </div>
                        <div class="group-top">
                            <img src="https://picsum.photos/300/500?random=15" alt="Image 15" class="home-photo-img">
                            <img src="https://picsum.photos/450/300?random=16" alt="Image 16" class="home-photo-img">
                            <img src="https://picsum.photos/400/250?random=17" alt="Image 17" class="home-photo-img">
                            <img src="https://picsum.photos/350/150?random=18" alt="Image 18" class="home-photo-img">
                            <img src="https://picsum.photos/300/200?random=19" alt="Image 19" class="home-photo-img">
                            <img src="https://picsum.photos/300/400?random=20" alt="Image 20" class="home-photo-img">
                        </div>
                    </div>
                      
                    <div class="home-photo-right carrousel">
                        <div class="group-bottom">
                            <img src="https://picsum.photos/300/200?random=21" alt="Image 21" class="home-photo-img">
                            <img src="https://picsum.photos/300/500?random=22" alt="Image 22" class="home-photo-img">
                            <img src="https://picsum.photos/300/200?random=23" alt="Image 23" class="home-photo-img">
                            <img src="https://picsum.photos/100/350?random=24" alt="Image 24" class="home-photo-img">
                            <img src="https://picsum.photos/300/200?random=25" alt="Image 25" class="home-photo-img">
                            <img src="https://picsum.photos/200/250?random=26" alt="Image 26" class="home-photo-img">
                            <img src="https://picsum.photos/450/200?random=27" alt="Image 27" class="home-photo-img">
                        </div>
                        <div class="group-bottom">
                            <img src="https://picsum.photos/300/200?random=21" alt="Image 21" class="home-photo-img">
                            <img src="https://picsum.photos/300/500?random=22" alt="Image 22" class="home-photo-img">
                            <img src="https://picsum.photos/300/200?random=23" alt="Image 23" class="home-photo-img">
                            <img src="https://picsum.photos/100/350?random=24" alt="Image 24" class="home-photo-img">
                            <img src="https://picsum.photos/300/200?random=25" alt="Image 25" class="home-photo-img">
                            <img src="https://picsum.photos/200/250?random=26" alt="Image 26" class="home-photo-img">
                            <img src="https://picsum.photos/450/200?random=27" alt="Image 27" class="home-photo-img">
                        </div>
                    </div>
                `;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  homePhoto();
});

// Sets up the upload input and related actions for applying effects and saving drafts
document.addEventListener("DOMContentLoaded", () => {
  const theme = localStorage.getItem("theme");
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
});

// Update logo based on theme (light or dark)
function updateLogoForTheme() {
  const logo = document.querySelector(".logo");
  if (!logo) return;
  if (document.documentElement.classList.contains("dark")) {
    logo.src = "assets/Camagru-logo-dark.png";
  } else {
    logo.src = "assets/camagru-logo.png";
  }
}


// Button toggle for light/dark mode with icon change
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("toggle-theme");
    const sunIcon = btn?.querySelector(".fa-sun");
    const moonIcon = btn?.querySelector(".fa-moon");
    
    function updateThemeIcon() {
    
      if (document.documentElement.classList.contains("dark")) {
        sunIcon.style.display = "inline";
        moonIcon.style.display = "none";
      } else {
        sunIcon.style.display = "none";
        moonIcon.style.display = "inline";
      }
    }
    if (btn) {
    btn.onclick = function () {
      document.documentElement.classList.toggle("dark");
      const isDark = document.documentElement.classList.contains("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      updateLogoForTheme();
      updateThemeIcon();
    };
    updateThemeIcon();
  }
  updateLogoForTheme();
});
