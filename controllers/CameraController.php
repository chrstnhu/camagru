<?php

require_once __DIR__ . '/../models/Auth.php';
require_once __DIR__ . '/../utils/ImageProcessor.php';
require_once __DIR__ . '/../models/Post.php';

class CameraController {
    private $imageProcessor;
    private $postModel;

    public function __construct() {
        $this->imageProcessor = new ImageProcessor();
        $this->postModel = new Post();
    }

    public function capturePhoto() {
        try {
            $user = Auth::requireAuth();
            
            if (!isset($_POST['image_data'])) {
                http_response_code(400);
                return json_encode(['error' => 'Image data is required']);
            }

            // Décoder l'image base64
            $imageData = $_POST['image_data'];
            $imageData = str_replace('data:image/png;base64,', '', $imageData);
            $imageData = str_replace(' ', '+', $imageData);
            $imageData = base64_decode($imageData);

            if (!$imageData) {
                http_response_code(400);
                return json_encode(['error' => 'Invalid image data']);
            }

            // Créer un fichier temporaire
            $tempFile = tempnam(sys_get_temp_dir(), 'capture_');
            file_put_contents($tempFile, $imageData);

            // Simuler un upload
            $fakeUpload = [
                'name' => 'capture_' . time() . '.png',
                'type' => 'image/png',
                'tmp_name' => $tempFile,
                'size' => strlen($imageData),
                'error' => UPLOAD_ERR_OK
            ];

            // Traiter l'image
            $result = $this->imageProcessor->processUpload($fakeUpload);
            
            // Nettoyer le fichier temporaire
            unlink($tempFile);

            if (!$result['success']) {
                http_response_code(400);
                return json_encode(['error' => $result['message']]);
            }

            return json_encode([
                'message' => 'Photo captured successfully',
                'image_path' => $result['path'],
                'filename' => $result['filename']
            ]);

        } catch (Exception $e) {
            error_log("Capture photo error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to capture photo']);
        }
    }

    public function applyEffect() {
        try {
            $user = Auth::requireAuth();
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['image_path']) || !isset($data['effect'])) {
                http_response_code(400);
                return json_encode(['error' => 'Image path and effect are required']);
            }

            $result = $this->imageProcessor->applyEffect(
                $data['image_path'],
                $data['effect'],
                $data['params'] ?? []
            );

            if (!$result['success']) {
                http_response_code(400);
                return json_encode(['error' => $result['message']]);
            }

            return json_encode([
                'message' => 'Effect applied successfully',
                'image_path' => $result['path'],
                'filename' => $result['filename']
            ]);

        } catch (Exception $e) {
            error_log("Apply effect error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to apply effect']);
        }
    }

    public function addFrame() {
        try {
            $user = Auth::requireAuth();
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['image_path']) || !isset($data['frame_path'])) {
                http_response_code(400);
                return json_encode(['error' => 'Image path and frame path are required']);
            }

            // Le frame devrait être un fichier prédéfini
            $framePath = '/app/server/assets/frames/' . basename($data['frame_path']);
            
            if (!file_exists($framePath)) {
                http_response_code(404);
                return json_encode(['error' => 'Frame not found']);
            }

            $result = $this->imageProcessor->addFrame($data['image_path'], $framePath);

            if (!$result['success']) {
                http_response_code(400);
                return json_encode(['error' => $result['message']]);
            }

            return json_encode([
                'message' => 'Frame added successfully',
                'image_path' => $result['path'],
                'filename' => $result['filename']
            ]);

        } catch (Exception $e) {
            error_log("Add frame error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to add frame']);
        }
    }

    public function savePhoto() {
        try {
            $user = Auth::requireAuth();
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['image_path'])) {
                http_response_code(400);
                return json_encode(['error' => 'Image path is required']);
            }

            $caption = $data['caption'] ?? null;
            
            // Créer le post
            $postId = $this->postModel->create($user['user_id'], $data['image_path'], $caption);

            return json_encode([
                'message' => 'Photo saved successfully',
                'post_id' => $postId
            ]);

        } catch (Exception $e) {
            error_log("Save photo error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to save photo']);
        }
    }

    public function getAvailableEffects() {
        try {
            $effects = [
                'grayscale' => [
                    'name' => 'Grayscale',
                    'description' => 'Convert image to black and white'
                ],
                'sepia' => [
                    'name' => 'Sepia',
                    'description' => 'Apply vintage sepia tone'
                ],
                'blur' => [
                    'name' => 'Blur',
                    'description' => 'Apply Gaussian blur'
                ],
                'brightness' => [
                    'name' => 'Brightness',
                    'description' => 'Adjust image brightness',
                    'params' => ['level' => 'integer (-100 to 100)']
                ],
                'contrast' => [
                    'name' => 'Contrast',
                    'description' => 'Adjust image contrast',
                    'params' => ['level' => 'integer (-100 to 100)']
                ],
                'vintage' => [
                    'name' => 'Vintage',
                    'description' => 'Apply vintage effect'
                ]
            ];

            return json_encode(['effects' => $effects]);

        } catch (Exception $e) {
            error_log("Get effects error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get effects']);
        }
    }

    public function getAvailableFrames() {
        try {
            $framesDir = '/app/server/assets/frames/';
            $frames = [];

            if (is_dir($framesDir)) {
                $files = scandir($framesDir);
                foreach ($files as $file) {
                    if (pathinfo($file, PATHINFO_EXTENSION) === 'png') {
                        $frames[] = [
                            'filename' => $file,
                            'path' => '/assets/frames/' . $file,
                            'name' => pathinfo($file, PATHINFO_FILENAME)
                        ];
                    }
                }
            }

            return json_encode(['frames' => $frames]);

        } catch (Exception $e) {
            error_log("Get frames error: " . $e->getMessage());
            http_response_code(500);
            return json_encode(['error' => 'Failed to get frames']);
        }
    }
}