import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  deadline?: string | null;
  milestones?: Milestone[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface CreateGoalInput {
  userId: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  deadline?: string;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  deadline?: string | null;
  milestones?: Milestone[];
}

export class GoalModel {
  static create(input: CreateGoalInput): Goal {
    const goal: Goal = {
      id: uuidv4(),
      userId: input.userId,
      title: input.title,
      description: input.description,
      priority: input.priority || 'medium',
      deadline: input.deadline || null,
      milestones: [],
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    };

    const stmt = db.prepare(`
      INSERT INTO goals (
        id, user_id, title, description, priority, deadline,
        milestones, archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      goal.id,
      goal.userId,
      goal.title,
      goal.description || null,
      goal.priority,
      goal.deadline,
      JSON.stringify(goal.milestones),
      goal.archived ? 1 : 0,
      goal.createdAt,
      goal.updatedAt
    );

    return goal;
  }

  static findById(id: string): Goal | null {
    const stmt = db.prepare(`
      SELECT * FROM goals 
      WHERE id = ? AND deleted_at IS NULL
    `);
    const row = stmt.get(id) as any;
    
    if (!row) return null;

    return this.rowToGoal(row);
  }

  static findByUserId(userId: string, includeArchived = false): Goal[] {
    const archivedCondition = includeArchived ? '' : 'AND archived = 0';
    const stmt = db.prepare(`
      SELECT * FROM goals 
      WHERE user_id = ? AND deleted_at IS NULL ${archivedCondition}
      ORDER BY created_at DESC
    `);
    
    const rows = stmt.all(userId) as any[];
    return rows.map(row => this.rowToGoal(row));
  }

  static update(id: string, userId: string, input: UpdateGoalInput): Goal | null {
    // Check ownership
    const existing = this.findById(id);
    if (!existing || existing.userId !== userId) return null;

    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [new Date().toISOString()];

    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title);
    }

    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }

    if (input.priority !== undefined) {
      updates.push('priority = ?');
      values.push(input.priority);
    }

    if (input.deadline !== undefined) {
      updates.push('deadline = ?');
      values.push(input.deadline);
    }

    if (input.milestones !== undefined) {
      updates.push('milestones = ?');
      values.push(JSON.stringify(input.milestones));
    }

    values.push(id);

    const stmt = db.prepare(`
      UPDATE goals 
      SET ${updates.join(', ')}
      WHERE id = ? AND deleted_at IS NULL
    `);

    stmt.run(...values);

    return this.findById(id);
  }

  static delete(id: string, userId: string, soft = true): boolean {
    // Check ownership
    const existing = this.findById(id);
    if (!existing || existing.userId !== userId) return false;

    if (soft) {
      // Soft delete
      const stmt = db.prepare(`
        UPDATE goals 
        SET deleted_at = ?, updated_at = ?
        WHERE id = ?
      `);
      const result = stmt.run(
        new Date().toISOString(),
        new Date().toISOString(),
        id
      );
      return result.changes > 0;
    } else {
      // Hard delete
      const stmt = db.prepare('DELETE FROM goals WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    }
  }

  static archive(id: string, userId: string): boolean {
    const stmt = db.prepare(`
      UPDATE goals 
      SET archived = 1, updated_at = ?
      WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    `);
    
    const result = stmt.run(
      new Date().toISOString(),
      id,
      userId
    );
    
    return result.changes > 0;
  }

  static unarchive(id: string, userId: string): boolean {
    const stmt = db.prepare(`
      UPDATE goals 
      SET archived = 0, updated_at = ?
      WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    `);
    
    const result = stmt.run(
      new Date().toISOString(),
      id,
      userId
    );
    
    return result.changes > 0;
  }

  static updateMilestone(goalId: string, milestoneId: string, completed: boolean): boolean {
    const goal = this.findById(goalId);
    if (!goal) return false;

    const milestones = goal.milestones || [];
    const milestone = milestones.find(m => m.id === milestoneId);
    
    if (!milestone) return false;

    milestone.completed = completed;
    milestone.completedAt = completed ? new Date().toISOString() : undefined;

    const stmt = db.prepare(`
      UPDATE goals 
      SET milestones = ?, updated_at = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      JSON.stringify(milestones),
      new Date().toISOString(),
      goalId
    );

    return result.changes > 0;
  }

  static getUserStats(userId: string): { totalGoals: number; activeGoals: number } {
    const totalStmt = db.prepare(`
      SELECT COUNT(*) as count FROM goals 
      WHERE user_id = ? AND deleted_at IS NULL
    `);
    const totalResult = totalStmt.get(userId) as any;

    const activeStmt = db.prepare(`
      SELECT COUNT(*) as count FROM goals 
      WHERE user_id = ? AND deleted_at IS NULL AND archived = 0
    `);
    const activeResult = activeStmt.get(userId) as any;

    return {
      totalGoals: totalResult?.count || 0,
      activeGoals: activeResult?.count || 0
    };
  }

  private static rowToGoal(row: any): Goal {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      deadline: row.deadline,
      milestones: row.milestones ? JSON.parse(row.milestones) : [],
      archived: row.archived === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    };
  }
}