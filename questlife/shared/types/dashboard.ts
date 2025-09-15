// Dashboard interfaces for QuestLife 2.0

import { CharacterClass, Quest, Achievement, ProgressStreak } from './game';

export interface DashboardData {
  todayQuests: DashboardQuest[];
  weeklyProgress: WeeklyProgress;
  activeClasses: DashboardClass[];
  recentAchievements: Achievement[];
  streakInfo: StreakInfo;
  statsummary: StatsSummary;
  lastUpdated: Date;
}

export interface DashboardQuest {
  id: string;
  classId: string;
  className: string;
  classColor?: string;
  type: 'daily' | 'weekly' | 'special';
  title: string;
  description: string;
  xpReward: number;
  xpWithBonus?: number;
  status: 'pending' | 'completed' | 'expired';
  difficulty: 1 | 2 | 3 | 4 | 5;
  expiresAt?: Date;
  completedAt?: Date;
}

export interface WeeklyProgress {
  totalXpEarned: number;
  questsCompleted: number;
  questsTotal: number;
  daysActive: number;
  weeklyGoal: number;
  progressPercentage: number;
  topPerformingClass?: {
    id: string;
    name: string;
    xpEarned: number;
  };
}

export interface DashboardClass {
  id: string;
  name: string;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  progressPercentage: number;
  questsAvailable: number;
  questsCompletedToday: number;
  status: 'active' | 'mastered' | 'evolved';
  icon?: string;
  color?: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  multiplier: number;
  lastCompletionDate?: Date;
  nextMilestone?: {
    days: number;
    multiplier: number;
  };
  willBreakAt?: Date;
}

export interface StatsSummary {
  totalPowerLevel: number;
  totalQuestsCompleted: number;
  totalXpEarned: number;
  averageDailyXp: number;
  masteredClasses: number;
  activeClasses: number;
  attributes: CharacterAttributes;
}

export interface CharacterAttributes {
  strength: number;
  wisdom: number;
  creativity: number;
  discipline: number;
  charisma: number;
}

export interface DashboardCache {
  id: string;
  userId: string;
  cacheKey: string;
  todayQuests: DashboardQuest[];
  weeklyProgress: WeeklyProgress;
  activeClasses: DashboardClass[];
  recentAchievements: Achievement[];
  streakInfo: StreakInfo;
  statsSummary: StatsSummary;
  cachedAt: Date;
  expiresAt: Date;
}

export interface QuickCompleteRequest {
  questId: string;
  notes?: string;
}

export interface QuickCompleteResponse {
  success: boolean;
  xpGained: number;
  levelUp?: {
    className: string;
    newLevel: number;
    unlockedFeatures?: string[];
  };
  streakUpdate?: {
    newStreak: number;
    newMultiplier: number;
  };
  achievement?: Achievement;
  updatedDashboard?: Partial<DashboardData>;
  message?: string;
}

export interface DashboardStatsRequest {
  timeRange?: 'day' | 'week' | 'month' | 'all';
  includeDetails?: boolean;
}

export interface DashboardStatsResponse {
  stats: StatsSummary;
  chartData?: {
    xpOverTime: Array<{ date: string; xp: number }>;
    questCompletionRate: Array<{ date: string; completed: number; total: number }>;
    classProgress: Array<{ className: string; level: number; xp: number }>;
  };
  insights?: string[];
}