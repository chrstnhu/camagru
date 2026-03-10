<?php

// User Controller: Manage user authentication, registration, and avatar upload

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/BaseController.php';

class UserController extends BaseController {
    private $db;
    private $user;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->user = new User($this->db);
    }

    // GET /api/user/status
    public function getStatus() {
        $response = [
            'logged_in' => isset($_SESSION['user_id']),
            'user' => null
        ];
        
        if (isset($_SESSION['user_id'])) {
            $response['user'] = [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'] ?? null,
                'email' => $_SESSION['email'] ?? null
            ];
        }
        
        echo json_encode($response);
    }

    // POST /api/auth/login
    public function login() {
        $input = $this->getJsonInput();
        
        if (!isset($input['email']) || !isset($input['password'])) {
            $this->sendError(400, 'Email and password required');
        }
        
        if (!$this->user->emailExists($input['email'])) {
            error_log("Login failed: email not found - " . $input['email']);
            $this->sendError(401, 'Invalid email or password');
        }

        $userLogin = $this->user->login($input['email'], $input['password']);
        
        if ($userLogin) {
            // Check if email is verified
            if (!$userLogin['email_verified']) {
                $this->sendError(403, 'Please verify your email address before logging in. Check your inbox for the verification link.');
            }
            
            // Save user info in session
            $_SESSION['user_id'] = $userLogin['id'];
            $_SESSION['username'] = $userLogin['username'];
            $_SESSION['email'] = $userLogin['email'];
            
            $this->sendSuccess('Login successful', [
                'user' => [
                    'id' => $userLogin['id'],
                    'username' => $userLogin['username'],
                    'email' => $userLogin['email'],
                    'email_verified' => $userLogin['email_verified']
                ]
            ]);
        } else {
            error_log("Login failed: wrong password for - " . $input['email']);
            $this->sendError(401, 'Invalid email or password');
        }
    }

    // POST /api/auth/register
    public function register() {
        $input = $this->getJsonInput();
        
        // Validation
        $required = ['username', 'email', 'password'];
        foreach ($required as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                $this->sendError(400, "Field $field is required");
            }
        }
        
        if ($this->user->emailExists($input['email'])) {
            $this->sendError(409, 'Email already exists');
        }

        // Validation of username
        if (!preg_match('/^[a-zA-Z0-9_-]{3,20}$/', $input['username'])) {
            $this->sendError(400, 'Username must be 3-20 characters and contain only letters, numbers, underscores or hyphens');
        }
        
        if ($this->user->usernameExists($input['username'])) {
            $this->sendError(409, 'Username already taken');
        }

        // Validation of password
        if (strlen($input['password']) < 8) {
            $this->sendError(400, 'Password must be at least 8 characters long');
        }
        
        // Create the user
        $result = $this->user->create($input['username'], $input['email'], $input['password']);
        
        if ($result) {
            // Handle avatar upload if provided
            error_log("📸 Register - avatar_data present: " . (isset($input['avatar_data']) ? 'YES (length: ' . strlen($input['avatar_data']) . ')' : 'NO'));
            if (isset($input['avatar_data']) && !empty($input['avatar_data'])) {
                $avatarDir = __DIR__ . '/../uploads/avatars';
                error_log("📸 Avatar dir: " . $avatarDir . " - exists: " . (is_dir($avatarDir) ? 'YES' : 'NO'));
                if (!is_dir($avatarDir)) {
                    $mkdirResult = mkdir($avatarDir, 0777, true);
                    error_log("📸 mkdir result: " . ($mkdirResult ? 'OK' : 'FAILED'));
                }
                $avatarPath = $avatarDir . '/' . $input['username'] . '.png';
                $avatarData = $input['avatar_data'];
                
                // Extract base64 data and save
                if (preg_match('/^data:image\/(\w+);base64,/', $avatarData, $type)) {
                    error_log("📸 Image type detected: " . $type[1]);
                    $avatarData = substr($avatarData, strpos($avatarData, ',') + 1);
                    $decoded = base64_decode($avatarData);
                    if ($decoded !== false) {
                        $writeResult = file_put_contents($avatarPath, $decoded);
                        error_log("📸 Avatar saved to: " . $avatarPath . " - bytes: " . $writeResult);
                        $dbAvatarPath = '/api/avatar/' . $input['username'];
                        $this->user->updateAvatar($result['user_id'], $dbAvatarPath);
                        error_log("📸 DB updated with avatar path: " . $dbAvatarPath . " for user_id: " . $result['user_id']);
                    } else {
                        error_log("📸 ERROR: base64_decode failed");
                    }
                } else {
                    error_log("📸 ERROR: avatar_data does not match base64 image pattern. First 50 chars: " . substr($input['avatar_data'], 0, 50));
                }
            } else {
                // No avatar provided: copy default avatar for this user
                $avatarDir = __DIR__ . '/../uploads/avatars';
                if (!is_dir($avatarDir)) {
                    mkdir($avatarDir, 0777, true);
                }
                $defaultAvatar = __DIR__ . '/../default-avatar.png';
                $userAvatarPath = $avatarDir . '/' . $input['username'] . '.png';
                if (file_exists($defaultAvatar)) {
                    copy($defaultAvatar, $userAvatarPath);
                    $dbAvatarPath = '/api/avatar/' . $input['username'];
                    $this->user->updateAvatar($result['user_id'], $dbAvatarPath);
                }
            }

            // Send email confirmation
            $verification_link = "http://localhost:9001/verify.php?code=" . $result['verification_token'];
            
            $to = $input['email'];
            $subject = "Email Verification - Camagru";
            $message = "Hello " . $input['username'] . ",\n\n";
            $message .= "Thank you for registering on Camagru!\n\n";
            $message .= "Please click the link below to verify your email address:\n\n";
            $message .= $verification_link . "\n\n";
            $message .= "If you did not create this account, please ignore this email.\n\n";
            $message .= "Best regards,\nThe Camagru Team";
            
            $headers = "From: no-reply@camagru.com\r\n";
            $headers .= "Reply-To: no-reply@camagru.com\r\n";
            $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
            
            $mailSent = mail($to, $subject, $message, $headers);

            if ($mailSent) {
                error_log("Verification email sent to: " . $to);
            } else {
                error_log("Failed to send verification email to: " . $to);
            }
            
            http_response_code(201);
            $this->sendSuccess('Registration successful! Please check your email to verify your account.', [
                'username' => $input['username'],
                'email' => $input['email']
            ]);
        } else {
            $this->sendError(500, 'Failed to create user');
        }
    }

    public function verifyEmail() {
        $code = $_GET['code'] ?? '';
        
        // Redirect to frontend with error message
        if (empty($code)) {
            header('Location: https://localhost:8080/?verified=error&reason=no_code');
            exit;
        }
        
        // Redirect to frontend with success message
        if ($this->user->verifyEmail($code)) {
            header('Location: https://localhost:8080/?verified=success');
            exit;
        } else {
            // Redirect to frontend with error message
            header('Location: https://localhost:8080/?verified=error&reason=invalid_code');
            exit;
        }
    }
    
    // POST /api/auth/forgot-password
    public function forgotPassword() {
        $input = $this->getJsonInput();
        
        if (!isset($input['email']) || empty($input['email'])) {
            $this->sendError(400, 'Email required');
        }
        
        $user = $this->user->getByEmail($input['email']);
        
        if ($user) {
            $token = $this->user->createPasswordResetToken($input['email']);
            
            // Send reset email
            if ($token) {
                $reset_link = "http://localhost:9001/reset-password.php?token=" . $token;
                
                $to = $input['email'];
                $subject = "Reset your password - Camagru";
                $message = "Hello " . $user['username'] . ",\n\n";
                $message .= "You requested to reset your password.\n\n";
                $message .= "Click the link below to reset your password:\n\n";
                $message .= $reset_link . "\n\n";
                $message .= "This link will expire in 1 hour.\n\n";
                $message .= "If you did not request this, please ignore this email.\n\n";
                $message .= "Best regards,\nThe Camagru Team";
                
                $headers = "From: no-reply@camagru.com\r\n";
                $headers .= "Reply-To: no-reply@camagru.com\r\n";
                $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
                
                mail($to, $subject, $message, $headers);
                
                $this->sendSuccess('Password reset email sent. Please check your inbox.');
            } else {
                $this->sendError(500, 'Failed to generate reset token');
            }
        } else {
            // To prevent email enumeration, we return the same success message even if the email does not exist
            $this->sendSuccess('If that email exists, a password reset link has been sent.');
        }
    }
    
    // POST /api/auth/reset-password
    public function resetPassword() {
        $input = $this->getJsonInput();
        
        if (!isset($input['token']) || !isset($input['password'])) {
            $this->sendError(400, 'Token and new password required');
        }
        
        // Validation of password complexity
        if (strlen($input['password']) < 8) {
            $this->sendError(400, 'Password must be at least 8 characters long');
        }

        // Attempt to reset the password using the provided token
        if ($this->user->resetPassword($input['token'], $input['password'])) {
            $this->sendSuccess('Password reset successfully. You can now log in.');
        } else {
            $this->sendError(400, 'Invalid or expired reset token');
        }
    }
    
    // GET /reset-password.php?token=xxx
    public function showResetPasswordPage() {
        $token = $_GET['token'] ?? '';
        
        if (empty($token)) {
            header('Location: https://localhost:8080/?reset=error&reason=no_token');
            exit;
        }
        
        // Verify token is valid
        $user = $this->user->verifyResetToken($token);
        
        if (!$user) {
            header('Location: https://localhost:8080/?reset=error&reason=invalid_token');
            exit;
        }
        
        // Redirect to frontend with token in URL
        header('Location: https://localhost:8080/?reset=form&token=' . $token);
        exit;
    }

    // POST /api/auth/logout
    public function logout() {
        session_destroy();
        $this->sendSuccess('Logged out successfully');
    }

    // POST /api/user/avatar
    public function uploadAvatar() {
        $this->checkUserAuth('upload avatar');
        
        $input = $this->getJsonInput();
        
        if (!isset($input['avatar_data'])) {
            $this->sendError(400, 'Avatar data required');
        }
        
        $userId = $_SESSION['user_id'];
        $username = $_SESSION['username'];
        $avatarData = $input['avatar_data'];
        
        // Save avatar image
        $avatarDir = __DIR__ . '/../uploads/avatars';
        if (!is_dir($avatarDir)) {
            mkdir($avatarDir, 0777, true);
        }
        $avatarPath = $avatarDir . '/' . $username . '.png';
        
        // Extract base64 data and save
        if (preg_match('/^data:image\/(\w+);base64,/', $avatarData, $type)) {
            $allowedTypes = ['png', 'jpeg', 'jpg'];

            if (!in_array($type[1], $allowedTypes)) {
                $this->sendError(400, 'Invalid image type');
            }

            $avatarData = substr($avatarData, strpos($avatarData, ',') + 1);
            $avatarData = base64_decode($avatarData);
            
            if ($avatarData === false) {
                $this->sendError(400, 'Invalid image data');
            }
            
            if (file_put_contents($avatarPath, $avatarData) === false) {
                $this->sendError(500, 'Failed to save avatar');
            }
            
            // Update database with avatar path
            $dbAvatarPath = '/api/avatar/' . $username;
            $this->user->updateAvatar($userId, $dbAvatarPath);
            
            $this->sendSuccess('Avatar uploaded successfully', ['avatar_path' => $dbAvatarPath]);
        } else {
            $this->sendError(400, 'Invalid image format');
        }
    }
    
    // GET /api/avatar/{username}
    public function getAvatar() {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $pathParts = explode('/', $path);
        $username = $pathParts[3] ?? null;
        
        if (!$username) {
            http_response_code(400);
            echo json_encode(['error' => 'Username required']);
            return;
        }
        
        $avatarPath = __DIR__ . '/../uploads/avatars/' . $username . '.png';
        
        error_log("📸 getAvatar - username: " . $username . " - path: " . $avatarPath . " - exists: " . (file_exists($avatarPath) ? 'YES' : 'NO'));
        
        if (file_exists($avatarPath)) {
            header('Content-Type: image/png');
            header('Cache-Control: no-cache, must-revalidate');
            readfile($avatarPath);
        } else {
            $defaultAvatar = __DIR__ . '/../default-avatar.png';
            if (file_exists($defaultAvatar)) {
                header('Content-Type: image/png');
                header('Cache-Control: no-cache, must-revalidate');
                readfile($defaultAvatar);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Avatar not found']);
            }
        }
    }
    

    // PUT /api/user/profile
    public function updateProfile() {
        $this->checkUserAuth('update profile');
        
        $input = $this->getJsonInput();
        $userId = $_SESSION['user_id'];
        
        // Check if at least one field is provided
        if (empty($input['username']) && empty($input['email'])) {
            $this->sendError(400, 'At least one field (username, email) required');
        }
        
        // Validation of password
        if (isset($input['password']) && !empty($input['password'])) {
            if (strlen($input['password']) < 8) {
                $this->sendError(400, 'Password must be at least 8 characters long');
            }
        }
        
        // Check if the new email is already taken by another user
        if (isset($input['email']) && !empty($input['email'])) {
            $existingUser = $this->user->getByEmail($input['email']);
            if ($existingUser && $existingUser['id'] != $userId) {
                $this->sendError(409, 'Email already in use');
            }
        }
        
        // Check if the new username is already taken by another user
        if (isset($input['username']) && !empty($input['username'])) {
            if ($this->user->usernameExists($input['username'])) {
                $currentUser = $this->user->getById($userId);
                if ($currentUser['username'] != $input['username']) {
                    $this->sendError(409, 'Username already taken');
                }
            }
        }
        
        // Update session data if username or email changed
        if ($this->user->updateProfile($userId, $input)) {
            if (isset($input['username'])) {
                $_SESSION['username'] = $input['username'];
            }
            if (isset($input['email'])) {
                $_SESSION['email'] = $input['email'];
            }
            
            $currentUser = $this->user->getById($userId);
            
            $this->sendSuccess('Profile updated successfully', [
                'user' => [
                    'id' => $userId,
                    'username' => $currentUser['username'],
                    'email' => $currentUser['email']
                ]
            ]);
        } else {
            $this->sendError(500, 'Failed to update profile');
        }
    }

    // POST /api/user/profile/password
    public function changePassword() {
        $this->checkUserAuth('change password');
        
        $input = $this->getJsonInput();
        $userId = $_SESSION['user_id'];
        
        if (empty($input['current_password']) || empty($input['new_password'])) {
            $this->sendError(400, 'Current password and new password are required');
        }
        
        // Retrieve current password hash from database
        $query = "SELECT password FROM users WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user) {
            $this->sendError(404, 'User not found');
        }
        
        // Check if current password is correct
        if (!password_verify($input['current_password'], $user['password'])) {
            $this->sendError(401, 'Current password is incorrect');
        }
        
        // Validate new password complexity
        if (strlen($input['new_password']) < 8) {
            $this->sendError(400, 'New password must be at least 8 characters long');
        }
        
        // Update password in database
        $newHash = password_hash($input['new_password'], PASSWORD_DEFAULT);
        $updateQuery = "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?";
        $updateStmt = $this->db->prepare($updateQuery);
        
        if ($updateStmt->execute([$newHash, $userId])) {
            $this->sendSuccess('Password updated successfully');
        } else {
            $this->sendError(500, 'Failed to update password');
        }
    }
}