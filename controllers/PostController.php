<?php

require_once __DIR__ . '/../models/Post.php';
require_once __DIR__ . '/../models/Auth.php';

class PostController {
    private $postModel;

    public function __construct() {
        $this->postModel = new Post();
    }

    public function getAllPosts() {
        try {
            $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
            $limit = isset($_GET['limit']) ? min(50, max(1, intval($_GET['limit']))) : 20;
            $offset = ($page - 1) * $limit;

            $posts = $this->postModel->getAllPosts($limit, $offset);
            $total = $this->postModel->getTotalCount();

            return json_encode([
                'posts' => $posts,
                'pagination' => [
                    'current_page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'total_pages' => ceil($total / $limit)
                ]
            ]);

        } catch (Exception $e) {
            error_log("Get all posts error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get posts']);
        }
    }

    public function getPost() {
        try {
            $id = $_GET['id'] ?? null;

            if (!$id) {
                http_response_code(400);
                return json_encode(['error' => 'Post ID is required']);
            }

            $post = $this->postModel->getPostsWithLikesAndComments($id);

            if (!$post) {
                http_response_code(404);
                return json_encode(['error' => 'Post not found']);
            }

            return json_encode(['post' => $post]);

        } catch (Exception $e) {
            error_log("Get post error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get post']);
        }
    }

    public function createPost() {
        try {
            $user = Auth::requireAuth();

            // Gérer l'upload d'image
            if (!isset($_FILES['image'])) {
                http_response_code(400);
                return json_encode(['error' => 'Image is required']);
            }

            $uploadResult = $this->handleImageUpload($_FILES['image']);
            if (!$uploadResult['success']) {
                http_response_code(400);
                return json_encode(['error' => $uploadResult['message']]);
            }

            $caption = $_POST['caption'] ?? null;
            $postId = $this->postModel->create($user['user_id'], $uploadResult['path'], $caption);

            return json_encode([
                'message' => 'Post created successfully',
                'post_id' => $postId,
                'image_path' => $uploadResult['path']
            ]);

        } catch (Exception $e) {
            error_log("Create post error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to create post']);
        }
    }

    public function getUserPosts() {
        try {
            $userId = $_GET['user_id'] ?? null;
            $user = Auth::getCurrentUser();

            // Si pas d'user_id spécifié, utiliser l'utilisateur connecté
            if (!$userId && $user) {
                $userId = $user['user_id'];
            }

            if (!$userId) {
                http_response_code(400);
                return json_encode(['error' => 'User ID is required']);
            }

            $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
            $limit = isset($_GET['limit']) ? min(50, max(1, intval($_GET['limit']))) : 20;
            $offset = ($page - 1) * $limit;

            $posts = $this->postModel->getPostsByUser($userId, $limit, $offset);

            return json_encode([
                'posts' => $posts,
                'pagination' => [
                    'current_page' => $page,
                    'limit' => $limit
                ]
            ]);

        } catch (Exception $e) {
            error_log("Get user posts error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get user posts']);
        }
    }

    public function deletePost() {
        try {
            $user = Auth::requireAuth();
            $postId = $_GET['id'] ?? null;

            if (!$postId) {
                http_response_code(400);
                return json_encode(['error' => 'Post ID is required']);
            }

            // Récupérer le post pour supprimer l'image
            $post = $this->postModel->findById($postId);
            if (!$post) {
                http_response_code(404);
                return json_encode(['error' => 'Post not found']);
            }

            if ($this->postModel->delete($postId, $user['user_id'])) {
                // Supprimer le fichier image
                $this->deleteImageFile($post['image_path']);
                
                return json_encode(['message' => 'Post deleted successfully']);
            } else {
                http_response_code(403);
                return json_encode(['error' => 'Not authorized to delete this post']);
            }

        } catch (Exception $e) {
            error_log("Delete post error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to delete post']);
        }
    }

    public function updatePost() {
        try {
            $user = Auth::requireAuth();
            $data = json_decode(file_get_contents('php://input'), true);
            $postId = $data['id'] ?? null;
            $caption = $data['caption'] ?? null;

            if (!$postId) {
                http_response_code(400);
                return json_encode(['error' => 'Post ID is required']);
            }

            if ($this->postModel->updateCaption($postId, $user['user_id'], $caption)) {
                return json_encode(['message' => 'Post updated successfully']);
            } else {
                http_response_code(403);
                return json_encode(['error' => 'Not authorized to update this post']);
            }

        } catch (Exception $e) {
            error_log("Update post error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to update post']);
        }
    }

    private function handleImageUpload($file) {
        // Vérifications de sécurité
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        $maxSize = 5 * 1024 * 1024; // 5MB

        if (!in_array($file['type'], $allowedTypes)) {
            return ['success' => false, 'message' => 'Invalid file type'];
        }

        if ($file['size'] > $maxSize) {
            return ['success' => false, 'message' => 'File too large'];
        }

        // Créer le répertoire d'upload s'il n'existe pas
        $uploadDir = '/app/server/uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Générer un nom de fichier unique
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid() . '_' . time() . '.' . $extension;
        $uploadPath = $uploadDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
            return [
                'success' => true, 
                'path' => '/uploads/' . $filename,
                'full_path' => $uploadPath
            ];
        }

        return ['success' => false, 'message' => 'Upload failed'];
    }

    private function deleteImageFile($imagePath) {
        $fullPath = '/app/server' . $imagePath;
        if (file_exists($fullPath)) {
            unlink($fullPath);
        }
    }
}