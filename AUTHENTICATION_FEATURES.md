# Nouvelles Fonctionnalités d'Authentification - Camagru

## ✅ Fonctionnalités Implémentées

### 1. Inscription avec validation d'email

- ✅ Validation de la complexité du mot de passe (8 caractères min, majuscule, minuscule, chiffre)
- ✅ Validation du format d'email
- ✅ Génération d'un token de vérification unique
- ✅ Envoi automatique d'email de confirmation
- ✅ L'utilisateur doit cliquer sur le lien dans l'email pour activer son compte
- ✅ Message de confirmation après vérification réussie

### 2. Connexion sécurisée

- ✅ Connexion avec email et mot de passe
- ✅ Session active pendant 1 heure (configurable)
- ✅ Vérification que l'email est bien confirmé (optionnel)

### 3. Réinitialisation de mot de passe

- ✅ Lien "Forgot Password?" dans le formulaire de connexion
- ✅ Interface pour saisir son email
- ✅ Envoi d'un email avec lien de réinitialisation
- ✅ Lien valide pendant 1 heure
- ✅ Interface pour saisir nouveau mot de passe
- ✅ Validation de la complexité du nouveau mot de passe

### 4. Déconnexion

- ✅ Déconnexion en un clic disponible sur toutes les pages
- ✅ Destruction complète de la session
- ✅ Redirection vers la page d'accueil

### 5. Modification du profil

- ✅ Page "My Account" accessible depuis le menu utilisateur
- ✅ Modification du username
- ✅ Modification de l'email
- ✅ Modification du mot de passe
- ✅ Validation des données avant modification
- ✅ Vérification que le nouvel email/username n'est pas déjà utilisé

## 📁 Fichiers Créés/Modifiés

### Backend (PHP)

- ✅ `srcs/server/models/User.php` - Ajout de méthodes pour tokens, reset password, update profile
- ✅ `srcs/server/utils/EmailService.php` - Nouveau service d'envoi d'emails
- ✅ `srcs/server/controllers/UserController.php` - Nouveaux endpoints pour vérification, reset, profile
- ✅ `srcs/server/routes/api.php` - Nouvelles routes ajoutées
- ✅ `srcs/server/server.php` - Configuration session 1h
- ✅ `srcs/server/config/init.sql` - Colonnes déjà présentes pour tokens

### Frontend (JavaScript/HTML)

- ✅ `srcs/client/public/srcs/js/login.js` - Validation password, lien forgot password
- ✅ `srcs/client/public/srcs/js/profile.js` - Nouveau fichier pour gestion profil et reset password
- ✅ `srcs/client/public/srcs/js/auth.js` - Affichage/masquage menu "My Posts"
- ✅ `srcs/client/public/srcs/js/ui.js` - Ajout section profile
- ✅ `srcs/client/public/index.html` - Section profile, menu My Account

### Documentation

- ✅ `EMAIL_SETUP.md` - Guide de configuration des emails

## 🔒 Sécurité

- **Hachage des mots de passe** : PASSWORD_DEFAULT (bcrypt)
- **Tokens cryptographiques** : random_bytes(32) converti en hex (64 caractères)
- **Expiration des tokens** :
  - Vérification email : Pas d'expiration automatique (géré en BDD)
  - Reset password : 1 heure
- **Validation côté client et serveur**
- **Protection contre l'énumération d'emails** : Même message que l'email existe ou non lors du forgot password
- **Session sécurisée** : session_set_cookie_params avec durée limitée

## 🔄 Flux d'inscription

```
1. Utilisateur remplit formulaire d'inscription
   ↓
2. Validation côté client (password complexité, format email)
   ↓
3. Envoi à l'API POST /api/auth/register
   ↓
4. Validation côté serveur
   ↓
5. Création du compte avec email_verified = 0
   ↓
6. Génération d'un token unique
   ↓
7. Envoi d'email avec lien de vérification
   ↓
8. Message "Check your email"
   ↓
9. Utilisateur clique sur lien dans email
   ↓
10. GET /api/auth/verify-email?token=...
    ↓
11. Validation du token
    ↓
12. email_verified = 1
    ↓
13. Redirection vers page login avec message de succès
```

## 🔄 Flux de réinitialisation de mot de passe

```
1. Utilisateur clique "Forgot Password?"
   ↓
2. Popup avec formulaire email
   ↓
3. Envoi à POST /api/auth/forgot-password
   ↓
4. Si email existe : génération token + envoi email
   ↓
5. Utilisateur clique sur lien dans email
   ↓
6. URL: /?reset-token=...
   ↓
7. Popup automatique pour nouveau password
   ↓
8. Validation complexité password
   ↓
9. Envoi à POST /api/auth/reset-password
   ↓
10. Vérification token + mise à jour password
    ↓
11. Message de succès + ouverture popup login
```

## 🔄 Flux de modification de profil

```
1. Utilisateur connecté clique "My Account"
   ↓
2. Chargement des données actuelles
   ↓
3. Modification des champs souhaités
   ↓
4. Validation côté client
   ↓
5. Envoi à PUT /api/user/profile
   ↓
6. Vérifications (email/username non utilisés)
   ↓
7. Mise à jour en base de données
   ↓
8. Mise à jour de la session
   ↓
9. Message de succès
```

## 🎯 API Endpoints

### Nouveaux endpoints

| Méthode | Route                     | Description                       | Auth requise |
| ------- | ------------------------- | --------------------------------- | ------------ |
| GET     | /api/auth/verify-email    | Vérifier email avec token         | Non          |
| POST    | /api/auth/forgot-password | Demander reset password           | Non          |
| POST    | /api/auth/reset-password  | Réinitialiser password avec token | Non          |
| PUT     | /api/user/profile         | Modifier profil utilisateur       | Oui          |

### Endpoints modifiés

| Méthode | Route              | Changement                  |
| ------- | ------------------ | --------------------------- |
| POST    | /api/auth/register | Génère token + envoie email |

## 🧪 Tests

### Test de l'inscription

1. Remplir le formulaire avec un email valide
2. Vérifier la réception de l'email (MailHog ou logs)
3. Cliquer sur le lien de vérification
4. Vérifier la redirection et le message de succès
5. Se connecter avec les identifiants

### Test du forgot password

1. Cliquer sur "Forgot Password?"
2. Entrer votre email
3. Vérifier la réception de l'email
4. Cliquer sur le lien
5. Entrer un nouveau mot de passe
6. Se connecter avec le nouveau mot de passe

### Test de modification de profil

1. Se connecter
2. Cliquer sur "My Account"
3. Modifier username/email/password
4. Vérifier la mise à jour
5. Se reconnecter si nécessaire

## 📝 Notes importantes

1. **Configuration email** : Consultez `EMAIL_SETUP.md` pour configurer l'envoi d'emails
2. **Base URL** : Modifiez `$baseUrl` dans `EmailService.php` selon votre environnement
3. **Session lifetime** : Modifiable dans `server.php` (actuellement 3600s = 1h)
4. **Email verification optionnelle** : Vous pouvez modifier `UserController::login()` pour forcer la vérification email avant connexion

## 🚀 Prochaines améliorations possibles

- [ ] Rate limiting sur forgot password
- [ ] Historique des modifications de profil
- [ ] Authentification à deux facteurs (2FA)
- [ ] Notifications par email lors de modifications de compte
- [ ] Possibilité de désactiver/supprimer son compte
- [ ] Templates HTML pour les emails
- [ ] Support de plusieurs langues dans les emails
