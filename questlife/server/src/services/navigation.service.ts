import { NavigationStateModel, NavigationState, UpdateNavigationInput } from '../models/navigationState.model.js';
import { getDatabase } from '../db/index.js';

export interface BadgeUpdate {
  quests?: number;
  character?: number;
  goals?: number;
}

export interface TutorialProgress {
  step: number;
  completed: boolean;
  nextStep?: string;
  description?: string;
}

export class NavigationService {
  private static db = getDatabase();

  /**
   * Get navigation state for user
   */
  static getNavigationState(userId: string): NavigationState {
    try {
      return NavigationStateModel.getOrCreate(userId);
    } catch (error) {
      console.error('Get navigation state error:', error);
      // Return default state on error
      return this.getDefaultNavigationState(userId);
    }
  }

  /**
   * Update navigation state
   */
  static updateNavigationState(userId: string, input: UpdateNavigationInput): NavigationState | null {
    try {
      return NavigationStateModel.update(userId, input);
    } catch (error) {
      console.error('Update navigation state error:', error);
      return null;
    }
  }

  /**
   * Switch to a different tab
   */
  static switchTab(userId: string, tab: NavigationState['currentTab']): NavigationState | null {
    try {
      return NavigationStateModel.update(userId, { currentTab: tab });
    } catch (error) {
      console.error('Switch tab error:', error);
      return null;
    }
  }

  /**
   * Update tutorial progress
   */
  static updateTutorialProgress(userId: string, step: number): TutorialProgress {
    try {
      const maxSteps = 5; // Total tutorial steps
      const completed = step >= maxSteps;

      NavigationStateModel.update(userId, {
        tutorialStep: step,
        onboardingCompleted: completed
      });

      return {
        step,
        completed,
        nextStep: !completed ? this.getTutorialStepDescription(step + 1) : undefined,
        description: this.getTutorialStepDescription(step)
      };
    } catch (error) {
      console.error('Update tutorial progress error:', error);
      return {
        step: 0,
        completed: false,
        description: 'Tutorial progress update failed'
      };
    }
  }

  /**
   * Complete onboarding
   */
  static completeOnboarding(userId: string): NavigationState | null {
    try {
      return NavigationStateModel.update(userId, {
        onboardingCompleted: true,
        tutorialStep: 5 // Assuming 5 is the max tutorial step
      });
    } catch (error) {
      console.error('Complete onboarding error:', error);
      return null;
    }
  }

  /**
   * Calculate and update badge counts
   */
  static calculateBadges(userId: string): NavigationState['badges'] {
    try {
      const badges = NavigationStateModel.calculateBadges(userId);
      NavigationStateModel.updateBadges(userId, badges);
      return badges;
    } catch (error) {
      console.error('Calculate badges error:', error);
      return { quests: 0, character: 0, goals: 0 };
    }
  }

  /**
   * Update specific badge counts
   */
  static updateBadges(userId: string, badgeUpdates: BadgeUpdate): void {
    try {
      NavigationStateModel.updateBadges(userId, badgeUpdates);
    } catch (error) {
      console.error('Update badges error:', error);
    }
  }

