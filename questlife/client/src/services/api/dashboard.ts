import { apiClient } from './client';

export interface DashboardStats {
  totalClasses: number;
  completedQuests: number;
  totalXP: number;
  maxStreak: number;
  todayXP: number;
  weeklyXP: number;
  completionRate: number;
}

export interface Quest {
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

export interface QuickQuest {
  id: string;
  title: string;
  xpReward: number;
  type: 'daily' | 'weekly' | 'special';
  estimatedTime: string;
  category: string;
}

export interface WeeklyProgress {
  name: string;
  completed: number;
  total: number;
}

export interface ActiveCharacter {
  name: string;
  level: number;
  className: string;
  description: string;
  currentXP: number;
  requiredXP: number;
}

export interface DashboardData {
  stats: DashboardStats;
  streakCount: number;
  todayQuests: Quest[];
  availableQuests: QuickQuest[];
  weeklyProgress: WeeklyProgress[];
  activeCharacter: ActiveCharacter | null;
}

export interface QuickCompleteResponse {
  success: boolean;
  xpGained: number;
  newLevel?: number;
  message?: string;
}

// Dashboard API functions
export const dashboardApi = {
  // Get aggregated dashboard data
  async getDashboard(): Promise<DashboardData> {
    return apiClient.get<DashboardData>('/dashboard');
  },

  // Quick complete a quest
  async quickCompleteQuest(questId: string): Promise<QuickCompleteResponse> {
    return apiClient.post<QuickCompleteResponse>(`/dashboard/quick-complete/${questId}`);
  },

  // Get dashboard stats only
  async getStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>('/dashboard/stats');
  },

  // Get today's quests
  async getTodayQuests(): Promise<Quest[]> {
    return apiClient.get<Quest[]>('/dashboard/today-quests');
  },

  // Get available quick quests
  async getAvailableQuests(): Promise<QuickQuest[]> {
    return apiClient.get<QuickQuest[]>('/dashboard/available-quests');
  },

  // Get weekly progress
  async getWeeklyProgress(): Promise<WeeklyProgress[]> {
    return apiClient.get<WeeklyProgress[]>('/dashboard/weekly-progress');
  },

  // Get active character info
  async getActiveCharacter(): Promise<ActiveCharacter | null> {
    return apiClient.get<ActiveCharacter | null>('/dashboard/active-character');
  },

  // Update dashboard cache
  async refreshCache(): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/dashboard/refresh-cache');
  }
};