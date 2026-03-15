<?php
// Base Controller: Contains common methods shared by all controllers

class BaseController {
    // Check authentication and stop execution if not logged in
    protected function checkUserAuth($action = 'perform this action') {
        if (!isset($_SESSION['user_id'])) {
            $this->sendError(401, 'You must be logged in to ' . $action);
        }
    }
    
    // Send error response and stop execution
    protected function sendError($code, $message) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
        exit();
    }
    
    // Send success response
    protected function sendSuccess($message, $data = []) {
        echo json_encode(array_merge([
            'success' => true,
            'message' => $message
        ], $data));
        exit();
    }
    
    // Get JSON input from request body
    protected function getJsonInput() {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    protected function getCsrfToken() {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }

        return $_SESSION['csrf_token'];
    }

    protected function requireCsrfProtection() {
        $headerToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        $sessionToken = $this->getCsrfToken();

        if (!$headerToken || !hash_equals($sessionToken, $headerToken)) {
            $this->sendError(403, 'Invalid CSRF token');
        }
    }
}
