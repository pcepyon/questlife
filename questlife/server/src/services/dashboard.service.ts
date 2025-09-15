import { DashboardCacheModel, DashboardData } from '../models/dashboardCache.model.js';
import { getDatabase } from '../db/index.js';

export interface QuickCompleteResult {
  questId: string;
  xpGained: number;
  levelUp: boolean;
  newLevel: number;
  streakMaintained: boolean;
  newStreak: number;
  multiplierApplied?: number;
  updatedStats: {
    totalXP: number;
    currentLevel: number;
    currentStreak: number;
    questsCompletedToday: number;
  };
}

export class DashboardService {
  private static db = getDatabase();

  /**
   * Get aggregated dashboard data for a user
   */
  static async getDashboardData(userId: string, useCache: boolean = true): Promise<DashboardData> {
    try {
      // Check cache first
      if (useCache) {
        const cached = DashboardCacheModel.get(userId);
        if (cached) {
          return cached.cacheData;
        }
      }

      // Aggregate fresh data
      const data = await this.aggregateDashboardData(userId);

      // Cache the results
      DashboardCacheModel.set(userId, data);

      return data;
    } catch (error) {
      console.error('Dashboard data aggregation error:', error);
      // Return empty state on error
      return this.getEmptyDashboardData();
    }
  }

  /**
   * Quick quest completion from dashboard
   */
  static async quickCompleteQuest(userId: string, questId: string): Promise<QuickCompleteResult> {
    try {
      // Check if quest exists and belongs to user
      const quest = this.findQuestForUser(userId, questId);
      if (!quest) {
        throw new Error('Quest not found');
      }

      if (quest.status === 'completed') {
        throw new Error('Quest already completed');
      }

      // Get current streak
      const streak = this.getCurrentStreak(userId);
      const multiplier = this.getStreakMultiplier(streak.currentStreak);

      // Calculate XP with multipliers
      const baseXP = quest.xpReward || 10;
      const finalXP = Math.floor(baseXP * multiplier);

      // Complete the quest
      this.completeQuest(questId, finalXP);

      // Update user stats
      const stats = this.updateUserStats(userId, finalXP);

      // Update streak
      const newStreak = this.updateStreak(userId);
      const levelUpInfo = this.checkLevelUp(userId, stats.totalXP);

      // Invalidate dashboard cache
      DashboardCacheModel.invalidate(userId);

      return {
        questId,
        xpGained: finalXP,
        levelUp: levelUpInfo.levelUp,
        newLevel: levelUpInfo.level,
        streakMaintained: newStreak.maintained,
        newStreak: newStreak.currentStreak,
        multiplierApplied: multiplier > 1 ? multiplier : undefined,
        updatedStats: {
          totalXP: stats.totalXP,
          currentLevel: levelUpInfo.level,
          currentStreak: newStreak.currentStreak,
          questsCompletedToday: stats.questsCompletedToday
        }
      };
    } catch (error: any) {
      console.error('Quick complete quest error:', error);
      throw new Error(error.message || 'Failed to complete quest');
    }
  }

  /**
   * Invalidate user's dashboard cache
   */
  static invalidateCache(userId: string): boolean {
    return DashboardCacheModel.invalidate(userId);
  }

  /**
   * Aggregate dashboard data from database
   */
  private static async aggregateDashboardData(userId: string): Promise<DashboardData> {
    const stats = this.getUserStats(userId);
    const todayQuests = this.getTodayQuests(userId);
    const activeClasses = this.getActiveClasses(userId);
    const recentAchievements = this.getRecentAchievements(userId);

    return {
      stats,
      todayQuests,
      activeClasses,
      recentAchievements
    };
  }

  /**
   * Get user statistics
   */
  private static getUserStats(userId: string): DashboardData['stats'] {
    // Get total XP and level
    const xpQuery = this.db.prepare(`
      SELECT
        COALESCE(SUM(cc.current_xp), 0) as totalXP,
        MAX(cc.level) as currentLevel
      FROM character_classes cc
      WHERE cc.user_id = ?
    `);
    const xpResult = xpQuery.get(userId) as any;
    const totalXP = xpResult?.totalXP || 0;
    const currentLevel = xpResult?.currentLevel || 1;

    // Get streak info
    const streakQuery = this.db.prepare(`
      SELECT
        current_streak,
        multiplier
      FROM progress_streaks
      WHERE user_id = ?
    `);
    const streakResult = streakQuery.get(userId) as any;
    const currentStreak = streakResult?.current_streak || 0;
    const streakMultiplier = streakResult?.multiplier || 1;

    // Get today's completed quests count
    const todayQuestsQuery = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM quests
      WHERE user_id = ? AND status = 'completed'
      AND DATE(completed_at) = DATE('now')
    `);
    const todayResult = todayQuestsQuery.get(userId) as any;
    const questsCompletedToday = todayResult?.count || 0;

    // Get total completed quests
    const totalQuestsQuery = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM quests
      WHERE user_id = ? AND status = 'completed'
    `);
    const totalResult = totalQuestsQuery.get(userId) as any;
    const totalQuestsCompleted = totalResult?.count || 0;

