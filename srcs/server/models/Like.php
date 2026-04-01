<?php

class Like {
    private $conn;
    private $table_name = "likes";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Add or remove like
    public function toggleLike($userId, $postId) {
        if ($this->isLikedByUser($userId, $postId)) {
            return $this->removeLike($userId, $postId);
        } else {
            return $this->addLike($userId, $postId);
        }
    }

    // Add a like
    private function addLike($userId, $postId) {
        $query = "INSERT INTO " . $this->table_name . " 
              (user_id, post_id, created_at) 
              VALUES (:user_id, :post_id, NOW())";

        $stmt = $this->conn->prepare($query);
        return $stmt->execute([':user_id' => $userId, ':post_id' => $postId]);
    }

    // Remove a like
    private function removeLike($userId, $postId) {
        $query = "DELETE FROM " . $this->table_name . " 
              WHERE user_id = :user_id AND post_id = :post_id";

        $stmt = $this->conn->prepare($query);
        return $stmt->execute([':user_id' => $userId, ':post_id' => $postId]);
    }

    // Check if the user has liked the post
    public function isLikedByUser($userId, $postId) {
        $query = "SELECT id FROM " . $this->table_name . " 
                  WHERE user_id = :user_id AND post_id = :post_id";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([':user_id' => $userId, ':post_id' => $postId]);
        return $stmt->fetch() !== false;
    }

    // Count the total number of likes for a post
    public function getLikeCount($postId) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " 
                  WHERE post_id = :post_id";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([':post_id' => $postId]);
        $result = $stmt->fetch();
        return $result['total'];
    }
}