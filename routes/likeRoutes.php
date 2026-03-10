<?php

require_once __DIR__ . '/../controllers/LikeController.php';

function setupLikeRoutes($router) {
    $likeController = new LikeController();

    // Routes des likes
    $router->post('/api/likes/toggle', function() use ($likeController) {
        echo $likeController->toggleLike();
    });

    $router->get('/api/likes/post/(\d+)', function($matches) use ($likeController) {
        $_GET['post_id'] = $matches[1];
        echo $likeController->getLikesForPost();
    });

    $router->get('/api/likes/status/(\d+)', function($matches) use ($likeController) {
        $_GET['post_id'] = $matches[1];
        echo $likeController->checkLikeStatus();
    });

    $router->get('/api/likes/my', function() use ($likeController) {
        echo $likeController->getUserLikes();
    });
}