import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, closeDatabase } from './index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function resetDatabase() {
  const dbPath = process.env.DATABASE_PATH || join(__dirname, '../../../data/questlife.db');
  const dataDir = dirname(dbPath);

  // Close any existing database connection
  closeDatabase();

  // Delete existing database if it exists
  if (existsSync(dbPath)) {
    console.log('Removing existing database...');
    unlinkSync(dbPath);

    // Also remove WAL and SHM files if they exist
    const walPath = dbPath + '-wal';
    const shmPath = dbPath + '-shm';

    if (existsSync(walPath)) unlinkSync(walPath);
    if (existsSync(shmPath)) unlinkSync(shmPath);
  }

  // Ensure data directory exists
  if (!existsSync(dataDir)) {
    console.log('Creating data directory...');
    mkdirSync(dataDir, { recursive: true });
  }

  // Reinitialize database
  console.log('Creating new database...');
  await initDatabase();

  console.log('Database reset complete!');
  process.exit(0);
}

resetDatabase().catch((error) => {
  console.error('Error resetting database:', error);
  process.exit(1);
});