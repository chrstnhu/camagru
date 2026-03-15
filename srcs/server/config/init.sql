-- Database initialization script for Camagru

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS camagru CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE camagru;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar_path VARCHAR(255) NULL,
    notification_enabled TINYINT(1) DEFAULT 1,
    
    verification_token VARCHAR(255) NULL, -- Email verification token
    email_verified TINYINT(1) DEFAULT 0,

    reset_token VARCHAR(255) NULL,
    reset_token_expires DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_enabled TINYINT(1) DEFAULT 1 AFTER avatar_path;

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    image_data LONGTEXT NULL,
    caption TEXT,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Captured images table (user's personal photos)
CREATE TABLE IF NOT EXISTS images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT NULL,
    image_path VARCHAR(255) NOT NULL,
    image_data LONGTEXT NOT NULL,  -- Image data URL (base64)
    caption TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_data LONGTEXT NULL AFTER image_path;
ALTER TABLE images ADD COLUMN IF NOT EXISTS post_id INT NULL AFTER user_id;

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Trigger to keep likes count updated
DELIMITER $$
CREATE TRIGGER update_likes_count_after_insert 
    AFTER INSERT ON likes 
    FOR EACH ROW 
BEGIN 
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
END$$

CREATE TRIGGER update_likes_count_after_delete 
    AFTER DELETE ON likes 
    FOR EACH ROW 
BEGIN 
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
END$$
DELIMITER ;

-- Insert test data (optional)
INSERT IGNORE INTO users (id, username, email, password, email_verified) 
VALUES 
(1, 'TestUser', 'test@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(2, 'AnotherUser', 'another@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(3, 'PhotoLover', 'photo@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE);

-- Insert test posts (optional)
INSERT IGNORE INTO posts (id, user_id, image_path, caption, created_at) 
VALUES 
(1, 1, 'assets/profile/photo1.jpg', 'My first post!', NOW() - INTERVAL 1 DAY),
(2, 2, 'assets/profile/photo2.jpg', 'Cool effect photo', NOW() - INTERVAL 2 HOUR),
(3, 3, 'assets/profile/photo3.jpg', 'Capture test', NOW() - INTERVAL 30 MINUTE),
(4, 1, 'assets/profile/photo1.jpg', 'Another photo', NOW() - INTERVAL 10 MINUTE),
(5, 2, 'assets/profile/photo2.jpg', 'Beautiful day!', NOW() - INTERVAL 5 MINUTE);

-- Insert test likes
INSERT IGNORE INTO likes (user_id, post_id, created_at)
VALUES
(1, 2, NOW() - INTERVAL 1 HOUR),  -- TestUser likes AnotherUser's post
(2, 1, NOW() - INTERVAL 30 MINUTE), -- AnotherUser likes TestUser's post  
(3, 1, NOW() - INTERVAL 15 MINUTE), -- PhotoLover likes TestUser's post
(1, 3, NOW() - INTERVAL 5 MINUTE);  -- TestUser likes PhotoLover's post

-- Insert test comments
INSERT IGNORE INTO comments (user_id, post_id, comment_text, created_at)
VALUES
(1, 1, 'How do you do', NOW() - INTERVAL 1 HOUR),
(1, 2, 'It\'s so beautiful', NOW() - INTERVAL 5 MINUTE),
(2, 1, 'WOW !', NOW() - INTERVAL 15 MINUTE);


