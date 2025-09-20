import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

interface RateLimitStore {
  [key: string]: {
    attempts: number;
    firstAttempt: number;
    lastAttempt: number;
    blocked: boolean;
    blockedUntil?: number;
  };
}

interface RateLimitOptions {
  windowMs: number;         // Time window in milliseconds
  max: number;              // Max attempts in window
  blockDuration: number;    // Block duration in ms after max attempts
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (req: Request, res: Response) => void;
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor(private options: RateLimitOptions) {
    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getKey(req);
      const now = Date.now();
      
      // Get or create entry
      let entry = this.store[key];
      
      if (!entry) {
        entry = this.store[key] = {
          attempts: 0,
          firstAttempt: now,
          lastAttempt: now,
          blocked: false
        };
      }

      // Check if blocked
      if (entry.blocked && entry.blockedUntil) {
        if (now < entry.blockedUntil) {
          const remainingTime = Math.ceil((entry.blockedUntil - now) / 1000);
          
          logger.warn('Rate limit blocked', {
            key,
            remainingSeconds: remainingTime
          });

          if (this.options.onLimitReached) {
            this.options.onLimitReached(req, res);
          } else {
            res.status(423).json({
              success: false,
              error: 'Account locked due to too many failed attempts',
              lockDuration: remainingTime
            });
          }
          return;
        } else {
          // Unblock if time has passed
          entry.blocked = false;
          entry.blockedUntil = undefined;
          entry.attempts = 0;
          entry.firstAttempt = now;
        }
      }

      // Check if window has expired
      if (now - entry.firstAttempt > this.options.windowMs) {
        // Reset window
        entry.attempts = 0;
        entry.firstAttempt = now;
      }

      // Increment attempts
      entry.attempts++;
      entry.lastAttempt = now;

      // Check if limit reached
      if (entry.attempts > this.options.max) {
        entry.blocked = true;
        entry.blockedUntil = now + this.options.blockDuration;
        
        logger.warn('Rate limit exceeded', {
          key,
          attempts: entry.attempts,
          max: this.options.max
        });

        if (this.options.onLimitReached) {
          this.options.onLimitReached(req, res);
        } else {
          res.status(423).json({
            success: false,
            error: 'Account locked due to too many failed attempts',
            lockDuration: Math.ceil(this.options.blockDuration / 1000)
          });
        }
        return;
      }

      // Store attempts remaining in response for client info
      const attemptsRemaining = this.options.max - entry.attempts;
      res.setHeader('X-RateLimit-Remaining', attemptsRemaining.toString());
      res.setHeader('X-RateLimit-Limit', this.options.max.toString());

      // Continue to next middleware
      next();

      // After response, check if we should count this attempt
      res.on('finish', () => {
        if (this.options.skipSuccessfulRequests && res.statusCode < 400) {
          // Don't count successful requests
          entry.attempts = Math.max(0, entry.attempts - 1);
        } else if (this.options.skipFailedRequests && res.statusCode >= 400) {
          // Don't count failed requests
          entry.attempts = Math.max(0, entry.attempts - 1);
        }
      });
    };
  }

  private getKey(req: Request): string {
    if (this.options.keyGenerator) {
      return this.options.keyGenerator(req);
    }
    
    // Default: Use IP + route
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const route = req.path;
    return `${ip}:${route}`;
  }

  private cleanup(): void {
    const now = Date.now();
    const windowAge = this.options.windowMs * 2; // Keep entries for 2x window
    
    Object.keys(this.store).forEach(key => {
      const entry = this.store[key];
      
      // Remove old entries
      if (now - entry.lastAttempt > windowAge) {
        delete this.store[key];
      }
      
      // Remove unblocked entries with no recent activity
      if (!entry.blocked && now - entry.lastAttempt > this.options.windowMs) {
        delete this.store[key];
      }
    });
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// PIN verification rate limiter
export const pinRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts
  blockDuration: 15 * 60 * 1000, // Block for 15 minutes
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // Use userId if available, otherwise IP
    const userId = req.body?.userId || req.params?.userId;
    if (userId) return `pin:${userId}`;
    return `pin:${req.ip || 'unknown'}`;
  }
});

// General API rate limiter
export const apiRateLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000,   // 1 minute
  max: 100,                   // 100 requests per minute
  blockDuration: 5 * 60 * 1000, // Block for 5 minutes
  keyGenerator: (req) => {
    // Use authenticated user ID if available
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) return `api:token:${token.substring(0, 10)}`;
    }
    return `api:${req.ip || 'unknown'}`;
  }
});

// Auth endpoints rate limiter
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes  
  max: 10,                    // 10 attempts
  blockDuration: 30 * 60 * 1000, // Block for 30 minutes
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    return `auth:${req.ip || 'unknown'}`;
  }
});

// Export middleware functions
export const pinRateLimitMiddleware = pinRateLimiter.middleware();
export const apiRateLimitMiddleware = apiRateLimiter.middleware();
export const authRateLimitMiddleware = authRateLimiter.middleware();

// Cleanup on process exit
process.on('SIGINT', () => {
  pinRateLimiter.destroy();
  apiRateLimiter.destroy();
  authRateLimiter.destroy();
});

process.on('SIGTERM', () => {
  pinRateLimiter.destroy();
  apiRateLimiter.destroy();
  authRateLimiter.destroy();
});