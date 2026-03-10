<?php

// Post Controller: Manage retrieval of posts and likes

require_once __DIR__ . '/../models/Like.php';
require_once __DIR__ . '/../models/Post.php';
require_once __DIR__ . '/../models/Comment.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/BaseController.php';

class PostController extends BaseController {
    private $db;
    private $like;
    private $post;
    private $comment;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->like = new Like($this->db);
        $this->post = new Post($this->db);
        $this->comment = new Comment($this->db);
    }

    // GET /api/posts
    public function getPosts() {
        try {
            $limit = $_GET['limit'] ?? 10;
            $page = $_GET['page'] ?? 1;
            $offset = ($page - 1) * $limit;

            // Retrieve posts with like status if user is logged in
            $userId = $_SESSION['user_id'] ?? null;
            $posts = $this->post->getAllPosts($limit, $offset, $userId);
            $total = $this->post->getTotalCount();

            // Add default avatar
            foreach ($posts as &$post) {
                $post['avatar'] = "assets/profile/photo1.jpg"; // Default avatar
                
                // If no user is logged in
                if (!$userId && !isset($post['is_liked'])) {
                    $post['is_liked'] = false;
                }
            }

            echo json_encode([
                'posts' => $posts,
                'total' => $total,
                'page' => (int)$page,
                'limit' => (int)$limit,
                'total_pages' => ceil($total / $limit)
            ]);

        } catch (Exception $e) {
            $this->sendError(500, 'Database error: ' . $e->getMessage());
        }
    }

    // POST /api/posts/{postId}/like
    public function toggleLike() {
        $this->checkUserAuth('like posts');

        // Retrieve the post ID from the URL
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $postId = intval(basename(dirname($path)));

        if (!$postId) {
            $this->sendError(400, 'Invalid post ID');
        }

        $userId = $_SESSION['user_id'];
        
        try {
            $success = $this->like->toggleLike($userId, $postId);
            
            if ($success) {
                // Retrieve the new like status
                $isLiked = $this->like->isLikedByUser($userId, $postId);
                $likesCount = $this->like->getLikeCount($postId);
                
                $this->sendSuccess('Like toggled successfully', [
                    'is_liked' => $isLiked,
                    'likes_count' => $likesCount
                ]);
            } else {
                $this->sendError(500, 'Failed to toggle like');
            }
        } catch (Exception $e) {
            $this->sendError(500, 'Database error: ' . $e->getMessage());
        }
    }

    // GET /api/posts/{postId}/likes
    public function getLikes() {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $postId = intval(basename(dirname($path)));

        if (!$postId) {
            $this->sendError(400, 'Invalid post ID');
        }

        try {
            $likesCount = $this->like->getLikeCount($postId);
            $isLiked = false;
            
            if (isset($_SESSION['user_id'])) {
                $isLiked = $this->like->isLikedByUser($_SESSION['user_id'], $postId);
            }
            
            echo json_encode([
                'likes_count' => $likesCount,
                'is_liked' => $isLiked
            ]);
        } catch (Exception $e) {
            $this->sendError(500, 'Database error: ' . $e->getMessage());
        }
    }

    // POST /api/posts/{postId}/comment
    public function userComment() {
        $this->checkUserAuth('comment posts');

        // Retrieve the post ID from the URL
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $postId = intval(basename(dirname($path)));

        if (!$postId) {
            $this->sendError(400, 'Invalid post ID');
        }
        
        $input = $this->getJsonInput();
        $commentText = $input['text'] ?? '';
        
        if (empty($commentText)) {
            $this->sendError(400, 'Comment text is required');
        }

        // Sanitize comment to prevent XSS
        $commentText = htmlspecialchars($commentText, ENT_QUOTES, 'UTF-8');

        $userId = $_SESSION['user_id'];
        $username = $_SESSION['username'];
        
        try {
            // Get post owner information
            $post = $this->post->getById($postId);
            
            if (!$post) {
                $this->sendError(404, 'Post not found');
            }
            
            $success = $this->comment->addComment($userId, $postId, $commentText);

            // Send notification email to post owner (without itself)
            if ($success) {
                if ($post['user_id'] != $userId && !empty($post['email'])) {
                    $this->sendCommentNotification(
                        $post['email'], 
                        $post['alias'], 
                        $username, 
                        $commentText,
                        $postId
                    );
                }
                
                $this->sendSuccess('Comment added successfully');
            } else {
                $this->sendError(500, 'Failed to add comment');
            }

            // Email content
            $userPost = "SELECT user_id FROM " . $this->table_name . " WHERE id = ?";
            $to = $input['userPost'];
            $subject = "Email Verification - Camagru";
            $message = "Hello " . $input['username'] . ",\n\n";
            $message .= "Comment your post\n\n";
            
            // Send the email
            $mailSent = mail($to, $subject, $message, $headers);

            if ($mailSent) {
                error_log("Mail sent to: " . $to);
            } else {
                error_log("Failed to send Mail " . $to);
            }
            

        } catch (Exception $e) {
            $this->sendError(500, 'Database error: ' . $e->getMessage());
        }
    }

    // GET /api/posts/{postId}/comments
    public function getComments() {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $postId = intval(basename(dirname($path)));

        if (!$postId) {
            $this->sendError(400, 'Invalid post ID');
        }

        try {
            $comments = $this->comment->getCommentsByPost($postId);
            
            echo json_encode([
                'comments' => $comments,
                'count' => count($comments)
            ]);
        } catch (Exception $e) {
            $this->sendError(500, 'Database error: ' . $e->getMessage());
        }
    }

    // Send comment notification email
    private function sendCommentNotification($ownerEmail, $ownerUsername, $commenterUsername, $commentText, $postId) {
        $subject = "New comment on your post";
        $message = "Hello $ownerUsername,\n\n";
        $message .= "$commenterUsername commented on your post:\n\n";
        $message .= "\"$commentText\"\n\n";
        $message .= "View all posts: https://localhost:8080/\n\n";
        $message .= "Best regards,\nCamagru Team";
        
        $headers = "From: noreply@camagru.com\r\n";
        $headers .= "Reply-To: noreply@camagru.com\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();
        
        mail($ownerEmail, $subject, $message, $headers);
    }

    // DELETE /api/posts/{postId}/comments/{commentId}
    public function deleteComment() {
        $this->checkUserAuth('delete comments');

        // Extract commentId from URL: /api/posts/{postId}/comments/{commentId}
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $pathParts = explode('/', trim($path, '/'));
        $commentId = intval(end($pathParts));

        if (!$commentId) {
            $this->sendError(400, 'Invalid comment ID');
        }

        $userId = $_SESSION['user_id'];
        
        try {
            $success = $this->comment->deleteComment($commentId, $userId);

            if ($success) {
                $this->sendSuccess('Comment deleted successfully');
            } else {
                $this->sendError(403, 'You can only delete your own comments');
            }
        } catch (Exception $e) {
            $this->sendError(500, 'Database error: ' . $e->getMessage());
        }
    }
}