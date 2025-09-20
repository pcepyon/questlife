import { Router, Response } from 'express';
import { z } from 'zod';
import { DashboardService } from '../services/dashboard.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Validation schemas
const quickCompleteSchema = z.object({
  questId: z.string().min(1, 'Quest ID is required'),
  classId: z.string().min(1, 'Class ID is required')
});

// GET /api/dashboard - Get aggregated dashboard data
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await DashboardService.getDashboardData(userId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error || 'Failed to load dashboard data'
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/dashboard/quick-complete - Quick quest completion
router.post('/quick-complete', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    const { questId, classId } = quickCompleteSchema.parse(req.body);

    const result = await DashboardService.quickCompleteQuest(userId, questId, classId);

    if (!result.success) {
      let status = 400;
      if (result.error === 'Quest not found') status = 404;
      else if (result.error === 'Quest already completed') status = 409;

      return res.status(status).json({
        success: false,
        error: result.error || 'Quest completion failed'
      });
    }

    res.json({
      success: true,
      data: {
        xpGained: result.data?.xpGained,
        newLevel: result.data?.newLevel,
        levelUp: result.data?.levelUp,
        streakMultiplier: result.data?.streakMultiplier,
        message: 'Quest completed successfully'
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        message: error.errors[0]?.message || 'Required fields missing'
      });
    }

    console.error('Error completing quest:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await DashboardService.getDashboardStats(userId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error || 'Failed to load dashboard stats'
      });
    }

    res.json({
      success: true,
      data: {
        totalClasses: result.data?.totalClasses || 0,
        totalQuests: result.data?.totalQuests || 0,
        completedQuests: result.data?.completedQuests || 0,
        totalXP: result.data?.totalXP || 0,
        currentStreak: result.data?.currentStreak || 0,
        longestStreak: result.data?.longestStreak || 0,
        averageLevel: result.data?.averageLevel || 0,
        completionRate: result.data?.completionRate || 0
      }
    });
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;