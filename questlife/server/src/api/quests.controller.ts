import { Router, Response } from 'express';
import { z } from 'zod';
import { completeQuest } from '../services/quest.service.js';
import { getDatabase } from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { DashboardService } from '../services/dashboard.service.js';

const router = Router();

const completeQuestSchema = z.object({
  // userId will come from auth middleware, not request body
});

// GET /api/quests - Get quests for a class
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.userId;
    const classId = req.query.classId as string;
    const status = req.query.status as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!classId) {
      return res.status(400).json({ error: 'classId is required' });
    }

    // Verify that the class belongs to the authenticated user
    const db = getDatabase();
    const classOwnership = db.prepare('SELECT id FROM character_classes WHERE id = ? AND user_id = ?')
      .get(classId, userId);

    if (!classOwnership) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this class'
      });
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
router.post('/:id/complete', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const questId = req.params.id;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Verify that the quest belongs to a class owned by the authenticated user
    const db = getDatabase();
    const questOwnership = db.prepare(`
      SELECT q.id FROM quests q
      INNER JOIN character_classes cc ON q.class_id = cc.id
      WHERE q.id = ? AND cc.user_id = ?
    `).get(questId, userId);

    if (!questOwnership) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to complete this quest'
      });
    }

    completeQuestSchema.parse(req.body); // Validate request body
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

// GET /api/quests/history - Get quest completion history
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    const classId = req.query.classId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const timeframe = req.query.timeframe as string; // 'day', 'week', 'month', 'year'

    const db = getDatabase();

    // Base query for completed quests
    let query = `
      SELECT
        q.*,
        cc.name as class_name,
        cc.level as class_level
      FROM quests q
      INNER JOIN character_classes cc ON q.class_id = cc.id
      WHERE q.status = 'completed' AND cc.user_id = ?
    `;

    const params: any[] = [userId];

    // Filter by class if specified
    if (classId) {
      query += ' AND q.class_id = ?';
      params.push(classId);
    }

    // Filter by timeframe if specified
    if (timeframe) {
      let dateFilter = '';
      const now = new Date();

      switch (timeframe) {
        case 'day':
          dateFilter = 'AND q.completed_at >= date("now", "start of day")';
          break;
        case 'week':
          dateFilter = 'AND q.completed_at >= date("now", "-7 days")';
          break;
        case 'month':
          dateFilter = 'AND q.completed_at >= date("now", "start of month")';
          break;
        case 'year':
          dateFilter = 'AND q.completed_at >= date("now", "start of year")';
          break;
      }

      if (dateFilter) {
        query += ' ' + dateFilter;
      }
    }

    // Order by completion date (most recent first) and add pagination
    query += ' ORDER BY q.completed_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const history = db.prepare(query).all(...params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM quests q
      INNER JOIN character_classes cc ON q.class_id = cc.id
      WHERE q.status = 'completed' AND cc.user_id = ?
    `;

    const countParams: any[] = [userId];

    if (classId) {
      countQuery += ' AND q.class_id = ?';
      countParams.push(classId);
    }

    if (timeframe) {
      let dateFilter = '';
      switch (timeframe) {
        case 'day':
          dateFilter = 'AND q.completed_at >= date("now", "start of day")';
          break;
        case 'week':
          dateFilter = 'AND q.completed_at >= date("now", "-7 days")';
          break;
        case 'month':
          dateFilter = 'AND q.completed_at >= date("now", "start of month")';
          break;
        case 'year':
          dateFilter = 'AND q.completed_at >= date("now", "start of year")';
          break;
      }

      if (dateFilter) {
        countQuery += ' ' + dateFilter;
      }
    }

    const totalResult = db.prepare(countQuery).get(...countParams) as any;
    const total = totalResult.total || 0;

    // Get completion stats
    const statsQuery = `
      SELECT
        COUNT(*) as total_completed,
        SUM(q.xp_reward) as total_xp_earned,
        COUNT(CASE WHEN q.type = 'daily' THEN 1 END) as daily_completed,
        COUNT(CASE WHEN q.type = 'weekly' THEN 1 END) as weekly_completed,
        COUNT(CASE WHEN q.type = 'special' THEN 1 END) as special_completed,
        AVG(q.xp_reward) as avg_xp_per_quest
      FROM quests q
      INNER JOIN character_classes cc ON q.class_id = cc.id
      WHERE q.status = 'completed' AND cc.user_id = ?
    `;

    const statsParams = [userId];
    if (classId) {
      statsQuery.replace('WHERE', 'WHERE q.class_id = ? AND');
      statsParams.unshift(classId);
    }

    const stats = db.prepare(statsQuery).get(...statsParams) as any;

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        stats: {
          totalCompleted: stats.total_completed || 0,
          totalXpEarned: stats.total_xp_earned || 0,
          dailyCompleted: stats.daily_completed || 0,
          weeklyCompleted: stats.weekly_completed || 0,
          specialCompleted: stats.special_completed || 0,
          avgXpPerQuest: Math.round(stats.avg_xp_per_quest || 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching quest history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quest history'
    });
  }
});

export default router;