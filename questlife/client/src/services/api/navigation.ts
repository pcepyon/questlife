import { apiClient } from './client';

export interface NavigationState {
  activeTab: string;
  previousTab?: string;
  timestamp: Date;
  scrollPosition?: number;
  pageState?: any;
}

export interface NavigationHistory {
  path: string;
  timestamp: Date;
  params?: Record<string, string>;
  duration?: number; // Time spent on page in seconds
}

export interface SaveNavigationRequest {
  state: NavigationState;
}

export interface GetNavigationResponse {
  state: NavigationState | null;
  history: NavigationHistory[];
}

// Navigation API functions
export const navigationApi = {
  // Save current navigation state
  async saveNavigationState(data: SaveNavigationRequest): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/navigation/save-state', data);
  },

  // Get saved navigation state
  async getNavigationState(): Promise<GetNavigationResponse> {
    return apiClient.get<GetNavigationResponse>('/navigation/state');
  },

  // Add entry to navigation history
  async addToHistory(path: string, params?: Record<string, string>): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/navigation/history', {
      path,
      params,
      timestamp: new Date()
    });
  },

  // Get navigation history
  async getHistory(limit: number = 50): Promise<NavigationHistory[]> {
    return apiClient.get<NavigationHistory[]>(`/navigation/history?limit=${limit}`);
  },

  // Get recent navigation history
  async getRecentHistory(hours: number = 24): Promise<NavigationHistory[]> {
    return apiClient.get<NavigationHistory[]>(`/navigation/history/recent?hours=${hours}`);
  },

  // Get navigation analytics
  async getNavigationAnalytics(): Promise<{
    mostVisitedTabs: { tab: string; count: number }[];
    averageSessionTime: number;
    totalPageViews: number;
    tabSwitchFrequency: number;
  }> {
    return apiClient.get('/navigation/analytics');
  },

  // Clear navigation history
  async clearHistory(): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>('/navigation/history');
  },

  // Save scroll position for a tab
  async saveScrollPosition(tabId: string, position: number): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/navigation/scroll-position', {
      tabId,
      position
    });
  },

  // Get scroll position for a tab
  async getScrollPosition(tabId: string): Promise<{ position: number }> {
    return apiClient.get<{ position: number }>(`/navigation/scroll-position/${tabId}`);
  },

  // Save page state for a tab
  async savePageState(tabId: string, state: any): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/navigation/page-state', {
      tabId,
      state
    });
  },

  // Get page state for a tab
  async getPageState(tabId: string): Promise<{ state: any }> {
    return apiClient.get<{ state: any }>(`/navigation/page-state/${tabId}`);
  }
};