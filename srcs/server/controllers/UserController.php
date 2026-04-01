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
            'user' => null,
            'csrf_token' => $this->getCsrfToken()
        ];
        
        if (isset($_SESSION['user_id'])) {
            $currentUser = $this->user->getById($_SESSION['user_id']);
            $avatarPath = null;
            if ($currentUser && array_key_exists('avatar_path', $currentUser) && $currentUser['avatar_path']) {
                $avatarPath = $currentUser['avatar_path'];
            } else if ($currentUser && array_key_exists('username', $currentUser) && $currentUser['username']) {
                $avatarPath = '/api/avatar/' . urlencode($currentUser['username']);
            }
            $response['user'] = [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'] ?? null,
                'email' => $_SESSION['email'] ?? null,
                'notification_enabled' => $currentUser['notification_enabled'] ?? 1,
                'avatar_path' => $avatarPath
            ];
        }
        
        echo json_encode($response);
        exit;
    }

    // POST /api/auth/login
    public function login() {
        $this->requireCsrfProtection();
        $input = $this->getJsonInput();
        
        if (!isset($input['email']) || !isset($input['password'])) {
            $this->sendError(400, 'Email and password required');
        }

        if (!$this->isValidEmail($input['email'])) {
            $this->sendError(400, 'Invalid email format');
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

            session_regenerate_id(true);
            
            // Save user info in session
            $_SESSION['user_id'] = $userLogin['id'];
            $_SESSION['username'] = $userLogin['username'];
            $_SESSION['email'] = $userLogin['email'];
            
            $this->sendSuccess('Login successful', [
                'user' => [
                    'id' => $userLogin['id'],
                    'username' => $userLogin['username'],
                    'email' => $userLogin['email'],
                    'email_verified' => $userLogin['email_verified'],
                    'notification_enabled' => $userLogin['notification_enabled']
                ]
            ]);
        } else {
            error_log("Login failed: wrong password for - " . $input['email']);
            $this->sendError(401, 'Invalid email or password');
        }
    }

    // POST /api/auth/register
    public function register() {
        $this->requireCsrfProtection();
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

        if (!$this->isValidEmail($input['email'])) {
            $this->sendError(400, 'Invalid email format');
        }

        // Validation of username
        if (!preg_match('/^[a-zA-Z0-9_-]{3,20}$/', $input['username'])) {
            $this->sendError(400, 'Username must be 3-20 characters and contain only letters, numbers, underscores or hyphens');
        }
        
        if ($this->user->usernameExists($input['username'])) {
            $this->sendError(409, 'Username already taken');
        }

        // Validation of password
        if (!$this->isStrongPassword($input['password'])) {
            $this->sendError(400, 'Password must be at least 8 characters and contain uppercase, lowercase and a number');
        }
        
        // Create the user
        $result = $this->user->create($input['username'], $input['email'], $input['password']);
        
        if ($result) {
            // Handle avatar upload if provided
            if (isset($input['avatar_data']) && !empty($input['avatar_data'])) {
                $avatarDir = __DIR__ . '/../uploads/avatars';
                if (!is_dir($avatarDir)) {
                    mkdir($avatarDir, 0777, true);
                }
                $avatarPath = $avatarDir . '/' . $input['username'] . '.png';

                $decodedAvatar = $this->decodeAndValidateImageData($input['avatar_data'], 5 * 1024 * 1024);
                $this->saveAvatarAsPng($decodedAvatar, $avatarPath);

                $dbAvatarPath = '/api/avatar/' . $input['username'];
                $this->user->updateAvatar($result['user_id'], $dbAvatarPath);
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
        $this->requireCsrfProtection();
        $input = $this->getJsonInput();
        
        if (!isset($input['email']) || empty($input['email'])) {
            $this->sendError(400, 'Email required');
        }

        if (!$this->isValidEmail($input['email'])) {
            $this->sendError(400, 'Invalid email format');
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
        $this->requireCsrfProtection();
        $input = $this->getJsonInput();
        
        if (!isset($input['token']) || !isset($input['password'])) {
            $this->sendError(400, 'Token and new password required');
        }
        
        // Validation of password complexity
        if (!$this->isStrongPassword($input['password'])) {
            $this->sendError(400, 'Password must be at least 8 characters and contain uppercase, lowercase and a number');
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
        $this->requireCsrfProtection();

        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', $params['secure'], $params['httponly']);
        }

        session_destroy();
        $this->sendSuccess('Logged out successfully');
    }

    // POST /api/user/avatar
    public function uploadAvatar() {
        $this->checkUserAuth('upload avatar');
        $this->requireCsrfProtection();
        
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

        $decodedAvatar = $this->decodeAndValidateImageData($avatarData, 5 * 1024 * 1024);
        $this->saveAvatarAsPng($decodedAvatar, $avatarPath);

        // Update database with avatar path
        $dbAvatarPath = '/api/avatar/' . $username;
        $this->user->updateAvatar($userId, $dbAvatarPath);
        
        $this->sendSuccess('Avatar uploaded successfully', ['avatar_path' => $dbAvatarPath]);
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
        $this->requireCsrfProtection();
        
        $input = $this->getJsonInput();
        $userId = $_SESSION['user_id'];

        if (array_key_exists('notification_enabled', $input)) {
            $input['notification_enabled'] = (bool)$input['notification_enabled'];
        }
        
        // Check if at least one field is provided
        if (
            empty($input['username']) &&
            empty($input['email']) &&
            !array_key_exists('notification_enabled', $input)
        ) {
            $this->sendError(400, 'At least one field (username, email, notification preference) required');
        }
        
        // Validation of password
        if (isset($input['password']) && !empty($input['password'])) {
            if (!$this->isStrongPassword($input['password'])) {
                $this->sendError(400, 'Password must be at least 8 characters and contain uppercase, lowercase and a number');
            }
        }
        
        // Check if the new email is already taken by another user
        if (isset($input['email']) && !empty($input['email'])) {
            if (!$this->isValidEmail($input['email'])) {
                $this->sendError(400, 'Invalid email format');
            }

            $existingUser = $this->user->getByEmail($input['email']);
            if ($existingUser && $existingUser['id'] != $userId) {
                $this->sendError(409, 'Email already in use');
            }
        }
        
        // Check if the new username is already taken by another user
        if (isset($input['username']) && !empty($input['username'])) {
            if (!preg_match('/^[a-zA-Z0-9_-]{3,20}$/', $input['username'])) {
                $this->sendError(400, 'Username must be 3-20 characters and contain only letters, numbers, underscores or hyphens');
            }

            if ($this->user->usernameExists($input['username'])) {
                $currentUser = $this->user->getById($userId);
                if ($currentUser['username'] != $input['username']) {
                    $this->sendError(409, 'Username already taken');
                }
            }
        }
        
        // Update session data if username or email changed
        $oldUser = $this->user->getById($userId);
        $oldUsername = $oldUser['username'] ?? null;
        $oldAvatarPath = $oldUser['avatar_path'] ?? null;

        if ($this->user->updateProfile($userId, $input)) {
            // If username changed and user had an avatar, rename the avatar file to match the new username
            if (isset($input['username']) && $oldUsername && $input['username'] !== $oldUsername) {
                $avatarDir = __DIR__ . '/../uploads/avatars';
                $oldAvatarFile = $avatarDir . '/' . $oldUsername . '.png';
                $newAvatarFile = $avatarDir . '/' . $input['username'] . '.png';
                if (file_exists($oldAvatarFile)) {
                    // If the old avatar file exists, rename it and update the database path
                    @rename($oldAvatarFile, $newAvatarFile);
                    $dbAvatarPath = '/api/avatar/' . $input['username'];
                    $this->user->updateAvatar($userId, $dbAvatarPath);
                }
                $_SESSION['username'] = $input['username'];
            }
            if (isset($input['email'])) {
                $_SESSION['email'] = $input['email'];
            }

            $currentUser = $this->user->getById($userId);
            $avatarPath = null;
            if ($currentUser && array_key_exists('avatar_path', $currentUser) && $currentUser['avatar_path']) {
                $avatarPath = $currentUser['avatar_path'];
            } else if ($currentUser && array_key_exists('username', $currentUser) && $currentUser['username']) {
                $avatarPath = '/api/avatar/' . urlencode($currentUser['username']);
            }

            $this->sendSuccess('Profile updated successfully', [
                'user' => [
                    'id' => $userId,
                    'username' => $currentUser['username'],
                    'email' => $currentUser['email'],
                    'notification_enabled' => (bool) ($currentUser['notification_enabled'] ?? 1),
                    'avatar_path' => $avatarPath
                ]
            ]);
        } else {
            $this->sendError(500, 'Failed to update profile');
        }
    }

    // POST /api/user/profile/password
    public function changePassword() {
        $this->checkUserAuth('change password');
        $this->requireCsrfProtection();
        
        $input = $this->getJsonInput();
        $userId = $_SESSION['user_id'];
        
        if (empty($input['current_password']) || empty($input['new_password'])) {
            $this->sendError(400, 'Current password and new password are required');
        }
        
        // Retrieve current password hash from database
        $query = "SELECT password FROM users WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch();

        if (!$user) {
            $this->sendError(404, 'User not found');
        }

        if (!password_verify($input['current_password'], $user['password'])) {
            $this->sendError(401, 'Current password is incorrect');
        }

        if (!$this->isStrongPassword($input['new_password'])) {
            $this->sendError(400, 'New password must be at least 8 characters and contain uppercase, lowercase and a number');
        }

        // Update password in database
        $newHash = password_hash($input['new_password'], PASSWORD_DEFAULT);
        $updateQuery = "UPDATE users SET password = :password, updated_at = NOW() WHERE id = :id";
        $updateStmt = $this->db->prepare($updateQuery);

        if ($updateStmt->execute([':password' => $newHash, ':id' => $userId])) {
            $this->sendSuccess('Password updated successfully');
        } else {
            $this->sendError(500, 'Failed to update password');
        }
    }

    // Validation email format
    private function isValidEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    // Validation of password complexity
    private function isStrongPassword($password) {
        return is_string($password)
            && strlen($password) >= 8
            && preg_match('/[A-Z]/', $password)
            && preg_match('/[a-z]/', $password)
            && preg_match('/[0-9]/', $password);
    }

    // Check if user is authenticated and has the required permission
    private function decodeAndValidateImageData($imageData, $maxBytes) {
        if (!is_string($imageData) || !preg_match('/^data:(image\/(png|jpeg));base64,/', $imageData)) {
            $this->sendError(400, 'Invalid image format');
        }

        $encoded = substr($imageData, strpos($imageData, ',') + 1);
        $binary = base64_decode($encoded, true);

        if ($binary === false) {
            $this->sendError(400, 'Invalid image data');
        }

        if (strlen($binary) > $maxBytes) {
            $this->sendError(400, 'Image size exceeds the allowed limit');
        }

        $imageInfo = @getimagesizefromstring($binary);
        if ($imageInfo === false || !in_array($imageInfo['mime'], ['image/png', 'image/jpeg'], true)) {
            $this->sendError(400, 'Unsupported image type');
        }

        return $binary;
    }

    // Save the uploaded avatar as a PNG file
    private function saveAvatarAsPng($binary, $targetPath) {
        $image = @imagecreatefromstring($binary);
        if ($image === false) {
            $this->sendError(400, 'Invalid image content');
        }

        if (!imagepng($image, $targetPath)) {
            imagedestroy($image);
            $this->sendError(500, 'Failed to save avatar');
        }

        imagedestroy($image);
    }
}