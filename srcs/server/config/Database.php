<?php
/**
 * CAMAGRU - Database Configuration
 * Manage connection to the MySQL database using PDO
 * DOCS: https://www.php.net/manual/en/
 * ATTR：https://www.php.net/manual/en/pdo.setattribute.php
 */

class Database {
    // Connection variables
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $conn;

    // Constructor - retrieves parameters from environment variables
    public function __construct() {
        $this->host = $_ENV['DB_HOST'] ?? 'database';
        $this->db_name = $_ENV['DB_NAME'] ?? 'camagru';
        $this->username = $_ENV['DB_USER'] ?? 'root';
        $this->password = $_ENV['DB_PASSWORD'] ?? 'password';
    }

    // Create and return a PDO connection to the database
    public function getConnection() {
        $this->conn = null;

        try {
            // Create PDO instance with error handling and UTF-8 encoding
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8",
                $this->username,
                $this->password,
                [
                    // ERRMODE_EXCEPTION: Exception is thrown on error
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,

                    // FETCH_ASSOC: Results are returned as associative arrays
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

                    // EMULATE_PREPARES = false: Use real MySQL prepared statements
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            throw new Exception("Database connection failed");
        }

        return $this->conn;
    }
}