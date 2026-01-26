<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Auth.php';
require_once __DIR__ . '/EmailController.php';

class AuthController {
    private $userModel;
    private $emailController;

    public function __construct() {
        $this->userModel = new User();
        $this->emailController = new EmailController();
    }

    public function register() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$this->validateRegisterData($data)) {
                http_response_code(400);
                return json_encode(['error' => 'Invalid data provided']);
            }

            // Vérifier si l'utilisateur existe déjà
            if ($this->userModel->findByEmail($data['email'])) {
                http_response_code(409);
                return json_encode(['error' => 'Email already exists']);
            }

            if ($this->userModel->findByUsername($data['username'])) {
                http_response_code(409);
                return json_encode(['error' => 'Username already exists']);
            }

            // Créer l'utilisateur
            $result = $this->userModel->create(
                $data['username'],
                $data['email'],
                $data['password']
            );

            // Envoyer l'email de vérification
            $this->emailController->sendVerificationEmail(
                $data['email'],
                $data['username'],
                $result['verification_token']
            );

            return json_encode([
                'message' => 'User registered successfully. Please check your email to verify your account.',
                'user_id' => $result['id']
            ]);

        } catch (Exception $e) {
            error_log("Registration error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Registration failed']);
        }
    }

    public function login() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['email']) || !isset($data['password'])) {
                http_response_code(400);
                return json_encode(['error' => 'Email and password are required']);
            }

            $user = $this->userModel->login($data['email'], $data['password']);

            if (!$user) {
                http_response_code(401);
                return json_encode(['error' => 'Invalid credentials']);
            }

            $token = Auth::generateToken($user['id'], $user['username']);

            return json_encode([
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email']
                ]
            ]);

        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            http_response_code(401);
            return json_encode(['error' => $e->getMessage()]);
        }
    }

    public function verifyEmail() {
        try {
            $token = $_GET['token'] ?? null;

            if (!$token) {
                http_response_code(400);
                return json_encode(['error' => 'Verification token is required']);
            }

            if ($this->userModel->verifyEmail($token)) {
                return json_encode(['message' => 'Email verified successfully']);
            } else {
                http_response_code(400);
                return json_encode(['error' => 'Invalid or expired verification token']);
            }

        } catch (Exception $e) {
            error_log("Email verification error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Email verification failed']);
        }
    }

    public function forgotPassword() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['email'])) {
                http_response_code(400);
                return json_encode(['error' => 'Email is required']);
            }

            $user = $this->userModel->findByEmail($data['email']);

            if ($user) {
                $resetToken = Auth::generateResetToken();
                $this->userModel->setResetToken($data['email'], $resetToken);
                
                $this->emailController->sendPasswordResetEmail(
                    $data['email'],
                    $user['username'],
                    $resetToken
                );
            }

            // Toujours renvoyer le même message pour des raisons de sécurité
            return json_encode([
                'message' => 'If the email exists, a password reset link has been sent'
            ]);

        } catch (Exception $e) {
            error_log("Forgot password error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Password reset request failed']);
        }
    }

    public function resetPassword() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['token']) || !isset($data['password'])) {
                http_response_code(400);
                return json_encode(['error' => 'Token and password are required']);
            }

            $user = $this->userModel->findByResetToken($data['token']);

            if (!$user) {
                http_response_code(400);
                return json_encode(['error' => 'Invalid or expired reset token']);
            }

            $this->userModel->updatePassword($user['id'], $data['password']);

            return json_encode(['message' => 'Password reset successfully']);

        } catch (Exception $e) {
            error_log("Reset password error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Password reset failed']);
        }
    }

    public function getProfile() {
        try {
            $user = Auth::requireAuth();
            $userData = $this->userModel->findById($user['user_id']);

            if (!$userData) {
                http_response_code(404);
                return json_encode(['error' => 'User not found']);
            }

            // Ne pas renvoyer le mot de passe
            unset($userData['password'], $userData['verification_token'], $userData['reset_token']);

            return json_encode(['user' => $userData]);

        } catch (Exception $e) {
            error_log("Get profile error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get profile']);
        }
    }

    public function updateProfile() {
        try {
            $user = Auth::requireAuth();
            $data = json_decode(file_get_contents('php://input'), true);

            if ($this->userModel->updateProfile($user['user_id'], $data)) {
                return json_encode(['message' => 'Profile updated successfully']);
            } else {
                http_response_code(400);
                return json_encode(['error' => 'No valid fields to update']);
            }

        } catch (Exception $e) {
            error_log("Update profile error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Profile update failed']);
        }
    }

    private function validateRegisterData($data) {
        if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
            return false;
        }

        // Validation basique
        if (strlen($data['username']) < 3 || strlen($data['username']) > 50) {
            return false;
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        if (strlen($data['password']) < 8) {
            return false;
        }

        return true;
    }
}