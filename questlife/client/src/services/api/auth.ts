import { apiClient } from './client';

export interface PinSetupRequest {
  pin: string;
}

export interface PinSetupResponse {
  success: boolean;
  data?: {
    user: any;
    message?: string;
  };
  error?: string;
}

export interface PinVerifyRequest {
  userId: string;
  pin: string;
}

export interface PinVerifyResponse {
  success: boolean;
  data?: {
    token: string;
    user: any;
    message?: string;
  };
  error?: string;
  remainingAttempts?: number;
  lockedUntil?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data?: {
    token: string;
    user: any;
    message?: string;
  };
  error?: string;
}

export interface SessionResponse {
  success: boolean;
  data?: {
    userId: string;
    isValid: boolean;
    expiresAt?: string;
    shouldRefresh?: boolean;
  };
  error?: string;
}

export interface ChangePinRequest {
  currentPin: string;
  newPin: string;
}

export interface ChangePinResponse {
  success: boolean;
  message?: string;
}

// Authentication API functions
export const authApi = {
  // Setup PIN for new user
  async setupPin(data: PinSetupRequest): Promise<PinSetupResponse> {
    return apiClient.post<PinSetupResponse>('/auth/setup-pin', data);
  },

  // Verify PIN for login
  async verifyPin(data: PinVerifyRequest): Promise<PinVerifyResponse> {
    return apiClient.post<PinVerifyResponse>('/auth/verify-pin', data);
  },

  // Refresh token
  async refreshToken(): Promise<RefreshTokenResponse> {
    return apiClient.post<RefreshTokenResponse>('/auth/refresh');
  },

  // Change PIN
  async changePin(data: ChangePinRequest): Promise<ChangePinResponse> {
    return apiClient.post<ChangePinResponse>('/auth/change-pin', data);
  },

  // Get current user
  async getCurrentUser() {
    return apiClient.get('/auth/me');
  },

  // Logout
  async logout() {
    return apiClient.post('/auth/logout');
  },

  // Check session validity
  async checkSession(): Promise<SessionResponse> {
    return apiClient.get<SessionResponse>('/auth/session');
  }
};