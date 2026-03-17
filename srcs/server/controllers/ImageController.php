<?php
// Image controller: Manage creation, retrieval, and deletion of captured images

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/Post.php';

class ImageController extends BaseController {
    private $db;
    private $post;
    
    // Initialize database connection
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->post = new Post($this->db);
    }

    // Save a captured image
    public function saveImage() {
        $this->checkUserAuth('save images');
        $this->requireCsrfProtection();
        
        try {
            // Retrieve JSON data sent by the client
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Retrieve user ID from session (secure)
            $userId = $_SESSION['user_id'];
            $caption = $input['caption'] ?? '';  // Optional caption

            if (isset($input['base_image_data']) && isset($input['effect_image_data'])) {
                $effectWidth = isset($input['effect_width']) ? (int) $input['effect_width'] : 100;
                $effectHeight = isset($input['effect_height']) ? (int) $input['effect_height'] : 80;

                $imageData = $this->composeImageData(
                    $input['base_image_data'],
                    $input['effect_image_data'],
                    $effectWidth,
                    $effectHeight
                );
            } elseif (isset($input['image_data'])) {
                $imageData = $this->validateImageDataUrl($input['image_data']);
            } else {
                $this->sendError(400, 'Missing image data');
            }

            if (strlen($caption) > 255) {
                $this->sendError(400, 'Caption is too long');
            }
            
            // Generate a unique filename
            $timestamp = time(); 
            $randomString = bin2hex(random_bytes(8));
            $imagePath = "uploads/images/{$userId}_{$timestamp}_{$randomString}.png";

            $this->db->beginTransaction();

            $postId = $this->post->create($userId, $imagePath, $caption, $imageData);
            if (!$postId) {
                throw new Exception('Failed to publish post');
            }

            $stmt = $this->db->prepare("
                INSERT INTO images (user_id, post_id, image_path, image_data, caption, created_at)
                VALUES (:user_id, :post_id, :image_path, :image_data, :caption, NOW())
            ");
            
            $stmt->execute([
                ':user_id' => $userId,
                ':post_id' => $postId,
                ':image_path' => $imagePath,
                ':image_data' => $imageData,
                ':caption' => $caption
            ]);
            
            $imageId = $this->db->lastInsertId();
            $this->db->commit();
            
            http_response_code(201);
            $this->sendSuccess('Image saved successfully', [
                'image_id' => $imageId,
                'post_id' => $postId,
                'image_path' => $imagePath,
                'image_data' => $imageData
            ]);
            
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            $this->sendError(500, 'Failed to save image: ' . $e->getMessage());
        }
    }
    
    // Retrieve images of a user (GET /api/images/user/{user_id})
    public function getUserImages() {
        $this->checkUserAuth('view images');
        
        try {
            // Extract user ID from URL
            $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            $requestedUserId = intval(basename($path));
            
            // Ensure the requested user ID matches the authenticated user
            if ($requestedUserId !== $_SESSION['user_id']) {
                $this->sendError(403, 'You can only view your own images');
            }
            
            // Fetch images from the database
            $stmt = $this->db->prepare("
                SELECT id, user_id, post_id, image_path, image_data, caption, created_at
                FROM images
                WHERE user_id = :user_id
                ORDER BY created_at DESC
            ");
            
            $stmt->execute([':user_id' => $_SESSION['user_id']]);
            $images = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Return images
            echo json_encode([
                'success' => true,
                'count' => count($images),
                'images' => $images
            ]);
            
        } catch (Exception $e) {
            $this->sendError(500, 'Failed to retrieve images: ' . $e->getMessage());
        }
    }
    
    // Delete image (DELETE /api/images/{image_id})
    public function deleteImage() {
        $this->checkUserAuth('delete images');
        $this->requireCsrfProtection();
        
        try {
            // Extract image ID from URL
            $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            $imageId = intval(basename($path));
            
            if (!$imageId) {
                $this->sendError(400, 'Invalid image ID');
            }
            
            // Image ownership verification
            $checkStmt = $this->db->prepare(
                "SELECT user_id, post_id FROM images WHERE id = :id"
            );
            $checkStmt->execute([':id' => $imageId]);
            $image = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$image) {
                $this->sendError(404, 'Image not found');
            }
            
            // Check ownership
            if ($image['user_id'] !== $_SESSION['user_id']) {
                $this->sendError(403, 'You can only delete your own images');
            }
            
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("DELETE FROM images WHERE id = :id");
            $stmt->execute([':id' => $imageId]);

            if (!empty($image['post_id'])) {
                $postStmt = $this->db->prepare("DELETE FROM posts WHERE id = :id AND user_id = :user_id");
                $postStmt->execute([
                    ':id' => $image['post_id'],
                    ':user_id' => $_SESSION['user_id']
                ]);
            }
            
            $this->db->commit();
            
            // Delete confirmation
            if ($stmt->rowCount() > 0) {
                $this->sendSuccess('Image deleted successfully');
            } else {
                $this->sendError(404, 'Image not found');
            }
            
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            $this->sendError(500, 'Failed to delete image: ' . $e->getMessage());
        }
    }

    private function validateImageDataUrl($imageData) {
        if (!is_string($imageData) || !preg_match('/^data:(image\/(png|jpeg));base64,/', $imageData)) {
            $this->sendError(400, 'Invalid image format');
        }

        $encoded = substr($imageData, strpos($imageData, ',') + 1);
        $binary = base64_decode($encoded, true);

        if ($binary === false) {
            $this->sendError(400, 'Invalid image data');
        }

        if (strlen($binary) > 10 * 1024 * 1024) {
            $this->sendError(400, 'Image size must be less than 10MB');
        }

        $info = @getimagesizefromstring($binary);
        if ($info === false || !in_array($info['mime'], ['image/png', 'image/jpeg'], true)) {
            $this->sendError(400, 'Unsupported image type');
        }

        return $imageData;
    }

    private function decodeImageDataUrl($imageData) {
        $this->validateImageDataUrl($imageData);

        $encoded = substr($imageData, strpos($imageData, ',') + 1);
        $binary = base64_decode($encoded, true);
        $info = @getimagesizefromstring($binary);

        if ($binary === false || $info === false) {
            $this->sendError(400, 'Invalid image data');
        }

        return [
            'binary' => $binary,
            'mime' => $info['mime'],
            'width' => $info[0],
            'height' => $info[1]
        ];
    }

    private function composeImageData($baseImageData, $effectImageData, $effectWidth, $effectHeight) {
        $baseImage = $this->decodeImageDataUrl($baseImageData);
        $effectImage = $this->decodeImageDataUrl($effectImageData);

        $baseResource = @imagecreatefromstring($baseImage['binary']);
        $effectResource = @imagecreatefromstring($effectImage['binary']);

        if ($baseResource === false || $effectResource === false) {
            $this->sendError(400, 'Unable to process image composition');
        }

        imagealphablending($baseResource, true);
        imagesavealpha($baseResource, true);
        imagealphablending($effectResource, true);
        imagesavealpha($effectResource, true);

        $baseWidth = imagesx($baseResource);
        $baseHeight = imagesy($baseResource);
        $overlaySourceWidth = imagesx($effectResource);
        $overlaySourceHeight = imagesy($effectResource);

        $overlayWidth = max(1, min($effectWidth > 0 ? $effectWidth : 100, $baseWidth));
        $overlayHeight = max(1, min($effectHeight > 0 ? $effectHeight : 80, $baseHeight));

        $positionX = (int) floor(($baseWidth - $overlayWidth) / 2);
        $positionY = (int) floor(($baseHeight - $overlayHeight) / 2);

        imagecopyresampled(
            $baseResource,
            $effectResource,
            $positionX,
            $positionY,
            0,
            0,
            $overlayWidth,
            $overlayHeight,
            $overlaySourceWidth,
            $overlaySourceHeight
        );

        ob_start();
        imagepng($baseResource);
        $composedBinary = ob_get_clean();

        imagedestroy($baseResource);
        imagedestroy($effectResource);

        if ($composedBinary === false) {
            $this->sendError(500, 'Failed to create final image');
        }

        return 'data:image/png;base64,' . base64_encode($composedBinary);
    }
}
