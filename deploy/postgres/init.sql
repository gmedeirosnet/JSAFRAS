-- Database initialization script for DevSecOps Interview Task
-- This script runs automatically when the PostgreSQL container starts

CREATE TABLE IF NOT EXISTS device_registrations (
    id SERIAL PRIMARY KEY,
    user_key VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_device_type CHECK (device_type IN ('iOS', 'Android', 'Watch', 'TV'))
);

CREATE INDEX IF NOT EXISTS idx_device_type ON device_registrations(device_type);

CREATE INDEX IF NOT EXISTS idx_user_key ON device_registrations(user_key);
