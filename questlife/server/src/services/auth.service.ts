import * as jwt from 'jsonwebtoken';
import { UserModel, User, SetupPinInput } from '../models/user.model.js';
import { UserSessionModel, CreateSessionInput } from '../models/userSession.model.js';

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  remainingAttempts?: number;
  lockedUntil?: string;
}

export interface SessionInfo {
  user: User;
  session: any;
  isValid: boolean;
  expiresAt?: string;
  shouldRefresh?: boolean;
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: JWTPayload & { sessionId: string };
  expired?: boolean;
  error?: string;
  expiresAt?: string;
  shouldRefresh?: boolean;
}

export class AuthService {
  private static JWT_SECRET = process.env.JWT_SECRET || 'questlife-dev-secret-key';
  private static JWT_EXPIRY = '7d'; // 7 days
  private static RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
  private static MAX_ATTEMPTS_PER_WINDOW = 5;

  // Rate limiting storage (in production, use Redis)
  private static rateLimitMap = new Map<string, { attempts: number; resetTime: number }>();

  /**
   * Setup PIN for a user (initial setup only)
   */
  static async setupPin(input: SetupPinInput): Promise<AuthResult> {
    try {
      const user = UserModel.findById(input.userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (user.pinHash) {
        return { success: false, message: 'PIN already set' };
      }

      const success = await UserModel.setupPin(input);
      if (!success) {
        return { success: false, message: 'Failed to setup PIN' };
      }

      const updatedUser = UserModel.findById(input.userId);
      return {
        success: true,
        user: updatedUser || user,
        message: 'PIN setup successful'
      };
    } catch (error: any) {
      console.error('Setup PIN error:', error);
      return {
        success: false,
        message: error.message || 'PIN setup failed'
      };
    }
  }

  /**
   * Verify PIN and generate JWT token
   */
  static async verifyPin(
    userId: string,
    pin: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    try {
      // Check rate limiting
      const rateLimitKey = `${userId}:${ipAddress || 'unknown'}`;
      if (!this.checkRateLimit(rateLimitKey)) {
        return {
          success: false,
          message: 'Too many attempts. Please try again later.'
        };
      }

      const user = UserModel.findById(userId);
      if (!user) {
        this.recordFailedAttempt(rateLimitKey);
        return { success: false, message: 'Invalid credentials' };
      }

      // Check if account is locked
      if (UserModel.isLocked(userId)) {
        const remainingAttempts = UserModel.getRemainingAttempts(userId);
        return {
          success: false,
          message: 'Account locked due to too many failed attempts',
          remainingAttempts,
          lockedUntil: user.pinLockedUntil || undefined
        };
      }

      // Verify PIN
      const isValid = await UserModel.verifyPin(userId, pin);
      if (!isValid) {
        this.recordFailedAttempt(rateLimitKey);
        const remainingAttempts = UserModel.getRemainingAttempts(userId);
        return {
          success: false,
          message: 'Invalid PIN',
          remainingAttempts
        };
      }

      // Reset rate limiting on successful auth
      this.rateLimitMap.delete(rateLimitKey);

      // Generate JWT token
      const token = this.generateToken({ userId: user.id, email: user.email });

      // Create session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const sessionInput: CreateSessionInput = {
        userId: user.id,
        token,
        expiresAt,
        ipAddress,
        userAgent
      };

      UserSessionModel.create(sessionInput);

      return {
        success: true,
        token,
        user,
        message: 'Authentication successful'
      };
    } catch (error: any) {
      console.error('Verify PIN error:', error);
      return {
        success: false,
        message: error.message || 'Authentication failed'
      };
    }
  }

  /**
   * Change PIN (requires current PIN verification)
   */
  static async changePin(
    userId: string,
    currentPin: string,
    newPin: string
  ): Promise<AuthResult> {
    try {
      const success = await UserModel.changePin(userId, currentPin, newPin);
      if (!success) {
        return { success: false, message: 'Failed to change PIN. Current PIN may be incorrect.' };
      }

      // Invalidate all existing sessions
      UserSessionModel.deleteByUserId(userId);

      const user = UserModel.findById(userId);
      return {
        success: true,
        user: user || undefined,
        message: 'PIN changed successfully'
      };
    } catch (error: any) {
      console.error('Change PIN error:', error);
      return {
        success: false,
        message: error.message || 'PIN change failed'
      };
    }
  }

