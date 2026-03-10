<?php

class Router {
    private $routes = [];
    private $method;
    private $path;

    public function __construct() {
        $this->method = $_SERVER['REQUEST_METHOD'];
        $this->path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    }

    public function addRoute($method, $pattern, $callback) {
        $this->routes[] = [
            'method' => $method,
            'pattern' => $pattern,
            'callback' => $callback
        ];
    }

    public function get($pattern, $callback) {
        $this->addRoute('GET', $pattern, $callback);
    }

    public function post($pattern, $callback) {
        $this->addRoute('POST', $pattern, $callback);
    }

    public function put($pattern, $callback) {
        $this->addRoute('PUT', $pattern, $callback);
    }

    public function delete($pattern, $callback) {
        $this->addRoute('DELETE', $pattern, $callback);
    }

    public function run() {
        foreach ($this->routes as $route) {
            if ($this->method === $route['method']) {
                $pattern = '#^' . $route['pattern'] . '$#';
                if (preg_match($pattern, $this->path, $matches)) {
                    // Appeler la fonction callback
                    return call_user_func($route['callback'], $matches);
                }
            }
        }

        // Route non trouvée
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
    }

    public static function parseParams($matches = []) {
        $params = [];
        foreach ($matches as $key => $value) {
            if (is_int($key) && $key > 0) {
                $params[] = $value;
            }
        }
        return $params;
    }
}