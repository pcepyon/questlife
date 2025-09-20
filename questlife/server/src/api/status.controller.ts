import { Router, Response } from 'express';
import { getDatabase } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/status - Get character status for a user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const db = getDatabase();
    
    // Get character status
    const status = db.prepare('SELECT * FROM character_status WHERE user_id = ?').get(userId) as any;
    
    if (!status) {
      // Create default status if not exists
      const defaultStatus = {
        id: uuidv4(),
        userId,
        strength: 10,
        wisdom: 10,
        creativity: 10,
        discipline: 10,
        charisma: 10,
        totalPowerLevel: 50,
        masteredClassCount: 0,
        totalQuestsCompleted: 0,
        permanentBonuses: []
      };
      
      db.prepare(`
        INSERT INTO character_status (
          id, user_id, strength, wisdom, creativity, discipline, charisma,
          total_power_level, mastered_class_count, total_quests_completed, permanent_bonuses
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        defaultStatus.id,
        defaultStatus.userId,
        defaultStatus.strength,
        defaultStatus.wisdom,
        defaultStatus.creativity,
        defaultStatus.discipline,
        defaultStatus.charisma,
        defaultStatus.totalPowerLevel,
        defaultStatus.masteredClassCount,
        defaultStatus.totalQuestsCompleted,
        JSON.stringify(defaultStatus.permanentBonuses)
      );
      
      return res.json(defaultStatus);
    }
    
    // Get streak info
    const streak = db.prepare('SELECT * FROM progress_streaks WHERE user_id = ?').get(userId) as any;
    
    // Get achievements
    const achievements = db.prepare('SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC LIMIT 5')
      .all(userId);
    
    res.json({
      ...status,
      permanentBonuses: JSON.parse(status.permanent_bonuses || '[]'),
      streak: streak ? {
        current: streak.current_streak,
        longest: streak.longest_streak,
        multiplier: streak.multiplier
      } : null,
      recentAchievements: achievements
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch character status' });
  }
});

export default router;