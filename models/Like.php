<?php

require_once __DIR__ . '/../database/Database.php';

class Like {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function addLike($userId, $postId) {
        try {
            $sql = "INSERT INTO likes (user_id, post_id) VALUES (?, ?)";
            $this->db->query($sql, [$userId, $postId]);
            
            // Mettre à jour le compteur de likes dans la table posts
            $this->updateLikesCount($postId);
            return true;
        } catch (Exception $e) {
            // Like déjà existant
            return false;
        }
    }

    public function removeLike($userId, $postId) {
        $sql = "DELETE FROM likes WHERE user_id = ? AND post_id = ?";
        $stmt = $this->db->query($sql, [$userId, $postId]);
        
        if ($stmt->rowCount() > 0) {
            // Mettre à jour le compteur de likes dans la table posts
            $this->updateLikesCount($postId);
            return true;
        }
        return false;
    }

    public function isLiked($userId, $postId) {
        $sql = "SELECT COUNT(*) as count FROM likes WHERE user_id = ? AND post_id = ?";
        $result = $this->db->fetchOne($sql, [$userId, $postId]);
        return $result['count'] > 0;
    }

    public function getLikesCount($postId) {
        $sql = "SELECT COUNT(*) as count FROM likes WHERE post_id = ?";
        $result = $this->db->fetchOne($sql, [$postId]);
        return $result['count'];
    }

    public function getLikesByPost($postId, $limit = 20, $offset = 0) {
        $sql = "SELECT l.*, u.username 
                FROM likes l 
                JOIN users u ON l.user_id = u.id 
                WHERE l.post_id = ? 
                ORDER BY l.created_at DESC 
                LIMIT ? OFFSET ?";
        return $this->db->fetchAll($sql, [$postId, $limit, $offset]);
    }

    private function updateLikesCount($postId) {
        $sql = "UPDATE posts SET likes_count = (
                    SELECT COUNT(*) FROM likes WHERE post_id = ?
                ) WHERE id = ?";
        $this->db->query($sql, [$postId, $postId]);
    }

    public function toggleLike($userId, $postId) {
        if ($this->isLiked($userId, $postId)) {
            return [
                'action' => 'removed',
                'success' => $this->removeLike($userId, $postId)
            ];
        } else {
            return [
                'action' => 'added',
                'success' => $this->addLike($userId, $postId)
            ];
        }
    }

    public function getUserLikes($userId, $limit = 20, $offset = 0) {
        $sql = "SELECT l.*, p.image_path, p.caption, u.username as post_author
                FROM likes l 
                JOIN posts p ON l.post_id = p.id
                JOIN users u ON p.user_id = u.id
                WHERE l.user_id = ? 
                ORDER BY l.created_at DESC 
                LIMIT ? OFFSET ?";
        return $this->db->fetchAll($sql, [$userId, $limit, $offset]);
    }
}