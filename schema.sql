-- Users Table for Admin Authentication
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Master Table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL
);

INSERT INTO categories (code, name) VALUES 
('ICE', 'In Case of Emergency'),
('ACDV', 'ACDV (Volunteers)'),
('MDRRMO', 'MDRRMO'),
('PNP', 'PNP'),
('BFP', 'BFP'),
('LGU', 'LGU'),
('RHU', 'RHU'),
('BARANGAY', 'Barangay'),
('SCHOOL', 'School');

-- Contacts Table
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    other_contact VARCHAR(20),
    address TEXT,
    organization VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    fb_link VARCHAR(255),
    category_id INT NOT NULL,
    is_ice BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'resigned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);