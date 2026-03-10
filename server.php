<?php

// Configuration et autoloading
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Charger les variables d'environnement
if (file_exists('/app/server/.env')) {
    $lines = file('/app/server/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Headers CORS et sécurité
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Autoloader simple
spl_autoload_register(function ($class) {
    $paths = [
        __DIR__ . '/models/' . $class . '.php',
        __DIR__ . '/controllers/' . $class . '.php',
        __DIR__ . '/database/' . $class . '.php',
        __DIR__ . '/utils/' . $class . '.php'
    ];
    
    foreach ($paths as $path) {
        if (file_exists($path)) {
            require_once $path;
            return;
        }
    }
});

// Inclure le routeur et les routes
require_once __DIR__ . '/routes/Router.php';
require_once __DIR__ . '/routes/authRoutes.php';
require_once __DIR__ . '/routes/postRoutes.php';
require_once __DIR__ . '/routes/likeRoutes.php';
require_once __DIR__ . '/routes/commentRoutes.php';
require_once __DIR__ . '/routes/cameraRoutes.php';

try {
    // Créer le routeur
    $router = new Router();

    // Configurer les routes
    setupAuthRoutes($router);
    setupPostRoutes($router);
    setupLikeRoutes($router);
    setupCommentRoutes($router);
    setupCameraRoutes($router);

    // Route de test
    $router->get('/api/health', function() {
        echo json_encode([
            'status' => 'healthy',
            'message' => 'Camagru API is running',
            'timestamp' => date('Y-m-d H:i:s'),
            'version' => '1.0.0'
        ]);
    });

    // Route pour servir les images uploadées
    $router->get('/uploads/(.*)', function($matches) {
        $filename = $matches[1];
        $filepath = '/app/server/uploads/' . $filename;
        
        if (file_exists($filepath)) {
            $mimeType = mime_content_type($filepath);
            header('Content-Type: ' . $mimeType);
            header('Content-Length: ' . filesize($filepath));
            readfile($filepath);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'File not found']);
        }
    });

    // Route par défaut
    $router->get('/', function() {
        echo json_encode([
            'message' => 'Welcome to Camagru API',
            'version' => '1.0.0',
            'endpoints' => [
                'POST /api/auth/register' => 'Register a new user',
                'POST /api/auth/login' => 'Login user',
                'GET /api/auth/verify' => 'Verify email',
                'GET /api/auth/profile' => 'Get user profile',
                'GET /api/posts' => 'Get all posts',
                'POST /api/posts' => 'Create a new post',
                'GET /api/posts/{id}' => 'Get a specific post',
                'POST /api/likes/toggle' => 'Toggle like on a post',
                'POST /api/comments' => 'Create a comment',
                'GET /api/health' => 'Health check'
            ]
        ]);
    });

    // Exécuter le routeur
    $router->run();

} catch (Exception $e) {
    error_log("Server error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => 'Please try again later'
    ]);
}
