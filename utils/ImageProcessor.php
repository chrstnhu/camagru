<?php

class ImageProcessor {
    private $uploadDir = '/app/server/uploads/';
    private $maxSize = 5 * 1024 * 1024; // 5MB
    private $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    
    public function __construct() {
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }

    public function processUpload($file) {
        try {
            // Validation de base
            if (!$this->validateFile($file)) {
                return ['success' => false, 'message' => 'Invalid file'];
            }

            // Créer un nom unique
            $filename = $this->generateUniqueFilename($file['name']);
            $uploadPath = $this->uploadDir . $filename;

            // Déplacer le fichier
            if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
                // Redimensionner si nécessaire
                $this->resizeImage($uploadPath, 800, 600);
                
                return [
                    'success' => true,
                    'filename' => $filename,
                    'path' => '/uploads/' . $filename,
                    'full_path' => $uploadPath
                ];
            }

            return ['success' => false, 'message' => 'Upload failed'];

        } catch (Exception $e) {
            error_log("Image processing error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Processing failed'];
        }
    }

    public function applyEffect($imagePath, $effectName, $params = []) {
        try {
            $fullPath = $this->uploadDir . basename($imagePath);
            
            if (!file_exists($fullPath)) {
                return ['success' => false, 'message' => 'Image not found'];
            }

            $image = $this->loadImage($fullPath);
            if (!$image) {
                return ['success' => false, 'message' => 'Could not load image'];
            }

            switch ($effectName) {
                case 'grayscale':
                    imagefilter($image, IMG_FILTER_GRAYSCALE);
                    break;
                
                case 'sepia':
                    imagefilter($image, IMG_FILTER_GRAYSCALE);
                    imagefilter($image, IMG_FILTER_COLORIZE, 100, 50, 0);
                    break;
                
                case 'blur':
                    imagefilter($image, IMG_FILTER_GAUSSIAN_BLUR);
                    break;
                
                case 'brightness':
                    $level = $params['level'] ?? 50;
                    imagefilter($image, IMG_FILTER_BRIGHTNESS, $level);
                    break;
                
                case 'contrast':
                    $level = $params['level'] ?? -50;
                    imagefilter($image, IMG_FILTER_CONTRAST, $level);
                    break;
                
                case 'vintage':
                    imagefilter($image, IMG_FILTER_CONTRAST, -30);
                    imagefilter($image, IMG_FILTER_COLORIZE, 30, 10, -15);
                    break;
                
                default:
                    imagedestroy($image);
                    return ['success' => false, 'message' => 'Unknown effect'];
            }

            // Sauvegarder l'image modifiée
            $newFilename = 'effect_' . time() . '_' . basename($imagePath);
            $newPath = $this->uploadDir . $newFilename;
            
            $saved = $this->saveImage($image, $newPath);
            imagedestroy($image);

            if ($saved) {
                return [
                    'success' => true,
                    'filename' => $newFilename,
                    'path' => '/uploads/' . $newFilename
                ];
            }

            return ['success' => false, 'message' => 'Could not save processed image'];

        } catch (Exception $e) {
            error_log("Effect application error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Effect application failed'];
        }
    }

    public function addFrame($imagePath, $framePath) {
        try {
            $baseImage = $this->loadImage($this->uploadDir . basename($imagePath));
            $frameImage = $this->loadImage($framePath);

            if (!$baseImage || !$frameImage) {
                return ['success' => false, 'message' => 'Could not load images'];
            }

            // Redimensionner le frame à la taille de l'image de base
            $baseWidth = imagesx($baseImage);
            $baseHeight = imagesy($baseImage);
            
            $resizedFrame = imagecreatetruecolor($baseWidth, $baseHeight);
            imagealphablending($resizedFrame, false);
            imagesavealpha($resizedFrame, true);
            
            imagecopyresampled(
                $resizedFrame, $frameImage,
                0, 0, 0, 0,
                $baseWidth, $baseHeight,
                imagesx($frameImage), imagesy($frameImage)
            );

            // Combiner les images
            imagecopy($baseImage, $resizedFrame, 0, 0, 0, 0, $baseWidth, $baseHeight);

            // Sauvegarder
            $newFilename = 'framed_' . time() . '_' . basename($imagePath);
            $newPath = $this->uploadDir . $newFilename;
            
            $saved = $this->saveImage($baseImage, $newPath);
            
            imagedestroy($baseImage);
            imagedestroy($frameImage);
            imagedestroy($resizedFrame);

            if ($saved) {
                return [
                    'success' => true,
                    'filename' => $newFilename,
                    'path' => '/uploads/' . $newFilename
                ];
            }

            return ['success' => false, 'message' => 'Could not save framed image'];

        } catch (Exception $e) {
            error_log("Frame application error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Frame application failed'];
        }
    }

    private function validateFile($file) {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return false;
        }

        if ($file['size'] > $this->maxSize) {
            return false;
        }

        if (!in_array($file['type'], $this->allowedTypes)) {
            return false;
        }

        return true;
    }

    private function generateUniqueFilename($originalName) {
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        return uniqid() . '_' . time() . '.' . strtolower($extension);
    }

    private function loadImage($path) {
        $imageInfo = getimagesize($path);
        
        switch ($imageInfo['mime']) {
            case 'image/jpeg':
                return imagecreatefromjpeg($path);
            case 'image/png':
                return imagecreatefrompng($path);
            case 'image/gif':
                return imagecreatefromgif($path);
            default:
                return false;
        }
    }

    private function saveImage($image, $path) {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        
        switch ($extension) {
            case 'jpg':
            case 'jpeg':
                return imagejpeg($image, $path, 90);
            case 'png':
                imagesavealpha($image, true);
                return imagepng($image, $path);
            case 'gif':
                return imagegif($image, $path);
            default:
                return false;
        }
    }

    private function resizeImage($path, $maxWidth, $maxHeight) {
        $image = $this->loadImage($path);
        if (!$image) return false;

        $width = imagesx($image);
        $height = imagesy($image);

        // Calculer les nouvelles dimensions
        $ratio = min($maxWidth / $width, $maxHeight / $height);
        
        if ($ratio < 1) {
            $newWidth = round($width * $ratio);
            $newHeight = round($height * $ratio);

            $resized = imagecreatetruecolor($newWidth, $newHeight);
            
            // Préserver la transparence pour PNG
            if (pathinfo($path, PATHINFO_EXTENSION) === 'png') {
                imagealphablending($resized, false);
                imagesavealpha($resized, true);
            }

            imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            
            $this->saveImage($resized, $path);
            
            imagedestroy($image);
            imagedestroy($resized);
        } else {
            imagedestroy($image);
        }

        return true;
    }

    public function deleteImage($path) {
        $fullPath = $this->uploadDir . basename($path);
        if (file_exists($fullPath)) {
            return unlink($fullPath);
        }
        return false;
    }
}