# 📚 PDO Attributes - Guide complet

## 🎯 C'est quoi un PDO::ATTR ?

Les **attributs PDO** sont des options de configuration pour personnaliser le comportement de la connexion à la base de données.

```php
$pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_XXX => valeur,  // ← Attributs de configuration
    PDO::ATTR_YYY => valeur,
]);
```

---

## ⭐ Les 3 attributs ESSENTIELS (utilisés dans Camagru)

### 1️⃣ PDO::ATTR_ERRMODE - Gestion des erreurs

**À quoi ça sert ?** Détermine comment PDO réagit aux erreurs SQL.

```php
// ❌ Sans configuration (par défaut)
$stmt = $pdo->query("SELCT * FROM users");  // Erreur de syntaxe
// → Retourne false silencieusement (difficile à déboguer!)

// ✅ Avec ERRMODE_EXCEPTION
PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
$stmt = $pdo->query("SELCT * FROM users");
// → Lance une exception claire: "SQLSTATE[42000]: Syntax error"
```

**Valeurs possibles :**

| Valeur                   | Comportement                   | Usage             |
| ------------------------ | ------------------------------ | ----------------- |
| `PDO::ERRMODE_SILENT`    | Retourne `false`, pas d'erreur | ❌ Déconseillé    |
| `PDO::ERRMODE_WARNING`   | Émet un `E_WARNING` PHP        | ⚠️ Pour debug     |
| `PDO::ERRMODE_EXCEPTION` | Lance une exception            | ✅ **Recommandé** |

### 2️⃣ PDO::ATTR_DEFAULT_FETCH_MODE - Format des résultats

**À quoi ça sert ?** Détermine comment sont retournées les données SQL.

```php
// Exemple de requête
$stmt = $pdo->query("SELECT id, username FROM users LIMIT 1");
$user = $stmt->fetch();

// FETCH_ASSOC (utilisé dans Camagru)
PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
// → ['id' => 42, 'username' => 'john']

// FETCH_NUM
PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_NUM
// → [0 => 42, 1 => 'john']

// FETCH_BOTH (par défaut)
// → ['id' => 42, 0 => 42, 'username' => 'john', 1 => 'john']  (redondant!)

// FETCH_OBJ
PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_OBJ
// → stdClass Object { id: 42, username: 'john' }
```

**Valeurs possibles :**

| Valeur             | Format               | Usage                     |
| ------------------ | -------------------- | ------------------------- |
| `PDO::FETCH_ASSOC` | `['key' => 'value']` | ✅ **Recommandé** (clair) |
| `PDO::FETCH_NUM`   | `[0 => 'value']`     | Pour performances         |
| `PDO::FETCH_BOTH`  | Les deux mélangés    | ❌ Éviter (doublons)      |
| `PDO::FETCH_OBJ`   | Objet `->propriete`  | Pour POO                  |
| `PDO::FETCH_CLASS` | Instance de classe   | Mapping ORM               |

### 3️⃣ PDO::ATTR_EMULATE_PREPARES - Vraies requêtes préparées

**À quoi ça sert ?** Active les vraies requêtes préparées MySQL (plus sécurisé).

```php
// EMULATE_PREPARES = true (par défaut, moins sûr)
PDO::ATTR_EMULATE_PREPARES => true
// PHP remplace les :placeholders AVANT d'envoyer à MySQL
// SQL envoyé: "SELECT * FROM users WHERE id = '42'"

// EMULATE_PREPARES = false (recommandé, plus sûr)
PDO::ATTR_EMULATE_PREPARES => false
// MySQL reçoit la requête préparée: "SELECT * FROM users WHERE id = ?"
// Puis les paramètres séparément: [42]
// → Impossible d'injecter du SQL malveillant
```

**Pourquoi c'est important ?**

```php
// Tentative d'injection SQL
$malicious = "1 OR 1=1";

// Avec EMULATE_PREPARES = true (émulation PHP)
// Risque faible mais théorique de bypass

// Avec EMULATE_PREPARES = false (vraies prepared statements)
// → MySQL traite "1 OR 1=1" comme une STRING littérale
// → Injection impossible ✅
```

---

## 🔧 Autres attributs utiles

### 4️⃣ PDO::ATTR_PERSISTENT - Connexions persistantes

```php
PDO::ATTR_PERSISTENT => true

// ❌ Sans (par défaut): Nouvelle connexion à chaque requête
// Page 1: Ouvre connexion → Requête → Ferme connexion
// Page 2: Ouvre connexion → Requête → Ferme connexion

// ✅ Avec: Réutilise la même connexion
// Page 1: Ouvre connexion → Requête (connexion reste ouverte)
// Page 2: Réutilise connexion → Requête
```

**Quand l'utiliser ?**

- ✅ Haut trafic (économise des connexions)
- ❌ Peut causer des problèmes de transactions non fermées

### 5️⃣ PDO::ATTR_TIMEOUT - Timeout de connexion

```php
PDO::ATTR_TIMEOUT => 10  // 10 secondes

// Si la DB ne répond pas après 10s, lance une exception
// Évite que l'application reste bloquée indéfiniment
```

### 6️⃣ PDO::ATTR_AUTOCOMMIT - Auto-commit des transactions

```php
PDO::ATTR_AUTOCOMMIT => false

// Par défaut (true): Chaque requête est commitée immédiatement
// INSERT INTO users...  → Commitée tout de suite

// Avec false: Nécessite commit manuel
$pdo->beginTransaction();
$pdo->exec("INSERT INTO users...");
$pdo->exec("INSERT INTO posts...");
$pdo->commit();  // ← Tout est sauvegardé en une fois
```

