export interface User {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    theme: 'dark' | 'light';
    notifications: boolean;
    soundEffects: boolean;
  };
}

export interface CharacterClass {
  id: string;
  userId: string;
  name: string;
  description: string;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  status: 'active' | 'mastered' | 'evolved';
  targetLevel: number;
  ultimateGoal: string;
  createdAt: Date;
  masteredAt?: Date;
  plannedEvolutions: string[];
  baseClassIds?: string[];
}

export interface Quest {
  id: string;
  classId: string;
  type: 'daily' | 'weekly' | 'monthly' | 'urgent' | 'special';
  title: string;
  description: string;
  xpReward: number;
  status: 'pending' | 'active' | 'completed' | 'expired';
  difficulty: 1 | 2 | 3 | 4 | 5;
  levelTrigger?: number;
  timeLimit?: number;
  expiresAt?: Date;
  createdAt: Date;
  completedAt?: Date;
  attemptCount: number;
  lastAttemptedAt?: Date;
}

export interface Goal {
  id: string;
  classId: string;
  originalText: string;
  processedGoal: string;
  timeframe: number;
  milestones: {
    month: number;
    description: string;
    achieved: boolean;
  }[];
  weeklyTimeCommitment: number;
  createdAt: Date;
  modifiedAt?: Date;
}

export interface ClassEvolution {
  id: string;
  userId: string;
  baseClass1Id: string;
  baseClass2Id: string;
  evolvedClassId?: string;
  evolutionName: string;
  evolutionDescription: string;
  status: 'planned' | 'ready' | 'completed';
  unlockedAt?: Date;
  evolvedAt?: Date;
}

export interface Achievement {
  id: string;
  userId: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  xpBonus?: number;
}

export interface CharacterStatus {
  id: string;
  userId: string;
  strength: number;
  wisdom: number;
  creativity: number;
  discipline: number;
  charisma: number;
  totalPowerLevel: number;
  masteredClassCount: number;
  totalQuestsCompleted: number;
  permanentBonuses: {
    attributeType: string;
    value: number;
    source: string;
  }[];
  updatedAt: Date;
}

export interface MasteryReward {
  id: string;
  classId: string;
  userId: string;
  title: string;
  badge: string;
  statBonuses: {
    strength?: number;
    wisdom?: number;
    creativity?: number;
    discipline?: number;
    charisma?: number;
  };
  effectColor: string;
  particleEffect: string;
  awardedAt: Date;
}

export interface SkillTree {
  id: string;
  classId: string;
  skills: {
    id: string;
    name: string;
    description: string;
    tier: 1 | 2 | 3;
    requiredLevel: number;
    requiredSkills: string[];
    unlocked: boolean;
    unlockedAt?: Date;
    xpMultiplier?: number;
    questBonus?: string;
    specialAbility?: string;
  }[];
  availablePoints: number;
  totalPointsEarned: number;
}

export interface ProgressStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  multiplier: number;
  lastCompletionDate: Date;
  streakMilestones: {
    days: number;
    achieved: boolean;
    achievedAt?: Date;
    reward?: string;
  }[];
}

export interface XPMultiplier {
  id: string;
  userId: string;
  questId: string;
  baseXP: number;
  multiplierValue: number;
  reason: 'streak' | 'urgent' | 'perfect_week' | 'special_event';
  finalXP: number;
  appliedAt: Date;
}