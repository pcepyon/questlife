import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import apiRouter from '../../src/api/index';
import { initDatabase, closeDatabase, getDatabase } from '../../src/db/index';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('GET /api/quests', () => {
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
    
    // Clear existing data
    db.prepare('DELETE FROM quests').run();
    
    // Add test quests
    const quests = [
      { id: uuidv4(), type: 'daily', title: 'Morning Meditation', status: 'pending', xp: 25, difficulty: 1 },
      { id: uuidv4(), type: 'daily', title: 'Code Review', status: 'completed', xp: 50, difficulty: 2 },
      { id: uuidv4(), type: 'weekly', title: 'Build Feature', status: 'pending', xp: 200, difficulty: 4 },
      { id: uuidv4(), type: 'urgent', title: 'Fix Critical Bug', status: 'active', xp: 100, difficulty: 3 }
    ];
    
    const stmt = db.prepare(`
      INSERT INTO quests (
        id, class_id, type, title, description, xp_reward, status,
        difficulty, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    quests.forEach(quest => {
      stmt.run(
        quest.id,
        classId,
        quest.type,
        quest.title,
        'Test description',
        quest.xp,
        quest.status,
        quest.difficulty
      );
    });
  });

  it('should return all quests for a class', async () => {
    const response = await request(app)
      .get('/api/quests')
      .query({ classId });

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(4);
    
    const titles = response.body.map((q: any) => q.title);
    expect(titles).toContain('Morning Meditation');
    expect(titles).toContain('Code Review');
    expect(titles).toContain('Build Feature');
    expect(titles).toContain('Fix Critical Bug');
  });

  it('should filter quests by status', async () => {
    const response = await request(app)
      .get('/api/quests')
      .query({ classId, status: 'pending' });

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(2);
    
    response.body.forEach((quest: any) => {
      expect(quest.status).toBe('pending');
    });
  });

  it('should return empty array for class with no quests', async () => {
    const response = await request(app)
      .get('/api/quests')
      .query({ classId: uuidv4() });

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(0);
  });

  it('should require classId parameter', async () => {
    const response = await request(app)
      .get('/api/quests');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('classId is required');
  });

  it('should include all required fields in response', async () => {
    const response = await request(app)
      .get('/api/quests')
      .query({ classId });

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    
    const firstQuest = response.body[0];
    expect(firstQuest).toHaveProperty('id');
    expect(firstQuest).toHaveProperty('class_id', classId);
    expect(firstQuest).toHaveProperty('type');
    expect(firstQuest).toHaveProperty('title');
    expect(firstQuest).toHaveProperty('description');
    expect(firstQuest).toHaveProperty('xp_reward');
    expect(firstQuest).toHaveProperty('status');
    expect(firstQuest).toHaveProperty('difficulty');
    expect(firstQuest).toHaveProperty('created_at');
  });

  it('should filter by multiple statuses', async () => {
    const response = await request(app)
      .get('/api/quests')
      .query({ classId, status: 'active' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Fix Critical Bug');
  });
});