// API client with authentication interceptor and error handling
export class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private tokenExpiresAt: string | null = null;
  private refreshPromise: Promise<any> | null = null;

  constructor(baseURL: string = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
    this.initializeToken();
  }

  private initializeToken() {
    this.token = localStorage.getItem('questlife-token');
    this.tokenExpiresAt = localStorage.getItem('questlife-token-expires-at');
  }

  public setToken(token: string | null, expiresAt?: string) {
    this.token = token;
    this.tokenExpiresAt = expiresAt || null;

    if (token) {
      localStorage.setItem('questlife-token', token);
      if (expiresAt) {
        localStorage.setItem('questlife-token-expires-at', expiresAt);
      }
    } else {
      localStorage.removeItem('questlife-token');
      localStorage.removeItem('questlife-token-expires-at');
    }
  }

  private getCurrentLocale(): string {
    return localStorage.getItem('i18nextLng') || 'ko';
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Locale': this.getCurrentLocale()
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private shouldRefreshToken(): boolean {
    if (!this.token || !this.tokenExpiresAt) {
      return false;
    }

    const expiresAt = new Date(this.tokenExpiresAt);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    // Refresh if token expires within 24 hours (24 * 60 * 60 * 1000 ms)
    return timeUntilExpiry <= 24 * 60 * 60 * 1000;
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    if (!this.shouldRefreshToken()) {
      return;
    }

    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      if (data.success && data.data?.token) {
        // Get expiry from session info if available
        let expiresAt: string | undefined;
        try {
          const sessionResponse = await fetch(`${this.baseURL}/auth/session`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${data.data.token}`,
              'Content-Type': 'application/json'
            }
          });

          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            expiresAt = sessionData.data?.expiresAt;
          }
        } catch (error) {
          // Ignore session fetch error, just use the refreshed token
          console.warn('Failed to get session info after refresh:', error);
        }

        this.setToken(data.data.token, expiresAt);

        // Dispatch custom event for successful refresh
        window.dispatchEvent(new CustomEvent('auth:tokenRefreshed', {
          detail: { token: data.data.token, expiresAt }
        }));
      } else {
        throw new Error(data.error || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.setToken(null);
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      throw error;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Skip refresh for auth endpoints to avoid loops
    const isAuthEndpoint = endpoint.startsWith('/auth/');

    if (!isAuthEndpoint) {
      await this.refreshTokenIfNeeded();
    }

    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        this.setToken(null);
        // Dispatch custom event for auth error
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new Error('Unauthorized - please log in again');
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection');
      }
      throw error;
    }
  }

  // HTTP methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create default client instance
export const apiClient = new ApiClient();