-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  settings TEXT DEFAULT '{"theme":"dark","notifications":true,"soundEffects":true}'
);

-- Character classes
CREATE TABLE IF NOT EXISTS character_classes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  xp_to_next_level INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active',
  target_level INTEGER,
  ultimate_goal TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  mastered_at DATETIME,
  planned_evolutions TEXT DEFAULT '[]',
  base_class_ids TEXT DEFAULT '[]',
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Quests
CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  difficulty INTEGER DEFAULT 1,
  level_trigger INTEGER,
  time_limit INTEGER,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  attempt_count INTEGER DEFAULT 0,
  last_attempted_at DATETIME,
  FOREIGN KEY (class_id) REFERENCES character_classes(id)
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  original_text TEXT NOT NULL,
  processed_goal TEXT,
  timeframe INTEGER,
  milestones TEXT DEFAULT '[]',
  weekly_time_commitment INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME,
  FOREIGN KEY (class_id) REFERENCES character_classes(id)
);

-- Class evolutions
CREATE TABLE IF NOT EXISTS class_evolutions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  base_class1_id TEXT NOT NULL,
  base_class2_id TEXT NOT NULL,
  evolved_class_id TEXT,
  evolution_name TEXT NOT NULL,
  evolution_description TEXT,
  status TEXT DEFAULT 'planned',
  unlocked_at DATETIME,
  evolved_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (base_class1_id) REFERENCES character_classes(id),
  FOREIGN KEY (base_class2_id) REFERENCES character_classes(id),
  FOREIGN KEY (evolved_class_id) REFERENCES character_classes(id)
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  rarity TEXT DEFAULT 'common',
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  xp_bonus INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Character status (one per user)
CREATE TABLE IF NOT EXISTS character_status (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  strength INTEGER DEFAULT 10,
  wisdom INTEGER DEFAULT 10,
  creativity INTEGER DEFAULT 10,
  discipline INTEGER DEFAULT 10,
  charisma INTEGER DEFAULT 10,
  total_power_level INTEGER DEFAULT 50,
  mastered_class_count INTEGER DEFAULT 0,
  total_quests_completed INTEGER DEFAULT 0,
  permanent_bonuses TEXT DEFAULT '[]',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Mastery rewards
CREATE TABLE IF NOT EXISTS mastery_rewards (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  badge TEXT,
  stat_bonuses TEXT DEFAULT '{}',
  effect_color TEXT,
  particle_effect TEXT,
  awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES character_classes(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Skill trees
CREATE TABLE IF NOT EXISTS skill_trees (
  id TEXT PRIMARY KEY,
  class_id TEXT UNIQUE NOT NULL,
  skills TEXT NOT NULL DEFAULT '[]',
  available_points INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  FOREIGN KEY (class_id) REFERENCES character_classes(id)
);

-- Progress streaks (one per user)
CREATE TABLE IF NOT EXISTS progress_streaks (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  multiplier REAL DEFAULT 1.0,
  last_completion_date DATE,
  streak_milestones TEXT DEFAULT '[]',
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- XP multipliers log
CREATE TABLE IF NOT EXISTS xp_multipliers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  base_xp INTEGER NOT NULL,
  multiplier_value REAL NOT NULL,
  reason TEXT NOT NULL,
  final_xp INTEGER NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (quest_id) REFERENCES quests(id)
);

-- Goal cache for OpenAI responses
CREATE TABLE IF NOT EXISTS goal_cache (
  goal_hash TEXT PRIMARY KEY,
  generated_class TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  hit_count INTEGER DEFAULT 1
);

-- Optimized indexes for quest tracking
CREATE INDEX IF NOT EXISTS idx_classes_user ON character_classes(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_class ON quests(class_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quests_composite ON quests(class_id, status, type);
CREATE INDEX IF NOT EXISTS idx_quests_expires ON quests(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_class ON goals(class_id);
CREATE INDEX IF NOT EXISTS idx_quests_completed ON quests(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classes_active ON character_classes(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cache_expires ON goal_cache(expires_at);