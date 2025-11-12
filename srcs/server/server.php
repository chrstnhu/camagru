<?php
// Camagru minimal PHP backend
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['message' => 'Hello Camagru 42!']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