    return {
      totalXP,
      currentLevel,
      currentStreak,
      streakMultiplier,
      questsCompletedToday,
      totalQuestsCompleted
    };
  }

  /**
   * Get today's quests
   */
  private static getTodayQuests(userId: string): DashboardData['todayQuests'] {
    const query = this.db.prepare(`
      SELECT
        q.id,
        q.title,
        q.description,
        q.type,
        q.xp_reward as xpReward,
        CASE WHEN q.status = 'completed' THEN 1 ELSE 0 END as completed,
        q.class_id as classId
      FROM quests q
      JOIN character_classes cc ON q.class_id = cc.id
      WHERE cc.user_id = ?
      AND (q.type = 'daily' OR (q.type = 'weekly' AND DATE(q.created_at) >= DATE('now', 'weekday 0', '-6 days')))
      AND q.status IN ('pending', 'active', 'completed')
      ORDER BY
        CASE q.type
          WHEN 'daily' THEN 1
          WHEN 'weekly' THEN 2
          ELSE 3
        END,
        q.created_at DESC
      LIMIT 20
    `);

    const rows = query.all(userId) as any[];
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type as 'daily' | 'weekly' | 'special',
      xpReward: row.xpReward,
      completed: row.completed === 1,
      classId: row.classId
    }));
  }

  /**
   * Get active character classes
   */
  private static getActiveClasses(userId: string): DashboardData['activeClasses'] {
    const query = this.db.prepare(`
      SELECT
        id,
        name,
        level,
        current_xp as currentXP,
        target_level,
        icon
      FROM character_classes
      WHERE user_id = ? AND status = 'active'
      ORDER BY level DESC, current_xp DESC
      LIMIT 5
    `);

    const rows = query.all(userId) as any[];
    return rows.map(row => {
      const requiredXP = this.calculateXPForLevel(row.level + 1) - this.calculateXPForLevel(row.level);
      return {
        id: row.id,
        name: row.name,
        level: row.level,
        currentXP: row.currentXP,
        requiredXP,
        icon: row.icon || '⚡'
      };
    });
  }

  /**
   * Get recent achievements
   */
  private static getRecentAchievements(userId: string): DashboardData['recentAchievements'] {
    const query = this.db.prepare(`
      SELECT
        id,
        name as title,
        description,
        unlocked_at as unlockedAt,
        icon
      FROM achievements
      WHERE user_id = ?
      ORDER BY unlocked_at DESC
      LIMIT 5
    `);

    const rows = query.all(userId) as any[];
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      unlockedAt: row.unlockedAt,
      icon: row.icon || '🏆'
    }));
  }

  /**
   * Find quest for user
   */
  private static findQuestForUser(userId: string, questId: string): any {
    const query = this.db.prepare(`
      SELECT q.*, cc.user_id
      FROM quests q
      JOIN character_classes cc ON q.class_id = cc.id
      WHERE q.id = ? AND cc.user_id = ?
    `);
    return query.get(questId, userId);
  }

  /**
   * Complete a quest
   */
  private static completeQuest(questId: string, finalXP: number): void {
    const query = this.db.prepare(`
      UPDATE quests
      SET status = 'completed', completed_at = datetime('now'), xp_reward = ?
      WHERE id = ?
    `);
    query.run(finalXP, questId);
  }

  /**
   * Get current streak for user
   */
  private static getCurrentStreak(userId: string): { currentStreak: number; multiplier: number } {
    const query = this.db.prepare(`
      SELECT current_streak, multiplier
      FROM progress_streaks
      WHERE user_id = ?
    `);
    const result = query.get(userId) as any;
    return {
      currentStreak: result?.current_streak || 0,
      multiplier: result?.multiplier || 1
    };
  }

  /**
   * Calculate streak multiplier
   */
  private static getStreakMultiplier(streak: number): number {
    if (streak >= 7) return 3.0;  // 3x for 7+ day streak
    if (streak >= 3) return 2.0;  // 2x for 3-6 day streak
    return 1.0;                   // 1x for less than 3 days
  }

  /**
   * Update user stats after quest completion
   */
  private static updateUserStats(userId: string, xpGained: number): { totalXP: number; questsCompletedToday: number } {
    // This would normally update character_classes or user stats
    // For now, we'll just return calculated values
    const stats = this.getUserStats(userId);
    return {
      totalXP: stats.totalXP + xpGained,
      questsCompletedToday: stats.questsCompletedToday + 1
    };
  }

  /**
   * Update streak information
   */
  private static updateStreak(userId: string): { currentStreak: number; maintained: boolean } {
    const today = new Date().toISOString().split('T')[0];

    // Get or create streak record
    let streakQuery = this.db.prepare(`
      SELECT * FROM progress_streaks WHERE user_id = ?
    `);
    let streak = streakQuery.get(userId) as any;

    if (!streak) {
      // Create new streak
      const insertQuery = this.db.prepare(`
        INSERT INTO progress_streaks (id, user_id, current_streak, longest_streak, multiplier, last_completion_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const streakId = `streak_${userId}_${Date.now()}`;
      insertQuery.run(streakId, userId, 1, 1, 1, today);
      return { currentStreak: 1, maintained: true };
    }

    const lastCompletion = streak.last_completion_date?.split('T')[0];
    let newStreak = streak.current_streak;
    let maintained = true;

    if (lastCompletion === today) {
      // Already completed today
      maintained = true;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastCompletion === yesterdayStr) {
        // Continuing streak
        newStreak += 1;
        maintained = true;
      } else if (!lastCompletion || lastCompletion < yesterdayStr) {
        // Streak broken, restart
        newStreak = 1;
        maintained = false;
      }

      // Update streak
      const updateQuery = this.db.prepare(`
        UPDATE progress_streaks
        SET current_streak = ?, longest_streak = MAX(longest_streak, ?),
            multiplier = ?, last_completion_date = ?
        WHERE user_id = ?
      `);
      const multiplier = this.getStreakMultiplier(newStreak);
      updateQuery.run(newStreak, newStreak, multiplier, today, userId);
    }

    return { currentStreak: newStreak, maintained };
  }

  /**
   * Check if user leveled up
   */
  private static checkLevelUp(userId: string, totalXP: number): { levelUp: boolean; level: number } {
    const currentLevel = Math.floor(totalXP / 1000) + 1; // Simple level calculation
    const stats = this.getUserStats(userId);
    return {
      levelUp: currentLevel > stats.currentLevel,
      level: currentLevel
    };
  }

  /**
   * Calculate XP required for a specific level
   */
  private static calculateXPForLevel(level: number): number {
    // Simple exponential growth: level^2 * 100
    return Math.floor(Math.pow(level, 2) * 100);
  }

  /**
   * Get empty dashboard data for new users
   */
  private static getEmptyDashboardData(): DashboardData {
    return {
      stats: {
        totalXP: 0,
        currentLevel: 1,
        currentStreak: 0,
        streakMultiplier: 1,
        questsCompletedToday: 0,
        totalQuestsCompleted: 0
      },
      todayQuests: [],
      activeClasses: [],
      recentAchievements: []
    };
  }

  /**
   * Clean up expired cache entries
   */
  static cleanupCache(): number {
    return DashboardCacheModel.cleanup();
  }

  /**
   * Force refresh dashboard data (bypass cache)
   */
  static async refreshDashboard(userId: string): Promise<DashboardData> {
    DashboardCacheModel.invalidate(userId);
    return this.getDashboardData(userId, false);
  }

  /**
   * Start scheduled cache cleanup task
   * Cleans up expired cache entries every hour
   */
  static startScheduledCleanup(): NodeJS.Timeout {
    const cleanupInterval = 60 * 60 * 1000; // 1 hour in milliseconds

    return setInterval(() => {
      try {
        const deletedCount = DashboardService.cleanupCache();
        if (deletedCount > 0) {
          console.log(`Dashboard cache cleanup: removed ${deletedCount} expired entries`);
        }
      } catch (error) {
        console.error('Dashboard cache cleanup error:', error);
      }
    }, cleanupInterval);
  }

  /**
   * Stop scheduled cache cleanup task
   */
  static stopScheduledCleanup(interval: NodeJS.Timeout): void {
    if (interval) {
      clearInterval(interval);
    }
  }
}