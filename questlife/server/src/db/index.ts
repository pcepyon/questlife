import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || join(__dirname, '../../../data/questlife.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const db = getDatabase();
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  
  try {
    db.exec(schema);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}