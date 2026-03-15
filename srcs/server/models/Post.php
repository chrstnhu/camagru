<?php

class Post {
    private $conn;
    private $table_name = "posts";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Retrieve all posts with pagination and like status
    public function getAllPosts($limit = 10, $offset = 0, $userId = null, $authorId = null) {
        $query = "SELECT 
                    p.id,
                    p.image_path,
                    p.image_data,
                    p.caption,
                    p.created_at,
                    p.user_id,
                    u.username as alias,
                    u.email,
                    MAX(i.id) as image_id,
                    COUNT(DISTINCT l.id) as likes_count,
                    (
                        SELECT COUNT(*)
                        FROM comments c
                        WHERE c.post_id = p.id
                    ) as comments_count";
        
        // Check if the user is provided to include is_liked
        if ($userId) {
            $query .= ", CASE WHEN ul.user_id IS NOT NULL THEN 1 ELSE 0 END as is_liked";
        }
        
        $query .= " FROM " . $this->table_name . " p
                  LEFT JOIN users u ON p.user_id = u.id
                  LEFT JOIN images i ON i.post_id = p.id
                  LEFT JOIN likes l ON p.id = l.post_id";
        
        // Add a join to check if the logged-in user has liked
        if ($userId) {
            $query .= " LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ?";
        }
        
        $conditions = [];
        $params = [];

        if ($authorId !== null) {
            $conditions[] = "p.user_id = ?";
            $params[] = $authorId;
        }

        if (!empty($conditions)) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }

        $query .= " GROUP BY p.id, u.id";
        
        if ($userId) {
            $query .= ", ul.user_id";
        }
        
        $query .= " ORDER BY p.created_at DESC
                  LIMIT ? OFFSET ?";
        
        $stmt = $this->conn->prepare($query);
        
        if ($userId) {
            array_unshift($params, $userId);
        }

        $params[] = $limit;
        $params[] = $offset;

        if (!empty($params)) {
            $stmt->execute($params);
        } else {
            $stmt->execute();
        }
        
        return $stmt->fetchAll();
    }

    // Retrieve a post by ID
    public function getById($id) {
        $query = "SELECT 
                    p.id,
                    p.image_path,
                    p.image_data,
                    p.caption,
                    p.created_at,
                    p.user_id,
                    u.username as alias,
                                        u.email,
                                        u.notification_enabled
                  FROM " . $this->table_name . " p
                  LEFT JOIN users u ON p.user_id = u.id
                  WHERE p.id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    // Create a new post
    public function create($userId, $imagePath, $caption = '', $imageData = null) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (user_id, image_path, image_data, caption, created_at) 
                  VALUES (?, ?, ?, ?, NOW())";
        
        $stmt = $this->conn->prepare($query);
        if($stmt->execute([$userId, $imagePath, $imageData, $caption])) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Count total posts
    public function getTotalCount($authorId = null) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name;
        $params = [];

        if ($authorId !== null) {
            $query .= " WHERE user_id = ?";
            $params[] = $authorId;
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return $result['total'];
    }
}