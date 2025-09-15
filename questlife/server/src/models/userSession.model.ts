import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  lastActivity: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateSessionInput {
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class UserSessionModel {
  static create(input: CreateSessionInput): UserSession {
    const session: UserSession = {
      id: uuidv4(),
      userId: input.userId,
      token: input.token,
      expiresAt: input.expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    };

    const stmt = db.prepare(`
      INSERT INTO user_sessions (
        id, user_id, token, expires_at, created_at, last_activity, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      session.id,
      session.userId,
      session.token,
      session.expiresAt,
      session.createdAt,
      session.lastActivity,
      session.ipAddress || null,
      session.userAgent || null
    );

    return session;
  }

  static findByToken(token: string): UserSession | null {
    const stmt = db.prepare(`
      SELECT * FROM user_sessions 
      WHERE token = ? AND expires_at > datetime('now')
    `);
    
    const row = stmt.get(token) as any;
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      lastActivity: row.last_activity,
      ipAddress: row.ip_address,
      userAgent: row.user_agent
    };
  }

  static findByUserId(userId: string): UserSession[] {
    const stmt = db.prepare(`
      SELECT * FROM user_sessions 
      WHERE user_id = ? AND expires_at > datetime('now')
      ORDER BY created_at DESC
    `);
    
    const rows = stmt.all(userId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      lastActivity: row.last_activity,
      ipAddress: row.ip_address,
      userAgent: row.user_agent
    }));
  }

  static updateActivity(token: string): boolean {
    const stmt = db.prepare(`
      UPDATE user_sessions
      SET last_activity = datetime('now')
      WHERE token = ? AND expires_at > datetime('now')
    `);

    const result = stmt.run(token);
    return result.changes > 0;
  }

  static updateToken(oldToken: string, newToken: string, newExpiresAt: Date): boolean {
    const stmt = db.prepare(`
      UPDATE user_sessions
      SET token = ?, expires_at = ?, last_activity = datetime('now')
      WHERE token = ?
    `);

    const result = stmt.run(newToken, newExpiresAt.toISOString(), oldToken);
    return result.changes > 0;
  }

  static delete(token: string): boolean {
    const stmt = db.prepare('DELETE FROM user_sessions WHERE token = ?');
    const result = stmt.run(token);
    return result.changes > 0;
  }

  static deleteByUserId(userId: string): number {
    const stmt = db.prepare('DELETE FROM user_sessions WHERE user_id = ?');
    const result = stmt.run(userId);
    return result.changes;
  }

  static deleteExpired(): number {
    const stmt = db.prepare(`
      DELETE FROM user_sessions 
      WHERE expires_at <= datetime('now')
    `);
    const result = stmt.run();
    return result.changes;
  }

  static isValid(token: string): boolean {
    const session = this.findByToken(token);
    if (!session) return false;
    
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    
    return now < expiresAt;
  }
}