import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';

export interface User {
  id: string;
  name: string;
  email: string;
  pinHash?: string;
  pinSalt?: string;
  pinAttempts: number;
  pinLockedUntil?: string | null;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
}

export interface SetupPinInput {
  userId: string;
  pin: string;
}

export class UserModel {
  static create(input: CreateUserInput): User {
    const user: User = {
      id: uuidv4(),
      name: input.name,
      email: input.email,
      pinAttempts: 0,
      pinLockedUntil: null,
      createdAt: new Date().toISOString()
    };

    const stmt = db.prepare(`
      INSERT INTO users (
        id, name, email, pin_attempts, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      user.id,
      user.name,
      user.email,
      user.pinAttempts,
      user.createdAt
    );

    return user;
  }

  static findById(id: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      pinHash: row.pin_hash,
      pinSalt: row.pin_salt,
      pinAttempts: row.pin_attempts || 0,
      pinLockedUntil: row.pin_locked_until,
      createdAt: row.created_at
    };
  }

  static findByEmail(email: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const row = stmt.get(email) as any;
    
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      pinHash: row.pin_hash,
      pinSalt: row.pin_salt,
      pinAttempts: row.pin_attempts || 0,
      pinLockedUntil: row.pin_locked_until,
      createdAt: row.created_at
    };
  }

  static async setupPin(input: SetupPinInput): Promise<boolean> {
    const user = this.findById(input.userId);
    if (!user) return false;
    
    // Check if PIN already set
    if (user.pinHash) return false;

    // Validate PIN format (4-6 digits)
    if (!/^\d{4,6}$/.test(input.pin)) {
      throw new Error('PIN must be 4-6 digits');
    }

    // Hash the PIN
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(input.pin, salt);

    const stmt = db.prepare(`
      UPDATE users 
      SET pin_hash = ?, pin_salt = ?, pin_attempts = 0
      WHERE id = ?
    `);

    const result = stmt.run(hash, salt, input.userId);
    return result.changes > 0;
  }

  static async verifyPin(userId: string, pin: string): Promise<boolean> {
    const user = this.findById(userId);
    if (!user || !user.pinHash) return false;

    // Check if account is locked
    if (user.pinLockedUntil) {
      const lockTime = new Date(user.pinLockedUntil);
      if (lockTime > new Date()) {
        return false;
      }
      // Unlock if time has passed
      this.unlockPin(userId);
    }

    const isValid = await bcrypt.compare(pin, user.pinHash);
    
    if (!isValid) {
      this.incrementPinAttempts(userId);
    } else {
      this.resetPinAttempts(userId);
    }

    return isValid;
  }

  static async changePin(userId: string, currentPin: string, newPin: string): Promise<boolean> {
    // Verify current PIN first
    const isValid = await this.verifyPin(userId, currentPin);
    if (!isValid) return false;

    // Validate new PIN format
    if (!/^\d{4,6}$/.test(newPin)) {
      throw new Error('PIN must be 4-6 digits');
    }

    // Check new PIN is different
    if (currentPin === newPin) {
      throw new Error('New PIN must be different from current PIN');
    }

    // Hash new PIN
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPin, salt);

    const stmt = db.prepare(`
      UPDATE users 
      SET pin_hash = ?, pin_salt = ?, pin_attempts = 0
      WHERE id = ?
    `);

    const result = stmt.run(hash, salt, userId);
    return result.changes > 0;
  }

  static incrementPinAttempts(userId: string): void {
    const user = this.findById(userId);
    if (!user) return;

    const newAttempts = user.pinAttempts + 1;
    const maxAttempts = 5;

    if (newAttempts >= maxAttempts) {
      // Lock account for 15 minutes
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const stmt = db.prepare(`
        UPDATE users 
        SET pin_attempts = ?, pin_locked_until = ?
        WHERE id = ?
      `);
      stmt.run(newAttempts, lockUntil, userId);
    } else {
      const stmt = db.prepare(`
        UPDATE users 
        SET pin_attempts = ?
        WHERE id = ?
      `);
      stmt.run(newAttempts, userId);
    }
  }

  static resetPinAttempts(userId: string): void {
    const stmt = db.prepare(`
      UPDATE users 
      SET pin_attempts = 0, pin_locked_until = NULL
      WHERE id = ?
    `);
    stmt.run(userId);
  }

  static unlockPin(userId: string): void {
    const stmt = db.prepare(`
      UPDATE users 
      SET pin_locked_until = NULL
      WHERE id = ?
    `);
    stmt.run(userId);
  }

  static isLocked(userId: string): boolean {
    const user = this.findById(userId);
    if (!user || !user.pinLockedUntil) return false;
    
    const lockTime = new Date(user.pinLockedUntil);
    return lockTime > new Date();
  }

  static getRemainingAttempts(userId: string): number {
    const user = this.findById(userId);
    if (!user) return 0;
    
    const maxAttempts = 5;
    return Math.max(0, maxAttempts - user.pinAttempts);
  }
}