<?php

// Configuration globale de l'application Camagru

class Config {
    // Base de données
    public static $db = [
        'host' => 'database',
        'port' => '3306',
        'name' => 'camagru',
        'user' => 'camagru_user',
        'password' => 'camagru_password',
        'charset' => 'utf8mb4'
    ];

    // Sécurité
    public static $security = [
        'jwt_secret' => 'your_jwt_secret_key_change_this_in_production',
        'jwt_expiry' => 86400, // 24 heures
        'bcrypt_cost' => 12,
        'token_length' => 64
    ];

    // Upload
    public static $upload = [
        'max_size' => 5 * 1024 * 1024, // 5MB
        'allowed_types' => ['image/jpeg', 'image/png', 'image/gif'],
        'allowed_extensions' => ['jpg', 'jpeg', 'png', 'gif'],
        'upload_dir' => '/app/server/uploads/',
        'max_width' => 1200,
        'max_height' => 1200
    ];

    // Email
    public static $email = [
        'smtp_host' => 'smtp.gmail.com',
        'smtp_port' => 587,
        'smtp_username' => '',
        'smtp_password' => '',
        'from_name' => 'Camagru',
        'enabled' => false // Désactivé par défaut pour le développement
    ];

    // Application
    public static $app = [
        'name' => 'Camagru',
        'version' => '1.0.0',
        'env' => 'development',
        'base_url' => 'http://localhost:9001',
        'client_url' => 'http://localhost:8080',
        'debug' => true
    ];

    // Pagination
    public static $pagination = [
        'default_limit' => 20,
        'max_limit' => 50
    ];

    // Rate limiting (à implémenter)
    public static $rate_limit = [
        'enabled' => false,
        'requests_per_minute' => 60,
        'requests_per_hour' => 1000
    ];

    public static function get($key, $default = null) {
        $keys = explode('.', $key);
        $config = self::${$keys[0]} ?? null;
        
        if ($config === null) {
            return $default;
        }

        for ($i = 1; $i < count($keys); $i++) {
            $config = $config[$keys[$i]] ?? null;
            if ($config === null) {
                return $default;
            }
        }

        return $config;
    }

    public static function loadFromEnv() {
        // Charger depuis les variables d'environnement si disponibles
        if (isset($_ENV['DB_HOST'])) {
            self::$db['host'] = $_ENV['DB_HOST'];
        }
        if (isset($_ENV['DB_NAME'])) {
            self::$db['name'] = $_ENV['DB_NAME'];
        }
        if (isset($_ENV['DB_USER'])) {
            self::$db['user'] = $_ENV['DB_USER'];
        }
        if (isset($_ENV['DB_PASSWORD'])) {
            self::$db['password'] = $_ENV['DB_PASSWORD'];
        }
        if (isset($_ENV['JWT_SECRET'])) {
            self::$security['jwt_secret'] = $_ENV['JWT_SECRET'];
        }
        if (isset($_ENV['CLIENT_URL'])) {
            self::$app['client_url'] = $_ENV['CLIENT_URL'];
        }
        if (isset($_ENV['SMTP_HOST'])) {
            self::$email['smtp_host'] = $_ENV['SMTP_HOST'];
            self::$email['smtp_username'] = $_ENV['SMTP_USERNAME'] ?? '';
            self::$email['smtp_password'] = $_ENV['SMTP_PASSWORD'] ?? '';
            self::$email['enabled'] = !empty($_ENV['SMTP_USERNAME']);
        }
    }
}