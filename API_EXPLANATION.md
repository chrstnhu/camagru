# 📖 Explication de api.php - Guide détaillé

## 🎯 Rôle du fichier

`routes/api.php` est le **cœur du routeur** de votre application. Il :

1. Démarre la session
2. Configure les headers HTTP
3. Charge automatiquement les classes PHP
4. Définit toutes les routes (URLs) de l'API
5. Route chaque requête vers le bon controller

---

## 📝 Explication ligne par ligne

### PARTIE 1 : Initialisation (lignes 1-19)

```php
<?php
/**
 * CAMAGRU - Routes API
 * Define routes for the CAMAGRU RESTful API
*/

// Start the session
session_start();
```

**🔍 Explication :**

- Démarre la session **une seule fois** pour toute l'application
- Permet d'accéder à `$_SESSION` dans tous les controllers
- **Important** : Appelé avant tout `echo` ou `header()`

```php
// Configure CORS and JSON headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

**🔍 Explication :**

- **`Content-Type: application/json`** : Indique que toutes les réponses sont en JSON
- **`Access-Control-Allow-Origin: *`** : Autorise TOUS les domaines à accéder à l'API (CORS)
  - `*` = n'importe quel domaine (localhost, etc.)
  - En production, remplacer par le domaine exact : `https://camagru.com`
- **`Allow-Methods`** : Méthodes HTTP autorisées (GET, POST, DELETE, etc.)
- **`Allow-Headers`** : Headers que le client peut envoyer

```php
// Manage OPTIONS requests (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
```

**🔍 Explication :**

- **Preflight CORS** : Le navigateur envoie d'abord une requête OPTIONS pour vérifier
- Si c'est OPTIONS, on répond juste "OK" (200) et on arrête
- Sinon, les vrais POST/GET/DELETE seraient bloqués par le navigateur

---

### PARTIE 2 : Autoloader (lignes 22-37)

```php
// Automatically load classes
function autoload($className) {
    $directories = [
        __DIR__ . '/../controllers/',
        __DIR__ . '/../models/',
        __DIR__ . '/../config/'
    ];

    foreach ($directories as $directory) {
        $file = $directory . $className . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
}
spl_autoload_register('autoload');
```

**🔍 Explication :**

- **Autoloader** = Charge automatiquement les classes PHP quand on les utilise
- **Comment ça marche ?**

```php
// Sans autoloader (à l'ancienne) ❌
require_once 'controllers/UserController.php';
require_once 'controllers/PostController.php';
require_once 'controllers/ImageController.php';
require_once 'models/User.php';
// ... 20 lignes de require_once

// Avec autoloader (moderne) ✅
spl_autoload_register('autoload');
// Quand on écrit: new UserController()
// PHP appelle automatiquement autoload('UserController')
// → Cherche dans controllers/, models/, config/
// → Trouve controllers/UserController.php et le charge
```

**Exemple concret :**

```php
// Ligne 67 : $router->addRoute('GET', '/api/posts', 'PostController', 'getPosts');
// Ligne 105 : $controller = new $route['controller']();
//             $controller = new 'PostController'();
//                           ↓
//             autoload('PostController') est appelé automatiquement
//                           ↓
//             Cherche dans controllers/PostController.php
//                           ↓
//             require_once 'controllers/PostController.php'
//                           ↓
//             new PostController() fonctionne !
```

---

### PARTIE 3 : Classe Router (lignes 40-100)

#### A. Structure de la classe

```php
class Router {
    private $routes = [];  // Liste de toutes les routes enregistrées
```

**🔍 Explication :**

- `$routes` est un tableau qui stocke toutes les routes
- Chaque route contient : méthode HTTP, chemin, controller, action

**Exemple de $routes :**

```php
$routes = [
    [
        'method' => 'GET',
        'path' => '/api/posts',
        'controller' => 'PostController',
        'action' => 'getPosts'
    ],
    [
        'method' => 'POST',
        'path' => '/api/images',
        'controller' => 'ImageController',
        'action' => 'saveImage'
    ],
    // ... autres routes
];
```

#### B. Méthode addRoute()

```php
public function addRoute($method, $path, $controller, $action) {
    $this->routes[] = [
        'method' => $method,
        'path' => $path,
        'controller' => $controller,
        'action' => $action
    ];
}
```

**🔍 Explication :**

