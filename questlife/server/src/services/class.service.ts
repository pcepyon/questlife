import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/index.js';
import { CharacterClass } from '@shared/types';
import { DashboardService } from './dashboard.service.js';

interface CreateClassInput {
  userId: string;
  name: string;
  description: string;
  targetLevel: number;
  ultimateGoal: string;
}

export async function createClass(input: CreateClassInput): Promise<CharacterClass> {
  const db = getDatabase();
  const classId = uuidv4();
  const now = new Date();
  
  const newClass: CharacterClass = {
    id: classId,
    userId: input.userId,
    name: input.name,
    description: input.description,
    level: 1,
    currentXP: 0,
    xpToNextLevel: 100,
    status: 'active',
    targetLevel: input.targetLevel,
    ultimateGoal: input.ultimateGoal,
    createdAt: now,
    plannedEvolutions: [],
  };
  
  db.prepare(`
    INSERT INTO character_classes (
      id, user_id, name, description, level, current_xp, xp_to_next_level,
      status, target_level, ultimate_goal, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newClass.id,
    newClass.userId,
    newClass.name,
    newClass.description,
    newClass.level,
    newClass.currentXP,
    newClass.xpToNextLevel,
    newClass.status,
    newClass.targetLevel,
    newClass.ultimateGoal,
    now.toISOString()
  );
  
  // Create skill tree for the class
  db.prepare(`
    INSERT INTO skill_trees (id, class_id, skills, available_points, total_points_earned)
    VALUES (?, ?, '[]', 0, 0)
  `).run(uuidv4(), classId);

  // Invalidate dashboard cache since new class affects dashboard data
  DashboardService.invalidateCache(input.userId);

  return newClass;
}

export async function getClassesByUser(userId: string): Promise<CharacterClass[]> {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM character_classes WHERE user_id = ?').all(userId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    level: row.level,
    currentXP: row.current_xp,
    xpToNextLevel: row.xp_to_next_level,
    status: row.status,
    targetLevel: row.target_level,
    ultimateGoal: row.ultimate_goal,
    createdAt: new Date(row.created_at),
    masteredAt: row.mastered_at ? new Date(row.mastered_at) : undefined,
    plannedEvolutions: JSON.parse(row.planned_evolutions || '[]'),
    baseClassIds: row.base_class_ids ? JSON.parse(row.base_class_ids) : undefined
  }));
}

export function calculateXPToNextLevel(currentLevel: number): number {
  const baseXP = 100;
  const increment = 50;
  return baseXP + (increment * (currentLevel - 1)) + (10 * Math.pow(currentLevel - 1, 1.2));
}