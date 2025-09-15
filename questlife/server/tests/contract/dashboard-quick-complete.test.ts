import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('POST /api/dashboard/quick-complete', () => {
  let app: express.Application;
  const validToken = 'valid-jwt-token';
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should complete quest quickly from dashboard', async () => {
    const response = await request(app)
      .post('/api/dashboard/quick-complete')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        questId: 'quest-123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Quest completed successfully',
      data: {
        questId: 'quest-123',
        xpGained: expect.any(Number),
        levelUp: expect.any(Boolean),
        newLevel: expect.any(Number),
        streakMaintained: expect.any(Boolean),
        newStreak: expect.any(Number),
        updatedStats: {
          totalXP: expect.any(Number),
          currentLevel: expect.any(Number),
          currentStreak: expect.any(Number),
          questsCompletedToday: expect.any(Number)
        }
      }
    });
  });

  it('should apply streak multiplier to XP', async () => {
    const response = await request(app)
      .post('/api/dashboard/quick-complete')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        questId: 'quest-456' // User has 3x streak
      });

    expect(response.status).toBe(200);
    expect(response.body.data.xpGained).toBeGreaterThan(0);
    expect(response.body.data).toHaveProperty('multiplierApplied');
    expect(response.body.data.multiplierApplied).toBeGreaterThanOrEqual(1);
  });

  it('should invalidate dashboard cache after completion', async () => {
    const dashboardBefore = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${validToken}`);

    const completionResponse = await request(app)
      .post('/api/dashboard/quick-complete')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        questId: 'quest-789'
      });

    expect(completionResponse.status).toBe(200);

    const dashboardAfter = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${validToken}`);

    expect(dashboardAfter.body.data.stats.questsCompletedToday)
      .toBeGreaterThan(dashboardBefore.body.data.stats.questsCompletedToday);
  });

  it('should reject non-existent quest', async () => {
    const response = await request(app)
      .post('/api/dashboard/quick-complete')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        questId: 'non-existent-quest'
      });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Quest not found'
    });
  });

  it('should reject already completed quest', async () => {
    const response = await request(app)
      .post('/api/dashboard/quick-complete')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        questId: 'completed-quest-123'
      });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Quest already completed'
    });
  });

  it('should require authentication', async () => {
    const response = await request(app)
      .post('/api/dashboard/quick-complete')
      .send({
        questId: 'quest-123'
      });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Authorization required'
    });
  });
});