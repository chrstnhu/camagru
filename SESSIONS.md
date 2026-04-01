# 🔐 Gestion des Sessions - Guide PHP

## ⚠️ ATTENTION : Session ≠ Base de données !

### `session_start()` → Gère l'AUTHENTIFICATION (savoir qui est connecté)

```php
session_start();  // Démarre une session HTTP (cookies)
$_SESSION['user_id'] = 42;  // Mémorise que l'utilisateur 42 est connecté
```

### `new PDO()` → Connexion à la BASE DE DONNÉES MySQL

```php
$db = new PDO("mysql:host=localhost;dbname=camagru", "root", "password");
$stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
```

## 🤔 Quelle est la différence ?

| Session (`session_start()`)     | Base de données (MySQL)           |
| ------------------------------- | --------------------------------- |
| 🍪 Stocke des infos temporaires | 💾 Stocke des données permanentes |
| 👤 Sait QUI est connecté        | 📦 Contient TOUTES les données    |
| ⏰ Expire après quelques heures | ♾️ Données permanentes            |
| 🚪 Une session par utilisateur  | 🏢 Une DB partagée par tous       |

## 📚 Exemple concret

### 1️⃣ Utilisateur se connecte (login.php)

```php
// ÉTAPE A : Ouvrir la session HTTP
session_start();

// ÉTAPE B : Se connecter à MySQL
$db = new PDO("mysql:host=localhost;dbname=camagru", "root", "pass");

// ÉTAPE C : Vérifier le mot de passe dans la DB
$stmt = $db->prepare("SELECT id, username FROM users WHERE email = ? AND password = ?");
$stmt->execute([$email, $hashedPassword]);
$user = $stmt->fetch();

if ($user) {
    // ÉTAPE D : Sauvegarder dans la SESSION que l'utilisateur est connecté
    $_SESSION['user_id'] = $user['id'];        // ← Mémorisé côté serveur
    $_SESSION['username'] = $user['username'];  // ← Pour 2-3 heures

    echo "Connecté !";
}
```

### 2️⃣ Utilisateur charge une autre page

```php
// ÉTAPE A : Rouvrir la session (récupère les infos précédentes)
session_start();

// ÉTAPE B : Vérifier si connecté (sans toucher à MySQL !)
if (isset($_SESSION['user_id'])) {
    echo "Bienvenue " . $_SESSION['username'];  // ← Pas besoin de MySQL !

    // ÉTAPE C : Si on veut ses photos, MAINTENANT on utilise MySQL
    $db = new PDO(...);
    $stmt = $db->prepare("SELECT * FROM images WHERE user_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
}
```

## 🎯 Dans Camagru : Les deux sont utilisés !

### Session (authentification) - routes/api.php

```php
session_start();  // ← Pour savoir QUI est connecté
```

### MySQL (données) - Database.php

```php
class Database {
    public function getConnection() {
        return new PDO("mysql:...");  // ← Pour accéder aux DONNÉES
    }
}
```

## 💡 Pourquoi séparer les deux ?

```php
// ❌ MAUVAIS - Requête MySQL à chaque vérification
function isLoggedIn() {
    $db = new PDO(...);  // Connexion MySQL
    $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    return $stmt->fetch() ? true : false;
}
// Problème : 100 requêtes SQL si on vérifie 100 fois !

// ✅ BON - Session en mémoire
session_start();
function isLoggedIn() {
    return isset($_SESSION['user_id']);  // Vérifie en mémoire (rapide !)
}
// Avantage : 0 requête SQL, instantané !
```

## 📖 Résumé simple

1. **`session_start()`** = "Se souvenir de qui est connecté" (comme un post-it temporaire)
2. **MySQL** = "Coffre-fort permanent avec toutes les données"

## ❓ Pourquoi une seule fois ?

```php
// ✅ BON - Session_start() appelé UNE SEULE FOIS dans routes
session_start();  // Au début du script

function fonction1() {
    // Accès direct à $_SESSION
    $userId = $_SESSION['user_id'];
}

function fonction2() {
    // Accès direct à $_SESSION
    if (isset($_SESSION['user_id'])) {
        // ...
    }
}
```

## 📍 Où appeler session_start() ?

### Dans Camagru : routes/api.php (ligne 8)

```php
<?php
// routes/api.php

session_start();  // ← UNE SEULE FOIS ICI

// Toutes les routes appelées après auront accès à $_SESSION
$router->addRoute('POST', '/api/images', 'ImageController', 'saveImage');
$router->addRoute('GET', '/api/user/status', 'UserController', 'getStatus');
// etc...
```

