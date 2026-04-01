<?php

class Comment {
    private $conn;
    private $table_name = "comments";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Add a comment
    public function addComment($userId, $postId, $commentText) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (user_id, post_id, comment_text, created_at) 
                  VALUES (:user_id, :post_id, :comment_text, NOW())";

        $stmt = $this->conn->prepare($query);
        return $stmt->execute([
            ':user_id' => $userId,
            ':post_id' => $postId,
            ':comment_text' => $commentText
        ]);
    }

    // Get all comments for a post
    public function getCommentsByPost($postId) {
        $query = "SELECT c.*, u.username 
                  FROM " . $this->table_name . " c
                  JOIN users u ON c.user_id = u.id
                  WHERE c.post_id = :post_id
                  ORDER BY c.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([':post_id' => $postId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Delete a comment
    public function deleteComment($commentId, $userId) {
        // Check if the comment belongs to the user using named parameters
        $query = "SELECT user_id FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([':id' => $commentId]);
        $comment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$comment || $comment['user_id'] != $userId) {
            return false;
        }

        // Delete the comment using named parameters
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([':id' => $commentId, ':user_id' => $userId]);
    }
}