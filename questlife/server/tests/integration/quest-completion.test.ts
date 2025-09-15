import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Quest Completion Workflow Integration', () => {
  let app: express.Application;
  let sessionToken: string;
  let userId: string;
  let classId: string;
  let questId: string;
  
  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Setup test user
    const userResponse = await request(app)
      .post('/api/users')
      .send({
        name: 'Quest Test User',
        email: 'quest@example.com'
      });

    userId = userResponse.body.data.userId;

    const authResponse = await request(app)
      .post('/api/auth/setup-pin')
      .send({
        userId,
        pin: '1234'
      });

    sessionToken = authResponse.body.data.sessionToken;

    // Create goal and class
    const goalResponse = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        title: '매일 운동하기'
      });

    const analyzeResponse = await request(app)
      .post('/api/goals/analyze')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({ goalId: goalResponse.body.data.id });

    classId = analyzeResponse.body.data.characterClass.id;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should complete quest and update XP/level', async () => {
    // Get available quests
    const questsResponse = await request(app)
      .get('/api/quests')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(questsResponse.status).toBe(200);
    const quests = questsResponse.body.data;
    expect(quests.length).toBeGreaterThan(0);
    
    questId = quests[0].id;
    const questXP = quests[0].xpReward;

    // Get initial stats
    const initialDashboard = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${sessionToken}`);
    
    const initialXP = initialDashboard.body.data.stats.totalXP;
    const initialLevel = initialDashboard.body.data.stats.currentLevel;

    // Complete quest
    const completeResponse = await request(app)
      .post(`/api/quests/${questId}/complete`)
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body).toMatchObject({
      success: true,
      data: {
        questId,
        xpGained: expect.any(Number),
        newTotalXP: expect.any(Number),
        levelUp: expect.any(Boolean)
      }
    });

    // Verify XP was added
    expect(completeResponse.body.data.newTotalXP).toBe(initialXP + completeResponse.body.data.xpGained);

    // Check updated dashboard
    const updatedDashboard = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(updatedDashboard.body.data.stats.totalXP).toBe(completeResponse.body.data.newTotalXP);
    expect(updatedDashboard.body.data.stats.questsCompletedToday).toBe(1);
    expect(updatedDashboard.body.data.stats.totalQuestsCompleted).toBe(1);

    // Check if level increased (if enough XP)
    if (completeResponse.body.data.levelUp) {
      expect(updatedDashboard.body.data.stats.currentLevel).toBe(initialLevel + 1);
    }
  });

  it('should apply streak multiplier correctly', async () => {
    // Complete quest on day 1
    const questsDay1 = await request(app)
      .get('/api/quests?type=daily')
      .set('Authorization', `Bearer ${sessionToken}`);

    if (questsDay1.body.data.length > 0) {
      await request(app)
        .post(`/api/quests/${questsDay1.body.data[0].id}/complete`)
        .set('Authorization', `Bearer ${sessionToken}`);
    }

    // Simulate day 2 (would need time manipulation in real test)
    // For now, just complete another quest
    const questsDay2 = await request(app)
      .get('/api/quests?type=daily')
      .set('Authorization', `Bearer ${sessionToken}`);

    if (questsDay2.body.data.length > 1) {
      const quest = questsDay2.body.data[1];
      const baseXP = quest.xpReward;

      const completeResponse = await request(app)
        .post(`/api/quests/${quest.id}/complete`)
        .set('Authorization', `Bearer ${sessionToken}`);

      // Check if multiplier was applied
      const dashboard = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${sessionToken}`);

      const multiplier = dashboard.body.data.stats.streakMultiplier;
      if (multiplier > 1) {
        expect(completeResponse.body.data.xpGained).toBeGreaterThanOrEqual(baseXP);
        expect(completeResponse.body.data).toHaveProperty('multiplierApplied');
      }
    }
  });

  it('should handle quick complete from dashboard', async () => {
    // Get dashboard with quests
    const dashboardResponse = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${sessionToken}`);

    const todayQuests = dashboardResponse.body.data.todayQuests;
    expect(todayQuests.length).toBeGreaterThan(0);

    const questToComplete = todayQuests[0];

    // Quick complete
    const quickCompleteResponse = await request(app)
      .post('/api/dashboard/quick-complete')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send({
        questId: questToComplete.id
      });

    expect(quickCompleteResponse.status).toBe(200);
    expect(quickCompleteResponse.body).toMatchObject({
      success: true,
      data: {
        questId: questToComplete.id,
        xpGained: expect.any(Number),
        updatedStats: expect.objectContaining({
          totalXP: expect.any(Number),
          questsCompletedToday: expect.any(Number)
        })
      }
    });

    // Verify quest is marked as completed in dashboard
    const updatedDashboard = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${sessionToken}`);

    const completedQuest = updatedDashboard.body.data.todayQuests.find(
      q => q.id === questToComplete.id
    );
    
    expect(completedQuest.completed).toBe(true);
  });

  it('should prevent duplicate quest completion', async () => {
    // Get a quest
    const questsResponse = await request(app)
      .get('/api/quests')
      .set('Authorization', `Bearer ${sessionToken}`);

    questId = questsResponse.body.data[0].id;

    // Complete it once
    const firstComplete = await request(app)
      .post(`/api/quests/${questId}/complete`)
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(firstComplete.status).toBe(200);

    // Try to complete again
    const secondComplete = await request(app)
      .post(`/api/quests/${questId}/complete`)
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(secondComplete.status).toBe(409);
    expect(secondComplete.body).toMatchObject({
      success: false,
      error: 'Quest already completed'
    });
  });

  it('should track quest history', async () => {
    // Complete multiple quests
    const questsResponse = await request(app)
      .get('/api/quests')
      .set('Authorization', `Bearer ${sessionToken}`);

    const questsToComplete = questsResponse.body.data.slice(0, 3);

    for (const quest of questsToComplete) {
      await request(app)
        .post(`/api/quests/${quest.id}/complete`)
        .set('Authorization', `Bearer ${sessionToken}`);
    }

    // Get quest history
    const historyResponse = await request(app)
      .get('/api/quests/history')
      .set('Authorization', `Bearer ${sessionToken}`);

    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body.data).toHaveLength(3);
    
    // Verify history includes completion details
    historyResponse.body.data.forEach(entry => {
      expect(entry).toMatchObject({
        questId: expect.any(String),
        questTitle: expect.any(String),
        completedAt: expect.any(String),
        xpGained: expect.any(Number),
        multiplierApplied: expect.any(Number)
      });
    });
  });

  it('should update character class progress', async () => {
    // Get class initial state
    const classResponse = await request(app)
      .get(`/api/classes/${classId}`)
      .set('Authorization', `Bearer ${sessionToken}`);

    const initialClassXP = classResponse.body.data.currentXP;
    const initialClassLevel = classResponse.body.data.level;

    // Complete class-specific quest
    const questsResponse = await request(app)
      .get(`/api/quests?classId=${classId}`)
      .set('Authorization', `Bearer ${sessionToken}`);

    if (questsResponse.body.data.length > 0) {
      const classQuest = questsResponse.body.data[0];
      
      await request(app)
        .post(`/api/quests/${classQuest.id}/complete`)
        .set('Authorization', `Bearer ${sessionToken}`);

      // Check class progress
      const updatedClassResponse = await request(app)
        .get(`/api/classes/${classId}`)
        .set('Authorization', `Bearer ${sessionToken}`);

      expect(updatedClassResponse.body.data.currentXP).toBeGreaterThan(initialClassXP);
      
      // Check if class leveled up
      if (updatedClassResponse.body.data.currentXP >= updatedClassResponse.body.data.requiredXP) {
        expect(updatedClassResponse.body.data.level).toBe(initialClassLevel + 1);
      }
    }
  });
});