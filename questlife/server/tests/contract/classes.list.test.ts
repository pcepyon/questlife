import request from 'supertest';
import express from 'express';
import apiRouter from '../../src/api/index';
import { initDatabase, closeDatabase, getDatabase } from '../../src/db/index';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('GET /api/classes', () => {
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
    db.prepare('DELETE FROM character_classes').run();
    
    // Add test data
    const classes = [
      { id: uuidv4(), name: 'Code Warrior', level: 5, status: 'active' },
      { id: uuidv4(), name: 'AI Scholar', level: 30, status: 'mastered' },
      { id: uuidv4(), name: 'Data Sage', level: 15, status: 'active' }
    ];
    
    const stmt = db.prepare(`
      INSERT INTO character_classes (
        id, user_id, name, description, level, current_xp, xp_to_next_level,
        status, target_level, ultimate_goal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    classes.forEach(cls => {
      stmt.run(
        cls.id,
        userId,
        cls.name,
        'Test description',
        cls.level,
        0,
        100 * cls.level,
        cls.status,
        30,
        'Test goal'
      );
    });
  });

  it('should return all classes for a user', async () => {
    const response = await request(app)
      .get('/api/classes')
      .query({ userId });

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(3);
    
    const classNames = response.body.map((c: any) => c.name);
    expect(classNames).toContain('Code Warrior');
    expect(classNames).toContain('AI Scholar');
    expect(classNames).toContain('Data Sage');
  });

  it('should return empty array for user with no classes', async () => {
    const response = await request(app)
      .get('/api/classes')
      .query({ userId: 'new-user-456' });

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(0);
  });

  it('should require userId parameter', async () => {
    const response = await request(app)
      .get('/api/classes');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('userId is required');
  });

  it('should include all required fields in response', async () => {
    const response = await request(app)
      .get('/api/classes')
      .query({ userId });

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    
    const firstClass = response.body[0];
    expect(firstClass).toHaveProperty('id');
    expect(firstClass).toHaveProperty('user_id', userId);
    expect(firstClass).toHaveProperty('name');
    expect(firstClass).toHaveProperty('description');
    expect(firstClass).toHaveProperty('level');
    expect(firstClass).toHaveProperty('current_xp');
    expect(firstClass).toHaveProperty('xp_to_next_level');
    expect(firstClass).toHaveProperty('status');
    expect(firstClass).toHaveProperty('target_level');
    expect(firstClass).toHaveProperty('ultimate_goal');
  });
});