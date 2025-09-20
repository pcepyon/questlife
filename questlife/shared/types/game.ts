// Core game type definitions for QuestLife

export interface CharacterClass {
  id: string;
  userId: string;
  name: string;
  description: string;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  status: 'active' | 'mastered' | 'evolved';
  targetLevel?: number;
  ultimateGoal?: string;
  createdAt: Date;
  masteredAt?: Date;
  plannedEvolutions?: string[];
  baseClassIds?: string[];
}

export interface Quest {
  id: string;
  classId: string;
  type: 'daily' | 'weekly' | 'special' | 'milestone';
  title: string;
  description: string;
  xpReward: number;
  status: 'pending' | 'completed' | 'expired' | 'failed';
  difficulty: 1 | 2 | 3 | 4 | 5;
  levelTrigger?: number;
  timeLimit?: number;
  expiresAt?: Date;
  createdAt: Date;
  completedAt?: Date;
  attemptCount: number;
  lastAttemptedAt?: Date;
  completionNotes?: string;
  xpGained?: number;
  streakBonusApplied?: boolean;
}

export interface Goal {
  id: string;
  classId: string;
  originalText: string;
  processedGoal?: string;
  timeframe?: number;
  milestones?: Milestone[];
  weeklyTimeCommitment?: number;
  createdAt: Date;
  modifiedAt?: Date;
  status: 'active' | 'completed' | 'archived';
  archivedAt?: Date;
  completionPercentage: number;
  notes?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface Achievement {
  id: string;
  userId: string;
  type: string;
  name: string;
  description: string;
  icon?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  xpBonus?: number;
}

export interface ProgressStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  multiplier: number;
  lastCompletionDate?: Date;
  streakMilestones?: StreakMilestone[];
}

export interface StreakMilestone {
  days: number;
  multiplier: number;
  achieved: boolean;
  achievedAt?: Date;
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
  permanentBonuses?: PermanentBonus[];
  updatedAt: Date;
}

export interface PermanentBonus {
  source: string;
  attribute: keyof Pick<CharacterStatus, 'strength' | 'wisdom' | 'creativity' | 'discipline' | 'charisma'>;
  value: number;
  appliedAt: Date;
}

export interface ClassEvolution {
  id: string;
  userId: string;
  baseClass1Id: string;
  baseClass2Id: string;
  evolvedClassId?: string;
  evolutionName: string;
  evolutionDescription?: string;
  status: 'planned' | 'ready' | 'completed';
  unlockedAt?: Date;
  evolvedAt?: Date;
}

export interface SkillTree {
  id: string;
  classId: string;
  skills: Skill[];
  availablePoints: number;
  totalPointsEarned: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon?: string;
  maxLevel: number;
  currentLevel: number;
  prerequisites?: string[];
  effects?: SkillEffect[];
}

export interface SkillEffect {
  type: 'stat_boost' | 'xp_multiplier' | 'unlock_feature';
  target?: string;
  value: number | string;
  description: string;
}

export interface MasteryReward {
  id: string;
  classId: string;
  userId: string;
  title: string;
  badge?: string;
  statBonuses?: Record<string, number>;
  effectColor?: string;
  particleEffect?: string;
  awardedAt: Date;
}

export interface XPMultiplier {
  id: string;
  userId: string;
  questId: string;
  baseXp: number;
  multiplierValue: number;
  reason: string;
  finalXp: number;
  appliedAt: Date;
}