- Ajoute une nouvelle route au tableau `$routes`
- **Paramètres :**
  - `$method` : GET, POST, DELETE, PUT
  - `$path` : URL de l'API (ex: `/api/posts`)
  - `$controller` : Nom de la classe (ex: `PostController`)
  - `$action` : Nom de la méthode (ex: `getPosts`)

**Exemple d'utilisation :**

```php
$router->addRoute('GET', '/api/posts', 'PostController', 'getPosts');
//                  ↓       ↓              ↓                ↓
//               Méthode   URL         Controller        Méthode
```

#### C. Méthode handle()

```php
public function handle() {
    $method = $_SERVER['REQUEST_METHOD'];  // GET, POST, DELETE, etc.
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);  // /api/posts
```

**🔍 Explication :**

- `$_SERVER['REQUEST_METHOD']` : Type de requête (GET, POST, etc.)
- `parse_url()` : Extrait juste le chemin de l'URL
  - `/api/posts?page=2` → `/api/posts`

```php
    $debugInfo = [];
    $debugInfo[] = "Method: $method";
    $debugInfo[] = "Path: $path";
```

**🔍 Explication :**

- Informations de debug pour comprendre ce qui se passe
- Affiché si aucune route ne correspond (erreur 404)

```php
    foreach ($this->routes as $route) {
        $debugInfo[] = "Checking route: {$route['method']} {$route['path']}";
        if ($this->matchRoute($route, $method, $path)) {
            $controller = new $route['controller']();
            $action = $route['action'];
            $controller->$action();
            return;
        }
    }
```

**🔍 Explication :**

- **Boucle** sur toutes les routes enregistrées
- **Vérifie** si la route correspond (méthode + chemin)
- **Si OUI** :
  1. Crée une instance du controller : `new PostController()`
  2. Appelle la méthode : `$controller->getPosts()`
  3. Arrête la recherche avec `return`

**Exemple concret :**

```php
// Requête: GET /api/posts
// Boucle:
//   Route 1: GET /api/user/status → Pas match
//   Route 2: POST /api/auth/login → Pas match (méthode différente)
//   Route 3: GET /api/posts → ✅ MATCH !
//     $controller = new PostController();
//     $controller->getPosts();
//     return;  // Arrête ici
```

```php
    // Route not found
    http_response_code(404);
    echo json_encode([
        'error' => 'Route not found',
        'debug' => $debugInfo
    ]);
}
```

**🔍 Explication :**

- Si aucune route ne correspond, retourne une erreur 404
- Avec informations de debug pour comprendre pourquoi

#### D. Méthode matchRoute()

```php
private function matchRoute($route, $method, $path) {
    if ($route['method'] !== $method) {
        return false;  // Méthode différente (GET vs POST)
    }
```

**🔍 Explication :**

- Vérifie d'abord si la méthode HTTP correspond
- Si GET attendu mais POST reçu → pas de match

```php
    $routePath = $route['path'];

    // If route contains wildcard '*', match accordingly
    if (strpos($routePath, '*') !== false) {
        $pattern = str_replace('*', '[^/]+', $routePath);
        $pattern = '#^' . $pattern . '$#';
        error_log("Router Debug - Wildcard pattern: $pattern for path: $path");
        $match = preg_match($pattern, $path);
        error_log("Router Debug - Pattern match result: " . ($match ? 'TRUE' : 'FALSE'));
        return $match;
    }
```

**🔍 Explication : WILDCARDS (\*)**

Les wildcards permettent de matcher des URLs dynamiques.

**Exemple 1 : `/api/posts/*/like`**

```php
// Route définie: /api/posts/*/like
//                          ↑
//                     wildcard = n'importe quel nombre

// Requête 1: /api/posts/5/like
//   * = 5 → ✅ MATCH

// Requête 2: /api/posts/42/like
//   * = 42 → ✅ MATCH

// Requête 3: /api/posts/abc/like
//   * = abc → ✅ MATCH

// Requête 4: /api/posts/5/42/like
//   * ne peut pas matcher "5/42" (contient /)
//   → ❌ PAS DE MATCH
```

**Comment ça fonctionne techniquement ?**

```php
// Route: /api/posts/*/like
// Étape 1: Remplacer * par [^/]+
$pattern = str_replace('*', '[^/]+', '/api/posts/*/like');
// Résultat: /api/posts/[^/]+/like

// Étape 2: Créer une regex
$pattern = '#^' . $pattern . '$#';
// Résultat: #^/api/posts/[^/]+/like$#
//           ↑              ↑        ↑
//         début      n'importe quoi  fin
//                    sauf /

// Étape 3: Tester
preg_match('#^/api/posts/[^/]+/like$#', '/api/posts/42/like');
// → TRUE ✅
```

