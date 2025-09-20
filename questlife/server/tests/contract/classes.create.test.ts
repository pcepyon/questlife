import request from 'supertest';
import express from 'express';
import apiRouter from '../../src/api/index';
import { initDatabase, closeDatabase } from '../../src/db/index';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('POST /api/classes', () => {
  beforeAll(async () => {
    process.env.DATABASE_PATH = ':memory:';
    await initDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  it('should create a new character class', async () => {
    const response = await request(app)
      .post('/api/classes')
      .send({
        userId: 'test-user-123',
        name: 'Code Warrior',
        description: 'Master of algorithms and data structures',
        targetLevel: 25,
        ultimateGoal: 'Become a senior software engineer'
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      userId: 'test-user-123',
      name: 'Code Warrior',
      description: 'Master of algorithms and data structures',
      level: 1,
      currentXP: 0,
      xpToNextLevel: 100,
      status: 'active',
      targetLevel: 25,
      ultimateGoal: 'Become a senior software engineer'
    });
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('createdAt');
  });

  it('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/classes')
      .send({
        userId: 'test-user-123',
        name: 'Code Warrior'
        // Missing required fields
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should validate targetLevel range (1-30)', async () => {
    const response = await request(app)
      .post('/api/classes')
      .send({
        userId: 'test-user-123',
        name: 'Code Warrior',
        description: 'Test description',
        targetLevel: 35, // Invalid: > 30
        ultimateGoal: 'Test goal'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should validate targetLevel minimum', async () => {
    const response = await request(app)
      .post('/api/classes')
      .send({
        userId: 'test-user-123',
        name: 'Code Warrior',
        description: 'Test description',
        targetLevel: 0, // Invalid: < 1
        ultimateGoal: 'Test goal'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});