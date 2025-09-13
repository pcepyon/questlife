import { Router } from 'express';
import goalsRouter from './goals.controller.js';
import classesRouter from './classes.controller.js';
import questsRouter from './quests.controller.js';
import statusRouter from './status.controller.js';
import userRouter from './user.controller.js';
import localeRouter from './locale.js';
import translationsRouter from './translations.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/', localeRouter);
router.use('/', translationsRouter);
router.use('/goals', goalsRouter);
router.use('/classes', classesRouter);
router.use('/quests', questsRouter);
router.use('/status', statusRouter);
router.use('/user', userRouter);

export default router;