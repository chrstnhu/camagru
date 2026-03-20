<?php

class User {
    private $conn;
    private $table_name = "users";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create a new user
    public function create($username, $email, $password) {
        // Generate a unique verification token for email verification
        $verification_token = bin2hex(random_bytes(32));

        // Use named parameters for security and clarity
        $query = "INSERT INTO " . $this->table_name . " 
                  (username, email, password, verification_token, email_verified, notification_enabled, created_at) 
                  VALUES (:username, :email, :password, :verification_token, 0, 1, NOW())";

        $stmt = $this->conn->prepare($query);
        $password_hash = password_hash($password, PASSWORD_DEFAULT);

        if($stmt->execute([
            ':username' => $username,
            ':email' => $email,
            ':password' => $password_hash,
            ':verification_token' => $verification_token
        ])) {
            return [
                'user_id' => $this->conn->lastInsertId(),
                'username' => $username,
                'email' => $email,
                'verification_token' => $verification_token
            ];
        }
        return false;
    }

    // Verify email using the verification code
    public function verifyEmail($code) {
        // Use named parameter for security and clarity
        $query = "UPDATE " . $this->table_name . "
                  SET email_verified = 1, verification_token = NULL, updated_at = NOW()
                  WHERE verification_token = :verification_token";
        $stmt = $this->conn->prepare($query);
        $result = $stmt->execute([':verification_token' => $code]);

        if ($result && $stmt->rowCount() > 0) {
            error_log("Email verification successful for code: " . substr($code, 0, 10) . "...");
            return true;
        }

        error_log("Email verification failed - code not found: " . substr($code, 0, 10) . "...");
        return false;
    }

    // Verify login credentials
    public function login($email, $password) {
        // Use named parameter for security and clarity
        $query = "SELECT id, username, email, password, email_verified, notification_enabled 
                  FROM " . $this->table_name . " 
                  WHERE email = :email";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([':email' => $email]);

        if($stmt->rowCount() == 1) {
            $row = $stmt->fetch();
            if(password_verify($password, $row['password'])) {
                unset($row['password']); // Do not return the hash
                return $row;
            }
            // Incorrect password
            error_log("Login failed: Invalid password for email: " . $email);
            return false;
        }
        error_log("Login failed: Email not found: " . $email);
        return false;
    }

    // Check if email exists
    public function emailExists($email) {
        // Use named parameter for security and clarity
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([':email' => $email]);
        return $stmt->rowCount() > 0;
    }

    // Check if username exists
    public function usernameExists($username) {
        // Use named parameter for security and clarity
        $query = "SELECT id FROM " . $this->table_name . " WHERE username = :username";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([':username' => $username]);
        return $stmt->rowCount() > 0;
    }

    // Get a user by ID
    public function getById($id) {
        // Use named parameter for security and clarity
        $query = "SELECT id, username, email, email_verified, notification_enabled, created_at 
                  FROM " . $this->table_name . " 
                  WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }
    
    // Update user avatar path
    public function updateAvatar($userId, $avatarPath) {
        // Use named parameters for security and clarity
        $query = "UPDATE " . $this->table_name . " 
                  SET avatar_path = :avatar_path, updated_at = NOW() 
                  WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([':avatar_path' => $avatarPath, ':id' => $userId]);
    }
    
    // Get user avatar path
    public function getAvatarPath($userId) {
        // Use named parameter for security and clarity
        $query = "SELECT avatar_path FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([':id' => $userId]);
        $result = $stmt->fetch();
        return $result ? $result['avatar_path'] : null;
    }
    
    // Update user profile
    public function updateProfile($userId, $data) {
        // Use named parameters for security and clarity
        $updates = [];
        $params = [];

        if(isset($data['username']) && !empty($data['username'])) {
            $updates[] = "username = :username";
            $params[':username'] = $data['username'];
        }

        if(isset($data['email']) && !empty($data['email'])) {
            $updates[] = "email = :email";
            $params[':email'] = $data['email'];
        }

        if(isset($data['password']) && !empty($data['password'])) {
            $updates[] = "password = :password";
            $params[':password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        if (array_key_exists('notification_enabled', $data)) {
            $updates[] = "notification_enabled = :notification_enabled";
            $params[':notification_enabled'] = $data['notification_enabled'] ? 1 : 0;
        }

        if(empty($updates)) {
            return false;
        }

        $updates[] = "updated_at = NOW()";
        $params[':id'] = $userId;

        $query = "UPDATE " . $this->table_name . " 
                  SET " . implode(', ', $updates) . " 
                  WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($params);
    }
    
    // Get user by email
    public function getByEmail($email) {
        // Use named parameter for security and clarity
        $query = "SELECT id, username, email, email_verified, notification_enabled FROM " . $this->table_name . " 
                  WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([':email' => $email]);
        return $stmt->fetch();
    }
    
    // Create password reset token
    public function createPasswordResetToken($email) {
        // Use named parameters for security and clarity
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));

        $query = "UPDATE " . $this->table_name . " 
                  SET reset_token = :reset_token, reset_token_expires = :reset_token_expires, updated_at = NOW() 
                  WHERE email = :email";
        $stmt = $this->conn->prepare($query);

        if ($stmt->execute([
            ':reset_token' => $token,
            ':reset_token_expires' => $expires,
            ':email' => $email
        ])) {
            return $token;
        }
        return false;
    }
    
    // Verify reset token
    public function verifyResetToken($token) {
        // Use named parameter for security and clarity
        $query = "SELECT id, email, username FROM " . $this->table_name . " 
                  WHERE reset_token = :reset_token AND reset_token_expires > NOW()";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([':reset_token' => $token]);
        return $stmt->fetch();
    }
    
    // Reset password with token
    public function resetPassword($token, $newPassword) {
        $user = $this->verifyResetToken($token);
        if (!$user) {
            return false;
        }

        // Use named parameters for security and clarity
        $password_hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $query = "UPDATE " . $this->table_name . " 
                  SET password = :password, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() 
                  WHERE reset_token = :reset_token";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([
            ':password' => $password_hash,
            ':reset_token' => $token
        ]);
    }
}