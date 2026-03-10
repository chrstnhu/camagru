<?php
// Server Entry Point: Handle all incoming requests and route them to the appropriate controllers

// Session configuration for 1 hour lifetime
ini_set('session.gc_maxlifetime', 3600); 
session_set_cookie_params(3600);
session_start();

// CORS headers - allow requests from any origin (adjust in production)
header('Access-Control-Allow-Origin: *');  // Allow all request (change to specific domain in production)
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');  // Allow these HTTP methods
header('Access-Control-Allow-Headers: Content-Type');  // Allow Content-Type header for JSON requests

// Handle preflight OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0); 
}

// Retrieve the request URI
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Route requests to API or return 404 for non-API routes
if (strpos($uri, '/api/') === 0 || $uri === '/verify.php' || $uri === '/reset-password.php') {
    require_once __DIR__ . '/routes/api.php';
} else {
    header('Content-Type: application/json');
    http_response_code(404);
    echo json_encode(['error' => 'Route not found', 'uri' => $uri]);
}

?>