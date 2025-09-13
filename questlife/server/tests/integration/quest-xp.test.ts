import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { initDatabase, closeDatabase, getDatabase } from '../../src/db/index';
import { completeQuest } from '../../src/services/quest.service';
import { v4 as uuidv4 } from 'uuid';

describe('Quest Completion and XP Gain Flow', () => {
  const userId = 'test-user-123';
  const classId = uuidv4();
  
  beforeAll(async () => {
    process.env.DATABASE_PATH = ':memory:';
    await initDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    const db = getDatabase();
    
    // Clear data in correct order to avoid foreign key constraints
    db.prepare('DELETE FROM xp_multipliers').run();
    db.prepare('DELETE FROM quests').run();
    db.prepare('DELETE FROM progress_streaks').run();
    db.prepare('DELETE FROM character_classes').run();
    db.prepare('DELETE FROM users').run();
    
    // Setup test data
    db.prepare(`
      INSERT INTO users (id, created_at, updated_at, settings)
      VALUES (?, datetime('now'), datetime('now'), '{}')
    `).run(userId);
    
    db.prepare(`
      INSERT INTO character_classes (
        id, user_id, name, description, level, current_xp, xp_to_next_level,
        status, target_level, ultimate_goal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      classId,
      userId,
      'Test Class',
      'Test description',
      5,
      250,
      500,
      'active',
      30,
      'Test goal'
    );
    
    db.prepare(`
      INSERT INTO progress_streaks (
        id, user_id, current_streak, longest_streak, multiplier, streak_milestones
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, 0, 0, 1.0, '[]');
  });

  it('should complete quest and award base XP', async () => {
    const db = getDatabase();
    const questId = uuidv4();
    
    // Create a quest
    db.prepare(`
      INSERT INTO quests (
        id, class_id, type, title, description, xp_reward, status,
        difficulty, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      questId,
      classId,
      'daily',
      'Test Quest',
      'Test description',
      50,
      'pending',
      2
    );
    
    // Complete the quest
    const result = await completeQuest(questId, userId);
    
    expect(result).toMatchObject({
      xpGained: 50,
      levelUp: false,
      streak: {
        current: 1,
        multiplier: 1.0
      }
    });
    
    // Verify quest status updated
    const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(questId) as any;
    expect(quest.status).toBe('completed');
    expect(quest.completed_at).toBeDefined();
    
    // Verify XP was added to class
    const charClass = db.prepare('SELECT * FROM character_classes WHERE id = ?').get(classId) as any;
    expect(charClass.current_xp).toBe(300); // 250 + 50
  });

  it('should handle level up when XP threshold reached', async () => {
    const db = getDatabase();
    const questId = uuidv4();
    
    // Set class XP close to level up
    db.prepare('UPDATE character_classes SET current_xp = 480 WHERE id = ?').run(classId);
    
    // Create a quest
    db.prepare(`
      INSERT INTO quests (
        id, class_id, type, title, description, xp_reward, status,
        difficulty, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      questId,
      classId,
      'daily',
      'Level Up Quest',
      'This should trigger level up',
      50,
      'pending',
      2
    );
    
    // Complete the quest
    const result = await completeQuest(questId, userId);
    
    expect(result).toMatchObject({
      xpGained: 50,
      levelUp: true,
      newLevel: 6,
      streak: {
        current: 1,
        multiplier: 1.0
      }
    });
    
    // Verify level increased
    const charClass = db.prepare('SELECT * FROM character_classes WHERE id = ?').get(classId) as any;
    expect(charClass.level).toBe(6);
    expect(charClass.current_xp).toBe(30); // 480 + 50 - 500 (overflow)
    expect(charClass.xp_to_next_level).toBe(600); // Level 6 requirement
  });

  it('should apply streak multipliers correctly', async () => {
    const db = getDatabase();
    
    // Set up an existing streak
    db.prepare('UPDATE progress_streaks SET current_streak = 5, multiplier = 1.5 WHERE user_id = ?')
      .run(userId);
    
    const questId = uuidv4();
    db.prepare(`
      INSERT INTO quests (
        id, class_id, type, title, description, xp_reward, status,
        difficulty, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      questId,
      classId,
      'daily',
      'Streak Quest',
      'Test streak multiplier',
      100,
      'pending',
      3
    );
    
    const result = await completeQuest(questId, userId);
    
    expect(result.xpGained).toBe(150); // 100 * 1.5
    expect(result.streak.current).toBe(6);
    expect(result.streak.multiplier).toBeGreaterThanOrEqual(1.5);
    
    // Verify XP multiplier was logged
    const multiplier = db.prepare(`
      SELECT * FROM xp_multipliers 
      WHERE quest_id = ? AND user_id = ?
    `).get(questId, userId) as any;
    
    expect(multiplier).toBeDefined();
    expect(multiplier.base_xp).toBe(100);
    expect(multiplier.multiplier_value).toBe(1.5);
    expect(multiplier.final_xp).toBe(150);
    expect(multiplier.reason).toBe('streak');
  });

  it('should calculate streak multiplier based on days', async () => {
    const db = getDatabase();
    
    // Test different streak lengths
    const streakTests = [
      { days: 3, expectedMultiplier: 1.5 },
      { days: 7, expectedMultiplier: 2.0 },
      { days: 14, expectedMultiplier: 3.0 },
      { days: 30, expectedMultiplier: 4.0 },
      { days: 50, expectedMultiplier: 5.0 }
    ];
    
    for (const test of streakTests) {
      // Reset streak
      db.prepare('UPDATE progress_streaks SET current_streak = ?, multiplier = ? WHERE user_id = ?')
        .run(test.days, 1.0, userId);
      
      const questId = uuidv4();
      db.prepare(`
        INSERT INTO quests (
          id, class_id, type, title, description, xp_reward, status,
          difficulty, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        questId,
        classId,
        'daily',
        `Day ${test.days} Quest`,
        'Test streak multiplier',
        100,
        'pending',
        2
      );
      
      const result = await completeQuest(questId, userId);
      
      // Calculate expected multiplier
      const expectedMultiplier = Math.min(1 + (test.days / 7) * 0.5, 5.0);
      expect(result.streak.multiplier).toBeCloseTo(expectedMultiplier, 1);
    }
  });

  it('should handle urgent quest bonus XP', async () => {
    const db = getDatabase();
    const questId = uuidv4();
    
    // Create an urgent quest
    db.prepare(`
      INSERT INTO quests (
        id, class_id, type, title, description, xp_reward, status,
        difficulty, created_at, time_limit, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now', '+2 hours'))
    `).run(
      questId,
      classId,
      'urgent',
      'Urgent Quest',
      'Complete quickly for bonus XP',
      100,
      'pending',
      4,
      7200 // 2 hours in seconds
    );
    
    const result = await completeQuest(questId, userId);
    
    // Urgent quests should give 1.5x XP
    expect(result.xpGained).toBeGreaterThanOrEqual(100);
    expect(result.bonusReason).toContain('urgent');
  });

  it('should track total quests completed', async () => {
    const db = getDatabase();
    
    // Create character status
    db.prepare(`
      INSERT INTO character_status (
        id, user_id, strength, wisdom, creativity, discipline, charisma,
        total_power_level, mastered_class_count, total_quests_completed, permanent_bonuses
      ) VALUES (?, ?, 10, 10, 10, 10, 10, 50, 0, 5, '[]')
    `).run(uuidv4(), userId);
    
    // Complete multiple quests
    for (let i = 0; i < 3; i++) {
      const questId = uuidv4();
      db.prepare(`
        INSERT INTO quests (
          id, class_id, type, title, description, xp_reward, status,
          difficulty, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        questId,
        classId,
        'daily',
        `Quest ${i + 1}`,
        'Test quest',
        25,
        'pending',
        1
      );
      
      await completeQuest(questId, userId);
    }
    
    // Check total quests completed
    const status = db.prepare('SELECT * FROM character_status WHERE user_id = ?').get(userId) as any;
    expect(status.total_quests_completed).toBe(8); // 5 initial + 3 completed
  });
});