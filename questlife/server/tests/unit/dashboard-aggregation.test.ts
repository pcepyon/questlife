import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock data types
interface Quest {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'special';
  xpReward: number;
  status: 'available' | 'in_progress' | 'completed';
  completedAt?: Date;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface CharacterClass {
  id: string;
  name: string;
  level: number;
  totalXP: number;
  isActive: boolean;
}

interface ProgressStreak {
  id: string;
  startDate: Date;
  endDate?: Date;
  count: number;
  isActive: boolean;
}

interface DashboardStats {
  totalClasses: number;
  completedQuests: number;
  totalXP: number;
  maxStreak: number;
  todayXP: number;
  weeklyXP: number;
  completionRate: number;
}

// Dashboard aggregation logic
export class DashboardAggregator {
  static aggregateStats(
    classes: CharacterClass[],
    quests: Quest[],
    streaks: ProgressStreak[]
  ): DashboardStats {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week

    // Total classes
    const totalClasses = classes.length;

    // Completed quests
    const completedQuests = quests.filter(q => q.status === 'completed').length;

    // Total XP
    const totalXP = classes.reduce((sum, cls) => sum + cls.totalXP, 0);

    // Max streak
    const maxStreak = streaks.length > 0 ? Math.max(...streaks.map(s => s.count)) : 0;

    // Today's XP
    const todayQuests = quests.filter(q =>
      q.status === 'completed' &&
      q.completedAt &&
      q.completedAt >= today &&
      q.completedAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    );
    const todayXP = todayQuests.reduce((sum, q) => sum + q.xpReward, 0);

    // Weekly XP
    const weeklyQuests = quests.filter(q =>
      q.status === 'completed' &&
      q.completedAt &&
      q.completedAt >= weekStart
    );
    const weeklyXP = weeklyQuests.reduce((sum, q) => sum + q.xpReward, 0);

    // Completion rate (today's completed vs available)
    const todayAvailableQuests = quests.filter(q => q.type === 'daily');
    const todayCompletedQuests = todayQuests.filter(q => q.type === 'daily');
    const completionRate = todayAvailableQuests.length > 0
      ? Math.round((todayCompletedQuests.length / todayAvailableQuests.length) * 100)
      : 0;

    return {
      totalClasses,
      completedQuests,
      totalXP,
      maxStreak,
      todayXP,
      weeklyXP,
      completionRate
    };
  }

  static calculateCurrentStreak(streaks: ProgressStreak[]): number {
    const activeStreak = streaks.find(s => s.isActive);
    return activeStreak ? activeStreak.count : 0;
  }

  static getActiveCharacter(classes: CharacterClass[]): CharacterClass | null {
    return classes.find(cls => cls.isActive) || null;
  }

  static getTodayQuests(quests: Quest[]): Quest[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return quests.filter(q => {
      // Daily quests are always shown for today
      if (q.type === 'daily') return true;

      // Weekly quests if not completed this week
      if (q.type === 'weekly') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        return !(q.status === 'completed' &&
                q.completedAt &&
                q.completedAt >= weekStart);
      }

      // Special quests if available
      return q.status === 'available';
    });
  }

  static calculateWeeklyProgress(quests: Quest[]): Array<{ name: string; completed: number; total: number }> {
    const categories = ['운동', '독서', '학습', '개인 관리'];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    return categories.map(category => {
      const categoryQuests = quests.filter(q =>
        q.title.includes(category) ||
        this.getCategoryFromQuest(q) === category
      );

      const total = categoryQuests.filter(q => q.type === 'daily' || q.type === 'weekly').length;
      const completed = categoryQuests.filter(q =>
        q.status === 'completed' &&
        q.completedAt &&
        q.completedAt >= weekStart
      ).length;

      return { name: category, completed: Math.min(completed, total), total };
    });
  }

  private static getCategoryFromQuest(quest: Quest): string {
    const title = quest.title.toLowerCase();
    if (title.includes('운동') || title.includes('스트레칭')) return '운동';
    if (title.includes('읽기') || title.includes('독서')) return '독서';
    if (title.includes('학습') || title.includes('공부') || title.includes('언어')) return '학습';
    return '개인 관리';
  }

