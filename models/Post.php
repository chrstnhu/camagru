<?php

require_once __DIR__ . '/../database/Database.php';

class Post {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function create($userId, $imagePath, $caption = null) {
        $sql = "INSERT INTO posts (user_id, image_path, caption) VALUES (?, ?, ?)";
        $this->db->query($sql, [$userId, $imagePath, $caption]);
        return $this->db->lastInsertId();
    }

    public function findById($id) {
        $sql = "SELECT p.*, u.username 
                FROM posts p 
                JOIN users u ON p.user_id = u.id 
                WHERE p.id = ?";
        return $this->db->fetchOne($sql, [$id]);
    }

    public function getAllPosts($limit = 20, $offset = 0) {
        $sql = "SELECT p.*, u.username, 
                       (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
                       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
                FROM posts p 
                JOIN users u ON p.user_id = u.id 
                ORDER BY p.created_at DESC 
                LIMIT ? OFFSET ?";
        return $this->db->fetchAll($sql, [$limit, $offset]);
    }

    public function getPostsByUser($userId, $limit = 20, $offset = 0) {
        $sql = "SELECT p.*, u.username,
                       (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
                       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
                FROM posts p 
                JOIN users u ON p.user_id = u.id 
                WHERE p.user_id = ?
                ORDER BY p.created_at DESC 
                LIMIT ? OFFSET ?";
        return $this->db->fetchAll($sql, [$userId, $limit, $offset]);
    }

    public function delete($postId, $userId) {
        $sql = "DELETE FROM posts WHERE id = ? AND user_id = ?";
        $stmt = $this->db->query($sql, [$postId, $userId]);
        return $stmt->rowCount() > 0;
    }

    public function updateCaption($postId, $userId, $caption) {
        $sql = "UPDATE posts SET caption = ? WHERE id = ? AND user_id = ?";
        $stmt = $this->db->query($sql, [$caption, $postId, $userId]);
        return $stmt->rowCount() > 0;
    }

    public function getPostsWithLikesAndComments($postId = null) {
        $whereClause = $postId ? "WHERE p.id = ?" : "";
        $params = $postId ? [$postId] : [];
        
        $sql = "SELECT p.*, u.username, u.id as user_id,
                       (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
                       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
                FROM posts p 
                JOIN users u ON p.user_id = u.id 
                $whereClause
                ORDER BY p.created_at DESC";
        
        if ($postId) {
            return $this->db->fetchOne($sql, $params);
        }
        return $this->db->fetchAll($sql, $params);
    }

    public function searchPosts($query, $limit = 20, $offset = 0) {
        $sql = "SELECT p.*, u.username,
                       (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
                       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
                FROM posts p 
                JOIN users u ON p.user_id = u.id 
                WHERE p.caption LIKE ? OR u.username LIKE ?
                ORDER BY p.created_at DESC 
                LIMIT ? OFFSET ?";
        $searchTerm = "%$query%";
        return $this->db->fetchAll($sql, [$searchTerm, $searchTerm, $limit, $offset]);
    }

    public function getTotalCount() {
        $sql = "SELECT COUNT(*) as count FROM posts";
        $result = $this->db->fetchOne($sql);
        return $result['count'];
    }
}