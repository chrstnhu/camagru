<?php
// Image controller: Manage creation, retrieval, and deletion of captured images

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/BaseController.php';

class ImageController extends BaseController {
    private $db;
    
    // Initialize database connection
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    // Save a captured image
    public function saveImage() {
        $this->checkUserAuth('save images');
        
        try {
            // Retrieve JSON data sent by the client
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Check image data is present
            if (!isset($input['image_data'])) {
                $this->sendError(400, 'Missing image_data');
            }
            
            // Retrieve user ID from session (secure)
            $userId = $_SESSION['user_id'];
            $imageData = $input['image_data'];
            $caption = $input['caption'] ?? '';  // Optional caption
            
            // Validate image format (must be base64)
            if (strpos($imageData, 'data:image') !== 0) {
                $this->sendError(400, 'Invalid image format');
            }
            
            // Generate a unique filename
            $timestamp = time(); 
            $randomString = bin2hex(random_bytes(8));
            $imagePath = "uploads/images/{$userId}_{$timestamp}_{$randomString}.png";
            
            // Save to the database
            $stmt = $this->db->prepare("
                INSERT INTO images (user_id, image_path, image_data, caption, created_at)
                VALUES (:user_id, :image_path, :image_data, :caption, NOW())
            ");
            
            $stmt->execute([
                ':user_id' => $userId,
                ':image_path' => $imagePath,
                ':image_data' => $imageData,
                ':caption' => $caption
            ]);
            
            $imageId = $this->db->lastInsertId();
            
            http_response_code(201);
            $this->sendSuccess('Image saved successfully', [
                'image_id' => $imageId,
                'image_path' => $imagePath
            ]);
            
        } catch (Exception $e) {
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
                SELECT id, user_id, image_path, image_data, caption, created_at
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
        
        try {
            // Extract image ID from URL
            $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            $imageId = intval(basename($path));
            
            if (!$imageId) {
                $this->sendError(400, 'Invalid image ID');
            }
            
            // Image ownership verification
            $checkStmt = $this->db->prepare(
                "SELECT user_id FROM images WHERE id = :id"
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
            
            // Delete the image in database
            $stmt = $this->db->prepare("DELETE FROM images WHERE id = :id");
            $stmt->execute([':id' => $imageId]);
            
            // Delete confirmation
            if ($stmt->rowCount() > 0) {
                $this->sendSuccess('Image deleted successfully');
            } else {
                $this->sendError(404, 'Image not found');
            }
            
        } catch (Exception $e) {
            $this->sendError(500, 'Failed to delete image: ' . $e->getMessage());
        }
    }
}
