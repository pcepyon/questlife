import request from 'supertest';
import express from 'express';
import apiRouter from '../../src/api/index';
import { initDatabase, closeDatabase, getDatabase } from '../../src/db/index';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('POST /api/quests/:id/complete', () => {
  const userId = 'test-user-123';
  const classId = uuidv4();
  const questId = uuidv4();
  
  beforeAll(async () => {
    process.env.DATABASE_PATH = ':memory:';
    await initDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    const db = getDatabase();
    
    // Clear existing data
    db.prepare('DELETE FROM quests').run();
    db.prepare('DELETE FROM character_classes').run();
    db.prepare('DELETE FROM users').run();
    db.prepare('DELETE FROM progress_streaks').run();
    
    // Create test user
    db.prepare(`
      INSERT INTO users (id, created_at, updated_at, settings)
      VALUES (?, datetime('now'), datetime('now'), '{}')
    `).run(userId);
    
    // Create test class
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
    
    // Create test quest
    db.prepare(`
      INSERT INTO quests (
        id, class_id, type, title, description, xp_reward, status,
        difficulty, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      questId,
      classId,
      'daily',
      'Complete coding challenge',
      'Solve a medium difficulty problem',
      50,
      'pending',
      2
    );
    
    // Create progress streak
    db.prepare(`
      INSERT INTO progress_streaks (
        id, user_id, current_streak, longest_streak, multiplier, streak_milestones
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, 0, 0, 1.0, '[]');
  });

  it('should complete a quest and award XP', async () => {
    const response = await request(app)
      .post(`/api/quests/${questId}/complete`)
      .send({ userId });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('xpGained');
    expect(response.body).toHaveProperty('levelUp');
    expect(response.body).toHaveProperty('streak');
    
    expect(response.body.xpGained).toBeGreaterThanOrEqual(50);
    expect(response.body.levelUp).toBe(false);
    
    // Verify quest status was updated
    const db = getDatabase();
    const quest = db.prepare('SELECT status FROM quests WHERE id = ?').get(questId) as any;
    expect(quest.status).toBe('completed');
  });

  it('should handle level up when XP threshold is reached', async () => {
    // Update class to be close to leveling up
    const db = getDatabase();
    db.prepare('UPDATE character_classes SET current_xp = 490 WHERE id = ?').run(classId);
    
    const response = await request(app)
      .post(`/api/quests/${questId}/complete`)
      .send({ userId });

    expect(response.status).toBe(200);
    expect(response.body.levelUp).toBe(true);
    expect(response.body).toHaveProperty('newLevel');
    expect(response.body.newLevel).toBe(6);
  });

  it('should prevent completing already completed quest', async () => {
    // First completion
    await request(app)
      .post(`/api/quests/${questId}/complete`)
      .send({ userId });
    
    // Second attempt
    const response = await request(app)
      .post(`/api/quests/${questId}/complete`)
      .send({ userId });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('already completed');
  });

  it('should require userId', async () => {
    const response = await request(app)
      .post(`/api/quests/${questId}/complete`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should handle non-existent quest', async () => {
    const response = await request(app)
      .post('/api/quests/non-existent-id/complete')
      .send({ userId });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('not found');
  });

  it('should apply streak multiplier', async () => {
    // Set up streak
    const db = getDatabase();
    db.prepare('UPDATE progress_streaks SET current_streak = 5, multiplier = 1.5 WHERE user_id = ?')
      .run(userId);
    
    const response = await request(app)
      .post(`/api/quests/${questId}/complete`)
      .send({ userId });

    expect(response.status).toBe(200);
    expect(response.body.xpGained).toBe(75); // 50 * 1.5
    expect(response.body.streak).toMatchObject({
      current: 6,
      multiplier: expect.any(Number)
    });
  });
});