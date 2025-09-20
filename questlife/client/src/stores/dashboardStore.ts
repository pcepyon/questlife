import { create } from 'zustand';

interface DashboardStats {
  totalClasses: number;
  completedQuests: number;
  totalXP: number;
  maxStreak: number;
  todayXP: number;
  weeklyXP: number;
  completionRate: number;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  xpReward: number;
  status: 'available' | 'in_progress' | 'completed';
  progress?: number;
  maxProgress?: number;
  timeLeft?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuickQuest {
  id: string;
  title: string;
  xpReward: number;
  type: 'daily' | 'weekly' | 'special';
  estimatedTime: string;
  category: string;
}

interface WeeklyProgress {
  name: string;
  completed: number;
  total: number;
}

interface ActiveCharacter {
  name: string;
  level: number;
  className: string;
  description: string;
  currentXP: number;
  requiredXP: number;
}

interface DashboardData {
  stats: DashboardStats;
  streakCount: number;
  todayQuests: Quest[];
  availableQuests: QuickQuest[];
  weeklyProgress: WeeklyProgress[];
  activeCharacter: ActiveCharacter | null;
}

interface DashboardState {
  // State
  dashboardData: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Cache settings
  cacheTimeout: number; // in milliseconds

  // Actions
  loadDashboard: () => Promise<void>;
  quickCompleteQuest: (questId: string) => Promise<void>;
  refreshDashboard: () => Promise<void>;
  preloadDashboard: () => Promise<void>;
  updateStats: (stats: Partial<DashboardStats>) => void;
  clearCache: () => void;
  setError: (error: string | null) => void;
}

// Mock data generation for demo
const generateMockDashboardData = (): DashboardData => {
  return {
    stats: {
      totalClasses: 3,
      completedQuests: 47,
      totalXP: 12450,
      maxStreak: 21,
      todayXP: 350,
      weeklyXP: 1820,
      completionRate: 85
    },
    streakCount: 7,
    todayQuests: [
      {
        id: '1',
        title: '30분 운동하기',
        description: '유산소 운동 또는 근력 운동 30분',
        type: 'daily',
        xpReward: 100,
        status: 'available',
        progress: 0,
        maxProgress: 30,
        timeLeft: '오늘 밤 12시까지',
        difficulty: 'medium'
      },
      {
        id: '2',
        title: '물 8잔 마시기',
        description: '하루 권장 수분 섭취량 달성',
        type: 'daily',
        xpReward: 50,
        status: 'in_progress',
        progress: 5,
        maxProgress: 8,
        timeLeft: '오늘 밤 12시까지',
        difficulty: 'easy'
      },
      {
        id: '3',
        title: '책 30페이지 읽기',
        description: '독서 습관 형성을 위한 일일 목표',
        type: 'daily',
        xpReward: 75,
        status: 'completed',
        progress: 30,
        maxProgress: 30,
        difficulty: 'easy'
      }
    ],
    availableQuests: [
      {
        id: 'q1',
        title: '감사 일기 쓰기',
        xpReward: 25,
        type: 'daily',
        estimatedTime: '5분',
        category: '개인 성장'
      },
      {
        id: 'q2',
        title: '스트레칭하기',
        xpReward: 30,
        type: 'daily',
        estimatedTime: '10분',
        category: '건강'
      },
      {
        id: 'q3',
        title: '영어 단어 10개 외우기',
        xpReward: 40,
        type: 'daily',
        estimatedTime: '15분',
        category: '학습'
      }
    ],
    weeklyProgress: [
      { name: '운동', completed: 5, total: 7 },
      { name: '독서', completed: 6, total: 7 },
      { name: '학습', completed: 4, total: 7 },
      { name: '개인 관리', completed: 7, total: 7 }
    ],
    activeCharacter: {
      name: '헬스 마스터',
      level: 15,
      className: '피트니스 전문가',
      description: '건강한 라이프스타일을 추구하는 운동 전문가',
      currentXP: 2340,
      requiredXP: 3000
    }
  };
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  dashboardData: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes

  // Load dashboard data
  loadDashboard: async () => {
    const { lastUpdated, cacheTimeout, dashboardData } = get();

    // Check if we have cached data that's still valid
    if (dashboardData && lastUpdated &&
        (Date.now() - lastUpdated.getTime()) < cacheTimeout) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const startTime = performance.now();

      // In a real app, this would be an API call
      // await api.getDashboard();

      // Optimized: Reduce API delay for better performance
      await new Promise(resolve => setTimeout(resolve, 100));

      // For demo, generate mock data (optimized)
      const data = generateMockDashboardData();

      const loadTime = performance.now() - startTime;
      console.log(`Dashboard loaded in ${loadTime.toFixed(2)}ms`);

      set({
        dashboardData: data,
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load dashboard',
        isLoading: false
      });
    }
  },

  // Quick complete a quest
  quickCompleteQuest: async (questId: string) => {
    const { dashboardData } = get();
    if (!dashboardData) return;

    // Optimistic update first for immediate UI feedback
    const completedQuest = dashboardData.todayQuests.find(q => q.id === questId) ||
                         dashboardData.availableQuests.find(q => q.id === questId);

    if (!completedQuest) return;

    const xpGained = completedQuest.xpReward;

    // Immediate optimistic update
    const updatedTodayQuests = dashboardData.todayQuests.map(quest =>
      quest.id === questId
        ? { ...quest, status: 'completed' as const, progress: quest.maxProgress }
        : quest
    );

    const updatedAvailableQuests = dashboardData.availableQuests.filter(
      quest => quest.id !== questId
    );

    set({
      dashboardData: {
        ...dashboardData,
        todayQuests: updatedTodayQuests,
        availableQuests: updatedAvailableQuests,
        stats: {
          ...dashboardData.stats,
          todayXP: dashboardData.stats.todayXP + xpGained,
          completedQuests: dashboardData.stats.completedQuests + 1
        }
      }
    });

    try {
      // Background API call (reduced delay for performance)
      await new Promise(resolve => setTimeout(resolve, 50));

      // In a real app, this would be an API call
      // await api.quickCompleteQuest(questId);

    } catch (error) {
      // Revert optimistic update on error
      set({ dashboardData });
      set({
        error: error instanceof Error ? error.message : 'Failed to complete quest'
      });
      throw error;
    }
  },

  // Refresh dashboard data
  refreshDashboard: async () => {
    set({ lastUpdated: null }); // Force refresh
    return get().loadDashboard();
  },

  // Preload dashboard data (no loading state)
  preloadDashboard: async () => {
    const { lastUpdated, cacheTimeout, dashboardData, isLoading } = get();

    // Don't preload if already loading or data is fresh
    if (isLoading || (dashboardData && lastUpdated &&
        (Date.now() - lastUpdated.getTime()) < cacheTimeout)) {
      return;
    }

    try {
      // Silent background loading
      await new Promise(resolve => setTimeout(resolve, 50));
      const data = generateMockDashboardData();

      set({
        dashboardData: data,
        lastUpdated: new Date()
      });
    } catch (error) {
      // Silent fail for preloading
      console.warn('Dashboard preload failed:', error);
    }
  },

  // Update stats
  updateStats: (stats: Partial<DashboardStats>) => {
    const { dashboardData } = get();
    if (!dashboardData) return;

    set({
      dashboardData: {
        ...dashboardData,
        stats: {
          ...dashboardData.stats,
          ...stats
        }
      }
    });
  },

  // Clear cache
  clearCache: () => {
    set({
      dashboardData: null,
      lastUpdated: null,
      error: null
    });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  }
}));