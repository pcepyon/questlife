import Database from 'better-sqlite3';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    const dbPath = process.env.DATABASE_PATH || join(__dirname, '../../../data/questlife.db');
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  const db = getDatabase();
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');

  try {
    db.exec(schema);
    console.log('Database initialized successfully');

    // Run migrations
    await runMigrations();
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export async function runMigrations(): Promise<void> {
  const db = getDatabase();
  const migrationsDir = join(__dirname, 'migrations');

  // Create migrations tracking table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      executed_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  if (!existsSync(migrationsDir)) {
    console.log('No migrations directory found');
    return;
  }

  // Get list of migrations
  const migrationFiles = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    // Check if migration already executed
    const existing = db.prepare('SELECT * FROM migrations WHERE filename = ?').get(file);

    if (!existing) {
      try {
        const migrationSQL = readFileSync(join(migrationsDir, file), 'utf-8');
        db.exec(migrationSQL);

        // Record migration
        db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(file);
        console.log(`Migration ${file} executed successfully`);
      } catch (error) {
        console.error(`Error executing migration ${file}:`, error);
        throw error;
      }
    }
  }
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// Export the db getter for models
export const db = getDatabase();