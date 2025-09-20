import request from 'supertest';
import express from 'express';
import apiRouter from '../../src/api/index.js';
describe('GET /api/dashboard', () => {
  let app: express.Application;
  const validToken = 'valid-jwt-token';
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);  });

  afterEach(() => {
    // Clean up after each test;
  });

  it('should return dashboard data for authenticated user', async () => {
    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        stats: {
          totalXP: expect.any(Number),
          currentLevel: expect.any(Number),
          currentStreak: expect.any(Number),
          streakMultiplier: expect.any(Number),
          questsCompletedToday: expect.any(Number),
          totalQuestsCompleted: expect.any(Number)
        },
        todayQuests: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
            description: expect.any(String),
            type: expect.stringMatching(/daily|weekly|special/),
            xpReward: expect.any(Number),
            completed: expect.any(Boolean),
            classId: expect.any(String)
          })
        ]),
        activeClasses: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            level: expect.any(Number),
            currentXP: expect.any(Number),
            requiredXP: expect.any(Number),
            icon: expect.any(String)
          })
        ]),
        recentAchievements: expect.any(Array)
      }
    });
  });

  it('should use cache when available', async () => {
    // First request
    const response1 = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response1.status).toBe(200);

    // Second request should be faster (from cache)
    const startTime = Date.now();
    const response2 = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${validToken}`);
    const endTime = Date.now();

    expect(response2.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(50); // Should be very fast from cache
    expect(response2.body).toEqual(response1.body);
  });

  it('should require authentication', async () => {
    const response = await request(app)
      .get('/api/dashboard');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Authorization required'
    });
  });

  it('should handle user with no data gracefully', async () => {
    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', 'Bearer new-user-token');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        stats: {
          totalXP: 0,
          currentLevel: 1,
          currentStreak: 0,
          streakMultiplier: 1,
          questsCompletedToday: 0,
          totalQuestsCompleted: 0
        },
        todayQuests: [],
        activeClasses: [],
        recentAchievements: []
      }
    });
  });
});