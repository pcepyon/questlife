// Authentication interfaces for QuestLife 2.0

export interface User {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  settings: UserSettings;
  pinHash?: string;
  pinAttempts: number;
  pinLockedUntil?: Date;
  lastLogin?: Date;
  onboardingCompleted: boolean;
  preferredLanguage: 'ko' | 'en';
}

export interface UserSettings {
  theme: 'dark' | 'light';
  notifications: boolean;
  soundEffects: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  pinHash: string;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

export interface PinSetupRequest {
  pin: string; // 4-6 digits
}

export interface PinSetupResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface PinVerifyRequest {
  userId: string;
  pin: string;
}

export interface PinVerifyResponse {
  success: boolean;
  token?: string;
  user?: User;
  attemptsRemaining?: number;
  lockedUntil?: Date;
  message?: string;
}

export interface ChangePinRequest {
  currentPin: string;
  newPin: string;
}

export interface ChangePinResponse {
  success: boolean;
  message?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface JWTPayload {
  userId: string;
  sessionId: string;
  iat: number;
  exp: number;
}