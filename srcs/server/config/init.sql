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
