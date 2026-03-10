<?php

require_once __DIR__ . '/../models/Like.php';
require_once __DIR__ . '/../models/Auth.php';

class LikeController {
    private $likeModel;

    public function __construct() {
        $this->likeModel = new Like();
    }

    public function toggleLike() {
        try {
            $user = Auth::requireAuth();
            $data = json_decode(file_get_contents('php://input'), true);
            $postId = $data['post_id'] ?? null;

            if (!$postId) {
                http_response_code(400);
                return json_encode(['error' => 'Post ID is required']);
            }

            $result = $this->likeModel->toggleLike($user['user_id'], $postId);
            
            if ($result['success']) {
                $likesCount = $this->likeModel->getLikesCount($postId);
                
                return json_encode([
                    'message' => 'Like ' . $result['action'] . ' successfully',
                    'action' => $result['action'],
                    'likes_count' => $likesCount,
                    'is_liked' => $result['action'] === 'added'
                ]);
            } else {
                http_response_code(500);
                return json_encode(['error' => 'Failed to toggle like']);
            }

        } catch (Exception $e) {
            error_log("Toggle like error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to toggle like']);
        }
    }

    public function getLikesForPost() {
        try {
            $postId = $_GET['post_id'] ?? null;

            if (!$postId) {
                http_response_code(400);
                return json_encode(['error' => 'Post ID is required']);
            }

            $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
            $limit = isset($_GET['limit']) ? min(50, max(1, intval($_GET['limit']))) : 20;
            $offset = ($page - 1) * $limit;

            $likes = $this->likeModel->getLikesByPost($postId, $limit, $offset);
            $totalLikes = $this->likeModel->getLikesCount($postId);

            return json_encode([
                'likes' => $likes,
                'total_likes' => $totalLikes,
                'pagination' => [
                    'current_page' => $page,
                    'limit' => $limit
                ]
            ]);

        } catch (Exception $e) {
            error_log("Get likes for post error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get likes']);
        }
    }

    public function getUserLikes() {
        try {
            $user = Auth::requireAuth();
            
            $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
            $limit = isset($_GET['limit']) ? min(50, max(1, intval($_GET['limit']))) : 20;
            $offset = ($page - 1) * $limit;

            $likes = $this->likeModel->getUserLikes($user['user_id'], $limit, $offset);

            return json_encode([
                'likes' => $likes,
                'pagination' => [
                    'current_page' => $page,
                    'limit' => $limit
                ]
            ]);

        } catch (Exception $e) {
            error_log("Get user likes error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get user likes']);
        }
    }

    public function checkLikeStatus() {
        try {
            $user = Auth::getCurrentUser();
            $postId = $_GET['post_id'] ?? null;

            if (!$postId) {
                http_response_code(400);
                return json_encode(['error' => 'Post ID is required']);
            }

            $isLiked = false;
            if ($user) {
                $isLiked = $this->likeModel->isLiked($user['user_id'], $postId);
            }

            $likesCount = $this->likeModel->getLikesCount($postId);

            return json_encode([
                'is_liked' => $isLiked,
                'likes_count' => $likesCount
            ]);

        } catch (Exception $e) {
            error_log("Check like status error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to check like status']);
        }
    }
}