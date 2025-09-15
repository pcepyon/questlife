import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { pinRateLimitMiddleware, authRateLimitMiddleware } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Validation schemas
const setupPinSchema = z.object({
  userId: z.string(),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4-6 digits')
});

const verifyPinSchema = z.object({
  userId: z.string(),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4-6 digits')
});

const changePinSchema = z.object({
  currentPin: z.string().regex(/^\d{4,6}$/, 'Current PIN must be 4-6 digits'),
  newPin: z.string().regex(/^\d{4,6}$/, 'New PIN must be 4-6 digits')
});

// POST /api/auth/setup-pin - Initial PIN setup
router.post('/setup-pin', pinRateLimitMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, pin } = setupPinSchema.parse(req.body);

    const result = await AuthService.setupPin({ userId, pin });

    if (!result.success) {
      return res.status(409).json({
        success: false,
        error: result.message || 'PIN setup failed'
      });
    }

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        message: result.message
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input format',
        message: error.errors[0]?.message || 'Invalid data provided'
      });
    }

    console.error('Error setting up PIN:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/auth/verify-pin - PIN verification
router.post('/verify-pin', authRateLimitMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, pin } = verifyPinSchema.parse(req.body);

    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await AuthService.verifyPin(userId, pin, ipAddress, userAgent);

    if (!result.success) {
      const status = result.message?.includes('locked') ? 423 : 401;
      return res.status(status).json({
        success: false,
        error: result.message || 'Authentication failed',
        remainingAttempts: result.remainingAttempts,
        lockedUntil: result.lockedUntil
      });
    }

    res.json({
      success: true,
      data: {
        token: result.token,
        user: result.user,
        message: result.message
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input format',
        message: error.errors[0]?.message || 'Invalid data provided'
      });
    }

    console.error('Error verifying PIN:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/auth/refresh - Refresh token
router.post('/refresh', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const result = await AuthService.refreshToken(token);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.message || 'Token refresh failed'
      });
    }

    res.json({
      success: true,
      data: {
        token: result.token,
        user: result.user,
        message: result.message
      }
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const result = AuthService.logout(token);

    if (!result) {
      return res.status(400).json({
        success: false,
        error: 'Logout failed'
      });
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/auth/change-pin - Change PIN
router.put('/change-pin', authMiddleware, pinRateLimitMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPin, newPin } = changePinSchema.parse(req.body);
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await AuthService.changePin(userId, currentPin, newPin);

    if (!result.success) {
      const status = result.message?.includes('incorrect') ? 401 : 400;
      return res.status(status).json({
        success: false,
        error: result.message || 'PIN change failed'
      });
    }

    res.json({
      success: true,
      data: {
        user: result.user,
        message: result.message
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input format',
        message: error.errors[0]?.message || 'Invalid data provided'
      });
    }

    console.error('Error changing PIN:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/auth/session - Get session info
router.get('/session', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!userId || !token) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const sessionInfo = AuthService.getSessionInfo(token);

    if (!sessionInfo || !sessionInfo.isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }

    res.json({
      success: true,
      data: {
        userId: sessionInfo.user.id,
        isValid: sessionInfo.isValid,
        expiresAt: sessionInfo.expiresAt,
        shouldRefresh: sessionInfo.shouldRefresh
      }
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;