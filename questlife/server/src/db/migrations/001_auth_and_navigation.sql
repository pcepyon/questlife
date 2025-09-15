-- Migration 001: Single User Local App Setup
-- Created: 2025-09-15
-- Description: Add tables for local single-user app with PIN auth

-- Since this is a local single-user app, we'll use a simplified structure
-- Add PIN fields to users table (single user)
ALTER TABLE users ADD COLUMN pin_hash TEXT;
ALTER TABLE users ADD COLUMN pin_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN pin_locked_until TEXT;

-- User sessions table for JWT management
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_activity TEXT DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Navigation state table
CREATE TABLE IF NOT EXISTS navigation_state (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  current_tab TEXT DEFAULT 'dashboard',
  last_visited_dashboard TEXT,
  last_visited_quests TEXT,
  last_visited_character TEXT,
  last_visited_goals TEXT,
  onboarding_completed INTEGER DEFAULT 0,
  tutorial_step INTEGER DEFAULT 0,
  badge_quests INTEGER DEFAULT 0,
  badge_character INTEGER DEFAULT 0,
  badge_goals INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_navigation_state_user_id ON navigation_state(user_id);

-- Dashboard cache table
CREATE TABLE IF NOT EXISTS dashboard_cache (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  cache_data TEXT NOT NULL, -- JSON string
  cache_key TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_dashboard_cache_user_id ON dashboard_cache(user_id);
CREATE INDEX idx_dashboard_cache_expires_at ON dashboard_cache(expires_at);

-- Add fields to goals table for CRUD operations
ALTER TABLE goals ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE goals ADD COLUMN deleted_at TEXT;
ALTER TABLE goals ADD COLUMN archived INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN priority TEXT DEFAULT 'medium';
ALTER TABLE goals ADD COLUMN deadline TEXT;
-- milestones column already exists in schema

-- Add quest history tracking
CREATE TABLE IF NOT EXISTS quest_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  quest_title TEXT NOT NULL,
  quest_type TEXT NOT NULL,
  class_id TEXT,
  xp_gained INTEGER NOT NULL,
  multiplier_applied REAL DEFAULT 1.0,
  completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE SET NULL,
  FOREIGN KEY (class_id) REFERENCES character_classes(id) ON DELETE SET NULL
);

CREATE INDEX idx_quest_history_user_id ON quest_history(user_id);
CREATE INDEX idx_quest_history_completed_at ON quest_history(completed_at);