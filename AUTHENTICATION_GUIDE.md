# Guide d'Authentification - Camagru

## Fonctionnalités Implémentées

### 1. Gestion des Sessions par Cookies

- **Stockage automatique** : Après login/register, les données utilisateur sont stockées dans un cookie `user_session`
- **Durée de vie** : 24 heures (86400 secondes)
- **Données stockées** :
  ```json
  {
    "user_id": 123,
    "username": "john_doe",
    "email": "john@example.com",
    "logged_in": true
  }
  ```

### 2. Interface Utilisateur Dynamique

#### Avant connexion

- Affichage du bouton "Login" avec icône utilisateur
- Clic sur le bouton → ouverture de la popup login/register

#### Après connexion

- **Le bouton login disparaît**
- **Photo de profil affichée** avec :
  - Cercle blanc contenant la première lettre du username (majuscule)
  - Avatar par défaut si pas de photo de profil
  - Menu déroulant au clic sur l'avatar

#### Menu Profil

- "My account" (lien vers le compte)
- "Logout" (déconnexion)

### 3. Vérification Automatique au Chargement

- À chaque chargement de page, vérification du cookie `user_session`
- Si session valide → affichage automatique du profil
- Si pas de session → affichage du bouton login

### 4. Protection des Fonctionnalités

- **Capture de photos** : Nécessite d'être connecté
  - Si non connecté → alerte "Please login to save your photos"
  - Les photos capturées utilisent le `user_id` réel depuis la session
- **My Photos** : Affiche uniquement les photos de l'utilisateur connecté

## Fichiers Modifiés

### 1. `login.js` (Modifications Principales)

#### `register_check()` - Ligne ~479

```javascript
if (response.ok) {
  // Store user session in cookie
  document.cookie = `user_session=${JSON.stringify({...})}; path=/; max-age=86400`;

  // Close popup
  closePopup();

  // Update UI
  updateUIAfterLogin({...});

  // Show success message
  showSuccessAlert("Registration successful! Welcome!");
}
```

#### `auth_check()` - Ligne ~538

```javascript
if (response.ok) {
  // Store user session in cookie
  document.cookie = `user_session=${JSON.stringify({...})}; path=/; max-age=86400`;

  // Close popup
  closePopup();

  // Update UI
  updateUIAfterLogin({...});

  // Show success message
  showSuccessAlert(`Welcome back, ${data.username}!`);

  // Navigate to gallery
  navigateTo("gallery", true);
}
```

#### Nouvelles Fonctions Ajoutées

**`updateUIAfterLogin(userData)`** - Ligne ~580

- Cache le bouton login
- Affiche le profil utilisateur
- Met à jour l'avatar avec la première lettre du username
- Stocke les données dans `window.currentUser`

**`getUserSession()`** - Ligne ~600

- Lit le cookie `user_session`
- Parse les données JSON
- Retourne `null` si cookie invalide

**`logout()`** - Ligne ~620

- Efface le cookie de session
- Cache le profil utilisateur
- Affiche le bouton login
- Redirige vers la page d'accueil
- Affiche un message de confirmation

**Vérification au Chargement** - Ligne ~645

```javascript
document.addEventListener("DOMContentLoaded", () => {
  const session = getUserSession();
  if (session && session.logged_in) {
    updateUIAfterLogin(session);
  }
});
```

### 2. `capturePhoto.js` - Ligne ~187

**Protection de la sauvegarde des photos**

```javascript
// Get logged-in user ID from cookies
let userId = null;
const cookies = document.cookie.split("; ");
const sessionCookie = cookies.find((cookie) =>
  cookie.startsWith("user_session="),
);

if (sessionCookie) {
  try {
    const sessionData = sessionCookie.split("=")[1];
    const session = JSON.parse(decodeURIComponent(sessionData));
    userId = session.user_id;
  } catch (error) {
    console.error("❌ Error parsing session cookie:", error);
  }
}

// Check if user is logged in
if (!userId) {
  showErrorAlert("Please login to save your photos");
  return;
}

// Save image with real user_id
fetch("/api/images", {
  method: "POST",
  body: JSON.stringify({
    user_id: userId, // Real user ID from session
    image_data: dataUrl,
    caption: "",
  }),
});
```

## Structure HTML

### `index.html` - Ligne ~54

```html
<div class="user-auth">
  <!-- Profile (hidden by default) -->
  <div class="user-profile" id="user-profile" style="display: none;">
    <div class="user-avatar">
      <span id="user-avatar-letter">C</span>
    </div>
    <div class="user-profile--dropdown">
      <a href="#">My account</a>
      <a href="#" onclick="logout()">Logout</a>
    </div>
  </div>

  <!-- Login button (visible by default) -->
  <div class="logo btn-login-popup" id="login-btn" onclick="window.showLogin()">
    <i class="fa-solid fa-user icon-menu-size"></i>
    Login
  </div>
</div>
```

