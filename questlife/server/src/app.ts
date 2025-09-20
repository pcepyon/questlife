import express from 'express';
import cors from 'cors';
import apiRouter from './api/index.js';
import { localeMiddleware } from './middleware/locale.js';
import { responseTransformer } from './middleware/responseTransformer.js';

export const app = express();

app.use(cors());
app.use(express.json());
app.use(localeMiddleware);
app.use(responseTransformer);

app.use('/api', apiRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});