**Exemple 2 : `/api/images/*`**

```php
// Route définie: /api/images/*

// DELETE /api/images/123 → * = 123 → ✅ MATCH
// DELETE /api/images/999 → * = 999 → ✅ MATCH
// GET /api/images/user/42 → * = user (s'arrête au /) → ❌ PAS DE MATCH
```

```php
    // Match exact
    $exactMatch = $routePath === $path;
    error_log("Router Debug - Exact match: " . ($exactMatch ? 'TRUE' : 'FALSE'));
    return $exactMatch;
}
```

**🔍 Explication :**

- Si pas de wildcard, vérifie si les chemins sont **exactement** identiques
- `/api/posts` === `/api/posts` → TRUE
- `/api/posts` === `/api/post` → FALSE

---

### PARTIE 4 : Configuration des routes (lignes 105-123)

```php
// Configuration of routes
$router = new Router();

// Authentication routes
$router->addRoute('GET', '/api/user/status', 'UserController', 'getStatus');
$router->addRoute('POST', '/api/auth/login', 'UserController', 'login');
$router->addRoute('POST', '/api/auth/register', 'UserController', 'register');
$router->addRoute('POST', '/api/auth/logout', 'UserController', 'logout');
$router->addRoute('POST', '/api/user/avatar', 'UserController', 'uploadAvatar');
$router->addRoute('GET', '/api/avatar/*', 'UserController', 'getAvatar');
```

**🔍 Explication :**

- Crée l'instance du Router
- **Enregistre** toutes les routes de l'API
- **Routes d'authentification** : Login, register, logout, statut

**Mapping complet :**

| Requête client          | Méthode        | Controller     | Action              |
| ----------------------- | -------------- | -------------- | ------------------- |
| GET /api/user/status    | getStatus()    | UserController | Vérifie si connecté |
| POST /api/auth/login    | login()        | UserController | Se connecter        |
| POST /api/auth/register | register()     | UserController | S'inscrire          |
| POST /api/auth/logout   | logout()       | UserController | Se déconnecter      |
| POST /api/user/avatar   | uploadAvatar() | UserController | Upload avatar       |
| GET /api/avatar/john    | getAvatar()    | UserController | Récupérer avatar    |

```php
// Routes des posts et likes
$router->addRoute('GET', '/api/posts', 'PostController', 'getPosts');
$router->addRoute('POST', '/api/posts/*/like', 'PostController', 'toggleLike');
$router->addRoute('GET', '/api/posts/*/likes', 'PostController', 'getLikes');
```

**🔍 Explication :**

| Requête                 | Action                      |
| ----------------------- | --------------------------- |
| GET /api/posts?page=1   | Liste des posts (page 1)    |
| POST /api/posts/42/like | Liker/unliker le post #42   |
| GET /api/posts/42/likes | Nombre de likes du post #42 |

```php
// Routes des images capturées
$router->addRoute('POST', '/api/images', 'ImageController', 'saveImage');
$router->addRoute('GET', '/api/images/user/*', 'ImageController', 'getUserImages');
$router->addRoute('DELETE', '/api/images/*', 'ImageController', 'deleteImage');
```

**🔍 Explication :**

| Requête                 | Action                                   |
| ----------------------- | ---------------------------------------- |
| POST /api/images        | Sauvegarder une nouvelle image           |
| GET /api/images/user/42 | Récupérer toutes les images de l'user 42 |
| DELETE /api/images/123  | Supprimer l'image #123                   |

```php
// Start the router
$router->handle();
```

**🔍 Explication :**

- **Lance le routeur** : analyse la requête et appelle le bon controller
- C'est ici que tout se passe !

---

## 🎯 Flux complet d'une requête

```
1. Client envoie: POST /api/images
                   ↓
2. server.php reçoit et redirige vers routes/api.php
                   ↓
3. session_start() démarre la session
                   ↓
4. Headers CORS configurés
                   ↓
5. Autoloader enregistré
                   ↓
6. Router créé et routes enregistrées
                   ↓
7. $router->handle() appelé
                   ↓
8. Boucle sur toutes les routes:
   - GET /api/user/status → Pas match
   - POST /api/auth/login → Pas match
   - ...
   - POST /api/images → ✅ MATCH !
                   ↓
9. new ImageController() créé (autoloader charge le fichier)
                   ↓
10. $controller->saveImage() appelé
                   ↓
11. ImageController vérifie authentification, sauvegarde en DB
                   ↓
12. Retourne JSON: {"success": true, "image_id": 123}
                   ↓
13. Client reçoit la réponse
```

