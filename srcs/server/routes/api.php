<?php
// Define routes for the CAMAGRU RESTful API

// Configure CORS and JSON headers
header('Content-Type: application/json');
if (!empty($_SERVER['HTTP_ORIGIN'])) {
    $allowedOrigin = $_ENV['FRONTEND_ORIGIN'] ?? 'https://localhost:8080';
    if ($_SERVER['HTTP_ORIGIN'] === $allowedOrigin) {
        header('Access-Control-Allow-Origin: ' . $allowedOrigin);
        header('Vary: Origin');
    }
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');

// Manage OPTIONS requests (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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

// Simple Router
class Router {
    private $routes = [];
    
    // Add a route with method, path, controller, and action
    public function addRoute($method, $path, $controller, $action) {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'controller' => $controller,
            'action' => $action
        ];
    }
    
    // Handle the incoming request
    public function handle() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        error_log("Router Debug - Method: $method, Path: $path");
        
        foreach ($this->routes as $route) {
            error_log("Router Debug - Checking route: {$route['method']} {$route['path']}");
            if ($this->matchRoute($route, $method, $path)) {
                error_log("Router Debug - MATCH FOUND! Calling {$route['controller']}::{$route['action']}");
                $controller = new $route['controller']();
                $action = $route['action'];
                $controller->$action();
                return;
            }
        }
        
        // Route not found
        error_log("Router Debug - NO MATCH FOUND for $method $path");
        http_response_code(404);
        echo json_encode([
            'error' => 'Route not found',
            'method' => $method,
            'path' => $path
        ]);
    }

    // Match route with support for wildcards
    private function matchRoute($route, $method, $path) {
        if ($route['method'] !== $method) {
            return false;
        }
        
        $routePath = $route['path'];
        
        // If route contains wildcard '*', match accordingly
        if (strpos($routePath, '*') !== false) {
            $pattern = str_replace('*', '[^/]+', $routePath);
            $pattern = '#^' . $pattern . '$#';
            // error_log("Router Debug - Wildcard pattern: $pattern for path: $path");
            $match = preg_match($pattern, $path);
            // error_log("Router Debug - Pattern match result: " . ($match ? 'TRUE' : 'FALSE'));
            return $match;
        }
        // Match exact
        $exactMatch = $routePath === $path;
        // error_log("Router Debug - Exact match: " . ($exactMatch ? 'TRUE' : 'FALSE'));
        return $exactMatch;
    }
}

// Configuration of routes
$router = new Router();

// Authentication routes
$router->addRoute('POST', '/api/auth/login', 'UserController', 'login');
$router->addRoute('POST', '/api/auth/register', 'UserController', 'register');
$router->addRoute('POST', '/api/auth/logout', 'UserController', 'logout');
$router->addRoute('GET', '/api/user/status', 'UserController', 'getStatus');
$router->addRoute('GET', '/verify.php', 'UserController', 'verifyEmail');
$router->addRoute('POST', '/api/auth/forgot-password', 'UserController', 'forgotPassword');
$router->addRoute('POST', '/api/auth/reset-password', 'UserController', 'resetPassword');
$router->addRoute('GET', '/reset-password.php', 'UserController', 'showResetPasswordPage');

// User routes
$router->addRoute('POST', '/api/user/avatar', 'UserController', 'uploadAvatar');
$router->addRoute('GET', '/api/avatar/*', 'UserController', 'getAvatar');
$router->addRoute('GET', '/api/user/*/avatar', 'UserController', 'getAvatar');
$router->addRoute('PUT', '/api/user/profile', 'UserController', 'updateProfile');
$router->addRoute('POST', '/api/user/profile/password', 'UserController', 'changePassword');

// Post routes
$router->addRoute('GET', '/api/posts', 'PostController', 'getPosts');
$router->addRoute('POST', '/api/posts/*/like', 'PostController', 'toggleLike');
$router->addRoute('GET', '/api/posts/*/likes', 'PostController', 'getLikes');
$router->addRoute('POST', '/api/posts/*/comment', 'PostController', 'userComment');
$router->addRoute('GET', '/api/posts/*/comments', 'PostController', 'getComments');
$router->addRoute('DELETE', '/api/posts/*/comments/*', 'PostController', 'deleteComment');

// Image routes
$router->addRoute('POST', '/api/images', 'ImageController', 'saveImage');
$router->addRoute('GET', '/api/images/user/*', 'ImageController', 'getUserImages');
$router->addRoute('GET', '/api/user/*/images', 'ImageController', 'getUserImages');
$router->addRoute('DELETE', '/api/images/*', 'ImageController', 'deleteImage');

// Start the router
$router->handle();