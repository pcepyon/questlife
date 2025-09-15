import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Onboarding Flow Integration', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should complete full onboarding flow', async () => {
    // Step 1: Create new user
    const createUserResponse = await request(app)
      .post('/api/users')
      .send({
        name: 'New User',
        email: 'newuser@example.com'
      });

    expect(createUserResponse.status).toBe(201);
    const userId = createUserResponse.body.data.userId;

    // Step 2: Setup PIN
    const setupPinResponse = await request(app)
      .post('/api/auth/setup-pin')
      .send({
        userId,
        pin: '1234'
      });

    expect(setupPinResponse.status).toBe(201);
    const sessionToken = setupPinResponse.body.data.sessionToken;

    // Step 3: Set first goal
    const goalResponse = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        title: '운동을 매일 하고 싶어요'
      });

    expect(goalResponse.status).toBe(201);
    const goalId = goalResponse.body.data.id;

    // Step 4: Analyze goal and create character class
    const analyzeResponse = await request(app)
      .post('/api/goals/analyze')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        goalId
      });

    expect(analyzeResponse.status).toBe(200);
    expect(analyzeResponse.body.data).toHaveProperty('characterClass');
    expect(analyzeResponse.body.data).toHaveProperty('quests');

    // Step 5: Mark onboarding as complete
    const navigationResponse = await request(app)
      .put('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        onboardingCompleted: true,
        tutorialStep: 1
      });

    expect(navigationResponse.status).toBe(200);
    expect(navigationResponse.body.data.onboardingCompleted).toBe(true);

    // Step 6: Verify dashboard is accessible
    const dashboardResponse = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body.data.activeClasses).toHaveLength(1);
    expect(dashboardResponse.body.data.todayQuests.length).toBeGreaterThan(0);
  });

  it('should handle skip onboarding option', async () => {
    // Create user with skip option
    const createUserResponse = await request(app)
      .post('/api/users')
      .send({
        name: 'Skip User',
        email: 'skip@example.com',
        skipOnboarding: true
      });

    expect(createUserResponse.status).toBe(201);
    const userId = createUserResponse.body.data.userId;

    // Setup PIN
    const setupPinResponse = await request(app)
      .post('/api/auth/setup-pin')
      .send({
        userId,
        pin: '5678'
      });

    expect(setupPinResponse.status).toBe(201);
    const sessionToken = setupPinResponse.body.data.sessionToken;

    // Should go directly to dashboard
    const navigationResponse = await request(app)
      .get('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(navigationResponse.status).toBe(200);
    expect(navigationResponse.body.data.onboardingCompleted).toBe(true);
    expect(navigationResponse.body.data.currentTab).toBe('dashboard');
  });

  it('should resume incomplete onboarding', async () => {
    // Create user
    const createUserResponse = await request(app)
      .post('/api/users')
      .send({
        name: 'Resume User',
        email: 'resume@example.com'
      });

    const userId = createUserResponse.body.data.userId;

    // Setup PIN but don't complete onboarding
    const setupPinResponse = await request(app)
      .post('/api/auth/setup-pin')
      .send({
        userId,
        pin: '9999'
      });

    const sessionToken = setupPinResponse.body.data.sessionToken;

    // Check navigation state
    const navResponse = await request(app)
      .get('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(navResponse.status).toBe(200);
    expect(navResponse.body.data.onboardingCompleted).toBe(false);
    expect(navResponse.body.data.tutorialStep).toBe(0);

    // Should redirect to onboarding
    const dashboardResponse = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(dashboardResponse.status).toBe(302);
    expect(dashboardResponse.headers.location).toContain('/onboarding');
  });
});