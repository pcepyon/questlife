import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('GET /api/navigation', () => {
  let app: express.Application;
  const validToken = 'valid-jwt-token';
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return current navigation state', async () => {
    const response = await request(app)
      .get('/api/navigation')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        currentTab: expect.stringMatching(/dashboard|quests|character|goals/),
        lastVisited: {
          dashboard: expect.any(String),
          quests: expect.any(String),
          character: expect.any(String),
          goals: expect.any(String)
        },
        onboardingCompleted: expect.any(Boolean),
        tutorialStep: expect.any(Number)
      }
    });
  });

  it('should return default state for new user', async () => {
    const response = await request(app)
      .get('/api/navigation')
      .set('Authorization', 'Bearer new-user-token');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        currentTab: 'dashboard',
        lastVisited: {
          dashboard: expect.any(String),
          quests: null,
          character: null,
          goals: null
        },
        onboardingCompleted: false,
        tutorialStep: 0
      }
    });
  });

  it('should require authentication', async () => {
    const response = await request(app)
      .get('/api/navigation');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Authorization required'
    });
  });

  it('should include badge counts for tabs', async () => {
    const response = await request(app)
      .get('/api/navigation')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('badges');
    expect(response.body.data.badges).toMatchObject({
      quests: expect.any(Number), // Uncompleted daily quests
      character: expect.any(Number), // Available skill points
      goals: expect.any(Number) // Goals needing attention
    });
  });
});