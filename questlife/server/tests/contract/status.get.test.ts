import request from 'supertest';
import express from 'express';
import apiRouter from '../../src/api/index';
import { initDatabase, closeDatabase, getDatabase } from '../../src/db/index';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('GET /api/status', () => {
  const userId = 'test-user-123';
  
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
    db.prepare('DELETE FROM character_status').run();
    db.prepare('DELETE FROM progress_streaks').run();
    db.prepare('DELETE FROM achievements').run();
    db.prepare('DELETE FROM users').run();
    
    // Create test user
    db.prepare(`
      INSERT INTO users (id, created_at, updated_at, settings)
      VALUES (?, datetime('now'), datetime('now'), '{}')
    `).run(userId);
  });

  it('should return character status for existing user', async () => {
    const db = getDatabase();
    
    // Create character status
    db.prepare(`
      INSERT INTO character_status (
        id, user_id, strength, wisdom, creativity, discipline, charisma,
        total_power_level, mastered_class_count, total_quests_completed, permanent_bonuses
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      userId,
      15,
      20,
      18,
      12,
      10,
      75,
      2,
      45,
      JSON.stringify([{ attributeType: 'strength', value: 5, source: 'Class Mastery' }])
    );
    
    // Create streak
    db.prepare(`
      INSERT INTO progress_streaks (
        id, user_id, current_streak, longest_streak, multiplier, streak_milestones
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, 7, 15, 2.0, '[]');
    
    // Create achievements
    db.prepare(`
      INSERT INTO achievements (
        id, user_id, type, name, description, icon, rarity, xp_bonus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      userId,
      'milestone',
      'First Quest',
      'Complete your first quest',
      '🎯',
      'common',
      10
    );
    
    const response = await request(app)
      .get('/api/status')
      .query({ userId });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      user_id: userId,
      strength: 15,
      wisdom: 20,
      creativity: 18,
      discipline: 12,
      charisma: 10,
      total_power_level: 75,
      mastered_class_count: 2,
      total_quests_completed: 45,
      permanentBonuses: [
        { attributeType: 'strength', value: 5, source: 'Class Mastery' }
      ],
      streak: {
        current: 7,
        longest: 15,
        multiplier: 2.0
      }
    });
    
    expect(response.body.recentAchievements).toBeInstanceOf(Array);
    expect(response.body.recentAchievements).toHaveLength(1);
  });

  it('should create default status for new user', async () => {
    const response = await request(app)
      .get('/api/status')
      .query({ userId });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      userId,
      strength: 10,
      wisdom: 10,
      creativity: 10,
      discipline: 10,
      charisma: 10,
      totalPowerLevel: 50,
      masteredClassCount: 0,
      totalQuestsCompleted: 0,
      permanentBonuses: []
    });
    
    // Verify it was saved to database
    const db = getDatabase();
    const status = db.prepare('SELECT * FROM character_status WHERE user_id = ?').get(userId);
    expect(status).toBeTruthy();
  });

  it('should require userId parameter', async () => {
    const response = await request(app)
      .get('/api/status');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('userId is required');
  });

  it('should handle user with no streak data', async () => {
    const db = getDatabase();
    
    // Create character status only (no streak)
    db.prepare(`
      INSERT INTO character_status (
        id, user_id, strength, wisdom, creativity, discipline, charisma,
        total_power_level, mastered_class_count, total_quests_completed, permanent_bonuses
      ) VALUES (?, ?, 10, 10, 10, 10, 10, 50, 0, 0, '[]')
    `).run(uuidv4(), userId);
    
    const response = await request(app)
      .get('/api/status')
      .query({ userId });

    expect(response.status).toBe(200);
    expect(response.body.streak).toBeNull();
  });

  it('should return up to 5 recent achievements', async () => {
    const db = getDatabase();
    
    // Create character status
    db.prepare(`
      INSERT INTO character_status (
        id, user_id, strength, wisdom, creativity, discipline, charisma,
        total_power_level, mastered_class_count, total_quests_completed, permanent_bonuses
      ) VALUES (?, ?, 10, 10, 10, 10, 10, 50, 0, 0, '[]')
    `).run(uuidv4(), userId);
    
    // Create 7 achievements
    const stmt = db.prepare(`
      INSERT INTO achievements (
        id, user_id, type, name, description, icon, rarity, xp_bonus, unlocked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (let i = 1; i <= 7; i++) {
      stmt.run(
        uuidv4(),
        userId,
        'milestone',
        `Achievement ${i}`,
        `Description ${i}`,
        '🏆',
        'common',
        10 * i,
        new Date(Date.now() - i * 3600000).toISOString() // Different timestamps
      );
    }
    
    const response = await request(app)
      .get('/api/status')
      .query({ userId });

    expect(response.status).toBe(200);
    expect(response.body.recentAchievements).toHaveLength(5);
    // Should be ordered by most recent first
    expect(response.body.recentAchievements[0].name).toBe('Achievement 1');
  });
});