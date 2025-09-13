const API_BASE = 'http://localhost:3000/api';

const getCurrentLocale = () => {
  return localStorage.getItem('i18nextLng') || 'ko';
};

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'X-Locale': getCurrentLocale()
  };
};

export const api = {
  // User
  async getOrCreateUser(userId?: string) {
    const res = await fetch(`${API_BASE}/user${userId ? `?id=${userId}` : ''}`, {
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
  
  // Status
  async getCharacterStatus(userId: string) {
    const res = await fetch(`${API_BASE}/status?userId=${userId}&locale=${getCurrentLocale()}`, {
      headers: getHeaders()
    });
    return res.json();
  }
};