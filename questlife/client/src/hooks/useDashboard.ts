import { useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useAuth } from './useAuth';

/**
 * Hook for dashboard functionality
 * Manages dashboard data loading, caching, and quest completion
 */
export function useDashboard() {
  const { isAuthenticated, user } = useAuth();
  const {
    dashboardData,
    isLoading,
    error,
    lastUpdated,
    loadDashboard,
    quickCompleteQuest,
    refreshDashboard,
    updateStats,
    clearCache,
    setError
  } = useDashboardStore();

  // Auto-load dashboard when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboard();
    }
  }, [isAuthenticated, user, loadDashboard]);

  // Check if data is stale (older than cache timeout)
  const isDataStale = () => {
    if (!lastUpdated) return true;
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    return Date.now() - lastUpdated.getTime() > staleThreshold;
  };

  // Get today's quest completion stats
  const getTodayStats = () => {
    if (!dashboardData) return { completed: 0, total: 0, percentage: 0 };

    const todayQuests = dashboardData.todayQuests;
    const completed = todayQuests.filter(q => q.status === 'completed').length;
    const total = todayQuests.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  // Get available XP that can be earned today
  const getAvailableXP = () => {
    if (!dashboardData) return 0;

    return dashboardData.todayQuests
      .filter(q => q.status !== 'completed')
      .reduce((sum, quest) => sum + quest.xpReward, 0);
  };

  // Get completed XP for today
  const getCompletedXP = () => {
    if (!dashboardData) return 0;

    return dashboardData.todayQuests
      .filter(q => q.status === 'completed')
      .reduce((sum, quest) => sum + quest.xpReward, 0);
  };

  // Complete quest with optimistic updates
  const completeQuest = async (questId: string) => {
    try {
      await quickCompleteQuest(questId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete quest'
      };
    }
  };

  // Complete multiple quests
  const completeMultipleQuests = async (questIds: string[]) => {
    const results = [];

    for (const questId of questIds) {
      const result = await completeQuest(questId);
      results.push({ questId, ...result });

      // Small delay between requests to avoid overwhelming the system
      if (questIds.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return results;
  };

  // Refresh dashboard data
  const refresh = async () => {
    try {
      await refreshDashboard();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh dashboard'
      };
    }
  };

  // Force refresh (bypass cache)
  const forceRefresh = async () => {
    clearCache();
    return refresh();
  };

  // Get streak information
  const getStreakInfo = () => {
    if (!dashboardData) return { current: 0, max: 0, isActive: false };

    return {
      current: dashboardData.streakCount,
      max: dashboardData.stats.maxStreak,
      isActive: dashboardData.streakCount > 0
    };
  };

  // Get weekly progress summary
  const getWeeklyProgressSummary = () => {
    if (!dashboardData) return { completed: 0, total: 0, percentage: 0 };

    const progress = dashboardData.weeklyProgress;
    const totalCompleted = progress.reduce((sum, p) => sum + p.completed, 0);
    const totalItems = progress.reduce((sum, p) => sum + p.total, 0);
    const percentage = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

    return { completed: totalCompleted, total: totalItems, percentage };
  };

  // Get character progress
  const getCharacterProgress = () => {
    if (!dashboardData?.activeCharacter) return null;

    const character = dashboardData.activeCharacter;
    const percentage = Math.round((character.currentXP / character.requiredXP) * 100);
    const xpToNextLevel = character.requiredXP - character.currentXP;

    return {
      ...character,
      progressPercentage: percentage,
      xpToNextLevel
    };
  };

  // Check if user can level up
  const canLevelUp = () => {
    const character = getCharacterProgress();
    return character && character.currentXP >= character.requiredXP;
  };

  // Get recommendations for next actions
  const getRecommendations = () => {
    if (!dashboardData) return [];

    const recommendations = [];
    const todayStats = getTodayStats();

    // Daily quest recommendations
    if (todayStats.completed < todayStats.total) {
      recommendations.push({
        type: 'daily_quests',
        title: '오늘의 퀘스트 완료',
        description: `${todayStats.total - todayStats.completed}개의 퀘스트가 남았습니다`,
        priority: 'high'
      });
    }

    // Streak maintenance
    const streak = getStreakInfo();
    if (streak.current > 0 && todayStats.percentage < 50) {
      recommendations.push({
        type: 'streak',
        title: '연속 기록 유지',
        description: `${streak.current}일 연속 기록을 유지하세요`,
        priority: 'medium'
      });
    }

    // Level up opportunity
    if (canLevelUp()) {
      recommendations.push({
        type: 'level_up',
        title: '레벨업 가능',
        description: '축하합니다! 레벨업이 가능합니다',
        priority: 'high'
      });
    }

    return recommendations;
  };

  return {
    // State
    dashboardData,
    isLoading,
    error,
    lastUpdated,

    // Data accessors
    getTodayStats,
    getAvailableXP,
    getCompletedXP,
    getStreakInfo,
    getWeeklyProgressSummary,
    getCharacterProgress,
    getRecommendations,

    // Actions
    loadDashboard,
    completeQuest,
    completeMultipleQuests,
    refresh,
    forceRefresh,
    updateStats,
    clearCache,
    setError,

    // Utils
    isDataStale: isDataStale(),
    canLevelUp: canLevelUp(),
    hasData: !!dashboardData
  };
}