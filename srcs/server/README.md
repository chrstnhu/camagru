# CAMAGRU - Backend PHP (Guide débutant)

## 📁 Structure du serveur

```
server/
├── server.php           # Point d'entrée - reçoit toutes les requêtes
├── config/
│   ├── Database.php     # Connexion à MySQL
│   └── init.sql         # Structure de la base de données
├── routes/
│   └── api.php          # Définition de toutes les routes (URLs)
├── controllers/
│   ├── ImageController.php  # Gestion des images capturées
│   ├── PostController.php   # Gestion des posts et likes
│   └── UserController.php   # Authentification et profils
└── models/
    ├── Image.php        # Requêtes DB pour images
    ├── Post.php         # Requêtes DB pour posts
    ├── User.php         # Requêtes DB pour utilisateurs
    └── Like.php         # Requêtes DB pour likes
```

## 🔄 Comment ça fonctionne ?

### 1. Flux d'une requête

```
Client (Browser)
    ↓ HTTP Request (ex: POST /api/images)
server.php (Point d'entrée)
    ↓ Vérifie que l'URL commence par /api/
routes/api.php (Router)
    ↓ Trouve la route qui correspond
controllers/ImageController.php
    ↓ Appelle la méthode saveImage()
    ↓ Vérifie l'authentification
    ↓ Valide les données
models/ (si besoin)
    ↓ Exécute des requêtes SQL
config/Database.php
    ↓ Connexion MySQL
    ↓ Retourne les résultats
    ↑
Controller
    ↑ Formate la réponse JSON
Client
    ↑ Reçoit la réponse
```

### 2. Exemple concret : Sauvegarder une image

**CLIENT (JavaScript)**

```javascript
fetch("/api/images", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    image_data: "data:image/png;base64,iVBORw0...",
    caption: "Ma photo",
  }),
});
```

**SERVEUR (PHP)**

1. **server.php** reçoit la requête

   ```php
   // Redirige vers routes/api.php
   require_once __DIR__ . '/routes/api.php';
   ```

2. **routes/api.php** trouve la route

   ```php
   $router->addRoute('POST', '/api/images', 'ImageController', 'saveImage');
   ```

3. **ImageController.php** traite
   ```php
   public function saveImage() {
       // Vérifie authentification
       session_start();
       if (!isset($_SESSION['user_id'])) {
           return error('Not logged in');
       }

       // Récupère les données
       $input = json_decode(file_get_contents('php://input'), true);

       // Valide les données
       if (!isset($input['image_data'])) {
           return error('Missing data');
       }

       // Sauvegarde en DB
       $stmt = $this->db->prepare("INSERT INTO images...");
       $stmt->execute([...]);

       // Retourne succès
       echo json_encode(['success' => true]);
   }
   ```

## 🔐 Sécurité implémentée

### ✅ Protection contre les injections SQL

```php
// ❌ MAUVAIS (vulnérable)
$sql = "SELECT * FROM users WHERE id = " . $_GET['id'];

// ✅ BON (sécurisé avec requête préparée)
$stmt = $db->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute([':id' => $_GET['id']]);
```

### ✅ Vérification d'authentification

```php
// Avant toute action sensible
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    return;
}
```

### ✅ Vérification de propriété

```php
// Un utilisateur ne peut supprimer que SES propres images
$stmt = $db->prepare("SELECT user_id FROM images WHERE id = :id");
$stmt->execute([':id' => $imageId]);
$image = $stmt->fetch();

if ($image['user_id'] !== $_SESSION['user_id']) {
    http_response_code(403);
    echo json_encode(['error' => 'Not your image']);
    return;
}
```

## 📝 Routes disponibles

### Authentification

- `GET /api/user/status` - Vérifier si connecté
- `POST /api/auth/login` - Se connecter
- `POST /api/auth/register` - S'inscrire
- `POST /api/auth/logout` - Se déconnecter

### Images (🔒 Authentification requise)

- `POST /api/images` - Sauvegarder une image
- `GET /api/images/user/{id}` - Récupérer ses images
- `DELETE /api/images/{id}` - Supprimer une image

### Posts

- `GET /api/posts` - Liste des posts
- `POST /api/posts/{id}/like` - Liker un post (🔒)
- `GET /api/posts/{id}/likes` - Nombre de likes

## 🎯 Conformité avec le sujet

### ✅ Exigences respectées

1. **Langages autorisés** : PHP standard library uniquement ✅
2. **Pas de frameworks** : Code PHP natif ✅
3. **Authentification obligatoire** :
   - ✅ Capture photo nécessite connexion
   - ✅ Upload image nécessite connexion
   - ✅ Suppression image nécessite connexion
4. **Sécurité** :
   - ✅ Un utilisateur ne peut supprimer que ses images
   - ✅ Requêtes préparées (anti-SQL injection)
   - ✅ Vérification de session
5. **Superposition d'images** : Côté serveur (à implémenter avec GD library)

## 🚀 Pour tester

```bash
# Démarrer les containers
docker-compose up

# Tester l'API
curl http://localhost:9001/api/user/status
```

## 📚 Ressources PHP utiles

- [PHP PDO](https://www.php.net/manual/fr/book.pdo.php) - Base de données
- [PHP Sessions](https://www.php.net/manual/fr/book.session.php) - Authentification
- [PHP GD](https://www.php.net/manual/fr/book.image.php) - Manipulation d'images
- [JSON en PHP](https://www.php.net/manual/fr/book.json.php) - API REST
