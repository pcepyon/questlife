import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface PinValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Hook for PIN-related functionality
 * Handles PIN validation, attempts tracking, and lockout logic
 */
export function usePin() {
  const {
    user,
    isLocked,
    lockTimeRemaining,
    setupPin,
    verifyPin,
    updateUser
  } = useAuth();

  const [attempts, setAttempts] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  // Validate PIN format
  const validatePinFormat = useCallback((pin: string): PinValidation => {
    if (!pin) {
      return { isValid: false, error: 'PIN을 입력해주세요.' };
    }

    if (pin.length < 4 || pin.length > 6) {
      return { isValid: false, error: 'PIN은 4-6자리여야 합니다.' };
    }

    if (!/^\d+$/.test(pin)) {
      return { isValid: false, error: 'PIN은 숫자만 입력 가능합니다.' };
    }

    // Check for simple patterns (optional security)
    if (/^(\d)\1+$/.test(pin)) {
      return { isValid: false, error: '같은 숫자만 반복할 수 없습니다.' };
    }

    if (pin === '1234' || pin === '0000' || pin === '1111') {
      return { isValid: false, error: '보안이 약한 PIN입니다.' };
    }

    return { isValid: true };
  }, []);

  // Setup new PIN
  const handleSetupPin = useCallback(async (pin: string, confirmPin: string) => {
    const validation = validatePinFormat(pin);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    if (pin !== confirmPin) {
      return { success: false, error: 'PIN이 일치하지 않습니다.' };
    }

    setIsValidating(true);
    try {
      const result = await setupPin(pin);
      setAttempts(0);
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [setupPin, validatePinFormat]);

  // Verify PIN for login
  const handleVerifyPin = useCallback(async (pin: string) => {
    if (isLocked) {
      return {
        success: false,
        error: `계정이 잠겨있습니다. ${lockTimeRemaining}초 후에 다시 시도해주세요.`
      };
    }

    const validation = validatePinFormat(pin);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    setIsValidating(true);
    try {
      const result = await verifyPin(pin);
      if (result.success) {
        setAttempts(0);
      } else {
        setAttempts(prev => prev + 1);
      }
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [verifyPin, validatePinFormat, isLocked, lockTimeRemaining]);

  // Change PIN (requires current PIN)
  const handleChangePin = useCallback(async (currentPin: string, newPin: string, confirmNewPin: string) => {
    // First verify current PIN
    const currentPinResult = await handleVerifyPin(currentPin);
    if (!currentPinResult.success) {
      return { success: false, error: '현재 PIN이 올바르지 않습니다.' };
    }

    // Validate new PIN
    const validation = validatePinFormat(newPin);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    if (newPin !== confirmNewPin) {
      return { success: false, error: '새 PIN이 일치하지 않습니다.' };
    }

    if (currentPin === newPin) {
      return { success: false, error: '현재 PIN과 같은 PIN은 사용할 수 없습니다.' };
    }

    // Setup new PIN
    return await setupPin(newPin);
  }, [handleVerifyPin, validatePinFormat, setupPin]);

  // Reset PIN attempts (admin function)
  const resetAttempts = useCallback(() => {
    if (!user) return;
    updateUser({
      pinAttempts: 0,
      pinLockedUntil: undefined
    });
    setAttempts(0);
  }, [user, updateUser]);

  // Get PIN strength
  const getPinStrength = useCallback((pin: string): 'weak' | 'medium' | 'strong' => {
    if (pin.length < 4) return 'weak';
    if (pin.length === 4) return 'medium';

    // Check for patterns
    const hasRepeating = /(\d)\1{2,}/.test(pin);
    const isSequential = /(?:0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)/.test(pin);

    if (hasRepeating || isSequential) return 'weak';
    if (pin.length >= 6) return 'strong';

    return 'medium';
  }, []);

  // Check if PIN is commonly used
  const isCommonPin = useCallback((pin: string): boolean => {
    const commonPins = [
      '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
      '1234', '4321', '0123', '1230', '1004', '2580', '1357', '2468'
    ];
    return commonPins.includes(pin);
  }, []);

  return {
    // State
    attempts,
    isValidating,
    isLocked,
    lockTimeRemaining,
    user,

    // Validation
    validatePinFormat,
    getPinStrength,
    isCommonPin,

    // Actions
    setupPin: handleSetupPin,
    verifyPin: handleVerifyPin,
    changePin: handleChangePin,
    resetAttempts,

    // Utils
    maxAttempts: 5,
    lockoutDuration: 5 * 60, // 5 minutes in seconds
  };
}