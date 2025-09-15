import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    theme: 'dark' | 'light';
    notifications: boolean;
    soundEffects: boolean;
  };
  pinHash?: string;
  pinAttempts: number;
  pinLockedUntil?: Date;
  lastLogin?: Date;
  onboardingCompleted: boolean;
  preferredLanguage: 'ko' | 'en';
}

interface AuthState {
  // State
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  tokenExpiresAt: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  setToken: (token: string | null, expiresAt?: string) => void;
  shouldRefresh: () => boolean;
}

// Default user for single-user app
const DEFAULT_USER_ID = 'default-user';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      token: null,
      tokenExpiresAt: null,
      loading: false,
      error: null,

      // Initialize auth on app start
      initializeAuth: async () => {
        set({ loading: true, error: null });

        try {
          // Check if user exists in localStorage or create one
          const existingUser = localStorage.getItem('questlife-user');
          const existingToken = localStorage.getItem('questlife-token');
          const tokenExpiresAt = localStorage.getItem('questlife-token-expires-at');

          // Set up event listeners for token refresh and auth events
          window.addEventListener('auth:tokenRefreshed', (event: any) => {
            const { token, expiresAt } = event.detail;
            set({
              token,
              tokenExpiresAt: expiresAt,
              isAuthenticated: true
            });
          });

          window.addEventListener('auth:unauthorized', () => {
            set({
              isAuthenticated: false,
              token: null,
              tokenExpiresAt: null,
              error: 'Session expired - please log in again'
            });
          });

          if (existingUser) {
            const user = JSON.parse(existingUser);
            set({
              user,
              token: existingToken,
              tokenExpiresAt,
              isAuthenticated: !!existingToken,
              loading: false
            });
          } else {
            // Create default user for single-user app
            const newUser: User = {
              id: DEFAULT_USER_ID,
              createdAt: new Date(),
              updatedAt: new Date(),
              settings: {
                theme: 'light',
                notifications: true,
                soundEffects: true
              },
              pinAttempts: 0,
              onboardingCompleted: false,
              preferredLanguage: 'ko'
            };

            localStorage.setItem('questlife-user', JSON.stringify(newUser));
            set({ user: newUser, loading: false });
          }
        } catch (error) {
          set({ error: 'Failed to initialize authentication', loading: false });
        }
      },

      // Setup PIN for new user
      setupPin: async (pin: string) => {
        const { user } = get();
        if (!user) {
          throw new Error('No user found');
        }

        set({ loading: true, error: null });

        try {
          // In a real app, you'd hash the PIN and send to server
          // For single-user local app, we'll just store a simple hash
          const pinHash = btoa(pin); // Simple encoding for demo

          const updatedUser: User = {
            ...user,
            pinHash,
            pinAttempts: 0,
            pinLockedUntil: undefined,
            lastLogin: new Date(),
            onboardingCompleted: true,
            updatedAt: new Date()
          };

          // Generate a simple token
          const token = `token-${Date.now()}`;
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

          localStorage.setItem('questlife-user', JSON.stringify(updatedUser));
          localStorage.setItem('questlife-token', token);
          localStorage.setItem('questlife-token-expires-at', expiresAt);

          set({
            user: updatedUser,
            token,
            tokenExpiresAt: expiresAt,
            isAuthenticated: true,
            loading: false
          });
        } catch (error) {
          set({ error: 'Failed to setup PIN', loading: false });
          throw error;
        }
      },

      // Verify PIN for login
      verifyPin: async (pin: string) => {
        const { user } = get();
        if (!user || !user.pinHash) {
          throw new Error('No PIN setup found');
        }

        set({ loading: true, error: null });

        try {
          // Check if user is locked
          if (user.pinLockedUntil && new Date() < user.pinLockedUntil) {
            const remainingTime = Math.ceil((user.pinLockedUntil.getTime() - new Date().getTime()) / 1000);
            throw {
              message: `계정이 잠겨있습니다. ${remainingTime}초 후에 다시 시도해주세요.`,
              lockedUntil: user.pinLockedUntil
            };
          }

          // Verify PIN
          const pinHash = btoa(pin);
          if (pinHash !== user.pinHash) {
            const newAttempts = user.pinAttempts + 1;
            const maxAttempts = 5;
            const attemptsRemaining = maxAttempts - newAttempts;

            let updatedUser = {
              ...user,
              pinAttempts: newAttempts,
              updatedAt: new Date()
            };

            // Lock account if too many attempts
            if (newAttempts >= maxAttempts) {
              const lockUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
              updatedUser = {
                ...updatedUser,
                pinLockedUntil: lockUntil,
                pinAttempts: 0 // Reset attempts after lock
              };
            }

            localStorage.setItem('questlife-user', JSON.stringify(updatedUser));
            set({ user: updatedUser, loading: false });

            throw {
              message: '잘못된 PIN입니다.',
              attemptsRemaining,
              lockedUntil: updatedUser.pinLockedUntil
            };
          }

          // Successful login
          const updatedUser = {
            ...user,
            pinAttempts: 0,
            pinLockedUntil: undefined,
            lastLogin: new Date(),
            updatedAt: new Date()
          };

          const token = `token-${Date.now()}`;
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

          localStorage.setItem('questlife-user', JSON.stringify(updatedUser));
          localStorage.setItem('questlife-token', token);
          localStorage.setItem('questlife-token-expires-at', expiresAt);

          set({
            user: updatedUser,
            token,
            tokenExpiresAt: expiresAt,
            isAuthenticated: true,
            loading: false
          });
        } catch (error) {
          if (typeof error === 'object' && error !== null && 'message' in error) {
            set({ error: (error as any).message, loading: false });
            throw error;
          }
          set({ error: 'PIN verification failed', loading: false });
          throw error;
        }
      },

      // Refresh token
      refreshToken: async () => {
        const { token } = get();
        if (!token) {
          throw new Error('No token available to refresh');
        }

        set({ loading: true, error: null });

        try {
          // Import authApi dynamically to avoid circular dependency
          const { authApi } = await import('../services/api/auth.js');
          const response = await authApi.refreshToken();

          if (response.success && response.data) {
            const newToken = response.data.token;
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

            localStorage.setItem('questlife-token', newToken);
            localStorage.setItem('questlife-token-expires-at', expiresAt);

            set({
              token: newToken,
              tokenExpiresAt: expiresAt,
              loading: false
            });
          } else {
            throw new Error(response.error || 'Token refresh failed');
          }
        } catch (error: any) {
          set({
            error: error.message || 'Token refresh failed',
            loading: false,
            isAuthenticated: false,
            token: null,
            tokenExpiresAt: null
          });
          localStorage.removeItem('questlife-token');
          localStorage.removeItem('questlife-token-expires-at');
          throw error;
        }
      },

      // Logout
      logout: () => {
        localStorage.removeItem('questlife-token');
        localStorage.removeItem('questlife-token-expires-at');
        set({
          isAuthenticated: false,
          token: null,
          tokenExpiresAt: null,
          error: null
        });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set user
      setUser: (user: User) => {
        localStorage.setItem('questlife-user', JSON.stringify(user));
        set({ user });
      },

      // Update user
      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        const updatedUser = {
          ...user,
          ...updates,
          updatedAt: new Date()
        };

        localStorage.setItem('questlife-user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      },

      // Set token
      setToken: (token: string | null, expiresAt?: string) => {
        if (token) {
          localStorage.setItem('questlife-token', token);
          if (expiresAt) {
            localStorage.setItem('questlife-token-expires-at', expiresAt);
          }
          set({
            token,
            tokenExpiresAt: expiresAt || null,
            isAuthenticated: true
          });

          // Update API client token
          import('../services/api/client.js').then(({ apiClient }) => {
            apiClient.setToken(token, expiresAt);
          });
        } else {
          localStorage.removeItem('questlife-token');
          localStorage.removeItem('questlife-token-expires-at');
          set({
            token: null,
            tokenExpiresAt: null,
            isAuthenticated: false
          });

          // Clear API client token
          import('../services/api/client.js').then(({ apiClient }) => {
            apiClient.setToken(null);
          });
        }
      },

      // Check if token should be refreshed
      shouldRefresh: () => {
        const { token, tokenExpiresAt } = get();
        if (!token || !tokenExpiresAt) {
          return false;
        }

        const expiresAt = new Date(tokenExpiresAt);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();

        // Refresh if token expires within 24 hours
        return timeUntilExpiry <= 24 * 60 * 60 * 1000;
      }
    }),
    {
      name: 'questlife-auth',
      partialize: (state) => ({
        token: state.token,
        tokenExpiresAt: state.tokenExpiresAt,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);