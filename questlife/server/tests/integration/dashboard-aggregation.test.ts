import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Dashboard Data Aggregation Integration', () => {
  let app: express.Application;
  let sessionToken: string;
  let userId: string;
  
  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Setup test user with data
    const userResponse = await request(app)
      .post('/api/users')
      .send({
        name: 'Dashboard Test User',
        email: 'dashboard@example.com'
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

  it('should aggregate data from multiple sources', async () => {
    // Create goals
    const goal1Response = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        title: '운동 목표',
        description: '매일 운동하기'
      });

    const goal2Response = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        title: '학습 목표',
        description: '프로그래밍 공부하기'
      });

    // Analyze goals to create classes and quests
    await request(app)
      .post('/api/goals/analyze')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ goalId: goal1Response.body.data.id });

    await request(app)
      .post('/api/goals/analyze')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ goalId: goal2Response.body.data.id });

    // Complete some quests
    const questsResponse = await request(app)
      .get('/api/quests')
      .set('Authorization', `Bearer ${sessionToken}`);

    const quests = questsResponse.body.data;
    if (quests.length > 0) {
      await request(app)
        .post(`/api/quests/${quests[0].id}/complete`)
        .set('Authorization', `Bearer ${sessionToken}`);
    }

    // Get dashboard
    const dashboardResponse = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(dashboardResponse.status).toBe(200);
    
    const dashboard = dashboardResponse.body.data;
    
    // Verify all sections have data
    expect(dashboard.stats).toBeDefined();
    expect(dashboard.stats.totalXP).toBeGreaterThanOrEqual(0);
    expect(dashboard.stats.currentLevel).toBeGreaterThanOrEqual(1);
    expect(dashboard.stats.questsCompletedToday).toBeGreaterThanOrEqual(0);
    
    expect(dashboard.todayQuests).toBeDefined();
    expect(Array.isArray(dashboard.todayQuests)).toBe(true);
    
    expect(dashboard.activeClasses).toBeDefined();
    expect(dashboard.activeClasses.length).toBeGreaterThanOrEqual(2);
    
    expect(dashboard.recentAchievements).toBeDefined();
    expect(Array.isArray(dashboard.recentAchievements)).toBe(true);
  });

  it('should calculate streak correctly', async () => {
    // Create goal and get quests
    const goalResponse = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        title: 'Streak Test Goal'
      });

    await request(app)
      .post('/api/goals/analyze')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ goalId: goalResponse.body.data.id });

    // Complete quest for multiple days (simulated)
    const questsResponse = await request(app)
      .get('/api/quests?type=daily')
      .set('Authorization', `Bearer ${sessionToken}`);

    const dailyQuests = questsResponse.body.data;

    // Complete today's quest
    if (dailyQuests.length > 0) {
      await request(app)
        .post(`/api/quests/${dailyQuests[0].id}/complete`)
        .set('Authorization', `Bearer ${sessionToken}`);
    }

    // Get dashboard and check streak
    const dashboardResponse = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body.data.stats.currentStreak).toBeGreaterThanOrEqual(1);
    expect(dashboardResponse.body.data.stats.streakMultiplier).toBeGreaterThanOrEqual(1);
  });

  it('should cache dashboard data appropriately', async () => {
    // First request - should generate fresh data
    const start1 = Date.now();
    const response1 = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${sessionToken}`);
    const time1 = Date.now() - start1;

    expect(response1.status).toBe(200);
    const data1 = response1.body.data;

    // Second request - should be from cache
    const start2 = Date.now();
    const response2 = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${sessionToken}`);
    const time2 = Date.now() - start2;

    expect(response2.status).toBe(200);
    const data2 = response2.body.data;

    // Cache should be faster
    expect(time2).toBeLessThan(time1);
    
    // Data should be identical
    expect(data2).toEqual(data1);

    // Complete a quest to invalidate cache
    const questsResponse = await request(app)
      .get('/api/quests')
      .set('Authorization', `Bearer ${sessionToken}`);

    if (questsResponse.body.data.length > 0) {
      await request(app)
        .post(`/api/quests/${questsResponse.body.data[0].id}/complete`)
        .set('Authorization', `Bearer ${sessionToken}`);
    }

    // Third request - should be fresh data again
    const response3 = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(response3.status).toBe(200);
    const data3 = response3.body.data;

    // Stats should have changed
    if (questsResponse.body.data.length > 0) {
      expect(data3.stats.totalXP).toBeGreaterThan(data1.stats.totalXP);
    }
  });

  it('should handle empty user data gracefully', async () => {
    // Create new user without any data
    const newUserResponse = await request(app)
      .post('/api/users')
      .send({
        name: 'Empty User',
        email: 'empty@example.com'
      });

    const newAuthResponse = await request(app)
      .post('/api/auth/setup-pin')
      .send({
        userId: newUserResponse.body.data.userId,
        pin: '5678'
      });

    const newToken = newAuthResponse.body.data.sessionToken;

    // Get dashboard for empty user
    const dashboardResponse = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${newToken}`);

    expect(dashboardResponse.status).toBe(200);
    
    const dashboard = dashboardResponse.body.data;
    
    // Should have default/empty values
    expect(dashboard.stats.totalXP).toBe(0);
    expect(dashboard.stats.currentLevel).toBe(1);
    expect(dashboard.stats.currentStreak).toBe(0);
    expect(dashboard.stats.streakMultiplier).toBe(1);
    expect(dashboard.stats.questsCompletedToday).toBe(0);
    expect(dashboard.stats.totalQuestsCompleted).toBe(0);
    
    expect(dashboard.todayQuests).toEqual([]);
    expect(dashboard.activeClasses).toEqual([]);
    expect(dashboard.recentAchievements).toEqual([]);
  });
});