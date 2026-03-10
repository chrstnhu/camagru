<?php

// Email Service: Handle sending emails for verification and password reset

class EmailService {
    private $fromEmail;
    private $fromName;
    private $baseUrl;
    
    // Configuration
    public function __construct() {
        $this->fromEmail = 'noreply@camagru.com';
        $this->fromName = 'Camagru';
        $this->baseUrl = 'https://localhost:8080';
    }
    
    // Send verification email
    public function sendVerificationEmail($email, $username, $token) {
        $verificationLink = 'http://localhost:9001/verify.php?code=' . $token;
        
        $subject = 'Verify your email address - Camagru';
        $message = "Hello $username,\n\n";
        $message .= "Thank you for registering on Camagru!\n\n";
        $message .= "Please click on the following link to verify your email address:\n";
        $message .= $verificationLink . "\n\n";
        $message .= "This link will expire in 24 hours.\n\n";
        $message .= "If you did not create this account, please ignore this email.\n\n";
        $message .= "Best regards,\nThe Camagru Team";
        
        $headers = "From: {$this->fromName} <{$this->fromEmail}>\r\n";
        $headers .= "Reply-To: {$this->fromEmail}\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();
        
        return mail($email, $subject, $message, $headers);
    }
    
    // Send password reset email
    public function sendPasswordResetEmail($email, $username, $token) {
        $resetLink = $this->baseUrl . '/?reset-token=' . $token;
        
        $subject = 'Reset your password - Camagru';
        $message = "Hello $username,\n\n";
        $message .= "You have requested to reset your password on Camagru.\n\n";
        $message .= "Please click on the following link to reset your password:\n";
        $message .= $resetLink . "\n\n";
        $message .= "This link will expire in 1 hour.\n\n";
        $message .= "If you did not request this password reset, please ignore this email.\n\n";
        $message .= "Best regards,\nThe Camagru Team";
        
        $headers = "From: {$this->fromName} <{$this->fromEmail}>\r\n";
        $headers .= "Reply-To: {$this->fromEmail}\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();
        
        return mail($email, $subject, $message, $headers);
    }
    
    // Send notification email when a comment is added to user's post
    public function sendCommentNotification($email, $username, $postId, $commenterName) {
        $postLink = $this->baseUrl . '/?post=' . $postId;
        
        $subject = 'New comment on your post - Camagru';
        $message = "Hello $username,\n\n";
        $message .= "$commenterName has commented on your post.\n\n";
        $message .= "View your post:\n";
        $message .= $postLink . "\n\n";
        $message .= "Best regards,\nThe Camagru Team";
        
        $headers = "From: {$this->fromName} <{$this->fromEmail}>\r\n";
        $headers .= "Reply-To: {$this->fromEmail}\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();
        
        return mail($email, $subject, $message, $headers);
    }
    
    // Send profile update confirmation email

    public function sendProfileUpdateEmail($email, $username) {
        $subject = 'Profile updated - Camagru';
        $message = "Hello $username,\n\n";
        $message .= "Your profile has been successfully updated.\n\n";
        $message .= "If you did not make this change, please contact us immediately.\n\n";
        $message .= "Best regards,\nThe Camagru Team";
        
        $headers = "From: {$this->fromName} <{$this->fromEmail}>\r\n";
        $headers .= "Reply-To: {$this->fromEmail}\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();
        
        return mail($email, $subject, $message, $headers);
    }
}
