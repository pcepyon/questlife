import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { initDatabase, closeDatabase, getDatabase } from '../../src/db/index';
import { analyzeGoal } from '../../src/services/goal.service';
import { createClass } from '../../src/services/class.service';
import { generateQuests } from '../../src/services/quest.service';

describe('Goal to Class Generation Flow', () => {
  beforeAll(async () => {
    process.env.DATABASE_PATH = ':memory:';
    process.env.OPENAI_API_KEY = 'test-key';
    await initDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  it('should transform a goal into a complete character class with quests', async () => {
    const userId = 'test-user-123';
    const goalText = 'I want to become a full-stack developer and build web applications';
    
    // Mock OpenAI response for testing
    jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              className: 'Full-Stack Architect',
              description: 'Master of both frontend and backend development, capable of building complete web applications.',
              suggestedLevel: 25,
              ultimateGoal: 'Build and deploy production-ready web applications',
              dailyQuests: [
                'Code for 2 hours',
                'Complete one tutorial or course module',
                'Review and refactor existing code'
              ],
              weeklyQuests: [
                'Build a small feature or component',
                'Contribute to open source',
                'Complete a coding challenge'
              ],
              milestones: [
                { month: 1, description: 'Complete basic HTML/CSS/JS fundamentals' },
                { month: 2, description: 'Build first React application' },
                { month: 3, description: 'Deploy first full-stack application' }
              ]
            })
          }
        }]
      })
    } as any);
    
    // Step 1: Analyze the goal
    const analyzedGoal = await analyzeGoal(goalText);
    expect(analyzedGoal).toMatchObject({
      className: 'Full-Stack Architect',
      description: expect.any(String),
      suggestedLevel: 25,
      ultimateGoal: expect.any(String),
      dailyQuests: expect.any(Array),
      weeklyQuests: expect.any(Array),
      milestones: expect.any(Array)
    });
    
    // Step 2: Create the character class
    const characterClass = await createClass({
      userId,
      name: analyzedGoal.className,
      description: analyzedGoal.description,
      targetLevel: analyzedGoal.suggestedLevel,
      ultimateGoal: analyzedGoal.ultimateGoal
    });
    
    expect(characterClass).toMatchObject({
      userId,
      name: 'Full-Stack Architect',
      level: 1,
      currentXP: 0,
      xpToNextLevel: 100,
      status: 'active'
    });
    expect(characterClass.id).toBeDefined();
    
    // Step 3: Generate quests for the class
    const quests = await generateQuests(characterClass.id, characterClass.level);
    
    expect(quests).toBeInstanceOf(Array);
    expect(quests.length).toBeGreaterThan(0);
    
    // Verify quest structure
    const dailyQuest = quests.find(q => q.type === 'daily');
    expect(dailyQuest).toBeDefined();
    expect(dailyQuest).toMatchObject({
      classId: characterClass.id,
      type: 'daily',
      title: expect.any(String),
      xpReward: expect.any(Number),
      status: 'pending',
      difficulty: expect.any(Number)
    });
    
    // Verify data persistence
    const db = getDatabase();
    const savedClass = db.prepare('SELECT * FROM character_classes WHERE id = ?')
      .get(characterClass.id) as any;
    expect(savedClass).toBeDefined();
    expect(savedClass.name).toBe('Full-Stack Architect');
    
    const savedQuests = db.prepare('SELECT * FROM quests WHERE class_id = ?')
      .all(characterClass.id) as any[];
    expect(savedQuests.length).toBeGreaterThan(0);
  });

  it('should handle goal text validation', async () => {
    const emptyGoal = '';
    const result = await analyzeGoal(emptyGoal);
    
    // Should return fallback response for empty goal
    expect(result.className).toBe('Aspiring Hero');
    expect(result.description).toContain('self-improvement');
  });

  it('should cache identical goal analyses', async () => {
    const goalText = 'Learn to play guitar';
    
    // First call - should hit API (mocked)
    jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              className: 'Melody Mage',
              description: 'Master of strings and rhythms',
              suggestedLevel: 20,
              ultimateGoal: 'Perform live on stage',
              dailyQuests: ['Practice for 30 minutes'],
              weeklyQuests: ['Learn a new song'],
              milestones: [{ month: 1, description: 'Learn basic chords' }]
            })
          }
        }]
      })
    } as any);
    
    const result1 = await analyzeGoal(goalText);
    expect(result1.className).toBe('Melody Mage');
    
    // Second call - should use cache
    const result2 = await analyzeGoal(goalText);
    expect(result2.className).toBe('Melody Mage');
    
    // Verify cache was used
    const db = getDatabase();
    const cached = db.prepare('SELECT hit_count FROM goal_cache WHERE goal_hash = ?')
      .get(require('crypto').createHash('sha256').update(goalText).digest('hex')) as any;
    expect(cached.hit_count).toBe(2);
  });

  it('should create appropriate quests based on class level', async () => {
    const classId = 'test-class-123';
    
    // Test for different levels
    const level1Quests = await generateQuests(classId, 1);
    const level10Quests = await generateQuests(classId, 10);
    const level20Quests = await generateQuests(classId, 20);
    
    // Higher level should have more difficult quests
    const avgDifficultyLevel1 = level1Quests.reduce((sum, q) => sum + q.difficulty, 0) / level1Quests.length;
    const avgDifficultyLevel20 = level20Quests.reduce((sum, q) => sum + q.difficulty, 0) / level20Quests.length;
    
    expect(avgDifficultyLevel20).toBeGreaterThan(avgDifficultyLevel1);
    
    // Should have variety of quest types
    const questTypes = new Set(level10Quests.map(q => q.type));
    expect(questTypes.size).toBeGreaterThanOrEqual(2);
  });
});