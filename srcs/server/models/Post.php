<?php

class Post {
    private $conn;
    private $table_name = "posts";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Retrieve all posts with pagination and like status
    public function getAllPosts($limit = 10, $offset = 0, $userId = null) {
        $query = "SELECT 
                    p.id,
                    p.image_path,
                    p.caption,
                    p.created_at,
                    p.user_id,
                    u.username as alias,
                    u.email,
                    COUNT(l.id) as likes_count";
        
        // Check if the user is provided to include is_liked
        if ($userId) {
            $query .= ", CASE WHEN ul.user_id IS NOT NULL THEN 1 ELSE 0 END as is_liked";
        }
        
        $query .= " FROM " . $this->table_name . " p
                  LEFT JOIN users u ON p.user_id = u.id
                  LEFT JOIN likes l ON p.id = l.post_id";
        
        // Add a join to check if the logged-in user has liked
        if ($userId) {
            $query .= " LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ?";
        }
        
        $query .= " GROUP BY p.id, u.id";
        
        if ($userId) {
            $query .= ", ul.user_id";
        }
        
        $query .= " ORDER BY p.created_at DESC
                  LIMIT ? OFFSET ?";
        
        $stmt = $this->conn->prepare($query);
        
        if ($userId) {
            $stmt->execute([$userId, $limit, $offset]);
        } else {
            $stmt->execute([$limit, $offset]);
        }
        
        return $stmt->fetchAll();
    }

    // Retrieve a post by ID
    public function getById($id) {
        $query = "SELECT 
                    p.id,
                    p.image_path,
                    p.caption,
                    p.created_at,
                    p.user_id,
                    u.username as alias,
                    u.email
                  FROM " . $this->table_name . " p
                  LEFT JOIN users u ON p.user_id = u.id
                  WHERE p.id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    // Create a new post
    public function create($userId, $imagePath, $caption = '') {
        $query = "INSERT INTO " . $this->table_name . " 
                  (user_id, image_path, caption, created_at) 
                  VALUES (?, ?, ?, NOW())";
        
        $stmt = $this->conn->prepare($query);
        if($stmt->execute([$userId, $imagePath, $caption])) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Count total posts
    public function getTotalCount() {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch();
        return $result['total'];
    }
}