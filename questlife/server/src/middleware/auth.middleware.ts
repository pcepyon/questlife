import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { logger } from '../lib/logger.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    sessionId: string;
  };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Authorization required'
      });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: 'Invalid authorization format'
      });
      return;
    }

    const token = parts[1];

    // Validate token
    const validation = AuthService.validateToken(token);

    if (!validation.valid || !validation.payload) {
      if (validation.expired) {
        res.status(401).json({
          success: false,
          error: 'Token expired'
        });
      } else if (validation.error === 'Session already terminated') {
        res.status(401).json({
          success: false,
          error: 'Session already terminated'
        });
      } else {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }
      return;
    }

    // Attach user info to request
    req.user = {
      userId: validation.payload.userId,
      sessionId: validation.payload.sessionId
    };

    // Log successful authentication
    logger.debug('User authenticated', {
      userId: req.user.userId,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.error('Auth middleware error', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
}

export function optionalAuthMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // No auth header, continue without user
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // Invalid format, continue without user
      next();
      return;
    }

    const token = parts[1];
    const validation = AuthService.validateToken(token);
    
    if (validation.valid && validation.payload) {
      req.user = {
        userId: validation.payload.userId,
        sessionId: validation.payload.sessionId
      };
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error', error);
    // Continue without user on error
    next();
  }
}

export function requireUserId(
  paramName = 'userId'
): (req: AuthRequest, res: Response, next: NextFunction) => void {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authorization required'
      });
      return;
    }

    const requestedUserId = req.params[paramName] || req.body[paramName];
    
    if (requestedUserId && requestedUserId !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to access this resource'
      });
      return;
    }

    next();
  };
}

export function extractUserFromToken(token: string): { userId: string; sessionId: string } | null {
  const validation = AuthService.validateToken(token);
  
  if (!validation.valid || !validation.payload) {
    return null;
  }

  return {
    userId: validation.payload.userId,
    sessionId: validation.payload.sessionId
  };
}