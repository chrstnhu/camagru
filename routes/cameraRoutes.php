<?php

require_once __DIR__ . '/../controllers/CameraController.php';

function setupCameraRoutes($router) {
    $cameraController = new CameraController();

    // Routes de la caméra et des effets
    $router->post('/api/camera/capture', function() use ($cameraController) {
        echo $cameraController->capturePhoto();
    });

    $router->post('/api/camera/effect', function() use ($cameraController) {
        echo $cameraController->applyEffect();
    });

    $router->post('/api/camera/frame', function() use ($cameraController) {
        echo $cameraController->addFrame();
    });

    $router->post('/api/camera/save', function() use ($cameraController) {
        echo $cameraController->savePhoto();
    });

    $router->get('/api/camera/effects', function() use ($cameraController) {
        echo $cameraController->getAvailableEffects();
    });

    $router->get('/api/camera/frames', function() use ($cameraController) {
        echo $cameraController->getAvailableFrames();
    });
}