// Legacy API - keeping for backward compatibility during transition
// New code should use the specific API modules in ./api/ directory

import { apiClient } from './api/client';

const API_BASE = 'http://localhost:3000/api';

const getCurrentLocale = () => {
  return localStorage.getItem('i18nextLng') || 'ko';
};

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Locale': getCurrentLocale()
  };

  // Add auth token if available
  const token = localStorage.getItem('questlife-token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const api = {
  // User
  async getOrCreateUser(userId?: string) {
    const endpoint = userId ? `/user?id=${userId}` : '/user';
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Goals
  async analyzeGoal(userId: string, goalText: string, targetLevel?: number) {
    const res = await fetch(`${API_BASE}/goals/analyze`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId, text: goalText, targetLevel, locale: getCurrentLocale() })
    });
    return res.json();
  },

  // Goals CRUD operations (NEW)
  async getGoals(userId?: string) {
    const endpoint = userId ? `/goals?userId=${userId}` : '/goals';
    return apiClient.get(endpoint);
  },

  async createGoal(data: any) {
    return apiClient.post('/goals', data);
  },

  async updateGoal(goalId: string, data: any) {
    return apiClient.patch(`/goals/${goalId}`, data);
  },

  async deleteGoal(goalId: string) {
    return apiClient.delete(`/goals/${goalId}`);
  },

  // Classes
  async getClasses(userId: string) {
    const res = await fetch(`${API_BASE}/classes?userId=${userId}&locale=${getCurrentLocale()}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async createClass(data: any) {
    const res = await fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Class management (NEW)
  async updateClass(classId: string, data: any) {
    return apiClient.patch(`/classes/${classId}`, data);
  },

  async deleteClass(classId: string) {
    return apiClient.delete(`/classes/${classId}`);
  },

  // Quests
  async getQuests(classId: string, status?: string) {
    const url = `${API_BASE}/quests?classId=${classId}${status ? `&status=${status}` : ''}&locale=${getCurrentLocale()}`;
    const res = await fetch(url, {
      headers: getHeaders()
    });
    return res.json();
  },

  async completeQuest(questId: string, userId: string) {
    const res = await fetch(`${API_BASE}/quests/${questId}/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  // Quest management (NEW)
  async createQuest(data: any) {
    return apiClient.post('/quests', data);
  },

  async updateQuest(questId: string, data: any) {
    return apiClient.patch(`/quests/${questId}`, data);
  },

  async deleteQuest(questId: string) {
    return apiClient.delete(`/quests/${questId}`);
  },

  // Quest history (NEW)
  async getQuestHistory(userId?: string, limit?: number) {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (limit) params.append('limit', limit.toString());

    return apiClient.get(`/quests/history?${params.toString()}`);
  },

  // Status
  async getCharacterStatus(userId: string) {
    const res = await fetch(`${API_BASE}/status?userId=${userId}&locale=${getCurrentLocale()}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Character progression (NEW)
  async updateCharacterStatus(userId: string, data: any) {
    return apiClient.patch(`/status/${userId}`, data);
  },

  async getSkillTree(classId: string) {
    return apiClient.get(`/classes/${classId}/skills`);
  },

  async upgradeSkill(classId: string, skillId: string) {
    return apiClient.post(`/classes/${classId}/skills/${skillId}/upgrade`);
  },

  // Authentication (NEW)
  async setupPin(pin: string) {
    return apiClient.post('/auth/setup-pin', { pin });
  },

  async verifyPin(userId: string, pin: string) {
    return apiClient.post('/auth/verify-pin', { userId, pin });
  },

  async changePin(currentPin: string, newPin: string) {
    return apiClient.post('/auth/change-pin', { currentPin, newPin });
  },

  // Dashboard (NEW)
  async getDashboard() {
    return apiClient.get('/dashboard');
  },

  async quickCompleteQuest(questId: string) {
    return apiClient.post(`/dashboard/quick-complete/${questId}`);
  },

  // Navigation (NEW)
  async saveNavigationState(state: any) {
    return apiClient.post('/navigation/save-state', { state });
  },

  async getNavigationState() {
    return apiClient.get('/navigation/state');
  },

  async addToNavigationHistory(path: string, params?: Record<string, string>) {
    return apiClient.post('/navigation/history', { path, params, timestamp: new Date() });
  },

  // Utilities
  setAuthToken(token: string | null) {
    apiClient.setToken(token);
  }
};

// Export new API client for modern usage
export { apiClient } from './api/client';
export { authApi } from './api/auth';
export { dashboardApi } from './api/dashboard';
export { navigationApi } from './api/navigation';