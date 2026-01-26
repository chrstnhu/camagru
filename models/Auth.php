<?php

class Auth {
    private static $secret_key = null;

    private static function getSecretKey() {
        if (self::$secret_key === null) {
            self::$secret_key = $_ENV['JWT_SECRET'] ?? 'your-fallback-secret-key';
        }
        return self::$secret_key;
    }

    public static function generateToken($userId, $username) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $userId,
            'username' => $username,
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60) // 24 heures
        ]);

        $headerEncoded = self::base64UrlEncode($header);
        $payloadEncoded = self::base64UrlEncode($payload);
        $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, self::getSecretKey(), true);
        $signatureEncoded = self::base64UrlEncode($signature);

        return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
    }

    public static function validateToken($token) {
        if (!$token) {
            return false;
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;

        $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, self::getSecretKey(), true);
        $expectedSignature = self::base64UrlEncode($signature);

        if (!hash_equals($expectedSignature, $signatureEncoded)) {
            return false;
        }

        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
        
        if (!$payload || $payload['exp'] < time()) {
            return false;
        }

        return $payload;
    }

    public static function getCurrentUser() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        
        if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return false;
        }

        $token = $matches[1];
        return self::validateToken($token);
    }

    public static function requireAuth() {
        $user = self::getCurrentUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        return $user;
    }

    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }

    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }

    public static function generateVerificationToken() {
        return bin2hex(random_bytes(32));
    }

    public static function generateResetToken() {
        return bin2hex(random_bytes(32));
    }
}