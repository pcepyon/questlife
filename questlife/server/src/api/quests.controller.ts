import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { completeQuest } from '../services/quest.service.js';
import { getDatabase } from '../db/index.js';

const router = Router();

const completeQuestSchema = z.object({
  userId: z.string()
});

// GET /api/quests - Get quests for a class
router.get('/', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const classId = req.query.classId as string;
    const status = req.query.status as string;
    
    if (!classId) {
      return res.status(400).json({ error: 'classId is required' });
    }
    
    const db = getDatabase();
    
    // Check if quests exist for this class
    const existingQuests = db.prepare('SELECT * FROM quests WHERE class_id = ? AND status = ?')
      .all(classId, 'pending') as any[];
    
    // If no pending quests exist, generate them
    if (existingQuests.length === 0) {
      const classData = db.prepare('SELECT * FROM character_classes WHERE id = ?').get(classId) as any;
      if (classData) {
        const { generateQuests } = await import('../services/quest.service.js');
        // For existing classes without AI-generated quests, use default quests
        await generateQuests(classId, classData.level, req.headers['x-locale'] as string || 'ko', undefined, undefined);
      }
    }
    
    // Now fetch all quests
    let query = 'SELECT * FROM quests WHERE class_id = ?';
    const params = [classId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    const quests = db.prepare(query).all(...params);
    res.json(quests);
  } catch (error) {
    console.error('Error fetching quests:', error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

// POST /api/quests/:id/complete - Complete a quest
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const questId = req.params.id;
    const { userId } = completeQuestSchema.parse(req.body);
    
    const result = await completeQuest(questId, userId);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Error completing quest:', error);
      res.status(500).json({ error: 'Failed to complete quest' });
    }
  }
});

export default router;