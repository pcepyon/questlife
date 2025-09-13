import { Router, Response } from 'express';
import { z } from 'zod';
import { analyzeGoal } from '../services/goal.service.js';
import { createClass } from '../services/class.service.js';
import { generateQuests } from '../services/quest.service.js';
import { LocaleRequest } from '../middleware/locale.js';

const router = Router();

const analyzeGoalSchema = z.object({
  userId: z.string().optional(),
  text: z.string().min(1).max(500),
  goalText: z.string().min(1).max(500).optional(),
  locale: z.string().optional(),
  targetLevel: z.number().min(1).max(30).optional(),
  timeframe: z.number().min(1).max(24).optional()
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

export default router;