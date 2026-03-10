<?php

require_once __DIR__ . '/../controllers/AuthController.php';

function setupAuthRoutes($router) {
    $authController = new AuthController();

    // Routes d'authentification
    $router->post('/api/auth/register', function() use ($authController) {
        echo $authController->register();
    });

    $router->post('/api/auth/login', function() use ($authController) {
        echo $authController->login();
    });

    $router->get('/api/auth/verify', function() use ($authController) {
        echo $authController->verifyEmail();
    });

    $router->post('/api/auth/forgot-password', function() use ($authController) {
        echo $authController->forgotPassword();
    });

    $router->post('/api/auth/reset-password', function() use ($authController) {
        echo $authController->resetPassword();
    });

    // Routes du profil utilisateur
    $router->get('/api/auth/profile', function() use ($authController) {
        echo $authController->getProfile();
    });

    $router->put('/api/auth/profile', function() use ($authController) {
        echo $authController->updateProfile();
    });
}