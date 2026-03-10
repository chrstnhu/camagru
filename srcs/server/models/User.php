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

        $query = "INSERT INTO " . $this->table_name . " 
                  (username, email, password, verification_token, email_verified, created_at) 
                  VALUES (?, ?, ?, ?, 0, NOW())";
        
        $stmt = $this->conn->prepare($query);
        $password_hash = password_hash($password, PASSWORD_DEFAULT);

        if($stmt->execute([$username, $email, $password_hash, $verification_token])) {
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
        $query = "UPDATE " . $this->table_name . "
                  SET email_verified = 1, verification_token = NULL, updated_at = NOW()
                  WHERE verification_token = ?";
        $stmt = $this->conn->prepare($query);
        $result = $stmt->execute([$code]);
        
        if ($result && $stmt->rowCount() > 0) {
            error_log("Email verification successful for code: " . substr($code, 0, 10) . "...");
            return true;
        }
        
        error_log("Email verification failed - code not found: " . substr($code, 0, 10) . "...");
        return false;
    }

    // Verify login credentials
    public function login($email, $password) {
        $query = "SELECT id, username, email, password, email_verified 
                  FROM " . $this->table_name . " 
                  WHERE email = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$email]);
        
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
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$email]);
        return $stmt->rowCount() > 0;
    }

    // Check if username exists
    public function usernameExists($username) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE username = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$username]);
        return $stmt->rowCount() > 0;
    }

    // Get a user by ID
    public function getById($id) {
        $query = "SELECT id, username, email, email_verified, created_at 
                  FROM " . $this->table_name . " 
                  WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    // Update user avatar path
    public function updateAvatar($userId, $avatarPath) {
        $query = "UPDATE " . $this->table_name . " 
                  SET avatar_path = ?, updated_at = NOW() 
                  WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$avatarPath, $userId]);
    }
    
    // Get user avatar path
    public function getAvatarPath($userId) {
        $query = "SELECT avatar_path FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        return $result ? $result['avatar_path'] : null;
    }
    
    // Update user profile
    public function updateProfile($userId, $data) {
        $updates = [];
        $params = [];
        
        if(isset($data['username']) && !empty($data['username'])) {
            $updates[] = "username = ?";
            $params[] = $data['username'];
        }
        
        if(isset($data['email']) && !empty($data['email'])) {
            $updates[] = "email = ?";
            $params[] = $data['email'];
        }
        
        if(isset($data['password']) && !empty($data['password'])) {
            $updates[] = "password = ?";
            $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        if(empty($updates)) {
            return false;
        }
        
        $updates[] = "updated_at = NOW()";
        $params[] = $userId;
        
        $query = "UPDATE " . $this->table_name . " 
                  SET " . implode(', ', $updates) . " 
                  WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($params);
    }
    
    // Get user by email
    public function getByEmail($email) {
        $query = "SELECT id, username, email, email_verified FROM " . $this->table_name . " 
                  WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$email]);
        return $stmt->fetch();
    }
    
    // Create password reset token
    public function createPasswordResetToken($email) {
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        $query = "UPDATE " . $this->table_name . " 
                  SET reset_token = ?, reset_token_expires = ?, updated_at = NOW() 
                  WHERE email = ?";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute([$token, $expires, $email])) {
            return $token;
        }
        return false;
    }
    
    // Verify reset token
    public function verifyResetToken($token) {
        $query = "SELECT id, email, username FROM " . $this->table_name . " 
                  WHERE reset_token = ? AND reset_token_expires > NOW()";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$token]);
        return $stmt->fetch();
    }
    
    // Reset password with token
    public function resetPassword($token, $newPassword) {
        $user = $this->verifyResetToken($token);
        if (!$user) {
            return false;
        }
        
        $password_hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $query = "UPDATE " . $this->table_name . " 
                  SET password = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() 
                  WHERE reset_token = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$password_hash, $token]);
    }
}