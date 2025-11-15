-- Create employeeDB and employee table (run on DB server)
CREATE DATABASE IF NOT EXISTS employeeDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE employeeDB;
CREATE TABLE IF NOT EXISTS employee (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NULL,
  gender ENUM('male','female') DEFAULT 'male',
  marriage_status ENUM('married','unmarried') DEFAULT 'unmarried',
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
