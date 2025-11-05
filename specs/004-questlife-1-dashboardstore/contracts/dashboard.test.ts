/**
 * Contract Test: Dashboard API
 * These tests MUST fail initially (RED phase of TDD)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { apiClient } from '../../../client/src/services/api/client';

describe('GET /api/dashboard', () => {
  beforeAll(() => {
    // Setup authentication token
    apiClient.setToken('test-token', new Date(Date.now() + 86400000).toISOString());
  });

  it('should return dashboard data with correct schema', async () => {
    const response = await apiClient.get('/dashboard');

    // User data validation
    expect(response.user).toBeDefined();
    expect(response.user.username).toBeTypeOf('string');
    expect(response.user.level).toBeTypeOf('number');
    expect(response.user.currentXP).toBeTypeOf('number');
    expect(response.user.requiredXP).toBeTypeOf('number');
    expect(response.user.streak).toBeTypeOf('number');

    // Quest arrays validation
    expect(response.todayQuests).toBeInstanceOf(Array);
    expect(response.weeklyQuests).toBeInstanceOf(Array);
    expect(response.specialQuests).toBeInstanceOf(Array);

    // Quest schema validation
    if (response.todayQuests.length > 0) {
      const quest = response.todayQuests[0];
      expect(quest.id).toBeTypeOf('string');
      expect(quest.title).toBeTypeOf('string');
      expect(quest.description).toBeTypeOf('string');
      expect(quest.type).toMatch(/^(daily|weekly|special)$/);
      expect(quest.xpReward).toBeTypeOf('number');
      expect(quest.status).toMatch(/^(active|completed|expired)$/);
    }

    // Streak info validation
    expect(response.streakInfo).toBeDefined();
    expect(response.streakInfo.current).toBeTypeOf('number');
    expect(response.streakInfo.multiplier).toBeTypeOf('number');
    expect(response.streakInfo.nextMilestone).toBeTypeOf('number');

    // Recent completions validation
    expect(response.recentCompletions).toBeInstanceOf(Array);

    // Stats validation
    expect(response.stats).toBeDefined();
    expect(response.stats.totalQuestsCompleted).toBeTypeOf('number');
    expect(response.stats.totalXPEarned).toBeTypeOf('number');
    expect(response.stats.currentPowerLevel).toBeTypeOf('number');
  });

  it('should return real data from database, not mock data', async () => {
    const response = await apiClient.get('/dashboard');

    // Check that data doesn't match mock pattern
    // Mock data always has specific patterns we can detect
    expect(response.user.username).not.toBe('TestUser');

    // Mock data always generates exactly 3 daily quests
    // Real data should vary
    const isNotMockData =
      response.todayQuests.length !== 3 ||
      !response.todayQuests.every(q => q.title.startsWith('Daily Quest'));

    expect(isNotMockData).toBe(true);
  });

  it('should return 401 without authentication', async () => {
    // Remove token temporarily
    const originalToken = apiClient.getToken();
    apiClient.setToken(null);

    try {
      await apiClient.get('/dashboard');
      expect.fail('Should have thrown 401 error');
    } catch (error) {
      expect(error.response.status).toBe(401);
    } finally {
      // Restore token
      apiClient.setToken(originalToken);
    }
  });

  it('should use cache for subsequent requests within 5 minutes', async () => {
    const start1 = Date.now();
    const response1 = await apiClient.get('/dashboard');
    const time1 = Date.now() - start1;

    // Second request should be faster (from cache)
    const start2 = Date.now();
    const response2 = await apiClient.get('/dashboard');
    const time2 = Date.now() - start2;

    expect(response2).toEqual(response1);
    expect(time2).toBeLessThan(time1 / 2); // Cache should be at least 2x faster
  });
});

describe('POST /api/dashboard/quick-complete', () => {
  it('should complete a quest and return updated data', async () => {
    const questId = 'test-quest-id';

    const response = await apiClient.post('/dashboard/quick-complete', {
      questId
    });

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data.xpGained).toBeTypeOf('number');
    expect(response.data.xpGained).toBeGreaterThan(0);
    expect(response.data.levelUp).toBeTypeOf('boolean');
    expect(response.data.streak).toBeTypeOf('number');
    expect(response.data.multiplier).toBeTypeOf('number');
    expect(response.data.multiplier).toBeGreaterThanOrEqual(1);
    expect(response.data.multiplier).toBeLessThanOrEqual(3);

    if (response.data.levelUp) {
      expect(response.data.newLevel).toBeTypeOf('number');
    }

    expect(response.data.updatedQuest).toBeDefined();
    expect(response.data.updatedQuest.status).toBe('completed');
  });

  it('should persist quest completion across refresh', async () => {
    const questId = 'test-quest-id-2';

    // Complete quest
    await apiClient.post('/dashboard/quick-complete', { questId });

    // Get dashboard (simulating page refresh)
    const dashboard = await apiClient.get('/dashboard');

    // Check quest is marked as completed
    const completedQuest = [
      ...dashboard.todayQuests,
      ...dashboard.weeklyQuests,
      ...dashboard.specialQuests
    ].find(q => q.id === questId);

    expect(completedQuest?.status).toBe('completed');

    // Check recent completions includes this quest
    const recentCompletion = dashboard.recentCompletions
      .find(c => c.questId === questId);
    expect(recentCompletion).toBeDefined();
  });

  it('should apply streak multiplier correctly', async () => {
    // Get current streak
    const dashboardBefore = await apiClient.get('/dashboard');
    const streakBefore = dashboardBefore.streakInfo.current;

    // Complete a quest
    const questId = 'test-quest-id-3';
    const response = await apiClient.post('/dashboard/quick-complete', {
      questId
    });

    // Verify multiplier matches streak rules
    const expectedMultiplier = Math.min(3, 1 + Math.floor(streakBefore / 7));
    expect(response.data.multiplier).toBe(expectedMultiplier);

    // Verify XP calculation
    const quest = [...dashboardBefore.todayQuests, ...dashboardBefore.weeklyQuests]
      .find(q => q.id === questId);

    if (quest) {
      const expectedXP = quest.xpReward * expectedMultiplier;
      expect(response.data.xpGained).toBe(expectedXP);
    }
  });

  it('should return 400 for already completed quest', async () => {
    const questId = 'completed-quest-id';

    // First completion should succeed
    await apiClient.post('/dashboard/quick-complete', { questId });

    // Second completion should fail
    try {
      await apiClient.post('/dashboard/quick-complete', { questId });
      expect.fail('Should have thrown 400 error');
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toMatch(/already completed/i);
    }
  });

  it('should return 404 for non-existent quest', async () => {
    try {
      await apiClient.post('/dashboard/quick-complete', {
        questId: 'non-existent-quest'
      });
      expect.fail('Should have thrown 404 error');
    } catch (error) {
      expect(error.response.status).toBe(404);
    }
  });

  it('should invalidate dashboard cache after completion', async () => {
    // Get dashboard (populates cache)
    const dashboard1 = await apiClient.get('/dashboard');

    // Complete a quest
    const questId = dashboard1.todayQuests[0]?.id;
    if (questId) {
      await apiClient.post('/dashboard/quick-complete', { questId });

      // Get dashboard again
      const dashboard2 = await apiClient.get('/dashboard');

      // Stats should be updated
      expect(dashboard2.stats.totalQuestsCompleted)
        .toBeGreaterThan(dashboard1.stats.totalQuestsCompleted);
      expect(dashboard2.stats.totalXPEarned)
        .toBeGreaterThan(dashboard1.stats.totalXPEarned);
    }
  });
});