# Data Model: QuestLife 2.0 Extensions

## New Tables

### user_sessions
Manages PIN-based authentication sessions
```sql
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  pin_hash TEXT NOT NULL,
  device_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  is_active BOOLEAN DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_active ON user_sessions(is_active, expires_at);
```

### navigation_state
Tracks user's current navigation position
```sql
CREATE TABLE navigation_state (
  user_id INTEGER PRIMARY KEY,
  current_tab TEXT DEFAULT 'dashboard',
  last_tab TEXT,
  breadcrumbs JSON,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### dashboard_cache
Performance optimization for dashboard data
```sql
CREATE TABLE dashboard_cache (
  user_id INTEGER PRIMARY KEY,
  today_quests JSON,
  character_summary JSON,
  streak_info JSON,
  quick_stats JSON,
  computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Modified Tables

### users (extended)
```sql
ALTER TABLE users ADD COLUMN has_pin BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN pin_setup_at DATETIME;
ALTER TABLE users ADD COLUMN failed_pin_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until DATETIME;
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN preferred_language TEXT DEFAULT 'ko';
```

### goals (extended for CRUD)
```sql
ALTER TABLE goals ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE goals ADD COLUMN deleted_at DATETIME;
ALTER TABLE goals ADD COLUMN is_archived BOOLEAN DEFAULT 0;
ALTER TABLE goals ADD COLUMN progress_percentage INTEGER DEFAULT 0;
```

## TypeScript Interfaces

### Authentication Types
```typescript
// shared/types/auth.ts
export interface UserSession {
  id: string;
  userId: number;
  deviceId?: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface PinSetupRequest {
  pin: string; // 4-6 digits
}

export interface PinVerifyRequest {
  pin: string;
  deviceId?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserProfile;
  message?: string;
}
```

### Navigation Types
```typescript
// shared/types/navigation.ts
export type TabType = 'dashboard' | 'quests' | 'character' | 'goals';

export interface NavigationState {
  currentTab: TabType;
  lastTab?: TabType;
  breadcrumbs: string[];
  updatedAt: Date;
}

export interface NavigationUpdate {
  tab: TabType;
  breadcrumb?: string;
}
```

### Dashboard Types
```typescript
// shared/types/dashboard.ts
export interface DashboardData {
  todayQuests: {
    daily: QuestWithProgress[];
    urgent: QuestWithProgress[];
    upcoming: QuestWithProgress[];
  };
  characterSummary: {
    level: number;
    currentXP: number;
    nextLevelXP: number;
    primaryClass: CharacterClass;
    attributes: CharacterAttributes;
  };
  streakInfo: {
    currentStreak: number;
    multiplier: number;
    lastCompletedDate: Date;
    willBreakAt: Date;
  };
  quickStats: {
    questsCompletedToday: number;
    totalXPToday: number;
    levelProgress: number;
    powerLevel: number;
  };
}

export interface QuestWithProgress extends Quest {
  progress: number;
  isCompletedToday: boolean;
  streakDays?: number;
}
```

### Extended Goal Types
```typescript
// shared/types/goals.ts (extended)
export interface GoalUpdate {
  title?: string;
  description?: string;
  targetDate?: Date;
  milestones?: Milestone[];
  isArchived?: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  targetDate?: Date;
  completed: boolean;
  completedAt?: Date;
  xpReward: number;
}
```

## State Management Schema

### Zustand Store Extensions
```typescript
// client/src/stores/authStore.ts
interface AuthState {
  isAuthenticated: boolean;
  hasPin: boolean;
  sessionToken?: string;
  sessionExpiry?: Date;

  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  logout: () => void;
  checkSession: () => boolean;
}

// client/src/stores/navigationStore.ts
interface NavigationState {
  currentTab: TabType;
  breadcrumbs: string[];

  navigateTo: (tab: TabType) => void;
  pushBreadcrumb: (crumb: string) => void;
  popBreadcrumb: () => void;
}

// client/src/stores/dashboardStore.ts
interface DashboardState {
  data?: DashboardData;
  isLoading: boolean;
  lastFetch?: Date;

  fetchDashboard: () => Promise<void>;
  invalidateCache: () => void;
  quickCompleteQuest: (questId: number) => Promise<void>;
}
```

## Validation Rules

### PIN Validation
- Length: 4-6 digits
- Format: Numeric only
- Attempts: Max 5 failed attempts before 15-minute lockout
- Change frequency: Can change once per 24 hours

### Session Management
- Duration: 7 days default, 30 days with "remember me"
- Idle timeout: 2 hours of inactivity
- Concurrent sessions: Single session per user
- Token refresh: Every 24 hours

### Dashboard Cache
- TTL: 5 minutes for quest data
- TTL: 1 hour for character summary
- Invalidation: On quest completion, level up, class change
- Background refresh: Every 15 minutes when app active

## Migration Strategy
```sql
-- Migration: 001_add_authentication
BEGIN TRANSACTION;

-- Add authentication tables
CREATE TABLE user_sessions (...);
CREATE TABLE navigation_state (...);
CREATE TABLE dashboard_cache (...);

-- Extend existing tables
ALTER TABLE users ADD COLUMN has_pin BOOLEAN DEFAULT 0;
-- ... other alterations

-- Set default values for existing users
UPDATE users SET
  has_pin = 0,
  onboarding_completed = 1,
  preferred_language = 'ko'
WHERE id > 0;

COMMIT;
```

## Indexes for Performance
```sql
-- Optimize dashboard queries
CREATE INDEX idx_quests_user_type_date
  ON quests(user_id, quest_type, created_at);

CREATE INDEX idx_quest_completions_date
  ON quest_completions(user_id, completed_at);

-- Optimize goal queries
CREATE INDEX idx_goals_user_archived
  ON goals(user_id, is_archived, deleted_at);
```

## Data Integrity Constraints
- PIN must be hashed before storage (bcrypt)
- Sessions must expire after defined period
- Soft delete for goals (preserve history)
- Dashboard cache must be invalidated on data changes
- Navigation state must persist across sessions