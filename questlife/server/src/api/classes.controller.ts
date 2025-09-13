import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createClass, getClassesByUser } from '../services/class.service.js';
import { evolveClasses, getAvailableEvolutions } from '../services/evolution.service.js';

const router = Router();

const createClassSchema = z.object({
  userId: z.string(),
  name: z.string(),
  description: z.string(),
  targetLevel: z.number().min(1).max(30),
  ultimateGoal: z.string()
});

// GET /api/classes - Get all classes for a user
router.get('/', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const classes = await getClassesByUser(userId);
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// POST /api/classes - Create a new class
router.post('/', async (req: Request, res: Response) => {
  try {
    const input = createClassSchema.parse(req.body);
    const newClass = await createClass(input);
    res.status(201).json(newClass);
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
router.get('/evolutions', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const evolutions = await getAvailableEvolutions(userId);
    res.json(evolutions);
  } catch (error) {
    console.error('Error fetching evolutions:', error);
    res.status(500).json({ error: 'Failed to fetch available evolutions' });
  }
});

// POST /api/classes/evolve - Evolve two classes
router.post('/evolve', async (req: Request, res: Response) => {
  try {
    const evolveSchema = z.object({
      userId: z.string(),
      class1Id: z.string(),
      class2Id: z.string(),
      evolutionName: z.string().optional(),
      evolutionDescription: z.string().optional()
    });
    
    const input = evolveSchema.parse(req.body);
    const evolvedClass = await evolveClasses(input);
    
    res.status(201).json(evolvedClass);
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