## CSS

### `login.css` - Ligne ~20-76

Styles pour le profil utilisateur :

- `.user-profile` : Conteneur principal
- `.user-avatar` : Cercle blanc 32x32px avec la lettre
- `.user-profile--dropdown` : Menu déroulant avec animation
- `.user-profile.show` : État actif du menu

## Flux d'Authentification

### 1. Inscription

```
User clicks "Register" → Fill form → Submit
  ↓
API /api/auth/register
  ↓
Response with user_id, username, email
  ↓
Store in cookie (24h)
  ↓
Update UI (show profile, hide login button)
  ↓
Show success alert
```

### 2. Connexion

```
User clicks "Login" → Fill form → Submit
  ↓
API /api/auth/login
  ↓
Response with user_id, username, email
  ↓
Store in cookie (24h)
  ↓
Update UI (show profile, hide login button)
  ↓
Navigate to gallery
  ↓
Show welcome message
```

### 3. Déconnexion

```
User clicks "Logout" in dropdown
  ↓
Clear cookie
  ↓
Update UI (hide profile, show login button)
  ↓
Navigate to home
  ↓
Show logout message
```

### 4. Chargement de Page

```
Page loads → DOMContentLoaded event
  ↓
Check for user_session cookie
  ↓
If valid session found
  ↓
Update UI (show profile, hide login button)
  ↓
Set window.currentUser
```

## Variables Globales

### `window.currentUser`

Accessible partout dans l'application pour vérifier l'état de connexion :

```javascript
if (window.currentUser && window.currentUser.logged_in) {
  console.log("User is logged in:", window.currentUser.username);
}
```

### Cookie Structure

```javascript
// Set cookie
document.cookie = `user_session=${JSON.stringify(userData)}; path=/; max-age=86400`;

// Read cookie
const cookies = document.cookie.split("; ");
const sessionCookie = cookies.find((c) => c.startsWith("user_session="));
const session = JSON.parse(decodeURIComponent(sessionCookie.split("=")[1]));

// Clear cookie
document.cookie = "user_session=; path=/; max-age=0";
```

## Sécurité

### Limitations Actuelles

- Cookie non sécurisé (pas de flag `HttpOnly`)
- Pas de token JWT
- Session côté client uniquement
- Pas de vérification serveur systématique

### Améliorations Recommandées

1. **Implémenter JWT** : Token sécurisé avec signature
2. **HttpOnly cookies** : Protéger contre XSS
3. **CSRF tokens** : Protéger contre CSRF
4. **Session serveur** : Vérifier chaque requête côté serveur
5. **Refresh tokens** : Renouvellement automatique de session

## Test de Fonctionnement

### 1. Tester l'inscription

```bash
# Open browser: https://localhost:8080
# Click "Login" button
# Switch to "Register" tab
# Fill: username, email, password
# Submit → Profile should appear with first letter
```

### 2. Tester la persistance

```bash
# After login, refresh page (F5)
# Profile should still be visible
# Cookie persists for 24 hours
```

### 3. Tester la déconnexion

```bash
# Click on avatar
# Click "Logout"
# Profile disappears, login button appears
```

### 4. Tester la capture

```bash
# Without login: try to capture photo
# → Alert: "Please login to save your photos"
#
# After login: capture photo
# → Photo saved with your user_id
# → Check in "My Photos" section
```

## Dépannage

### Le profil ne s'affiche pas après login

1. Vérifier la console : `console.log` montre-t-il l'update UI ?
2. Vérifier le cookie : `document.cookie` dans la console
3. Vérifier le style : `display: flex` sur `#user-profile` ?

### Les photos ne se sauvent pas

1. Vérifier la session : `getUserSession()` retourne-t-il un objet ?
2. Vérifier la console : Y a-t-il des erreurs API ?
3. Vérifier le backend : Le `user_id` est-il bien envoyé ?

### Le cookie ne persiste pas

1. Vérifier le chemin : `path=/` dans le cookie ?
2. Vérifier l'expiration : `max-age=86400` (24h) ?
3. Vérifier le domaine : Cookie accessible sur localhost ?

## Notes

- L'avatar affiche **uniquement la première lettre** du username
- Si une vraie photo de profil est ajoutée plus tard, remplacer `<span>` par `<img>`
- Le cookie expire après 24h, l'utilisateur devra se reconnecter
- Tous les logs de debug sont préfixés avec des émojis pour faciliter le suivi