---

## ✅ Est-ce que l'organisation est bonne ?

### 🎉 Points EXCELLENTS

1. **✅ Séparation des responsabilités**
   - Routes définies ici
   - Logique métier dans les controllers
   - Données dans les models
   - → Pattern MVC bien respecté

2. **✅ Router simple mais efficace**
   - Pas de dépendance externe (pas de framework)
   - Facile à comprendre et maintenir
   - Support des wildcards

3. **✅ Autoloader personnalisé**
   - Pas besoin de `require_once` partout
   - Charge uniquement ce qui est nécessaire

4. **✅ CORS bien configuré**
   - Permet les requêtes cross-origin
   - Gère les requêtes OPTIONS

5. **✅ Session centralisée**
   - Démarrée une seule fois
   - Disponible partout

### ⚠️ Points à améliorer (optionnel)

1. **Logs de debug**

   ```php
   error_log("Router Debug - ...");  // ← À retirer en production
   ```

   **Solution :** Ajouter un mode DEBUG

   ```php
   define('DEBUG_MODE', false);
   if (DEBUG_MODE) {
       error_log("...");
   }
   ```

2. **CORS trop permissif**

   ```php
   header('Access-Control-Allow-Origin: *');  // ← Accepte TOUS les domaines
   ```

   **Solution :** En production, restreindre

   ```php
   $allowedOrigin = $_ENV['ALLOWED_ORIGIN'] ?? 'https://camagru.com';
   header('Access-Control-Allow-Origin: ' . $allowedOrigin);
   ```

3. **Pas de gestion des erreurs du router**
   - Si le controller n'existe pas, PHP crash

   **Solution :**

   ```php
   if (class_exists($route['controller'])) {
       $controller = new $route['controller']();
   } else {
       http_response_code(500);
       echo json_encode(['error' => 'Controller not found']);
   }
   ```

4. **Pas de cache des routes**
   - Les routes sont redéfinies à chaque requête
   - Pour un gros projet (100+ routes), ça peut être lent

   **Solution :** Mettre en cache (mais pas nécessaire pour Camagru)

---

## 📊 Comparaison avec d'autres approches

### Votre approche (custom router)

**✅ Avantages :**

- Simple à comprendre
- Pas de dépendances
- Conforme au sujet (PHP standard library)
- Facile à déboguer

**❌ Inconvénients :**

- Moins de fonctionnalités qu'un framework
- Pas de middleware (mais pas nécessaire ici)

### Avec un framework (Laravel/Symfony)

**✅ Avantages :**

- Beaucoup de fonctionnalités (middleware, validation, etc.)
- Communauté et documentation

**❌ Inconvénients :**

- ❌ **Interdit par le sujet Camagru** (pas de framework)
- Plus complexe
- Plus lourd

---

## 🏆 Verdict final

### Note : **9/10** ⭐⭐⭐⭐⭐⭐⭐⭐⭐

**Pourquoi ?**

- ✅ Structure claire et bien organisée
- ✅ Code facile à lire et comprendre
- ✅ Conforme au sujet (pas de framework)
- ✅ Fonctionnel et maintenable
- ⚠️ Quelques petites optimisations possibles (mais pas critiques)

**Pour un projet 42 comme Camagru, c'est une EXCELLENTE organisation !** 🎉

---

## 💡 Recommandations

### Pour l'instant : RAS ✅

Le code est très bien tel quel pour Camagru.

### Si vous voulez aller plus loin (optionnel) :

1. **Ajouter un mode DEBUG**

   ```php
   define('DEBUG', $_ENV['DEBUG'] ?? false);
   ```

2. **Restreindre CORS en production**

   ```php
   $origin = $_ENV['FRONTEND_URL'] ?? 'http://localhost:8080';
   header('Access-Control-Allow-Origin: ' . $origin);
   ```

3. **Middleware pour l'authentification**
   ```php
   class AuthMiddleware {
       public static function requireAuth() {
           if (!isset($_SESSION['user_id'])) {
               http_response_code(401);
               echo json_encode(['error' => 'Not authenticated']);
               exit;
           }
       }
   }
   ```

Mais encore une fois, **le code actuel est déjà excellent pour Camagru** ! 👏
