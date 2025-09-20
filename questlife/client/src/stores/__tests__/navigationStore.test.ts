import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useNavigationStore } from '../navigationStore';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock console.error to avoid noise in tests
const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('NavigationStore', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    // Reset store state
    useNavigationStore.setState({
      activeTab: 'dashboard',
      previousTab: null,
      history: [],
      isLoading: false,
      error: null,
      scrollPositions: {},
      pageStates: {}
    });
  });

  afterEach(() => {
    consoleErrorMock.mockClear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useNavigationStore.getState();

      expect(state.activeTab).toBe('dashboard');
      expect(state.previousTab).toBe(null);
      expect(state.history).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.scrollPositions).toEqual({});
      expect(state.pageStates).toEqual({});
    });
  });

  describe('Tab Navigation', () => {
    it('should set active tab and update previous tab', () => {
      const { setActiveTab } = useNavigationStore.getState();

      setActiveTab('quests');

      let state = useNavigationStore.getState();
      expect(state.activeTab).toBe('quests');
      expect(state.previousTab).toBe('dashboard');

      setActiveTab('character');

      state = useNavigationStore.getState();
      expect(state.activeTab).toBe('character');
      expect(state.previousTab).toBe('quests');
    });

    it('should handle rapid tab changes', () => {
      const { setActiveTab } = useNavigationStore.getState();

      setActiveTab('quests');
      setActiveTab('character');
      setActiveTab('goals');

      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('goals');
      expect(state.previousTab).toBe('character');
    });
  });

  describe('Navigation History', () => {
    it('should add entries to history', () => {
      const { addToHistory } = useNavigationStore.getState();

      addToHistory('/dashboard');
      addToHistory('/quests', { filter: 'daily' });

      const state = useNavigationStore.getState();
      expect(state.history).toHaveLength(2);
      expect(state.history[0].path).toBe('/dashboard');
      expect(state.history[1].path).toBe('/quests');
      expect(state.history[1].params).toEqual({ filter: 'daily' });
    });

    it('should not add duplicate consecutive entries', () => {
      const { addToHistory } = useNavigationStore.getState();

      addToHistory('/dashboard');
      addToHistory('/dashboard'); // Duplicate
      addToHistory('/quests');
      addToHistory('/quests'); // Duplicate

      const state = useNavigationStore.getState();
      expect(state.history).toHaveLength(2);
      expect(state.history[0].path).toBe('/dashboard');
      expect(state.history[1].path).toBe('/quests');
    });

    it('should limit history to 20 entries', () => {
      const { addToHistory } = useNavigationStore.getState();

      // Add 25 entries
      for (let i = 0; i < 25; i++) {
        addToHistory(`/page${i}`);
      }

      const state = useNavigationStore.getState();
      expect(state.history).toHaveLength(20);
      expect(state.history[0].path).toBe('/page5'); // First 5 entries should be dropped
      expect(state.history[19].path).toBe('/page24');
    });

    it('should include timestamps in history entries', () => {
      const { addToHistory } = useNavigationStore.getState();
      const beforeTime = new Date();

      addToHistory('/dashboard');

      const state = useNavigationStore.getState();
      const afterTime = new Date();

      expect(state.history[0].timestamp).toBeInstanceOf(Date);
      expect(state.history[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(state.history[0].timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('Scroll Position Management', () => {
    it('should save and retrieve scroll positions', () => {
      const { saveScrollPosition, getScrollPosition } = useNavigationStore.getState();

      saveScrollPosition('dashboard', 150);
      saveScrollPosition('quests', 300);

      expect(getScrollPosition('dashboard')).toBe(150);
      expect(getScrollPosition('quests')).toBe(300);
      expect(getScrollPosition('character')).toBe(0); // Default for unknown tab
    });

    it('should update existing scroll positions', () => {
      const { saveScrollPosition, getScrollPosition } = useNavigationStore.getState();

      saveScrollPosition('dashboard', 100);
      saveScrollPosition('dashboard', 200);

      expect(getScrollPosition('dashboard')).toBe(200);
    });
  });

  describe('Page State Management', () => {
    it('should save and retrieve page states', () => {
      const { savePageState, getPageState } = useNavigationStore.getState();

      const dashboardState = { selectedQuest: 'q1', filter: 'completed' };
      const questsState = { sortBy: 'date', showCompleted: false };

      savePageState('dashboard', dashboardState);
      savePageState('quests', questsState);

      expect(getPageState('dashboard')).toEqual(dashboardState);
      expect(getPageState('quests')).toEqual(questsState);
      expect(getPageState('character')).toEqual({}); // Default for unknown tab
    });

    it('should update existing page states', () => {
      const { savePageState, getPageState } = useNavigationStore.getState();

      const initialState = { filter: 'all' };
      const updatedState = { filter: 'completed', sortBy: 'date' };

      savePageState('dashboard', initialState);
      savePageState('dashboard', updatedState);

      expect(getPageState('dashboard')).toEqual(updatedState);
    });
  });

  describe('Loading and Error States', () => {
    it('should set loading state', () => {
      const { setLoading } = useNavigationStore.getState();

      setLoading(true);
      expect(useNavigationStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useNavigationStore.getState().isLoading).toBe(false);
    });

    it('should set error state', () => {
      const { setError } = useNavigationStore.getState();

      setError('Navigation failed');
      expect(useNavigationStore.getState().error).toBe('Navigation failed');

      setError(null);
      expect(useNavigationStore.getState().error).toBe(null);
    });
  });

  describe('Persistence', () => {
    it('should save navigation state to localStorage', () => {
      const { saveNavigationState, setActiveTab, addToHistory, saveScrollPosition, savePageState } = useNavigationStore.getState();

      setActiveTab('quests');
      addToHistory('/dashboard');
      addToHistory('/quests');
      saveScrollPosition('dashboard', 100);
      savePageState('dashboard', { filter: 'all' });

      saveNavigationState();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'questlife-navigation',
        expect.stringContaining('"activeTab":"quests"')
      );
    });

    it('should restore navigation state from localStorage', () => {
      const savedState = {
        activeTab: 'character',
        previousTab: 'quests',
        history: [
          { path: '/dashboard', timestamp: '2023-01-01T00:00:00.000Z' },
          { path: '/quests', timestamp: '2023-01-01T00:01:00.000Z' }
        ],
        scrollPositions: { dashboard: 150 },
        pageStates: { quests: { filter: 'completed' } }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

      const { restoreNavigationState } = useNavigationStore.getState();
      restoreNavigationState();

      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('character');
      expect(state.previousTab).toBe('quests');
      expect(state.history).toHaveLength(2);
      expect(state.history[0].timestamp).toBeInstanceOf(Date);
      expect(state.scrollPositions).toEqual({ dashboard: 150 });
      expect(state.pageStates).toEqual({ quests: { filter: 'completed' } });
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const { restoreNavigationState } = useNavigationStore.getState();
      restoreNavigationState();

      // Should not throw and console.error should be called
      expect(consoleErrorMock).toHaveBeenCalledWith(
        'Failed to restore navigation state:',
        expect.any(Error)
      );

      // State should remain at defaults
      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('dashboard');
    });

    it('should handle missing localStorage data', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { restoreNavigationState } = useNavigationStore.getState();
      restoreNavigationState();

      // Should not change state from defaults
      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('dashboard');
      expect(state.history).toEqual([]);
    });

    it('should limit history entries when saving', () => {
      const { saveNavigationState, addToHistory } = useNavigationStore.getState();

      // Add 15 history entries
      for (let i = 0; i < 15; i++) {
        addToHistory(`/page${i}`);
      }

      saveNavigationState();

      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const parsedData = JSON.parse(savedData);
      expect(parsedData.history).toHaveLength(10); // Should be limited to 10
    });
  });

  describe('Clear History', () => {
    it('should clear all navigation data', () => {
      const { clearHistory, setActiveTab, addToHistory, saveScrollPosition, savePageState } = useNavigationStore.getState();

      // Set up some state
      setActiveTab('quests');
      addToHistory('/dashboard');
      saveScrollPosition('dashboard', 100);
      savePageState('dashboard', { filter: 'all' });

      clearHistory();

      const state = useNavigationStore.getState();
      expect(state.history).toEqual([]);
      expect(state.scrollPositions).toEqual({});
      expect(state.pageStates).toEqual({});
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('questlife-navigation');
    });
  });

  describe('Performance', () => {
    it('should handle rapid state updates efficiently', () => {
      const { setActiveTab, addToHistory, saveScrollPosition } = useNavigationStore.getState();

      const start = performance.now();

      // Perform many rapid updates
      for (let i = 0; i < 1000; i++) {
        setActiveTab(`tab${i % 4}`);
        addToHistory(`/page${i}`);
        saveScrollPosition(`tab${i % 4}`, i * 10);
      }

      const end = performance.now();
      const duration = end - start;

      // Should complete quickly (less than 100ms)
      expect(duration).toBeLessThan(100);

      // State should be consistent
      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('tab3'); // 999 % 4 = 3
      expect(state.history).toHaveLength(20); // Limited to 20
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string parameters', () => {
      const { setActiveTab, addToHistory } = useNavigationStore.getState();

      setActiveTab('');
      addToHistory('');

      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('');
      expect(state.history[0].path).toBe('');
    });

    it('should handle special characters in tab names and paths', () => {
      const { setActiveTab, addToHistory } = useNavigationStore.getState();

      const specialTab = 'tab-with-特殊문자-and-émojis-🚀';
      const specialPath = '/path/with-특수문자/and-émojis-🎯';

      setActiveTab(specialTab);
      addToHistory(specialPath);

      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe(specialTab);
      expect(state.history[0].path).toBe(specialPath);
    });

    it('should handle very large page states', () => {
      const { savePageState, getPageState } = useNavigationStore.getState();

      const largeState = {
        data: new Array(10000).fill(0).map((_, i) => ({ id: i, value: `item${i}` })),
        metadata: { count: 10000, generated: new Date().toISOString() }
      };

      savePageState('dashboard', largeState);
      const retrieved = getPageState('dashboard');

      expect(retrieved).toEqual(largeState);
    });
  });
});