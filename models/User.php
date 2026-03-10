<?php

require_once __DIR__ . '/database/Database.php';

class User {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function create($username, $email, $password) {
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $verificationToken = bin2hex(random_bytes(32));
        
        $sql = "INSERT INTO users (username, email, password, verification_token) VALUES (?, ?, ?, ?)";
        $this->db->query($sql, [$username, $email, $hashedPassword, $verificationToken]);
        
        return [
            'id' => $this->db->lastInsertId(),
            'verification_token' => $verificationToken
        ];
    }

    public function findByEmail($email) {
        $sql = "SELECT * FROM users WHERE email = ?";
        return $this->db->fetchOne($sql, [$email]);
    }

    public function findByUsername($username) {
        $sql = "SELECT * FROM users WHERE username = ?";
        return $this->db->fetchOne($sql, [$username]);
    }

    public function findById($id) {
        $sql = "SELECT * FROM users WHERE id = ?";
        return $this->db->fetchOne($sql, [$id]);
    }

    public function verifyEmail($token) {
        $sql = "UPDATE users SET verified = TRUE, verification_token = NULL WHERE verification_token = ?";
        $stmt = $this->db->query($sql, [$token]);
        return $stmt->rowCount() > 0;
    }

    public function login($email, $password) {
        $user = $this->findByEmail($email);
        if ($user && password_verify($password, $user['password'])) {
            if (!$user['verified']) {
                throw new Exception("Please verify your email before logging in");
            }
            return $user;
        }
        return false;
    }

    public function updatePassword($userId, $newPassword) {
        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
        $sql = "UPDATE users SET password = ?, reset_token = NULL WHERE id = ?";
        $this->db->query($sql, [$hashedPassword, $userId]);
    }

    public function setResetToken($email, $token) {
        $sql = "UPDATE users SET reset_token = ? WHERE email = ?";
        $this->db->query($sql, [$token, $email]);
    }

    public function findByResetToken($token) {
        $sql = "SELECT * FROM users WHERE reset_token = ?";
        return $this->db->fetchOne($sql, [$token]);
    }

    public function updateProfile($userId, $data) {
        $fields = [];
        $values = [];
        
        if (isset($data['username'])) {
            $fields[] = "username = ?";
            $values[] = $data['username'];
        }
        
        if (isset($data['email'])) {
            $fields[] = "email = ?";
            $values[] = $data['email'];
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $userId;
        $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = ?";
        $this->db->query($sql, $values);
        return true;
    }

    public function getAllUsers($limit = 20, $offset = 0) {
        $sql = "SELECT id, username, email, verified, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?";
        return $this->db->fetchAll($sql, [$limit, $offset]);
    }
}