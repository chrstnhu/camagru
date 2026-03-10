<?php

require_once __DIR__ . '/../controllers/CommentController.php';

function setupCommentRoutes($router) {
    $commentController = new CommentController();

    // Routes des commentaires
    $router->post('/api/comments', function() use ($commentController) {
        echo $commentController->createComment();
    });

    $router->get('/api/comments/post/(\d+)', function($matches) use ($commentController) {
        $_GET['post_id'] = $matches[1];
        echo $commentController->getCommentsForPost();
    });

    $router->put('/api/comments', function() use ($commentController) {
        echo $commentController->updateComment();
    });

    $router->delete('/api/comments/(\d+)', function($matches) use ($commentController) {
        $_GET['id'] = $matches[1];
        echo $commentController->deleteComment();
    });

    $router->get('/api/comments/my', function() use ($commentController) {
        echo $commentController->getUserComments();
    });

    $router->get('/api/comments/recent', function() use ($commentController) {
        echo $commentController->getRecentComments();
    });
}