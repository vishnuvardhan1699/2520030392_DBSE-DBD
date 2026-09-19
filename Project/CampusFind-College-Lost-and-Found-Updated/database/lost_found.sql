-- CampusFind Database Design (documentation)

CREATE DATABASE campus_lost_found;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student','lecturer') NOT NULL,
  points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  report_type ENUM('Lost','Found') NOT NULL,
  report_date DATE NOT NULL,
  location VARCHAR(150) NOT NULL,
  contact VARCHAR(100) NOT NULL,
  reporter_id INT,
  status ENUM('Active','Recovered') DEFAULT 'Active',
  image_url TEXT,
  reward_points INT DEFAULT 25,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id)
);

CREATE TABLE claims (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL,
  claimant_id INT NOT NULL,
  claimant_name VARCHAR(100) NOT NULL,
  claimant_contact VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (claimant_id) REFERENCES users(id)
);

-- Relationships
-- users 1 ---- N items
-- users 1 ---- N claims
-- items 1 ---- N claims

-- Reward rule
-- A user reports an item as Found -> reward_points = 25.
-- The reporter confirms the owner collected it -> item status becomes Recovered.
-- The Found reporter then receives +25 points in users.points.