  /**
   * Get quest-related badge count
   */
  static getQuestsBadgeCount(userId: string): number {
    try {
      // Count incomplete daily quests
      const query = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM quests q
        JOIN character_classes cc ON q.class_id = cc.id
        WHERE cc.user_id = ? AND q.type = 'daily' AND q.status != 'completed'
        AND DATE(q.created_at) = DATE('now')
      `);
      const result = query.get(userId) as any;
      return result?.count || 0;
    } catch (error) {
      console.error('Get quests badge count error:', error);
      return 0;
    }
  }

  /**
   * Get character-related badge count
   */
  static getCharacterBadgeCount(userId: string): number {
    try {
      // Count available skill points or level-up opportunities
      const query = this.db.prepare(`
        SELECT
          SUM(CASE WHEN level >= 10 AND level % 10 = 0 THEN 1 ELSE 0 END) as skillPoints,
          SUM(CASE WHEN current_xp >= (level * 1000) THEN 1 ELSE 0 END) as levelUps
        FROM character_classes
        WHERE user_id = ? AND status = 'active'
      `);
      const result = query.get(userId) as any;
      return (result?.skillPoints || 0) + (result?.levelUps || 0);
    } catch (error) {
      console.error('Get character badge count error:', error);
      return 0;
    }
  }

  /**
   * Get goals-related badge count
   */
  static getGoalsBadgeCount(userId: string): number {
    try {
      // Count goals needing attention (no recent progress)
      const query = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM goals
        WHERE user_id = ? AND deleted_at IS NULL AND archived = 0
        AND updated_at < datetime('now', '-7 days')
      `);
      const result = query.get(userId) as any;
      return result?.count || 0;
    } catch (error) {
      console.error('Get goals badge count error:', error);
      return 0;
    }
  }

  /**
   * Reset tutorial progress
   */
  static resetTutorial(userId: string): NavigationState | null {
    try {
      return NavigationStateModel.update(userId, {
        tutorialStep: 0,
        onboardingCompleted: false
      });
    } catch (error) {
      console.error('Reset tutorial error:', error);
      return null;
    }
  }

  /**
   * Get tutorial status
   */
  static getTutorialStatus(userId: string): TutorialProgress {
    try {
      const state = this.getNavigationState(userId);
      return {
        step: state.tutorialStep,
        completed: state.onboardingCompleted,
        nextStep: !state.onboardingCompleted ? this.getTutorialStepDescription(state.tutorialStep + 1) : undefined,
        description: this.getTutorialStepDescription(state.tutorialStep)
      };
    } catch (error) {
      console.error('Get tutorial status error:', error);
      return {
        step: 0,
        completed: false,
        description: 'Unable to get tutorial status'
      };
    }
  }

  /**
   * Check if user needs onboarding
   */
  static needsOnboarding(userId: string): boolean {
    try {
      const state = this.getNavigationState(userId);
      return !state.onboardingCompleted;
    } catch (error) {
      console.error('Check onboarding error:', error);
      return true; // Default to needing onboarding on error
    }
  }

  /**
   * Get last visited tab
   */
  static getLastVisitedTab(userId: string): NavigationState['currentTab'] {
    try {
      const state = this.getNavigationState(userId);
      return state.currentTab;
    } catch (error) {
      console.error('Get last visited tab error:', error);
      return 'dashboard';
    }
  }

  /**
   * Update all badge counts at once
   */
  static refreshAllBadges(userId: string): NavigationState['badges'] {
    try {
      const badges = {
        quests: this.getQuestsBadgeCount(userId),
        character: this.getCharacterBadgeCount(userId),
        goals: this.getGoalsBadgeCount(userId)
      };

      NavigationStateModel.updateBadges(userId, badges);
      return badges;
    } catch (error) {
      console.error('Refresh all badges error:', error);
      return { quests: 0, character: 0, goals: 0 };
    }
  }

  /**
   * Get navigation analytics data
   */
  static getNavigationAnalytics(userId: string): {
    totalVisits: { [key: string]: number };
    lastVisitTimes: NavigationState['lastVisited'];
    currentStreak: number;
  } {
    try {
      // This would normally track visit counts in a separate table
      // For now, return basic info
      const state = this.getNavigationState(userId);
      return {
        totalVisits: {
          dashboard: 1,
          quests: 1,
          character: 1,
          goals: 1
        },
        lastVisitTimes: state.lastVisited,
        currentStreak: 1
      };
    } catch (error) {
      console.error('Get navigation analytics error:', error);
      return {
        totalVisits: {},
        lastVisitTimes: { dashboard: null, quests: null, character: null, goals: null },
        currentStreak: 0
      };
    }
  }

  /**
   * Get tutorial step description
   */
  private static getTutorialStepDescription(step: number): string {
    const descriptions: { [key: number]: string } = {
      0: 'Welcome to QuestLife! Let\'s get started.',
      1: 'Set up your first goal and create a character class',
      2: 'Complete your first daily quest',
      3: 'Explore the character progression system',
      4: 'Learn about streaks and multipliers',
      5: 'Tutorial completed! You\'re ready to adventure!'
    };

    return descriptions[step] || 'Tutorial step not found';
  }

  /**
   * Get default navigation state for new users
   */
  private static getDefaultNavigationState(userId: string): NavigationState {
    return {
      id: `nav_${userId}`,
      userId,
      currentTab: 'dashboard',
      lastVisited: {
        dashboard: new Date().toISOString(),
        quests: null,
        character: null,
        goals: null
      },
      onboardingCompleted: false,
      tutorialStep: 0,
      badges: {
        quests: 0,
        character: 0,
        goals: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Bulk update navigation states (for maintenance)
   */
  static bulkRefreshBadges(): number {
    try {
      // Get all users with navigation states
      const query = this.db.prepare(`
        SELECT DISTINCT user_id FROM navigation_state
      `);
      const users = query.all() as any[];

      let updated = 0;
      for (const user of users) {
        try {
          this.refreshAllBadges(user.user_id);
          updated++;
        } catch (error) {
          console.error(`Failed to refresh badges for user ${user.user_id}:`, error);
        }
      }

      return updated;
    } catch (error) {
      console.error('Bulk refresh badges error:', error);
      return 0;
    }
  }

  /**
   * Export navigation state (for backup/migration)
   */
  static exportNavigationState(userId: string): NavigationState | null {
    try {
      return this.getNavigationState(userId);
    } catch (error) {
      console.error('Export navigation state error:', error);
      return null;
    }
  }

  /**
   * Import navigation state (for backup/migration)
   */
  static importNavigationState(userId: string, state: Partial<NavigationState>): NavigationState | null {
    try {
      return NavigationStateModel.update(userId, {
        currentTab: state.currentTab,
        onboardingCompleted: state.onboardingCompleted,
        tutorialStep: state.tutorialStep
      });
    } catch (error) {
      console.error('Import navigation state error:', error);
      return null;
    }
  }
}