  static optimizeQuery(filters: any = {}): { useCache: boolean; cacheKey: string } {
    const now = new Date();
    const cacheKey = `dashboard_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;

    // Use cache if requesting current day data without specific filters
    const useCache = Object.keys(filters).length === 0;

    return { useCache, cacheKey };
  }
}

describe('Dashboard Aggregation', () => {
  let mockClasses: CharacterClass[];
  let mockQuests: Quest[];
  let mockStreaks: ProgressStreak[];

  beforeEach(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    mockClasses = [
      { id: '1', name: '헬스 마스터', level: 15, totalXP: 2340, isActive: true },
      { id: '2', name: '독서왕', level: 10, totalXP: 1500, isActive: false },
      { id: '3', name: '학습자', level: 8, totalXP: 1200, isActive: false }
    ];

    mockQuests = [
      {
        id: '1',
        title: '30분 운동하기',
        type: 'daily',
        xpReward: 100,
        status: 'completed',
        completedAt: new Date(today.getTime() + 2 * 60 * 60 * 1000), // Today 2 hours ago
        difficulty: 'medium'
      },
      {
        id: '2',
        title: '책 30페이지 읽기',
        type: 'daily',
        xpReward: 75,
        status: 'completed',
        completedAt: yesterday,
        difficulty: 'easy'
      },
      {
        id: '3',
        title: '물 8잔 마시기',
        type: 'daily',
        xpReward: 50,
        status: 'in_progress',
        difficulty: 'easy'
      },
      {
        id: '4',
        title: '주간 목표 설정',
        type: 'weekly',
        xpReward: 200,
        status: 'completed',
        completedAt: new Date(weekStart.getTime() + 24 * 60 * 60 * 1000), // Earlier this week
        difficulty: 'hard'
      },
      {
        id: '5',
        title: '특별 이벤트',
        type: 'special',
        xpReward: 300,
        status: 'available',
        difficulty: 'hard'
      }
    ];

    mockStreaks = [
      { id: '1', startDate: new Date('2023-12-01'), count: 7, isActive: true },
      { id: '2', startDate: new Date('2023-11-01'), endDate: new Date('2023-11-20'), count: 21, isActive: false },
      { id: '3', startDate: new Date('2023-10-01'), endDate: new Date('2023-10-10'), count: 10, isActive: false }
    ];
  });

  describe('Stats Aggregation', () => {
    it('should calculate total classes correctly', () => {
      const stats = DashboardAggregator.aggregateStats(mockClasses, mockQuests, mockStreaks);
      expect(stats.totalClasses).toBe(3);
    });

    it('should calculate completed quests correctly', () => {
      const stats = DashboardAggregator.aggregateStats(mockClasses, mockQuests, mockStreaks);
      expect(stats.completedQuests).toBe(3); // 3 completed quests
    });

    it('should calculate total XP correctly', () => {
      const stats = DashboardAggregator.aggregateStats(mockClasses, mockQuests, mockStreaks);
      expect(stats.totalXP).toBe(5040); // 2340 + 1500 + 1200
    });

    it('should calculate max streak correctly', () => {
      const stats = DashboardAggregator.aggregateStats(mockClasses, mockQuests, mockStreaks);
      expect(stats.maxStreak).toBe(21);
    });

    it('should calculate today XP correctly', () => {
      const stats = DashboardAggregator.aggregateStats(mockClasses, mockQuests, mockStreaks);
      expect(stats.todayXP).toBe(100); // Only today's completed quest
    });

    it('should calculate weekly XP correctly', () => {
      const stats = DashboardAggregator.aggregateStats(mockClasses, mockQuests, mockStreaks);
      expect(stats.weeklyXP).toBe(300); // Today's quest (100) + this week's quest (200)
    });

    it('should calculate completion rate correctly', () => {
      const stats = DashboardAggregator.aggregateStats(mockClasses, mockQuests, mockStreaks);
      // 3 daily quests total, 1 completed today = 33%
      expect(stats.completionRate).toBe(33);
    });
  });

  describe('Empty Data Handling', () => {
    it('should handle empty classes array', () => {
      const stats = DashboardAggregator.aggregateStats([], mockQuests, mockStreaks);
      expect(stats.totalClasses).toBe(0);
      expect(stats.totalXP).toBe(0);
    });

    it('should handle empty quests array', () => {
      const stats = DashboardAggregator.aggregateStats(mockClasses, [], mockStreaks);
      expect(stats.completedQuests).toBe(0);
      expect(stats.todayXP).toBe(0);
      expect(stats.weeklyXP).toBe(0);
      expect(stats.completionRate).toBe(0);
    });

    it('should handle empty streaks array', () => {
      const stats = DashboardAggregator.aggregateStats(mockClasses, mockQuests, []);
      expect(stats.maxStreak).toBe(0);
    });

    it('should handle all empty arrays', () => {
      const stats = DashboardAggregator.aggregateStats([], [], []);
      expect(stats).toEqual({
        totalClasses: 0,
        completedQuests: 0,
        totalXP: 0,
        maxStreak: 0,
        todayXP: 0,
        weeklyXP: 0,
        completionRate: 0
      });
    });
  });

  describe('Current Streak Calculation', () => {
    it('should return active streak count', () => {
      const currentStreak = DashboardAggregator.calculateCurrentStreak(mockStreaks);
      expect(currentStreak).toBe(7);
    });

    it('should return 0 if no active streak', () => {
      const inactiveStreaks = mockStreaks.map(s => ({ ...s, isActive: false }));
      const currentStreak = DashboardAggregator.calculateCurrentStreak(inactiveStreaks);
      expect(currentStreak).toBe(0);
    });
  });

  describe('Active Character', () => {
    it('should return active character', () => {
      const activeChar = DashboardAggregator.getActiveCharacter(mockClasses);
      expect(activeChar?.name).toBe('헬스 마스터');
      expect(activeChar?.isActive).toBe(true);
    });

    it('should return null if no active character', () => {
      const inactiveClasses = mockClasses.map(c => ({ ...c, isActive: false }));
      const activeChar = DashboardAggregator.getActiveCharacter(inactiveClasses);
      expect(activeChar).toBeNull();
    });
  });

  describe('Today Quests Filtering', () => {
    it('should include all daily quests', () => {
      const todayQuests = DashboardAggregator.getTodayQuests(mockQuests);
      const dailyQuests = todayQuests.filter(q => q.type === 'daily');
      expect(dailyQuests).toHaveLength(3);
    });

    it('should include available special quests', () => {
      const todayQuests = DashboardAggregator.getTodayQuests(mockQuests);
      const specialQuests = todayQuests.filter(q => q.type === 'special' && q.status === 'available');
      expect(specialQuests).toHaveLength(1);
    });

    it('should exclude completed weekly quests from this week', () => {
      const todayQuests = DashboardAggregator.getTodayQuests(mockQuests);
      const weeklyQuests = todayQuests.filter(q => q.type === 'weekly');
      expect(weeklyQuests).toHaveLength(0); // Weekly quest was completed this week
    });
  });

  describe('Weekly Progress Calculation', () => {
    it('should calculate progress for each category', () => {
      const progress = DashboardAggregator.calculateWeeklyProgress(mockQuests);
      expect(progress).toHaveLength(4);
      expect(progress.every(p => p.name && typeof p.completed === 'number' && typeof p.total === 'number')).toBe(true);
    });

    it('should not exceed total in completed count', () => {
      const progress = DashboardAggregator.calculateWeeklyProgress(mockQuests);
      progress.forEach(p => {
        expect(p.completed).toBeLessThanOrEqual(p.total);
      });
    });
  });

  describe('Query Optimization', () => {
    it('should suggest caching for default queries', () => {
      const { useCache, cacheKey } = DashboardAggregator.optimizeQuery();
      expect(useCache).toBe(true);
      expect(cacheKey).toMatch(/^dashboard_\d{4}_\d{1,2}_\d{1,2}$/);
    });

    it('should not cache filtered queries', () => {
      const { useCache } = DashboardAggregator.optimizeQuery({ userId: 'test' });
      expect(useCache).toBe(false);
    });

    it('should generate consistent cache keys for same date', () => {
      const result1 = DashboardAggregator.optimizeQuery();
      const result2 = DashboardAggregator.optimizeQuery();
      expect(result1.cacheKey).toBe(result2.cacheKey);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large datasets efficiently', () => {
      // Generate large dataset
      const largeClasses = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        name: `Class ${i}`,
        level: Math.floor(Math.random() * 30) + 1,
        totalXP: Math.floor(Math.random() * 10000),
        isActive: i === 0
      }));

      const largeQuests = Array.from({ length: 10000 }, (_, i) => ({
        id: i.toString(),
        title: `Quest ${i}`,
        type: ['daily', 'weekly', 'special'][i % 3] as 'daily' | 'weekly' | 'special',
        xpReward: Math.floor(Math.random() * 200) + 10,
        status: ['available', 'in_progress', 'completed'][i % 3] as 'available' | 'in_progress' | 'completed',
        completedAt: Math.random() > 0.5 ? new Date() : undefined,
        difficulty: ['easy', 'medium', 'hard'][i % 3] as 'easy' | 'medium' | 'hard'
      }));

      const largeStreaks = Array.from({ length: 100 }, (_, i) => ({
        id: i.toString(),
        startDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        count: Math.floor(Math.random() * 30) + 1,
        isActive: i === 0
      }));

      const start = Date.now();
      const stats = DashboardAggregator.aggregateStats(largeClasses, largeQuests, largeStreaks);
      const duration = Date.now() - start;

      expect(stats).toBeDefined();
      expect(duration).toBeLessThan(200); // Should complete in under 200ms
    });
  });
});