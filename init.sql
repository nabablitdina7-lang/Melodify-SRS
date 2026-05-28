-- Create database and admin user automatically
CREATE DATABASE IF NOT EXISTS melodify;
USE melodify;

-- Create admin user (password: admin123)
INSERT INTO users (email, password, role) 
SELECT 'admin@gmail.com', '$2a$10$N.Zq9wWq4Xq5Xq5Xq5Xq5Oq5Xq5Xq5Xq5Xq5Xq5Xq5Xq5Xq5Xq5', 'ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@gmail.com');