  /**
   * Validate JWT token and get user session info
   */
  static validateToken(token: string): TokenValidationResult {
    try {
      // Verify JWT
      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;

      // Check if session exists and is valid
      const session = UserSessionModel.findByToken(token);
      if (!session) {
        return {
          valid: false,
          error: 'Session not found'
        };
      }

      // Get user
      const user = UserModel.findById(decoded.userId);
      if (!user) {
        return {
          valid: false,
          error: 'User not found'
        };
      }

      // Check if token should be refreshed (within 24 hours of expiry)
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const shouldRefresh = timeUntilExpiry <= 24 * 60 * 60 * 1000; // 24 hours in ms

      // Update last activity
      UserSessionModel.updateActivity(token);

      return {
        valid: true,
        payload: {
          ...decoded,
          sessionId: session.id
        },
        expiresAt: session.expiresAt,
        shouldRefresh
      };
    } catch (error: any) {
      console.error('Token validation error:', error);

      // Check if token is expired
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          expired: true,
          error: 'Token expired'
        };
      }

      return {
        valid: false,
        error: 'Invalid token'
      };
    }
  }

  /**
   * Get session info (backward compatibility wrapper)
   */
  static getSessionInfo(token: string): SessionInfo | null {
    const validation = this.validateToken(token);

    if (!validation.valid || !validation.payload) {
      return null;
    }

    const user = UserModel.findById(validation.payload.userId);
    const session = UserSessionModel.findByToken(token);

    if (!user || !session) {
      return null;
    }

    return {
      user,
      session,
      isValid: true,
      expiresAt: validation.expiresAt,
      shouldRefresh: validation.shouldRefresh
    };
  }

  /**
   * Logout (invalidate session)
   */
  static logout(token: string): boolean {
    try {
      return UserSessionModel.delete(token);
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Logout all sessions for a user
   */
  static logoutAll(userId: string): number {
    try {
      return UserSessionModel.deleteByUserId(userId);
    } catch (error) {
      console.error('Logout all error:', error);
      return 0;
    }
  }

  /**
   * Generate JWT token
   */
  private static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRY
    });
  }

  /**
   * Rate limiting check
   */
  private static checkRateLimit(key: string): boolean {
    const now = Date.now();
    const record = this.rateLimitMap.get(key);

    if (!record) {
      return true;
    }

    // Reset window if expired
    if (now > record.resetTime) {
      this.rateLimitMap.delete(key);
      return true;
    }

    return record.attempts < this.MAX_ATTEMPTS_PER_WINDOW;
  }

  /**
   * Record failed authentication attempt
   */
  private static recordFailedAttempt(key: string): void {
    const now = Date.now();
    const record = this.rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      this.rateLimitMap.set(key, {
        attempts: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      });
    } else {
      record.attempts++;
    }
  }

  /**
   * Clean up expired sessions
   */
  static cleanupSessions(): number {
    try {
      return UserSessionModel.deleteExpired();
    } catch (error) {
      console.error('Session cleanup error:', error);
      return 0;
    }
  }

  /**
   * Get user sessions
   */
  static getUserSessions(userId: string): any[] {
    try {
      return UserSessionModel.findByUserId(userId);
    } catch (error) {
      console.error('Get user sessions error:', error);
      return [];
    }
  }

  /**
   * Check if user has PIN set
   */
  static hasPinSetup(userId: string): boolean {
    const user = UserModel.findById(userId);
    return !!(user?.pinHash);
  }

  /**
   * Get remaining PIN attempts for user
   */
  static getRemainingAttempts(userId: string): number {
    return UserModel.getRemainingAttempts(userId);
  }

  /**
   * Refresh JWT token - generate new token with extended expiry
   */
  static async refreshToken(currentToken: string): Promise<AuthResult> {
    try {
      // Validate current token
      const validation = this.validateToken(currentToken);

      if (!validation.valid || !validation.payload) {
        return {
          success: false,
          message: validation.error || 'Invalid token'
        };
      }

      // Get session and user
      const session = UserSessionModel.findByToken(currentToken);
      const user = UserModel.findById(validation.payload.userId);

      if (!session || !user) {
        return {
          success: false,
          message: 'Session or user not found'
        };
      }

      // Generate new token
      const newToken = this.generateToken({
        userId: user.id,
        email: user.email
      });

      // Update session with new token and extended expiry
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7); // 7 days

      const success = UserSessionModel.updateToken(currentToken, newToken, newExpiresAt);

      if (!success) {
        return {
          success: false,
          message: 'Failed to update session'
        };
      }

      return {
        success: true,
        token: newToken,
        user,
        message: 'Token refreshed successfully'
      };
    } catch (error: any) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        message: error.message || 'Token refresh failed'
      };
    }
  }

  /**
   * Check if user account is locked
   */
  static isAccountLocked(userId: string): boolean {
    return UserModel.isLocked(userId);
  }

  /**
   * Unlock user account (admin function)
   */
  static unlockAccount(userId: string): void {
    UserModel.unlockPin(userId);
  }
}