import { describe, it, expect, beforeEach } from '@jest/globals';

// PIN validation logic
export class PinValidator {
  private static readonly MIN_LENGTH = 4;
  private static readonly MAX_LENGTH = 6;
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

  static validatePinFormat(pin: string): { isValid: boolean; error?: string } {
    if (!pin) {
      return { isValid: false, error: 'PIN is required' };
    }

    if (pin.length < this.MIN_LENGTH) {
      return { isValid: false, error: `PIN must be at least ${this.MIN_LENGTH} digits` };
    }

    if (pin.length > this.MAX_LENGTH) {
      return { isValid: false, error: `PIN must be no more than ${this.MAX_LENGTH} digits` };
    }

    if (!/^\d+$/.test(pin)) {
      return { isValid: false, error: 'PIN must contain only numbers' };
    }

    return { isValid: true };
  }

  static validatePinSecurity(pin: string): { isSecure: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Check for sequential numbers
    if (/(\d)\1{2,}/.test(pin)) {
      warnings.push('PIN contains repeated digits');
    }

    // Check for sequential patterns
    const sequences = ['0123', '1234', '2345', '3456', '4567', '5678', '6789', '9876', '8765', '7654', '6543', '5432', '4321', '3210'];
    if (sequences.some(seq => pin.includes(seq))) {
      warnings.push('PIN contains sequential digits');
    }

    // Check for common patterns
    const commonPins = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '0123', '9876'];
    if (commonPins.includes(pin)) {
      warnings.push('PIN is too common');
    }

    return {
      isSecure: warnings.length === 0,
      warnings
    };
  }

  static hashPin(pin: string): string {
    // Simple hash for testing - in production use bcrypt or similar
    return Buffer.from(pin).toString('base64');
  }

  static verifyPin(pin: string, hashedPin: string): boolean {
    return this.hashPin(pin) === hashedPin;
  }

  static shouldLockAccount(attempts: number): boolean {
    return attempts >= this.MAX_ATTEMPTS;
  }

  static calculateLockoutTime(now: Date = new Date()): Date {
    return new Date(now.getTime() + this.LOCKOUT_DURATION);
  }

  static isAccountLocked(lockedUntil?: Date): boolean {
    if (!lockedUntil) return false;
    return new Date() < lockedUntil;
  }

  static getRemainingLockoutTime(lockedUntil?: Date): number {
    if (!lockedUntil) return 0;
    const remaining = lockedUntil.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(remaining / 1000));
  }
}

describe('PIN Validation', () => {
  describe('PIN Format Validation', () => {
    it('should accept valid 4-digit PIN', () => {
      const result = PinValidator.validatePinFormat('1234');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid 6-digit PIN', () => {
      const result = PinValidator.validatePinFormat('123456');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty PIN', () => {
      const result = PinValidator.validatePinFormat('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('PIN is required');
    });

    it('should reject PIN shorter than 4 digits', () => {
      const result = PinValidator.validatePinFormat('123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('PIN must be at least 4 digits');
    });

    it('should reject PIN longer than 6 digits', () => {
      const result = PinValidator.validatePinFormat('1234567');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('PIN must be no more than 6 digits');
    });

    it('should reject PIN with non-numeric characters', () => {
      const result = PinValidator.validatePinFormat('12ab');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('PIN must contain only numbers');
    });

    it('should reject PIN with special characters', () => {
      const result = PinValidator.validatePinFormat('12!@');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('PIN must contain only numbers');
    });
  });

  describe('PIN Security Validation', () => {
    it('should detect repeated digits', () => {
      const result = PinValidator.validatePinSecurity('1111');
      expect(result.isSecure).toBe(false);
      expect(result.warnings).toContain('PIN contains repeated digits');
    });

    it('should detect sequential patterns', () => {
      const result = PinValidator.validatePinSecurity('1234');
      expect(result.isSecure).toBe(false);
      expect(result.warnings).toContain('PIN contains sequential digits');
    });

    it('should detect reverse sequential patterns', () => {
      const result = PinValidator.validatePinSecurity('4321');
      expect(result.isSecure).toBe(false);
      expect(result.warnings).toContain('PIN contains sequential digits');
    });

    it('should detect common PINs', () => {
      const result = PinValidator.validatePinSecurity('0000');
      expect(result.isSecure).toBe(false);
      expect(result.warnings).toContain('PIN is too common');
    });

    it('should accept secure PIN', () => {
      const result = PinValidator.validatePinSecurity('3851');
      expect(result.isSecure).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return multiple warnings for insecure PIN', () => {
      const result = PinValidator.validatePinSecurity('1234');
      expect(result.isSecure).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('PIN Hashing and Verification', () => {
    it('should hash PIN consistently', () => {
      const pin = '1234';
      const hash1 = PinValidator.hashPin(pin);
      const hash2 = PinValidator.hashPin(pin);
      expect(hash1).toBe(hash2);
    });

    it('should verify correct PIN', () => {
      const pin = '1234';
      const hash = PinValidator.hashPin(pin);
      expect(PinValidator.verifyPin(pin, hash)).toBe(true);
    });

    it('should reject incorrect PIN', () => {
      const pin = '1234';
      const wrongPin = '5678';
      const hash = PinValidator.hashPin(pin);
      expect(PinValidator.verifyPin(wrongPin, hash)).toBe(false);
    });
  });

  describe('Account Lockout Logic', () => {
    it('should not lock account before max attempts', () => {
      expect(PinValidator.shouldLockAccount(0)).toBe(false);
      expect(PinValidator.shouldLockAccount(3)).toBe(false);
      expect(PinValidator.shouldLockAccount(4)).toBe(false);
    });

    it('should lock account at max attempts', () => {
      expect(PinValidator.shouldLockAccount(5)).toBe(true);
      expect(PinValidator.shouldLockAccount(6)).toBe(true);
    });

    it('should calculate correct lockout time', () => {
      const now = new Date('2023-01-01T12:00:00Z');
      const expected = new Date('2023-01-01T12:05:00Z');
      const lockoutTime = PinValidator.calculateLockoutTime(now);
      expect(lockoutTime).toEqual(expected);
    });

    it('should detect locked account', () => {
      const futureTime = new Date(Date.now() + 60000); // 1 minute from now
      expect(PinValidator.isAccountLocked(futureTime)).toBe(true);
    });

    it('should detect unlocked account', () => {
      const pastTime = new Date(Date.now() - 60000); // 1 minute ago
      expect(PinValidator.isAccountLocked(pastTime)).toBe(false);
      expect(PinValidator.isAccountLocked(undefined)).toBe(false);
    });

    it('should calculate remaining lockout time', () => {
      const futureTime = new Date(Date.now() + 30000); // 30 seconds from now
      const remaining = PinValidator.getRemainingLockoutTime(futureTime);
      expect(remaining).toBeGreaterThan(25);
      expect(remaining).toBeLessThanOrEqual(30);
    });

    it('should return zero for expired lockout', () => {
      const pastTime = new Date(Date.now() - 60000); // 1 minute ago
      const remaining = PinValidator.getRemainingLockoutTime(pastTime);
      expect(remaining).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined inputs gracefully', () => {
      expect(PinValidator.validatePinFormat('')).toEqual({
        isValid: false,
        error: 'PIN is required'
      });
    });

    it('should handle very long strings', () => {
      const longPin = '1'.repeat(100);
      const result = PinValidator.validatePinFormat(longPin);
      expect(result.isValid).toBe(false);
    });

    it('should handle unicode characters', () => {
      const result = PinValidator.validatePinFormat('1２3４');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('PIN must contain only numbers');
    });
  });
});