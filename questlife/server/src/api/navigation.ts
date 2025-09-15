import { Router, Response } from 'express';
import { z } from 'zod';
import { NavigationService } from '../services/navigation.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Validation schemas
const updateNavigationSchema = z.object({
  activeTab: z.enum(['dashboard', 'classes', 'quests', 'profile'], {
    errorMap: () => ({ message: 'Active tab must be one of: dashboard, classes, quests, profile' })
  }),
  lastVisited: z.object({
    dashboard: z.string().datetime().optional(),
    classes: z.string().datetime().optional(),
    quests: z.string().datetime().optional(),
    profile: z.string().datetime().optional()
  }).optional()
});

// GET /api/navigation - Get navigation state
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await NavigationService.getNavigationState(userId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error || 'Navigation state not found'
      });
    }

    res.json({
      success: true,
      data: {
        activeTab: result.data?.activeTab || 'dashboard',
        lastVisited: result.data?.lastVisited || {
          dashboard: null,
          classes: null,
          quests: null,
          profile: null
        },
        onboardingComplete: result.data?.onboardingComplete || false
      }
    });
  } catch (error) {
    console.error('Error getting navigation state:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/navigation - Update navigation state
router.put('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    const navigationData = updateNavigationSchema.parse(req.body);

    const result = await NavigationService.updateNavigationState(userId, navigationData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to update navigation state'
      });
    }

    res.json({
      success: true,
      data: {
        activeTab: result.data?.activeTab,
        lastVisited: result.data?.lastVisited,
        onboardingComplete: result.data?.onboardingComplete
      },
      message: 'Navigation state updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid navigation data',
        message: error.errors[0]?.message || 'Invalid request format'
      });
    }

    console.error('Error updating navigation state:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;