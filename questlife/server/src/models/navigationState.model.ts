import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';

export interface NavigationState {
  id: string;
  userId: string;
  currentTab: 'dashboard' | 'quests' | 'character' | 'goals';
  lastVisited: {
    dashboard: string | null;
    quests: string | null;
    character: string | null;
    goals: string | null;
  };
  onboardingCompleted: boolean;
  tutorialStep: number;
  badges: {
    quests: number;
    character: number;
    goals: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNavigationInput {
  currentTab?: 'dashboard' | 'quests' | 'character' | 'goals';
  onboardingCompleted?: boolean;
  tutorialStep?: number;
}

export class NavigationStateModel {
  static create(userId: string): NavigationState {
    const state: NavigationState = {
      id: uuidv4(),
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

    const stmt = db.prepare(`
      INSERT INTO navigation_state (
        id, user_id, current_tab, last_visited_dashboard,
        onboarding_completed, tutorial_step, badge_quests, badge_character, badge_goals,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      state.id,
      state.userId,
      state.currentTab,
      state.lastVisited.dashboard,
      state.onboardingCompleted ? 1 : 0,
      state.tutorialStep,
      state.badges.quests,
      state.badges.character,
      state.badges.goals,
      state.createdAt,
      state.updatedAt
    );

    return state;
  }

  static findByUserId(userId: string): NavigationState | null {
    const stmt = db.prepare(`
      SELECT * FROM navigation_state WHERE user_id = ?
    `);
    
    const row = stmt.get(userId) as any;
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      currentTab: row.current_tab,
      lastVisited: {
        dashboard: row.last_visited_dashboard,
        quests: row.last_visited_quests,
        character: row.last_visited_character,
        goals: row.last_visited_goals
      },
      onboardingCompleted: row.onboarding_completed === 1,
      tutorialStep: row.tutorial_step,
      badges: {
        quests: row.badge_quests || 0,
        character: row.badge_character || 0,
        goals: row.badge_goals || 0
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static getOrCreate(userId: string): NavigationState {
    let state = this.findByUserId(userId);
    if (!state) {
      state = this.create(userId);
    }
    return state;
  }

  static update(userId: string, input: UpdateNavigationInput): NavigationState | null {
    const current = this.getOrCreate(userId);
    const now = new Date().toISOString();

    // Build dynamic update query
    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (input.currentTab !== undefined) {
      updates.push('current_tab = ?');
      values.push(input.currentTab);
      
      // Update last visited for the tab
      const visitedColumn = `last_visited_${input.currentTab}`;
      updates.push(`${visitedColumn} = ?`);
      values.push(now);
    }

    if (input.onboardingCompleted !== undefined) {
      updates.push('onboarding_completed = ?');
      values.push(input.onboardingCompleted ? 1 : 0);
    }

    if (input.tutorialStep !== undefined) {
      updates.push('tutorial_step = ?');
      values.push(input.tutorialStep);
    }

    values.push(userId); // For WHERE clause

    const stmt = db.prepare(`
      UPDATE navigation_state 
      SET ${updates.join(', ')}
      WHERE user_id = ?
    `);

    stmt.run(...values);

    return this.findByUserId(userId);
  }

  static updateBadges(userId: string, badges: Partial<NavigationState['badges']>): void {
    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [new Date().toISOString()];

    if (badges.quests !== undefined) {
      updates.push('badge_quests = ?');
      values.push(badges.quests);
    }

    if (badges.character !== undefined) {
      updates.push('badge_character = ?');
      values.push(badges.character);
    }

    if (badges.goals !== undefined) {
      updates.push('badge_goals = ?');
      values.push(badges.goals);
    }

    values.push(userId);

    const stmt = db.prepare(`
      UPDATE navigation_state 
      SET ${updates.join(', ')}
      WHERE user_id = ?
    `);

    stmt.run(...values);
  }

  static calculateBadges(userId: string): NavigationState['badges'] {
    // Calculate uncompleted daily quests
    const questsStmt = db.prepare(`
      SELECT COUNT(*) as count FROM quests 
      WHERE user_id = ? AND type = 'daily' AND completed = 0
    `);
    const questsResult = questsStmt.get(userId) as any;
    const questsBadge = questsResult?.count || 0;

    // Calculate available skill points
    const characterStmt = db.prepare(`
      SELECT SUM(skill_points) as points FROM character_classes 
      WHERE user_id = ?
    `);
    const characterResult = characterStmt.get(userId) as any;
    const characterBadge = characterResult?.points || 0;

    // Calculate goals needing attention (no recent progress)
    const goalsStmt = db.prepare(`
      SELECT COUNT(*) as count FROM goals 
      WHERE user_id = ? AND deleted_at IS NULL AND archived = 0
      AND updated_at < datetime('now', '-7 days')
    `);
    const goalsResult = goalsStmt.get(userId) as any;
    const goalsBadge = goalsResult?.count || 0;

    return {
      quests: questsBadge,
      character: characterBadge,
      goals: goalsBadge
    };
  }
}