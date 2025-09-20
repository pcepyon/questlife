import OpenAI from 'openai';
import crypto from 'crypto';
import { getDatabase } from '../db/index.js';
import { requireEnv } from '../load-env.js';
import { GoalModel, Goal, CreateGoalInput, UpdateGoalInput, Milestone } from '../models/goal.model.js';
import { DashboardService } from './dashboard.service.js';
import { NavigationService } from './navigation.service.js';

const apiKey = requireEnv('OPENAI_API_KEY');
const openai = new OpenAI({ apiKey });

interface AnalyzedGoal {
  className: string;
  classNameKo?: string;
  description: string;
  descriptionKo?: string;
  suggestedLevel: number;
  ultimateGoal: string;
  dailyQuests: string[];
  weeklyQuests: string[];
  milestones: { month: number; description: string }[];
}

export async function analyzeGoal(goalText: string, locale: string = 'ko'): Promise<AnalyzedGoal> {
  const db = getDatabase();
  
  // Check cache first
  const goalHash = crypto.createHash('sha256').update(goalText).digest('hex');
  const cached = db.prepare('SELECT * FROM goal_cache WHERE goal_hash = ?').get(goalHash) as any;
  
  if (cached && new Date(cached.expires_at) > new Date()) {
    db.prepare('UPDATE goal_cache SET hit_count = hit_count + 1 WHERE goal_hash = ?').run(goalHash);
    return JSON.parse(cached.generated_class);
  }
  
  // Call OpenAI if not cached
  const isKorean = locale === 'ko';
  const systemPrompt = isKorean
    ? `당신은 개인 목표를 RPG 캐릭터 클래스로 변환하는 게임 마스터입니다.
    목표 달성에 도움이 되는 창의적이고 동기부여가 되는 RPG 클래스를 생성하세요.
    구체적이고 격려하는 톤으로 작성하세요. 모든 설명은 한국어로 작성하되, 클래스명은 영어와 한국어 모두 제공하세요.
    예시: "AI Scholar(AI 학자)", "Code Warrior(코드 전사)", "Fitness Paladin(피트니스 성기사)"`
    : `You are a game master creating RPG character classes from personal goals.
    Generate a creative, motivating RPG class that will help someone achieve their goal.
    Be specific and encouraging. Think of classes like "AI Scholar", "Code Warrior", "Fitness Paladin".`;

  const userPrompt = isKorean
    ? `이 목표를 RPG 캐릭터 클래스로 변환하세요: "${goalText}"

    다음 형식의 JSON 객체를 반환하세요:
    - className: 창의적인 RPG 클래스명 (영어)
    - classNameKo: 클래스명 (한국어)
    - description: 2-3문장의 클래스 설명 (한국어로 작성)
    - descriptionKo: description과 동일 (한국어)
    - suggestedLevel: 목표 레벨 (1-30)
    - ultimateGoal: 최종 목표 (한국어로 작성)
    - dailyQuests: 일일 퀘스트 3-5개 배열 (한국어로 작성)
    - weeklyQuests: 주간 도전 과제 2-3개 배열 (한국어로 작성)
    - milestones: 월별 마일스톤 배열, month 번호와 description (한국어) 포함`
    : `Transform this goal into an RPG character class: "${goalText}"

    Return a JSON object with:
    - className: Creative RPG class name
    - description: 2-3 sentence description
    - suggestedLevel: Target level (1-30)
    - ultimateGoal: The final achievement
    - dailyQuests: Array of 3-5 daily quest ideas
    - weeklyQuests: Array of 2-3 weekly challenge ideas
    - milestones: Array of monthly milestones with month number and description`;
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.8
    });
    
    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Cache the result
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    db.prepare(`
      INSERT OR REPLACE INTO goal_cache (goal_hash, generated_class, expires_at, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(goalHash, JSON.stringify(result), expiresAt.toISOString());
    
    return result;
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Return a fallback response
    return {
      className: "Aspiring Hero",
      description: "A determined individual on a quest for self-improvement and achievement.",
      suggestedLevel: 20,
      ultimateGoal: goalText,
      dailyQuests: [
        "Spend 30 minutes on your goal",
        "Learn one new thing related to your goal",
        "Practice a key skill"
      ],
      weeklyQuests: [
        "Complete a significant milestone",
        "Review and adjust your approach"
      ],
      milestones: [
        { month: 1, description: "Establish consistent habits" },
        { month: 2, description: "See measurable progress" },
        { month: 3, description: "Achieve your first major milestone" }
      ]
    };
  }
}

// Extended GoalService with CRUD operations and milestone management
export class GoalService {
  /**
   * Create a new goal
   */
  static createGoal(input: CreateGoalInput): Goal {
    try {
      const goal = GoalModel.create(input);

      // Invalidate dashboard cache since new goal affects dashboard data
      DashboardService.invalidateCache(input.userId);

      // Update navigation badges to reflect new goal
      NavigationService.refreshAllBadges(input.userId);

      return goal;
    } catch (error: any) {
      console.error('Create goal error:', error);
      throw new Error(error.message || 'Failed to create goal');
    }
  }

  /**
   * Get goal by ID
   */
  static getGoalById(goalId: string, userId: string): Goal | null {
    try {
      const goal = GoalModel.findById(goalId);

      // Verify ownership
      if (goal && goal.userId !== userId) {
        throw new Error('Access denied');
      }

      return goal;
    } catch (error: any) {
      console.error('Get goal error:', error);
      throw new Error(error.message || 'Failed to get goal');
    }
  }

  /**
   * Get all goals for a user
   */
  static getUserGoals(userId: string, includeArchived: boolean = false): Goal[] {
    try {
      return GoalModel.findByUserId(userId, includeArchived);
    } catch (error: any) {
      console.error('Get user goals error:', error);
      throw new Error(error.message || 'Failed to get user goals');
    }
  }

  /**
   * Update a goal
   */
  static updateGoal(goalId: string, userId: string, input: UpdateGoalInput): Goal | null {
    try {
      const updatedGoal = GoalModel.update(goalId, userId, input);

      if (updatedGoal) {
        // Invalidate dashboard cache since goal data changed
        DashboardService.invalidateCache(userId);

        // Update navigation badges
        NavigationService.refreshAllBadges(userId);
      }

      return updatedGoal;
    } catch (error: any) {
      console.error('Update goal error:', error);
      throw new Error(error.message || 'Failed to update goal');
    }
  }

  /**
   * Delete a goal (soft delete by default)
   */
  static deleteGoal(goalId: string, userId: string, hardDelete: boolean = false): boolean {
    try {
      const success = GoalModel.delete(goalId, userId, !hardDelete);

      if (success) {
        // Invalidate dashboard cache
        DashboardService.invalidateCache(userId);

        // Update navigation badges
        NavigationService.refreshAllBadges(userId);
      }

      return success;
    } catch (error: any) {
      console.error('Delete goal error:', error);
      throw new Error(error.message || 'Failed to delete goal');
    }
  }

  /**
   * Archive a goal
   */
  static archiveGoal(goalId: string, userId: string): boolean {
    try {
      const success = GoalModel.archive(goalId, userId);

      if (success) {
        // Update navigation badges
        NavigationService.refreshAllBadges(userId);
      }

      return success;
    } catch (error: any) {
      console.error('Archive goal error:', error);
      throw new Error(error.message || 'Failed to archive goal');
    }
  }

  /**
   * Unarchive a goal
   */
  static unarchiveGoal(goalId: string, userId: string): boolean {
    try {
      const success = GoalModel.unarchive(goalId, userId);

      if (success) {
        // Update navigation badges
        NavigationService.refreshAllBadges(userId);
      }

      return success;
    } catch (error: any) {
      console.error('Unarchive goal error:', error);
      throw new Error(error.message || 'Failed to unarchive goal');
    }
  }

  /**
   * Add milestone to a goal
   */
  static addMilestone(goalId: string, userId: string, milestone: Omit<Milestone, 'id' | 'completed'>): Goal | null {
    try {
      const goal = this.getGoalById(goalId, userId);
      if (!goal) return null;

      const newMilestone: Milestone = {
        id: `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: milestone.title,
        completed: false,
        ...milestone
      };

      const milestones = goal.milestones || [];
      milestones.push(newMilestone);

      const input: UpdateGoalInput = { milestones };
      return this.updateGoal(goalId, userId, input);
    } catch (error: any) {
      console.error('Add milestone error:', error);
      throw new Error(error.message || 'Failed to add milestone');
    }
  }

  /**
   * Update milestone completion status
   */
  static updateMilestone(goalId: string, userId: string, milestoneId: string, completed: boolean): boolean {
    try {
      const goal = this.getGoalById(goalId, userId);
      if (!goal) return false;

      const success = GoalModel.updateMilestone(goalId, milestoneId, completed);

      if (success) {
        // Invalidate dashboard cache
        DashboardService.invalidateCache(userId);

        // Update navigation badges
        NavigationService.refreshAllBadges(userId);
      }

      return success;
    } catch (error: any) {
      console.error('Update milestone error:', error);
      throw new Error(error.message || 'Failed to update milestone');
    }
  }

  /**
   * Remove milestone from a goal
   */
  static removeMilestone(goalId: string, userId: string, milestoneId: string): Goal | null {
    try {
      const goal = this.getGoalById(goalId, userId);
      if (!goal) return null;

      const milestones = (goal.milestones || []).filter(m => m.id !== milestoneId);
      const input: UpdateGoalInput = { milestones };

      return this.updateGoal(goalId, userId, input);
    } catch (error: any) {
      console.error('Remove milestone error:', error);
      throw new Error(error.message || 'Failed to remove milestone');
    }
  }

  /**
   * Get goal statistics for a user
   */
  static getGoalStats(userId: string): {
    totalGoals: number;
    activeGoals: number;
    archivedGoals: number;
    completedMilestones: number;
    totalMilestones: number;
    completionRate: number;
  } {
    try {
      const stats = GoalModel.getUserStats(userId);
      const allGoals = GoalModel.findByUserId(userId, true);

      let completedMilestones = 0;
      let totalMilestones = 0;
      let archivedGoals = 0;

      allGoals.forEach(goal => {
        if (goal.archived) archivedGoals++;

        if (goal.milestones) {
          totalMilestones += goal.milestones.length;
          completedMilestones += goal.milestones.filter(m => m.completed).length;
        }
      });

      const completionRate = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

      return {
        totalGoals: stats.totalGoals,
        activeGoals: stats.activeGoals,
        archivedGoals,
        completedMilestones,
        totalMilestones,
        completionRate: Math.round(completionRate)
      };
    } catch (error: any) {
      console.error('Get goal stats error:', error);
      return {
        totalGoals: 0,
        activeGoals: 0,
        archivedGoals: 0,
        completedMilestones: 0,
        totalMilestones: 0,
        completionRate: 0
      };
    }
  }

  /**
   * Search goals by text
   */
  static searchGoals(userId: string, query: string, includeArchived: boolean = false): Goal[] {
    try {
      const goals = GoalModel.findByUserId(userId, includeArchived);
      const searchQuery = query.toLowerCase();

      return goals.filter(goal =>
        goal.title.toLowerCase().includes(searchQuery) ||
        goal.description?.toLowerCase().includes(searchQuery) ||
        goal.milestones?.some(m => m.title.toLowerCase().includes(searchQuery))
      );
    } catch (error: any) {
      console.error('Search goals error:', error);
      return [];
    }
  }

  /**
   * Get goals by priority
   */
  static getGoalsByPriority(userId: string, priority: 'low' | 'medium' | 'high'): Goal[] {
    try {
      const goals = GoalModel.findByUserId(userId, false);
      return goals.filter(goal => goal.priority === priority);
    } catch (error: any) {
      console.error('Get goals by priority error:', error);
      return [];
    }
  }

  /**
   * Get goals with upcoming deadlines
   */
  static getGoalsWithUpcomingDeadlines(userId: string, daysAhead: number = 7): Goal[] {
    try {
      const goals = GoalModel.findByUserId(userId, false);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      return goals.filter(goal => {
        if (!goal.deadline) return false;
        const deadline = new Date(goal.deadline);
        return deadline <= cutoffDate && deadline > new Date();
      }).sort((a, b) => {
        const aDate = new Date(a.deadline!);
        const bDate = new Date(b.deadline!);
        return aDate.getTime() - bDate.getTime();
      });
    } catch (error: any) {
      console.error('Get goals with upcoming deadlines error:', error);
      return [];
    }
  }

  /**
   * Get goals that need attention (no recent updates)
   */
  static getGoalsNeedingAttention(userId: string, daysThreshold: number = 7): Goal[] {
    try {
      const goals = GoalModel.findByUserId(userId, false);
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

      return goals.filter(goal => {
        const lastUpdate = new Date(goal.updatedAt);
        return lastUpdate < thresholdDate;
      });
    } catch (error: any) {
      console.error('Get goals needing attention error:', error);
      return [];
    }
  }

  /**
   * Bulk update goal priorities
   */
  static bulkUpdatePriorities(userId: string, updates: Array<{ goalId: string; priority: 'low' | 'medium' | 'high' }>): number {
    try {
      let updated = 0;

      for (const update of updates) {
        try {
          const result = this.updateGoal(update.goalId, userId, { priority: update.priority });
          if (result) updated++;
        } catch (error) {
          console.error(`Failed to update priority for goal ${update.goalId}:`, error);
        }
      }

      return updated;
    } catch (error: any) {
      console.error('Bulk update priorities error:', error);
      return 0;
    }
  }

  /**
   * Export goals data (for backup/migration)
   */
  static exportGoals(userId: string): Goal[] {
    try {
      return GoalModel.findByUserId(userId, true); // Include archived
    } catch (error: any) {
      console.error('Export goals error:', error);
      return [];
    }
  }

  /**
   * Import goals data (for backup/migration)
   */
  static importGoals(userId: string, goals: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]): number {
    try {
      let imported = 0;

      for (const goalData of goals) {
        try {
          const input: CreateGoalInput = {
            userId,
            title: goalData.title,
            description: goalData.description,
            priority: goalData.priority,
            deadline: goalData.deadline || undefined
          };

          const goal = this.createGoal(input);

          // Add milestones if present
          if (goalData.milestones && goalData.milestones.length > 0) {
            const updateInput: UpdateGoalInput = { milestones: goalData.milestones };
            this.updateGoal(goal.id, userId, updateInput);
          }

          imported++;
        } catch (error) {
          console.error(`Failed to import goal "${goalData.title}":`, error);
        }
      }

      return imported;
    } catch (error: any) {
      console.error('Import goals error:', error);
      return 0;
    }
  }
}