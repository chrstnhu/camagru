# Configuration de l'envoi d'emails

## Aperçu

Le système d'authentification de Camagru utilise l'envoi d'emails pour :

- La vérification de compte lors de l'inscription
- La réinitialisation de mot de passe

## Configuration PHP pour l'envoi d'emails

### Option 1 : Utiliser la fonction mail() de PHP (Simple)

La fonction `mail()` de PHP est déjà configurée dans `EmailService.php`. Pour qu'elle fonctionne, vous devez configurer votre serveur.

#### Sur un serveur de développement local :

1. **Installer un serveur mail local (ex: MailHog pour le développement)**

   ```bash
   # Télécharger MailHog
   wget https://github.com/mailhog/MailHog/releases/download/v1.0.0/MailHog_linux_amd64

   # Rendre exécutable
   chmod +x MailHog_linux_amd64

   # Lancer MailHog
   ./MailHog_linux_amd64
   ```

   MailHog interceptera tous les emails et vous permettra de les visualiser sur http://localhost:8025

2. **Configurer PHP pour utiliser MailHog**

   Éditez votre `php.ini` :

   ```ini
   sendmail_path = /usr/sbin/sendmail -t -i
   ```

#### Sur un serveur de production :

Vous devrez configurer un serveur SMTP. Consultez la documentation de votre hébergeur.

### Option 2 : Utiliser PHPMailer (Recommandé pour la production)

Si vous préférez utiliser un service SMTP externe (Gmail, SendGrid, etc.), modifiez `EmailService.php` :

1. **Installer PHPMailer** :

   ```bash
   composer require phpmailer/phpmailer
   ```

2. **Modifier EmailService.php** pour utiliser PHPMailer au lieu de mail()

## Configuration de l'URL de base

Dans `srcs/server/utils/EmailService.php`, modifiez la propriété `$baseUrl` pour correspondre à votre environnement :

```php
$this->baseUrl = 'http://localhost:8080'; // Développement
// ou
$this->baseUrl = 'https://your-domain.com'; // Production
```

## Emails envoyés

### Email de vérification

- **Sujet** : "Verify your email address - Camagru"
- **Contenu** : Lien de vérification unique valable 24h
- **Route** : `GET /api/auth/verify-email?token={token}`

### Email de réinitialisation de mot de passe

- **Sujet** : "Reset your password - Camagru"
- **Contenu** : Lien de réinitialisation unique valable 1h
- **Route** : Redirige vers `/?reset-token={token}`

## Test de l'envoi d'emails

### Avec MailHog (recommandé pour le développement)

1. Lancez MailHog
2. Créez un compte sur votre application
3. Consultez http://localhost:8025 pour voir l'email
4. Cliquez sur le lien de vérification

### Sans serveur mail (pour tester la logique)

Les emails ne seront pas envoyés, mais vous pouvez :

1. Regarder les logs PHP pour voir le contenu des emails
2. Utiliser les tokens directement depuis la base de données pour tester

## Dépannage

### Les emails ne sont pas envoyés

- Vérifiez que PHP peut envoyer des emails : `php -r "mail('test@example.com', 'Test', 'Test message');"`
- Vérifiez les logs PHP pour les erreurs
- Assurez-vous que MailHog ou un serveur SMTP est en cours d'exécution

### Les liens dans les emails ne fonctionnent pas

- Vérifiez que `$baseUrl` dans `EmailService.php` correspond à votre URL
- Vérifiez que les routes sont bien configurées dans `api.php`

## Sécurité

- Les tokens de vérification sont générés avec `random_bytes(32)` (cryptographiquement sécurisés)
- Les tokens de réinitialisation expirent après 1 heure
- Un utilisateur ne peut pas se connecter tant que son email n'est pas vérifié (optionnel, peut être modifié dans `UserController::login()`)
