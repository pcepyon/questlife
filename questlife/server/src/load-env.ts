import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading .env files in order of priority (first one found wins)
const candidateEnvPaths = [
  path.join(__dirname, '..', '.env'),           // questlife/server/.env
  path.join(__dirname, '..', '..', '.env'),     // questlife/.env
  path.join(__dirname, '..', '..', '..', '.env'), // repo root .env
];

// Only load if not already set (don't override existing env vars)
for (const envPath of candidateEnvPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`Loaded environment variables from: ${envPath}`);
    break;
  }
}

// Helper function to require environment variables
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}