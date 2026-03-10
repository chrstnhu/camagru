<?php

require_once __DIR__ . '/../models/Comment.php';
require_once __DIR__ . '/../models/Auth.php';

class CommentController {
    private $commentModel;

    public function __construct() {
        $this->commentModel = new Comment();
    }

    public function createComment() {
        try {
            $user = Auth::requireAuth();
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['post_id']) || !isset($data['content'])) {
                http_response_code(400);
                return json_encode(['error' => 'Post ID and content are required']);
            }

            $content = trim($data['content']);
            if (empty($content)) {
                http_response_code(400);
                return json_encode(['error' => 'Comment content cannot be empty']);
            }

            $commentId = $this->commentModel->create(
                $user['user_id'],
                $data['post_id'],
                $content
            );

            $comment = $this->commentModel->findById($commentId);

            return json_encode([
                'message' => 'Comment created successfully',
                'comment' => $comment
            ]);

        } catch (Exception $e) {
            error_log("Create comment error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to create comment']);
        }
    }

    public function getCommentsForPost() {
        try {
            $postId = $_GET['post_id'] ?? null;

            if (!$postId) {
                http_response_code(400);
                return json_encode(['error' => 'Post ID is required']);
            }

            $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
            $limit = isset($_GET['limit']) ? min(50, max(1, intval($_GET['limit']))) : 20;
            $offset = ($page - 1) * $limit;

            $comments = $this->commentModel->getCommentsByPost($postId, $limit, $offset);
            $totalComments = $this->commentModel->getCommentsCount($postId);

            return json_encode([
                'comments' => $comments,
                'total_comments' => $totalComments,
                'pagination' => [
                    'current_page' => $page,
                    'limit' => $limit
                ]
            ]);

        } catch (Exception $e) {
            error_log("Get comments for post error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get comments']);
        }
    }

    public function updateComment() {
        try {
            $user = Auth::requireAuth();
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['id']) || !isset($data['content'])) {
                http_response_code(400);
                return json_encode(['error' => 'Comment ID and content are required']);
            }

            $content = trim($data['content']);
            if (empty($content)) {
                http_response_code(400);
                return json_encode(['error' => 'Comment content cannot be empty']);
            }

            if (!$this->commentModel->canEditComment($data['id'], $user['user_id'])) {
                http_response_code(403);
                return json_encode(['error' => 'Not authorized to edit this comment']);
            }

            if ($this->commentModel->update($data['id'], $user['user_id'], $content)) {
                $comment = $this->commentModel->findById($data['id']);
                return json_encode([
                    'message' => 'Comment updated successfully',
                    'comment' => $comment
                ]);
            } else {
                http_response_code(404);
                return json_encode(['error' => 'Comment not found']);
            }

        } catch (Exception $e) {
            error_log("Update comment error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to update comment']);
        }
    }

    public function deleteComment() {
        try {
            $user = Auth::requireAuth();
            $commentId = $_GET['id'] ?? null;

            if (!$commentId) {
                http_response_code(400);
                return json_encode(['error' => 'Comment ID is required']);
            }

            if (!$this->commentModel->canEditComment($commentId, $user['user_id'])) {
                http_response_code(403);
                return json_encode(['error' => 'Not authorized to delete this comment']);
            }

            if ($this->commentModel->delete($commentId, $user['user_id'])) {
                return json_encode(['message' => 'Comment deleted successfully']);
            } else {
                http_response_code(404);
                return json_encode(['error' => 'Comment not found']);
            }

        } catch (Exception $e) {
            error_log("Delete comment error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to delete comment']);
        }
    }

    public function getUserComments() {
        try {
            $user = Auth::requireAuth();
            
            $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
            $limit = isset($_GET['limit']) ? min(50, max(1, intval($_GET['limit']))) : 20;
            $offset = ($page - 1) * $limit;

            $comments = $this->commentModel->getCommentsByUser($user['user_id'], $limit, $offset);

            return json_encode([
                'comments' => $comments,
                'pagination' => [
                    'current_page' => $page,
                    'limit' => $limit
                ]
            ]);

        } catch (Exception $e) {
            error_log("Get user comments error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get user comments']);
        }
    }

    public function getRecentComments() {
        try {
            $limit = isset($_GET['limit']) ? min(50, max(1, intval($_GET['limit']))) : 10;
            
            $comments = $this->commentModel->getRecentComments($limit);

            return json_encode([
                'comments' => $comments
            ]);

        } catch (Exception $e) {
            error_log("Get recent comments error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get recent comments']);
        }
    }
}