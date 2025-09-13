import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import apiRouter from '../../src/api/index.js';
import { initDatabase, closeDatabase } from '../../src/db/index.js';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('POST /api/goals/analyze', () => {
  beforeAll(async () => {
    process.env.DATABASE_PATH = ':memory:';
    process.env.OPENAI_API_KEY = 'test-key';
    await initDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  it('should analyze a goal and return a character class', async () => {
    const response = await request(app)
      .post('/api/goals/analyze')
      .send({
        userId: 'test-user-123',
        goalText: 'I want to learn machine learning and build AI applications',
        targetLevel: 20,
        timeframe: 6
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('class');
    expect(response.body).toHaveProperty('quests');
    expect(response.body).toHaveProperty('analysis');

    const { class: characterClass } = response.body;
    expect(characterClass).toMatchObject({
      userId: 'test-user-123',
      name: expect.any(String),
      description: expect.any(String),
      level: 1,
      currentXP: 0,
      xpToNextLevel: 100,
      status: 'active'
    });

    expect(response.body.quests).toBeInstanceOf(Array);
    expect(response.body.quests.length).toBeGreaterThan(0);
  });

  it('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/goals/analyze')
      .send({
        userId: 'test-user-123'
        // Missing goalText
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should enforce goal text length limits', async () => {
    const longText = 'a'.repeat(501);
    const response = await request(app)
      .post('/api/goals/analyze')
      .send({
        userId: 'test-user-123',
        goalText: longText
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should validate targetLevel range', async () => {
    const response = await request(app)
      .post('/api/goals/analyze')
      .send({
        userId: 'test-user-123',
        goalText: 'Learn to code',
        targetLevel: 31 // Max is 30
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});