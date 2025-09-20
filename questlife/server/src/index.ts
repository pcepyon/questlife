import './load-env.js';
import { createLogger, format, transports } from 'winston';
import { initDatabase } from './db/index.js';
import { app } from './app.js';
import { DashboardService } from './services/dashboard.service.js';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

const PORT = process.env.PORT || 3000;

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

async function start() {
  try {
    await initDatabase();
    logger.info('Database initialized');

    // Start dashboard cache cleanup scheduler
    const cleanupInterval = DashboardService.startScheduledCleanup();
    logger.info('Dashboard cache cleanup scheduler started');

    // Handle graceful shutdown
    const shutdown = () => {
      logger.info('Shutting down server...');
      DashboardService.stopScheduledCleanup(cleanupInterval);
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();