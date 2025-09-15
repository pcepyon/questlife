import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Navigation State Persistence Integration', () => {
  let app: express.Application;
  let sessionToken: string;
  let userId: string;
  
  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Setup test user
    const userResponse = await request(app)
      .post('/api/users')
      .send({
        name: 'Navigation Test User',
        email: 'navigation@example.com'
      });

    userId = userResponse.body.data.userId;

    const authResponse = await request(app)
      .post('/api/auth/setup-pin')
      .send({
        userId,
        pin: '1234'
      });

    sessionToken = authResponse.body.data.sessionToken;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should persist navigation state across sessions', async () => {
    // Set initial navigation state
    const updateResponse = await request(app)
      .put('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        currentTab: 'quests',
        tutorialStep: 3
      });

    expect(updateResponse.status).toBe(200);

    // Logout
    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${sessionToken}`);

    // Login again
    const loginResponse = await request(app)
      .post('/api/auth/verify-pin')
      .send({
        userId,
        pin: '1234'
      });

    const newToken = loginResponse.body.data.sessionToken;

    // Check navigation state persisted
    const navResponse = await request(app)
      .get('/api/navigation')
      .set('Authorization', `Bearer ${newToken}`);

    expect(navResponse.status).toBe(200);
    expect(navResponse.body.data).toMatchObject({
      currentTab: 'quests',
      tutorialStep: 3
    });
  });

  it('should track last visited timestamps for tabs', async () => {
    // Visit dashboard
    await request(app)
      .put('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ currentTab: 'dashboard' });

    const dashboardTime = Date.now();

    // Wait a bit and visit quests
    await new Promise(resolve => setTimeout(resolve, 100));

    await request(app)
      .put('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ currentTab: 'quests' });

    const questsTime = Date.now();

    // Wait a bit and visit character
    await new Promise(resolve => setTimeout(resolve, 100));

    await request(app)
      .put('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ currentTab: 'character' });

    // Get navigation state
    const navResponse = await request(app)
      .get('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(navResponse.status).toBe(200);
    
    const lastVisited = navResponse.body.data.lastVisited;
    expect(lastVisited.dashboard).toBeDefined();
    expect(lastVisited.quests).toBeDefined();
    expect(lastVisited.character).toBeDefined();

    // Verify timestamps are in correct order
    const dashboardTimestamp = new Date(lastVisited.dashboard).getTime();
    const questsTimestamp = new Date(lastVisited.quests).getTime();
    const characterTimestamp = new Date(lastVisited.character).getTime();

    expect(questsTimestamp).toBeGreaterThan(dashboardTimestamp);
    expect(characterTimestamp).toBeGreaterThan(questsTimestamp);
  });

  it('should handle onboarding flow navigation', async () => {
    // New user starts with onboarding not completed
    const navResponse1 = await request(app)
      .get('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(navResponse1.body.data.onboardingCompleted).toBe(false);
    expect(navResponse1.body.data.tutorialStep).toBe(0);

    // Progress through tutorial steps
    for (let step = 1; step <= 5; step++) {
      await request(app)
        .put('/api/navigation')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({ tutorialStep: step });
    }

    // Complete onboarding
    await request(app)
      .put('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        onboardingCompleted: true,
        currentTab: 'dashboard'
      });

    // Verify final state
    const navResponse2 = await request(app)
      .get('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(navResponse2.body.data).toMatchObject({
      onboardingCompleted: true,
      tutorialStep: 5,
      currentTab: 'dashboard'
    });
  });

  it('should calculate badge counts correctly', async () => {
    // Create goals and quests
    const goalResponse = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        title: 'Test Goal for Badges'
      });

    await request(app)
      .post('/api/goals/analyze')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ goalId: goalResponse.body.data.id });

    // Get navigation with badge counts
    const navResponse = await request(app)
      .get('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(navResponse.status).toBe(200);
    expect(navResponse.body.data.badges).toBeDefined();
    
    const badges = navResponse.body.data.badges;
    
    // Quests badge shows uncompleted daily quests
    expect(badges.quests).toBeGreaterThanOrEqual(0);
    
    // Character badge shows available skill points
    expect(badges.character).toBeGreaterThanOrEqual(0);
    
    // Goals badge shows goals needing attention
    expect(badges.goals).toBeGreaterThanOrEqual(0);

    // Complete a quest and verify badge count changes
    const questsResponse = await request(app)
      .get('/api/quests?type=daily')
      .set('Authorization', `Bearer ${sessionToken}`);

    if (questsResponse.body.data.length > 0) {
      const initialQuestBadge = badges.quests;
      
      await request(app)
        .post(`/api/quests/${questsResponse.body.data[0].id}/complete`)
        .set('Authorization', `Bearer ${sessionToken}`);

      const updatedNavResponse = await request(app)
        .get('/api/navigation')
        .set('Authorization', `Bearer ${sessionToken}`);

      expect(updatedNavResponse.body.data.badges.quests).toBeLessThan(initialQuestBadge);
    }
  });

  it('should sync navigation state with user actions', async () => {
    // Complete onboarding
    await request(app)
      .put('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        onboardingCompleted: true,
        currentTab: 'dashboard'
      });

    // Create a goal (should update goals badge)
    await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        title: 'New Goal'
      });

    // Navigation should reflect new goal
    const navAfterGoal = await request(app)
      .get('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(navAfterGoal.body.data.badges.goals).toBeGreaterThan(0);

    // Visit goals tab
    await request(app)
      .put('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ currentTab: 'goals' });

    // Navigation should update last visited
    const navAfterVisit = await request(app)
      .get('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(navAfterVisit.body.data.currentTab).toBe('goals');
    expect(navAfterVisit.body.data.lastVisited.goals).toBeDefined();
  });

  it('should handle concurrent navigation updates', async () => {
    // Simulate concurrent tab switches
    const updates = [
      request(app)
        .put('/api/navigation')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({ currentTab: 'quests' }),
      request(app)
        .put('/api/navigation')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({ currentTab: 'character' }),
      request(app)
        .put('/api/navigation')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send({ currentTab: 'goals' })
    ];

    const responses = await Promise.all(updates);
    
    // All should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });

    // Final state should be one of the tabs
    const finalNav = await request(app)
      .get('/api/navigation')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(['quests', 'character', 'goals']).toContain(finalNav.body.data.currentTab);
  });
});