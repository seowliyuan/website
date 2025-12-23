-- Activity Logs Table Schema
-- This table stores admin activity logs for audit trail purposes

-- Option 1: admin_activity_logs (recommended)
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL, -- e.g., 'user_created', 'food_updated', 'login', 'logout'
  description TEXT, -- Human-readable description of the action
  admin_id UUID, -- ID of the admin who performed the action (can be null for system actions)
  admin_name VARCHAR(255), -- Name/email of the admin
  details JSONB DEFAULT '{}', -- Additional metadata about the action
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_activity_type ON admin_activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id ON admin_activity_logs(admin_id);

-- Option 2: activity_logs (alternative name)
-- CREATE TABLE IF NOT EXISTS activity_logs (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   type VARCHAR(100) NOT NULL,
--   description TEXT,
--   admin_id UUID,
--   admin_name VARCHAR(255),
--   details JSONB DEFAULT '{}',
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Example activity types:
-- - user_created, user_updated, user_deleted, user_enabled, user_disabled
-- - food_created, food_updated, food_deleted
-- - login, logout
-- - settings_updated
-- - system_maintenance_mode_toggled

