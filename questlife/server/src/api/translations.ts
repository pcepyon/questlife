import { Router, Response } from 'express';
import { LocaleRequest } from '../middleware/locale.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const validNamespaces = ['common', 'quests', 'classes', 'errors', 'gaming'];

router.get('/translations/:namespace', async (req: LocaleRequest, res: Response): Promise<Response | void> => {
  const { namespace } = req.params;
  const locale = req.locale || 'ko';
  
  if (!validNamespaces.includes(namespace)) {
    return res.status(404).json({ error: 'Invalid namespace' });
  }
  
  try {
    const translationPath = path.join(
      __dirname,
      '..', '..', '..', 'client', 'public', 'locales',
      locale,
      `${namespace}.json`
    );
    
    const translations = await fs.readFile(translationPath, 'utf-8');
    
    res.json({
      namespace,
      locale,
      translations: JSON.parse(translations)
    });
  } catch (error) {
    console.error('Error loading translations:', error);
    res.status(500).json({ error: 'Failed to load translations' });
  }
});

export default router;