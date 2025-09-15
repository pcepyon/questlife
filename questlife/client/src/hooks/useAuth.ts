import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Hook for authentication functionality
 * Provides auth state and actions with automatic initialization
 */
export function useAuth() {
  const {
    isAuthenticated,
    user,
    token,
    loading,
    error,
    initializeAuth,
    setupPin,
    verifyPin,
    logout,
    clearError,
    setUser,
    updateUser
  } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    if (!user && !loading) {
      initializeAuth();
    }
  }, [user, loading, initializeAuth]);

  // Check if user has completed onboarding
  const hasCompletedOnboarding = user?.onboardingCompleted ?? false;

  // Check if user has PIN setup
  const hasPinSetup = !!user?.pinHash;

  // Check if user is locked
  const isLocked = user?.pinLockedUntil ? new Date() < user.pinLockedUntil : false;

  // Get remaining lock time in seconds
  const lockTimeRemaining = isLocked && user?.pinLockedUntil
    ? Math.ceil((user.pinLockedUntil.getTime() - new Date().getTime()) / 1000)
    : 0;

  // PIN verification with error handling
  const verifyPinSafe = async (pin: string) => {
    try {
      await verifyPin(pin);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'PIN verification failed',
        attemptsRemaining: error.attemptsRemaining,
        lockedUntil: error.lockedUntil
      };
    }
  };

  // PIN setup with error handling
  const setupPinSafe = async (pin: string) => {
    try {
      await setupPin(pin);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'PIN setup failed'
      };
    }
  };

  // Update user settings
  const updateSettings = (settings: Partial<NonNullable<typeof user>['settings']>) => {
    if (!user) return;
    updateUser({
      settings: {
        ...user.settings,
        ...settings
      }
    });
  };

  // Mark onboarding as completed
  const completeOnboarding = () => {
    if (!user) return;
    updateUser({ onboardingCompleted: true });
  };

  return {
    // State
    isAuthenticated,
    user,
    token,
    loading,
    error,
    hasCompletedOnboarding,
    hasPinSetup,
    isLocked,
    lockTimeRemaining,

    // Actions
    initializeAuth,
    setupPin: setupPinSafe,
    verifyPin: verifyPinSafe,
    logout,
    clearError,
    setUser,
    updateUser,
    updateSettings,
    completeOnboarding
  };
}