### Ensuite dans les controllers : JAMAIS de session_start()

```php
<?php
// ImageController.php

class ImageController {
    public function saveImage() {
        // ✅ Accès direct à $_SESSION (session déjà démarrée)
        if (!isset($_SESSION['user_id'])) {
            // Non connecté
        }

        // Utiliser $_SESSION normalement
        $userId = $_SESSION['user_id'];
    }
}
```

## 🔄 Cycle de vie d'une session

```
1. Client fait une requête → server.php
                              ↓
2. server.php route vers  → routes/api.php
                              ↓
3. session_start() appelé  → Récupère la session du client
                              ↓
4. Router trouve la route  → ImageController::saveImage()
                              ↓
5. Controller utilise      → $_SESSION['user_id']
                              ↓
6. Fin de la requête       → Session sauvegardée automatiquement
```

## 💾 Comment PHP gère les sessions ?

1. **Première visite** :

   ```php
   session_start();  // Crée un cookie PHPSESSID
   $_SESSION['user_id'] = 123;  // Sauvegarde côté serveur
   ```

2. **Visites suivantes** :
   ```php
   session_start();  // Lit le cookie PHPSESSID
   echo $_SESSION['user_id'];  // 123 (récupéré depuis le serveur)
   ```

## 🎯 Pattern utilisé dans Camagru

```
┌──────────────────────────────────────────────┐
│  routes/api.php                              │
│  ┌────────────────────────────────────────┐  │
│  │ session_start(); ← UNE SEULE FOIS     │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Router démarre...                           │
│                                              │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │ ImageController │  │ UserController  │  │
│  │                 │  │                 │  │
│  │ ✅ $_SESSION    │  │ ✅ $_SESSION    │  │
│  │ disponible      │  │ disponible      │  │
│  └─────────────────┘  └─────────────────┘  │
└──────────────────────────────────────────────┘
```

## ⚡ Avantages de notre approche

1. **Pas de warnings** : session_start() appelé qu'une fois
2. **Performances** : session chargée une seule fois
3. **Simplicité** : tous les controllers accèdent directement à $\_SESSION
4. **Maintenabilité** : un seul endroit à modifier si besoin

## 🔍 Vérifier si un utilisateur est connecté

```php
// Dans n'importe quel controller :
if (!isset($_SESSION['user_id'])) {
    // ❌ Utilisateur NON connecté
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    return;
}

// ✅ Utilisateur connecté
$userId = $_SESSION['user_id'];
// ... faire les opérations
```

## 📚 Ressources

