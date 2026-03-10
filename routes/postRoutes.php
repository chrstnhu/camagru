<?php

require_once __DIR__ . '/../controllers/PostController.php';

function setupPostRoutes($router) {
    $postController = new PostController();

    // Routes des posts
    $router->get('/api/posts', function() use ($postController) {
        echo $postController->getAllPosts();
    });

    $router->get('/api/posts/(\d+)', function($matches) use ($postController) {
        $_GET['id'] = $matches[1];
        echo $postController->getPost();
    });

    $router->post('/api/posts', function() use ($postController) {
        echo $postController->createPost();
    });

    $router->put('/api/posts', function() use ($postController) {
        echo $postController->updatePost();
    });

    $router->delete('/api/posts/(\d+)', function($matches) use ($postController) {
        $_GET['id'] = $matches[1];
        echo $postController->deletePost();
    });

    // Routes des posts utilisateur
    $router->get('/api/posts/user/(\d+)', function($matches) use ($postController) {
        $_GET['user_id'] = $matches[1];
        echo $postController->getUserPosts();
    });

    $router->get('/api/posts/my', function() use ($postController) {
        echo $postController->getUserPosts();
    });
}