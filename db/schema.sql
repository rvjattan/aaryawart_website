-- Database schema for Social & Charity Organization Website
-- Compatible with MySQL / MariaDB

CREATE DATABASE IF NOT EXISTS charity_org
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE charity_org;

-- Table: admins
CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('SUPER_ADMIN', 'EDITOR', 'MODERATOR') NOT NULL DEFAULT 'EDITOR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: volunteers
CREATE TABLE IF NOT EXISTS volunteers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address VARCHAR(255),
  state VARCHAR(100),
  city VARCHAR(100),
  skills VARCHAR(255),
  availability VARCHAR(255),
  registered_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_volunteers_state_city ON volunteers (state, city);
CREATE INDEX idx_volunteers_registered_date ON volunteers (registered_date);

-- Table: blogs
CREATE TABLE IF NOT EXISTS blogs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  featured_image VARCHAR(255),
  category VARCHAR(100),
  content LONGTEXT NOT NULL,
  author VARCHAR(120) NOT NULL,
  publish_date DATE NOT NULL,
  status ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_blogs_status_publish_date ON blogs (status, publish_date);
CREATE INDEX idx_blogs_category ON blogs (category);

-- Table: media
CREATE TABLE IF NOT EXISTS media (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  uploaded_by INT UNSIGNED,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_media_admin FOREIGN KEY (uploaded_by)
    REFERENCES admins(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_media_file_type ON media (file_type);

-- Optional: website activity metrics for impact counters & analytics
CREATE TABLE IF NOT EXISTS stats_counters (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL UNIQUE,
  value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Donations (Razorpay)
CREATE TABLE IF NOT EXISTS donations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  donor_name VARCHAR(120) NOT NULL,
  donor_email VARCHAR(120) NOT NULL,
  amount_paise BIGINT UNSIGNED NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  razorpay_order_id VARCHAR(64) NOT NULL,
  razorpay_payment_id VARCHAR(64) NOT NULL,
  status ENUM('pending', 'captured', 'failed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_donations_razorpay_order (razorpay_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Site Settings - Key-value store for configurable site details
CREATE TABLE IF NOT EXISTS site_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value LONGTEXT NOT NULL,
  setting_type ENUM('text', 'textarea', 'number', 'email', 'url', 'json') NOT NULL DEFAULT 'text',
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default site settings
INSERT IGNORE INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
  ('site_name', 'Aaryawart Seva Nyaas', 'text', 'Organization name'),
  ('site_tagline', 'Seva | Shiksha | Sahyog', 'text', 'Organization tagline'),
  ('site_description', 'A nationwide volunteer movement working in education, healthcare, rural development, women empowerment, disaster relief, and cultural preservation.', 'textarea', 'Site meta description'),
  ('mission_statement', 'To build a harmonious, self-reliant, and compassionate society through organized, selfless service rooted in timeless values.', 'textarea', 'Organization mission'),
  ('vision_statement', 'A nation where every individual is empowered, every village is vibrant, and cultural heritage guides modern progress.', 'textarea', 'Organization vision'),
  ('approach_statement', 'Grassroots initiatives led by trained volunteers, in partnership with communities, institutions, and well-wishers worldwide.', 'textarea', 'Organization approach'),
  ('hero_title', 'Serving Society, Preserving Culture, Empowering Communities', 'text', 'Hero section title'),
  ('hero_subtitle', 'A nationwide volunteer movement working in education, healthcare, rural development, women empowerment, disaster relief, and cultural preservation.', 'textarea', 'Hero section subtitle'),
  ('contact_email', 'contact@aaryawart.org', 'email', 'Main contact email'),
  ('contact_phone', '+91-XXX-XXXX-XXXX', 'text', 'Main contact phone'),
  ('office_address', 'Your Organization Address', 'textarea', 'Physical office address'),
  ('social_facebook', 'https://facebook.com/aaryawart', 'url', 'Facebook profile URL'),
  ('social_twitter', 'https://twitter.com/aaryawart', 'url', 'Twitter profile URL'),
  ('social_instagram', 'https://instagram.com/aaryawart', 'url', 'Instagram profile URL'),
  ('social_youtube', 'https://youtube.com/@aaryawart', 'url', 'YouTube channel URL'),
  ('social_linkedin', 'https://linkedin.com/company/aaryawart', 'url', 'LinkedIn profile URL'),
  ('footer_text', '© 2026 Aaryawart Seva Nyaas. All rights reserved.', 'text', 'Footer copyright text'),
  ('volunteers_impact', '2719', 'number', 'Active volunteers count'),
  ('projects_completed', '3', 'number', 'Projects completed count');

-- Create the first admin by running: node scripts/create_admin.js
-- Default login: username 'superadmin', password 'admin123' (change in production)

