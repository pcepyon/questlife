import request from 'supertest';
import express from 'express';
import apiRouter from '../../src/api/index.js';
describe('PUT /api/navigation', () => {
  let app: express.Application;
  const validToken = 'valid-jwt-token';
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);  });

  afterEach(() => {
    // Clean up after each test;
  });

  it('should update navigation state', async () => {
    const response = await request(app)
      .put('/api/navigation')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        currentTab: 'quests'
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Navigation state updated',
      data: {
        currentTab: 'quests',
        lastVisited: expect.objectContaining({
          quests: expect.any(String)
        })
      }
    });
  });

  it('should update onboarding completion', async () => {
    const response = await request(app)
      .put('/api/navigation')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        onboardingCompleted: true
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        onboardingCompleted: true
      }
    });
  });

  it('should update tutorial step', async () => {
    const response = await request(app)
      .put('/api/navigation')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        tutorialStep: 3
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        tutorialStep: 3
      }
    });
  });

  it('should reject invalid tab name', async () => {
    const response = await request(app)
      .put('/api/navigation')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        currentTab: 'invalid-tab'
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Invalid tab name'
    });
  });

  it('should allow partial updates', async () => {
    const response = await request(app)
      .put('/api/navigation')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        currentTab: 'character',
        tutorialStep: 5
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      currentTab: 'character',
      tutorialStep: 5
    });
  });

  it('should require authentication', async () => {
    const response = await request(app)
      .put('/api/navigation')
      .send({
        currentTab: 'goals'
      });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: 'Authorization required'
    });
  });
});