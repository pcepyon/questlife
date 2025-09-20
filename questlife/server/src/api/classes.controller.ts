import { Router, Response } from 'express';
import { z } from 'zod';
import { createClass, getClassesByUser } from '../services/class.service.js';
import { evolveClasses, getAvailableEvolutions } from '../services/evolution.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

const createClassSchema = z.object({
  // userId will come from auth middleware
  name: z.string(),
  description: z.string(),
  targetLevel: z.number().min(1).max(30),
  ultimateGoal: z.string()
});

// GET /api/classes - Get all classes for a user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const classes = await getClassesByUser(userId);
    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// POST /api/classes - Create a new class
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const classData = createClassSchema.parse(req.body);
    const input = { ...classData, userId };
    const newClass = await createClass(input);
    res.status(201).json({
      success: true,
      data: newClass
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Error creating class:', error);
      res.status(500).json({ error: 'Failed to create class' });
    }
  }
});

// GET /api/classes/evolutions - Get available evolutions
router.get('/evolutions', authMiddleware, async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const evolutions = await getAvailableEvolutions(userId);
    res.json({
      success: true,
      data: evolutions
    });
  } catch (error) {
    console.error('Error fetching evolutions:', error);
    res.status(500).json({ error: 'Failed to fetch available evolutions' });
  }
});

// POST /api/classes/evolve - Evolve two classes
router.post('/evolve', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const evolveSchema = z.object({
      class1Id: z.string(),
      class2Id: z.string(),
      evolutionName: z.string().optional(),
      evolutionDescription: z.string().optional()
    });

    const evolveData = evolveSchema.parse(req.body);
    const input = { ...evolveData, userId };
    const evolvedClass = await evolveClasses(input);

    res.status(201).json({
      success: true,
      data: evolvedClass
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Error evolving classes:', error);
      res.status(500).json({ error: 'Failed to evolve classes' });
    }
  }
});

export default router;