### 7️⃣ PDO::ATTR_CASE - Casse des noms de colonnes

```php
PDO::ATTR_CASE => PDO::CASE_LOWER

// Par défaut: PDO::CASE_NATURAL (tel quel)
// SELECT UserName → ['UserName' => 'john']

// PDO::CASE_LOWER
// SELECT UserName → ['username' => 'john']

// PDO::CASE_UPPER
// SELECT UserName → ['USERNAME' => 'john']
```

### 8️⃣ PDO::ATTR_ORACLE_NULLS - Gestion des NULL

```php
PDO::ATTR_ORACLE_NULLS => PDO::NULL_EMPTY_STRING

// Convertit les chaînes vides en NULL
// INSERT INTO users (bio) VALUES ('') → NULL
```

### 9️⃣ PDO::ATTR_STRINGIFY_FETCHES - Tout en string

```php
PDO::ATTR_STRINGIFY_FETCHES => true

// Par défaut: Types natifs
// SELECT id FROM users → ['id' => 42]  (integer)

// Avec stringify:
// SELECT id FROM users → ['id' => '42']  (string)
```

### 🔟 PDO::MYSQL_ATTR_INIT_COMMAND - Commandes d'init

```php
PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"

// Exécute cette commande SQL après chaque connexion
// Utile pour configurer l'encodage, le timezone, etc.
```

---

## 🎯 Configuration recommandée pour Camagru

```php
<?php
// Configuration OPTIMALE pour un projet web sécurisé

$pdo = new PDO(
    "mysql:host=localhost;dbname=camagru;charset=utf8mb4",
    "root",
    "password",
    [
        // ✅ OBLIGATOIRE: Gestion d'erreurs avec exceptions
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,

        // ✅ OBLIGATOIRE: Tableaux associatifs (plus lisible)
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

        // ✅ OBLIGATOIRE: Vraies requêtes préparées (sécurité)
        PDO::ATTR_EMULATE_PREPARES => false,

        // ⚡ OPTIONNEL: Timeout de 5 secondes
        PDO::ATTR_TIMEOUT => 5,

        // ⚡ OPTIONNEL: Encodage UTF-8 complet (emojis, etc.)
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ]
);
```

---

## 📊 Comparaison: Avec vs Sans attributs

### Sans configuration (défaut PDO)

```php
// ❌ Code fragile
$pdo = new PDO("mysql:host=localhost;dbname=test", "root", "pass");

$stmt = $pdo->query("SELCT * FROM users");  // Typo
// → Retourne false, pas d'erreur visible

$user = $stmt->fetch();
// → ['id' => 1, 0 => 1, 'name' => 'john', 1 => 'john']  (doublons)

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute([':id' => "1 OR 1=1"]);
// → Potentiellement vulnérable (émulation PHP)
```

### Avec configuration (Camagru)

```php
// ✅ Code robuste
$pdo = new PDO(
    "mysql:host=localhost;dbname=test",
    "root",
    "pass",
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]
);

$stmt = $pdo->query("SELCT * FROM users");  // Typo
// → Exception: "SQLSTATE[42000]: Syntax error" (visible immédiatement!)

$user = $stmt->fetch();
// → ['id' => 1, 'name' => 'john']  (clair et concis)

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute([':id' => "1 OR 1=1"]);
// → Sécurisé: "1 OR 1=1" traité comme string littérale
```

---

## 🔍 Comment voir tous les attributs ?

```php
// Lister tous les attributs d'une connexion
$attrs = [
    PDO::ATTR_AUTOCOMMIT,
    PDO::ATTR_CASE,
    PDO::ATTR_CLIENT_VERSION,
    PDO::ATTR_CONNECTION_STATUS,
    PDO::ATTR_DRIVER_NAME,
    PDO::ATTR_ERRMODE,
    PDO::ATTR_ORACLE_NULLS,
    PDO::ATTR_PERSISTENT,
    PDO::ATTR_PREFETCH,
    PDO::ATTR_SERVER_INFO,
    PDO::ATTR_SERVER_VERSION,
    PDO::ATTR_TIMEOUT
];

foreach ($attrs as $attr) {
    echo "Attr: " . $attr . " = ";
    try {
        echo $pdo->getAttribute($attr);
    } catch (Exception $e) {
        echo "Non supporté";
    }
    echo "\n";
}
```

---

## 📚 Documentation officielle

- [Liste complète PDO::ATTR](https://www.php.net/manual/fr/pdo.setattribute.php)
- [PDO::setAttribute()](https://www.php.net/manual/fr/pdo.setattribute.php)
- [PDO::getAttribute()](https://www.php.net/manual/fr/pdo.getattribute.php)
- [Modes de fetch](https://www.php.net/manual/fr/pdostatement.fetch.php)

---

## ✅ Résumé

| Attribut                  | Utilité                | Valeur Camagru | Typique ? |
| ------------------------- | ---------------------- | -------------- | --------- |
| `ATTR_ERRMODE`            | Gestion erreurs        | `EXCEPTION`    | ✅ Oui    |
| `ATTR_DEFAULT_FETCH_MODE` | Format résultats       | `FETCH_ASSOC`  | ✅ Oui    |
| `ATTR_EMULATE_PREPARES`   | Sécurité SQL           | `false`        | ✅ Oui    |
| `ATTR_PERSISTENT`         | Connexions réutilisées | Non utilisé    | Parfois   |
| `ATTR_TIMEOUT`            | Timeout connexion      | Non utilisé    | Parfois   |
| `ATTR_AUTOCOMMIT`         | Transactions auto      | Non utilisé    | Rarement  |

**Les 3 attributs de Camagru sont les plus importants et typiques !** ✅