- [PHP Sessions](https://www.php.net/manual/fr/book.session.php)
- [session_start()](https://www.php.net/manual/fr/function.session-start.php)
- [Best practices](https://www.php.net/manual/fr/features.session.security.management.php)

---

## ❓ Questions fréquentes

### Q1: La session commence seulement si l'utilisateur est connecté ?

**NON !** La session démarre **TOUJOURS**, même si personne n'est connecté.

```php
// Visiteur anonyme (non connecté)
session_start();  // ← Session créée quand même !
// $_SESSION est vide []

// Si je me connecte
$_SESSION['user_id'] = 42;  // ← Maintenant la session contient des infos

// Si je me déconnecte
session_destroy();  // ← Session détruite, mais une nouvelle peut être créée
```

#### Exemple concret :

```php
<?php
// routes/api.php
session_start();  // ← TOUJOURS appelé, pour tous les visiteurs

// Vérifier SI quelqu'un est connecté dans la session
if (isset($_SESSION['user_id'])) {
    echo "Utilisateur " . $_SESSION['user_id'] . " est connecté";
} else {
    echo "Personne n'est connecté (session vide)";
}
```

#### Cycle de vie :

```
1. Premier visiteur arrive
   → session_start() crée une session vide
   → $_SESSION = []

2. Visiteur se connecte (login)
   → $_SESSION['user_id'] = 42
   → $_SESSION = ['user_id' => 42, 'username' => 'john']

3. Visiteur navigue sur le site
   → session_start() charge la session existante
   → $_SESSION contient toujours ['user_id' => 42]

4. Visiteur se déconnecte (logout)
   → session_destroy() supprime tout
   → $_SESSION devient vide []
```

### Q2: Si un user se déconnecte, un autre peut-il se connecter sur le même ordi ?

**OUI !** Absolument. Chaque connexion/déconnexion gère sa propre session.

```php
// UTILISATEUR 1 se connecte
session_start();
$_SESSION['user_id'] = 42;  // John
$_SESSION['username'] = 'john';

// UTILISATEUR 1 se déconnecte
session_destroy();  // ← Efface TOUT (user_id, username, etc.)

// UTILISATEUR 2 peut maintenant se connecter
session_start();  // ← Nouvelle session propre
$_SESSION['user_id'] = 99;  // Jane
$_SESSION['username'] = 'jane';
```

#### Comment ça marche ?

```
┌──────────────────────────────────────────────────────────────┐
│  ORDINATEUR - Navigateur Chrome                              │
└──────────────────────────────────────────────────────────────┘
        │
        │ 1️⃣ John se connecte
        ↓
    session_start() → Crée cookie PHPSESSID=abc123
    $_SESSION = ['user_id' => 42, 'username' => 'john']
        │
        │ 2️⃣ John navigue (plusieurs pages)
        │    → Cookie PHPSESSID=abc123 envoyé à chaque requête
        │    → Serveur retrouve la session de John
        ↓
    session_destroy() → SUPPRIME le cookie + données serveur
        │
        │ 3️⃣ Jane se connecte (même ordi, même navigateur)
        ↓
    session_start() → Crée NOUVEAU cookie PHPSESSID=xyz789
    $_SESSION = ['user_id' => 99, 'username' => 'jane']
        │
        │ 4️⃣ Jane navigue
        │    → Cookie PHPSESSID=xyz789 (différent de John!)
        │    → Serveur retrouve la session de Jane
```

#### Code de logout() dans UserController.php

```php
public function logout() {
    // Détruit complètement la session de l'utilisateur actuel
    session_destroy();

    // Maintenant la session est vide
    // Un autre utilisateur peut se connecter

    return json_encode(['success' => true]);
}
```

### Q3: Que se passe-t-il si je ne me déconnecte pas ?

```php
// Scénario : John oublie de se déconnecter

// Cas A : Jane ouvre un NOUVEL onglet/fenêtre (même navigateur)
→ Elle verra encore la session de John ! (cookie partagé)
→ ⚠️ DANGER : Jane a accès au compte de John

// Cas B : Jane ferme complètement le navigateur et le rouvre
→ Session expirée après 24h (par défaut PHP)
→ ✅ Cookie supprimé, Jane peut se connecter

// Cas C : Jane utilise un AUTRE navigateur (Firefox au lieu de Chrome)
→ Nouveau cookie, nouvelle session
→ ✅ Jane peut se connecter sans problème
```

### 💡 Bonnes pratiques de sécurité

```php
// ✅ BON : Toujours permettre la déconnexion
<button onclick="logout()">Se déconnecter</button>

// ✅ BON : Expiration automatique des sessions
// Dans php.ini ou au début de l'app
ini_set('session.gc_maxlifetime', 3600);  // 1 heure
session_set_cookie_params(3600);

// ✅ BON : Demander le mot de passe pour actions sensibles
function deleteAccount() {
    if (!isset($_POST['confirm_password'])) {
        return error('Confirmez votre mot de passe');
    }
}
```

### 📊 Résumé visuel

```
┌─────────────────────────────────────────────────────────────┐
│ ÉTAT DE LA SESSION                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  session_start()    ┌──────────────┐                       │
│  ────────────────→  │  $_SESSION   │  ← Toujours créée    │
│                     │  = []        │     (vide au début)   │
│                     └──────────────┘                       │
│                            │                                │
│                            │ Login                          │
│                            ↓                                │
│                     ┌──────────────┐                       │
│                     │  $_SESSION   │                       │
│                     │  = [         │                       │
│                     │   'user_id'  │  ← Remplie après      │
│                     │   'username' │     connexion         │
│                     │  ]           │                       │
│                     └──────────────┘                       │
│                            │                                │
│                            │ Logout                         │
│                            ↓                                │
│  session_destroy()  ┌──────────────┐                       │
│  ────────────────→  │  $_SESSION   │                       │
│                     │  = []        │  ← Vidée, prête pour  │
│                     └──────────────┘     un autre user     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 🎯 Réponses courtes

| Question                                | Réponse                                  |
| --------------------------------------- | ---------------------------------------- |
| Session démarre seulement si connecté ? | **NON** - Toujours créée                 |
| Session vide = pas connecté ?           | **OUI** - `!isset($_SESSION['user_id'])` |
| Deux users sur même ordi ?              | **OUI** - Après `session_destroy()`      |
| Partage de session entre users ?        | **NON** - Chacun sa session              |
| Cookie PHPSESSID supprimé au logout ?   | **OUI** - Via `session_destroy()`        |
