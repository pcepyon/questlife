import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';

export interface DashboardCache {
  id: string;
  userId: string;
  cacheData: any;
  cacheKey: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  stats: {
    totalXP: number;
    currentLevel: number;
    currentStreak: number;
    streakMultiplier: number;
    questsCompletedToday: number;
    totalQuestsCompleted: number;
  };
  todayQuests: Array<{
    id: string;
    title: string;
    description: string;
    type: 'daily' | 'weekly' | 'special';
    xpReward: number;
    completed: boolean;
    classId: string;
  }>;
  activeClasses: Array<{
    id: string;
    name: string;
    level: number;
    currentXP: number;
    requiredXP: number;
    icon: string;
  }>;
  recentAchievements: Array<{
    id: string;
    title: string;
    description: string;
    unlockedAt: string;
    icon: string;
  }>;
}

export class DashboardCacheModel {
  private static CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  static set(userId: string, data: DashboardData): DashboardCache {
    const existing = this.get(userId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CACHE_DURATION_MS);
    const cacheKey = `dashboard_${userId}_${now.getTime()}`;

    if (existing) {
      // Update existing cache
      const stmt = db.prepare(`
        UPDATE dashboard_cache 
        SET cache_data = ?, cache_key = ?, expires_at = ?, updated_at = ?
        WHERE user_id = ?
      `);

      stmt.run(
        JSON.stringify(data),
        cacheKey,
        expiresAt.toISOString(),
        now.toISOString(),
        userId
      );

      return {
        ...existing,
        cacheData: data,
        cacheKey,
        expiresAt: expiresAt.toISOString(),
        updatedAt: now.toISOString()
      };
    } else {
      // Create new cache entry
      const cache: DashboardCache = {
        id: uuidv4(),
        userId,
        cacheData: data,
        cacheKey,
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      const stmt = db.prepare(`
        INSERT INTO dashboard_cache (
          id, user_id, cache_data, cache_key, expires_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        cache.id,
        cache.userId,
        JSON.stringify(data),
        cache.cacheKey,
        cache.expiresAt,
        cache.createdAt,
        cache.updatedAt
      );

      return cache;
    }
  }

  static get(userId: string): DashboardCache | null {
    const stmt = db.prepare(`
      SELECT * FROM dashboard_cache 
      WHERE user_id = ? AND expires_at > datetime('now')
    `);
    
    const row = stmt.get(userId) as any;
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      cacheData: JSON.parse(row.cache_data),
      cacheKey: row.cache_key,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static invalidate(userId: string): boolean {
    const stmt = db.prepare(`
      UPDATE dashboard_cache 
      SET expires_at = datetime('now', '-1 second')
      WHERE user_id = ?
    `);
    
    const result = stmt.run(userId);
    return result.changes > 0;
  }

  static invalidateAll(): number {
    const stmt = db.prepare(`
      UPDATE dashboard_cache 
      SET expires_at = datetime('now', '-1 second')
    `);
    
    const result = stmt.run();
    return result.changes;
  }

  static cleanup(): number {
    const stmt = db.prepare(`
      DELETE FROM dashboard_cache 
      WHERE expires_at <= datetime('now')
    `);
    
    const result = stmt.run();
    return result.changes;
  }

  static isValid(userId: string): boolean {
    const cache = this.get(userId);
    if (!cache) return false;
    
    const now = new Date();
    const expiresAt = new Date(cache.expiresAt);
    
    return now < expiresAt;
  }

  static setCacheDuration(minutes: number): void {
    this.CACHE_DURATION_MS = minutes * 60 * 1000;
  }
}