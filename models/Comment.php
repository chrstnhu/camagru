<?php

require_once __DIR__ . '/../database/Database.php';

class Comment {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function create($userId, $postId, $content) {
        $sql = "INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)";
        $this->db->query($sql, [$userId, $postId, $content]);
        return $this->db->lastInsertId();
    }

    public function getCommentsByPost($postId, $limit = 20, $offset = 0) {
        $sql = "SELECT c.*, u.username 
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                WHERE c.post_id = ? 
                ORDER BY c.created_at ASC 
                LIMIT ? OFFSET ?";
        return $this->db->fetchAll($sql, [$postId, $limit, $offset]);
    }

    public function findById($id) {
        $sql = "SELECT c.*, u.username 
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                WHERE c.id = ?";
        return $this->db->fetchOne($sql, [$id]);
    }

    public function update($commentId, $userId, $content) {
        $sql = "UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ? AND user_id = ?";
        $stmt = $this->db->query($sql, [$content, $commentId, $userId]);
        return $stmt->rowCount() > 0;
    }

    public function delete($commentId, $userId) {
        $sql = "DELETE FROM comments WHERE id = ? AND user_id = ?";
        $stmt = $this->db->query($sql, [$commentId, $userId]);
        return $stmt->rowCount() > 0;
    }

    public function getCommentsCount($postId) {
        $sql = "SELECT COUNT(*) as count FROM comments WHERE post_id = ?";
        $result = $this->db->fetchOne($sql, [$postId]);
        return $result['count'];
    }

    public function getRecentComments($limit = 10) {
        $sql = "SELECT c.*, u.username, p.image_path
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                JOIN posts p ON c.post_id = p.id
                ORDER BY c.created_at DESC 
                LIMIT ?";
        return $this->db->fetchAll($sql, [$limit]);
    }

    public function getCommentsByUser($userId, $limit = 20, $offset = 0) {
        $sql = "SELECT c.*, p.image_path, p.caption
                FROM comments c 
                JOIN posts p ON c.post_id = p.id
                WHERE c.user_id = ? 
                ORDER BY c.created_at DESC 
                LIMIT ? OFFSET ?";
        return $this->db->fetchAll($sql, [$userId, $limit, $offset]);
    }

    public function searchComments($query, $limit = 20, $offset = 0) {
        $sql = "SELECT c.*, u.username, p.image_path
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                JOIN posts p ON c.post_id = p.id
                WHERE c.content LIKE ?
                ORDER BY c.created_at DESC 
                LIMIT ? OFFSET ?";
        $searchTerm = "%$query%";
        return $this->db->fetchAll($sql, [$searchTerm, $limit, $offset]);
    }

    public function canEditComment($commentId, $userId) {
        $sql = "SELECT user_id FROM comments WHERE id = ?";
        $result = $this->db->fetchOne($sql, [$commentId]);
        return $result && $result['user_id'] == $userId;
    }
}