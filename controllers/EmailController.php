<?php

class EmailController {
    private $smtpHost;
    private $smtpPort;
    private $smtpUsername;
    private $smtpPassword;
    private $fromEmail;
    private $fromName;

    public function __construct() {
        $this->smtpHost = $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com';
        $this->smtpPort = $_ENV['SMTP_PORT'] ?? 587;
        $this->smtpUsername = $_ENV['SMTP_USERNAME'] ?? '';
        $this->smtpPassword = $_ENV['SMTP_PASSWORD'] ?? '';
        $this->fromEmail = $this->smtpUsername;
        $this->fromName = 'Camagru';
    }

    public function sendVerificationEmail($email, $username, $token) {
        $baseUrl = $_ENV['CLIENT_URL'] ?? 'http://localhost:8080';
        $verificationUrl = "$baseUrl/verify?token=$token";
        
        $subject = 'Verify your Camagru account';
        $body = $this->getVerificationEmailTemplate($username, $verificationUrl);
        
        return $this->sendEmail($email, $subject, $body);
    }

    public function sendPasswordResetEmail($email, $username, $token) {
        $baseUrl = $_ENV['CLIENT_URL'] ?? 'http://localhost:8080';
        $resetUrl = "$baseUrl/reset-password?token=$token";
        
        $subject = 'Reset your Camagru password';
        $body = $this->getPasswordResetTemplate($username, $resetUrl);
        
        return $this->sendEmail($email, $subject, $body);
    }

    public function sendLikeNotification($email, $username, $likerUsername, $postId) {
        $baseUrl = $_ENV['CLIENT_URL'] ?? 'http://localhost:8080';
        $postUrl = "$baseUrl/post/$postId";
        
        $subject = 'Someone liked your post!';
        $body = $this->getLikeNotificationTemplate($username, $likerUsername, $postUrl);
        
        return $this->sendEmail($email, $subject, $body);
    }

    public function sendCommentNotification($email, $username, $commenterUsername, $postId, $comment) {
        $baseUrl = $_ENV['CLIENT_URL'] ?? 'http://localhost:8080';
        $postUrl = "$baseUrl/post/$postId";
        
        $subject = 'New comment on your post!';
        $body = $this->getCommentNotificationTemplate($username, $commenterUsername, $comment, $postUrl);
        
        return $this->sendEmail($email, $subject, $body);
    }

    private function sendEmail($to, $subject, $body) {
        try {
            // Si les paramètres SMTP ne sont pas configurés, simuler l'envoi
            if (empty($this->smtpUsername) || empty($this->smtpPassword)) {
                error_log("Email would be sent to: $to - Subject: $subject");
                return true;
            }

            // Configuration des en-têtes
            $headers = [
                'MIME-Version' => '1.0',
                'Content-type' => 'text/html; charset=UTF-8',
                'From' => "$this->fromName <$this->fromEmail>",
                'Reply-To' => $this->fromEmail,
                'X-Mailer' => 'PHP/' . phpversion()
            ];

            $headerString = '';
            foreach ($headers as $key => $value) {
                $headerString .= "$key: $value\r\n";
            }

            // Pour un vrai envoi SMTP, vous devriez utiliser une bibliothèque comme PHPMailer
            // Ici, on utilise la fonction mail() de base
            $result = mail($to, $subject, $body, $headerString);
            
            if ($result) {
                error_log("Email sent successfully to: $to");
                return true;
            } else {
                error_log("Failed to send email to: $to");
                return false;
            }

        } catch (Exception $e) {
            error_log("Email sending error: " . $e->getMessage());
            return false;
        }
    }

    private function getVerificationEmailTemplate($username, $verificationUrl) {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>Verify your account</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Welcome to Camagru!</h1>
                </div>
                <div class='content'>
                    <h2>Hi $username!</h2>
                    <p>Thank you for signing up for Camagru. To complete your registration, please verify your email address by clicking the button below:</p>
                    <p style='text-align: center;'>
                        <a href='$verificationUrl' class='button'>Verify My Account</a>
                    </p>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p><a href='$verificationUrl'>$verificationUrl</a></p>
                    <p>This link will expire in 24 hours.</p>
                </div>
                <div class='footer'>
                    <p>If you didn't create an account with Camagru, please ignore this email.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }

    private function getPasswordResetTemplate($username, $resetUrl) {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>Reset your password</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Password Reset</h1>
                </div>
                <div class='content'>
                    <h2>Hi $username!</h2>
                    <p>You requested a password reset for your Camagru account. Click the button below to reset your password:</p>
                    <p style='text-align: center;'>
                        <a href='$resetUrl' class='button'>Reset Password</a>
                    </p>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p><a href='$resetUrl'>$resetUrl</a></p>
                    <p>This link will expire in 1 hour.</p>
                </div>
                <div class='footer'>
                    <p>If you didn't request a password reset, please ignore this email.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }

    private function getLikeNotificationTemplate($username, $likerUsername, $postUrl) {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>Someone liked your post!</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>👍 Your post got a like!</h1>
                </div>
                <div class='content'>
                    <h2>Hi $username!</h2>
                    <p><strong>$likerUsername</strong> liked your post on Camagru!</p>
                    <p style='text-align: center;'>
                        <a href='$postUrl' class='button'>View Post</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        ";
    }

    private function getCommentNotificationTemplate($username, $commenterUsername, $comment, $postUrl) {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <title>New comment on your post!</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #17a2b8; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; background-color: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
                .comment { background-color: white; padding: 15px; border-left: 4px solid #17a2b8; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>💬 New Comment!</h1>
                </div>
                <div class='content'>
                    <h2>Hi $username!</h2>
                    <p><strong>$commenterUsername</strong> commented on your post:</p>
                    <div class='comment'>
                        <p>$comment</p>
                    </div>
                    <p style='text-align: center;'>
                        <a href='$postUrl' class='button'>View Post</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
}