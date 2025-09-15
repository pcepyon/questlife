import { Router, Response } from 'express';
import { z } from 'zod';
import { analyzeGoal, GoalService } from '../services/goal.service.js';
import { createClass } from '../services/class.service.js';
import { generateQuests } from '../services/quest.service.js';
import { LocaleRequest } from '../middleware/locale.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

const analyzeGoalSchema = z.object({
  userId: z.string().optional(),
  text: z.string().min(1).max(500),
  goalText: z.string().min(1).max(500).optional(),
  locale: z.string().optional(),
  targetLevel: z.number().min(1).max(30).optional(),
  timeframe: z.number().min(1).max(24).optional()
});

const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  deadline: z.string().datetime().optional(),
  milestones: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    targetDate: z.string().datetime().optional(),
    completed: z.boolean()
  })).optional()
});

router.post('/analyze', async (req: LocaleRequest, res: Response) => {
  try {
    const input = analyzeGoalSchema.parse(req.body);
    const locale = req.locale || input.locale || 'ko';
    const goalText = input.text || input.goalText || '';
    
    const analyzedGoal = await analyzeGoal(goalText, locale);
    
    const characterClass = await createClass({
      userId: input.userId || '1',
      name: locale === 'ko' && analyzedGoal.classNameKo ? analyzedGoal.classNameKo : analyzedGoal.className,
      description: locale === 'ko' && analyzedGoal.descriptionKo ? analyzedGoal.descriptionKo : analyzedGoal.description,
      targetLevel: input.targetLevel || analyzedGoal.suggestedLevel,
      ultimateGoal: analyzedGoal.ultimateGoal
    });
    
    const quests = await generateQuests(
      characterClass.id,
      characterClass.level,
      locale,
      analyzedGoal.dailyQuests,
      analyzedGoal.weeklyQuests
    );
    
    const response: any = {
      class: characterClass,
      quests
    };

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Error analyzing goal:', error);
      res.status(500).json({ error: 'Failed to analyze goal' });
    }
  }
});

// GET /api/goals - Get all goals for a user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const goals = GoalService.getGoalsByUser(userId);

    res.json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/goals - Create a new goal
router.post('/', authMiddleware, async (req: AuthRequest & LocaleRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const createGoalSchema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
      deadline: z.string().datetime().optional(),
      milestones: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        targetDate: z.string().datetime().optional(),
        completed: z.boolean().default(false)
      })).optional()
    });

    const goalData = createGoalSchema.parse(req.body);

    const newGoal = GoalService.createGoal(userId, goalData);

    if (!newGoal) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create goal'
      });
    }

    res.status(201).json({
      success: true,
      data: newGoal,
      message: 'Goal created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        message: error.errors[0]?.message || 'Validation failed'
      });
    }

    console.error('Error creating goal:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PATCH /api/goals/:id - Update a goal
router.patch('/:id', authMiddleware, async (req: AuthRequest & LocaleRequest, res: Response) => {
  try {
    const goalId = req.params.id;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    const updateData = updateGoalSchema.parse(req.body);

    // Check if goal exists and belongs to user
    const existingGoal = GoalService.getGoalById(goalId, userId);
    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        error: 'Goal not found'
      });
    }

    const updatedGoal = GoalService.updateGoal(goalId, userId, updateData);
    if (!updatedGoal) {
      return res.status(400).json({
        success: false,
        error: 'Failed to update goal'
      });
    }

    res.json({
      success: true,
      data: updatedGoal,
      message: 'Goal updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        message: error.errors[0]?.message || 'Validation failed'
      });
    }

    console.error('Error updating goal:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/goals/:id - Delete a goal
router.delete('/:id', authMiddleware, async (req: AuthRequest & LocaleRequest, res: Response) => {
  try {
    const goalId = req.params.id;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    const hardDelete = req.query.hard === 'true';

    // Check if goal exists and belongs to user
    const existingGoal = GoalService.getGoalById(goalId, userId);
    if (!existingGoal) {
      return res.status(404).json({
        success: false,
        error: 'Goal not found'
      });
    }

    const success = GoalService.deleteGoal(goalId, userId, hardDelete);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to delete goal'
      });
    }

    res.json({
      success: true,
      message: hardDelete ? 'Goal permanently deleted' : 'Goal archived successfully'
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;