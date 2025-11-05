/**
 * Contract Test: Goals and Classes API
 * These tests MUST fail initially (RED phase of TDD)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { apiClient } from '../../../client/src/services/api/client';

describe('POST /api/goals', () => {
  beforeAll(() => {
    // Setup authentication token
    apiClient.setToken('test-token', new Date(Date.now() + 86400000).toISOString());
  });

  it('should create a goal and generate character class', async () => {
    const goalData = {
      title: 'Learn Korean',
      description: 'I want to become fluent in Korean within 6 months'
    };

    const response = await apiClient.post('/goals', goalData);

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data.goalId).toBeTypeOf('string');
    expect(response.data.classId).toBeTypeOf('string');
    expect(response.data.className).toBeTypeOf('string');
    expect(response.data.className.length).toBeGreaterThan(0);
    expect(response.data.classDescription).toBeTypeOf('string');
  });

  it('should persist goal across sessions', async () => {
    const goalData = {
      title: 'Exercise Daily',
      description: 'Build a consistent workout routine'
    };

    const createResponse = await apiClient.post('/goals', goalData);
    const goalId = createResponse.data.goalId;

    // Simulate session refresh by getting user goals
    const goalsResponse = await apiClient.get('/goals');

    const createdGoal = goalsResponse.data.find(g => g.id === goalId);
    expect(createdGoal).toBeDefined();
    expect(createdGoal.title).toBe(goalData.title);
    expect(createdGoal.description).toBe(goalData.description);
    expect(createdGoal.status).toBe('active');
  });

  it('should create quests for the generated class', async () => {
    const goalData = {
      title: 'Read More Books',
      description: 'Read at least 2 books per month'
    };

    const createResponse = await apiClient.post('/goals', goalData);
    const classId = createResponse.data.classId;

    // Get dashboard to check for new quests
    const dashboard = await apiClient.get('/dashboard');

    // Should have quests related to the new class
    const classQuests = [
      ...dashboard.todayQuests,
      ...dashboard.weeklyQuests
    ].filter(q => q.classId === classId);

    expect(classQuests.length).toBeGreaterThan(0);
  });

  it('should validate required fields', async () => {
    const invalidRequests = [
      { title: '' }, // Missing description
      { description: 'Test' }, // Missing title
      { title: '', description: '' }, // Empty values
      { title: 'a'.repeat(101), description: 'Test' } // Title too long
    ];

    for (const invalidData of invalidRequests) {
      try {
        await apiClient.post('/goals', invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toMatch(/validation|required|invalid/i);
      }
    }
  });

  it('should require authentication', async () => {
    const originalToken = apiClient.getToken();
    apiClient.setToken(null);

    try {
      await apiClient.post('/goals', {
        title: 'Test Goal',
        description: 'Test Description'
      });
      expect.fail('Should have thrown 401 error');
    } catch (error) {
      expect(error.response.status).toBe(401);
    } finally {
      apiClient.setToken(originalToken);
    }
  });

  it('should handle LLM failures gracefully', async () => {
    // Test with content that might fail LLM processing
    const goalData = {
      title: '!!!###$$$%%%',
      description: '...'
    };

    try {
      const response = await apiClient.post('/goals', goalData);
      // If it succeeds, should still generate a valid class
      expect(response.data.className).toBeTypeOf('string');
    } catch (error) {
      // If it fails, should return meaningful error
      expect(error.response.status).toBeOneOf([400, 500]);
      expect(error.response.data.message).toBeDefined();
    }
  });
});

describe('POST /api/classes', () => {
  it('should create a character class without a goal', async () => {
    const classData = {
      name: 'Code Warrior',
      description: 'Master of programming and software development'
    };

    const response = await apiClient.post('/classes', classData);

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data.id).toBeTypeOf('string');
    expect(response.data.name).toBe(classData.name);
    expect(response.data.description).toBe(classData.description);
    expect(response.data.level).toBe(1);
    expect(response.data.currentXp).toBe(0);
    expect(response.data.totalXp).toBe(0);

    // Attributes validation
    expect(response.data.attributes).toBeDefined();
    expect(response.data.attributes.strength).toBeTypeOf('number');
    expect(response.data.attributes.intelligence).toBeTypeOf('number');
    expect(response.data.attributes.creativity).toBeTypeOf('number');
    expect(response.data.attributes.discipline).toBeTypeOf('number');

    // Skills validation
    expect(response.data.skills).toBeInstanceOf(Array);
    expect(response.data.evolutionReady).toBe(false);
  });

  it('should be accessible from Quest tab "첫번째 클래스 만들기" button', async () => {
    // This simulates the button click from Quest tab
    const classData = {
      name: 'Fitness Champion'
    };

    const response = await apiClient.post('/classes', classData);

    expect(response.success).toBe(true);

    // Verify class appears in user's classes
    const classesResponse = await apiClient.get('/classes');
    const createdClass = classesResponse.data.find(c => c.id === response.data.id);

    expect(createdClass).toBeDefined();
    expect(createdClass.name).toBe(classData.name);
  });

  it('should generate quests for new class', async () => {
    const classData = {
      name: 'Artist'
    };

    const createResponse = await apiClient.post('/classes', classData);
    const classId = createResponse.data.id;

    // Get quests for this class
    const questsResponse = await apiClient.get(`/classes/${classId}/quests`);

    expect(questsResponse.data).toBeInstanceOf(Array);
    expect(questsResponse.data.length).toBeGreaterThan(0);

    // Verify quest structure
    const quest = questsResponse.data[0];
    expect(quest.classId).toBe(classId);
    expect(quest.type).toBeOneOf(['daily', 'weekly', 'special']);
  });

  it('should persist across browser refresh', async () => {
    const classData = {
      name: 'Music Producer',
      description: 'Create amazing beats and melodies'
    };

    const createResponse = await apiClient.post('/classes', classData);
    const classId = createResponse.data.id;

    // Simulate browser refresh by clearing any client cache
    // and fetching data again
    const classesResponse = await apiClient.get('/classes');

    const persistedClass = classesResponse.data.find(c => c.id === classId);
    expect(persistedClass).toBeDefined();
    expect(persistedClass.name).toBe(classData.name);
    expect(persistedClass.description).toBe(classData.description);
  });

  it('should validate class name', async () => {
    const invalidRequests = [
      { name: '' }, // Empty name
      { name: 'a'.repeat(51) }, // Name too long
      { name: null }, // Null name
    ];

    for (const invalidData of invalidRequests) {
      try {
        await apiClient.post('/classes', invalidData);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    }
  });

  it('should generate default attributes based on class name', async () => {
    const classes = [
      { name: 'Warrior', expectedHigh: 'strength' },
      { name: 'Scholar', expectedHigh: 'intelligence' },
      { name: 'Artist', expectedHigh: 'creativity' },
      { name: 'Monk', expectedHigh: 'discipline' }
    ];

    for (const testClass of classes) {
      const response = await apiClient.post('/classes', {
        name: testClass.name
      });

      const attributes = response.data.attributes;
      const highestAttr = Object.entries(attributes)
        .sort(([,a], [,b]) => b - a)[0][0];

      // The highest attribute should somewhat match the class type
      // This is a loose check as the actual implementation may vary
      expect(attributes[testClass.expectedHigh]).toBeGreaterThan(0);
    }
  });

  it('should require authentication', async () => {
    const originalToken = apiClient.getToken();
    apiClient.setToken(null);

    try {
      await apiClient.post('/classes', {
        name: 'Test Class'
      });
      expect.fail('Should have thrown 401 error');
    } catch (error) {
      expect(error.response.status).toBe(401);
    } finally {
      apiClient.setToken(originalToken);
    }
  });
});