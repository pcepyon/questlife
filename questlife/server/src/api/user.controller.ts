import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/index.js';

const router = Router();

// GET /api/user - Get or create user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.id as string || uuidv4();
    const db = getDatabase();
    
    let user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    
    if (!user) {
      // Create new user
      const now = new Date().toISOString();
      const settings = {
        theme: 'dark' as const,
        notifications: true,
        soundEffects: true
      };
      
      db.prepare(`
        INSERT INTO users (id, created_at, updated_at, settings)
        VALUES (?, ?, ?, ?)
      `).run(userId, now, now, JSON.stringify(settings));
      
      // Create character status
      db.prepare(`
        INSERT INTO character_status (
          id, user_id, strength, wisdom, creativity, discipline, charisma,
          total_power_level, mastered_class_count, total_quests_completed, permanent_bonuses
        ) VALUES (?, ?, 10, 10, 10, 10, 10, 50, 0, 0, '[]')
      `).run(uuidv4(), userId);
      
      // Create progress streak
      db.prepare(`
        INSERT INTO progress_streaks (
          id, user_id, current_streak, longest_streak, multiplier, streak_milestones
        ) VALUES (?, ?, 0, 0, 1.0, '[]')
      `).run(uuidv4(), userId);
      
      user = {
        id: userId,
        createdAt: now,
        updatedAt: now,
        settings
      };
    } else {
      user.settings = JSON.parse(user.settings);
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error handling user:', error);
    res.status(500).json({ error: 'Failed to get/create user' });
  }
});

// PATCH /api/user/:id/settings - Update user settings
router.patch('/:id/settings', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const settings = req.body;
    
    const db = getDatabase();
    db.prepare('UPDATE users SET settings = ?, updated_at = ? WHERE id = ?')
      .run(JSON.stringify(settings), new Date().toISOString(), userId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;