import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NavigationHistory {
  path: string;
  timestamp: Date;
  params?: Record<string, string>;
}

interface NavigationState {
  // Current state
  activeTab: string;
  previousTab: string | null;
  history: NavigationHistory[];
  isLoading: boolean;
  error: string | null;

  // Tab-specific state
  scrollPositions: Record<string, number>;
  pageStates: Record<string, any>;

  // Actions
  setActiveTab: (tabId: string) => void;
  saveNavigationState: () => void;
  restoreNavigationState: () => void;
  addToHistory: (path: string, params?: Record<string, string>) => void;
  getScrollPosition: (tabId: string) => number;
  saveScrollPosition: (tabId: string, position: number) => void;
  savePageState: (tabId: string, state: any) => void;
  getPageState: (tabId: string) => any;
  clearHistory: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeTab: 'dashboard',
      previousTab: null,
      history: [],
      isLoading: false,
      error: null,
      scrollPositions: {},
      pageStates: {},

      // Set active tab
      setActiveTab: (tabId: string) => {
        const { activeTab } = get();
        set({
          previousTab: activeTab,
          activeTab: tabId
        });
      },

      // Save current navigation state
      saveNavigationState: () => {
        const { activeTab, addToHistory } = get();

        // Add current tab to history
        addToHistory(`/${activeTab}`);

        // Save to localStorage for persistence across sessions
        const state = get();
        localStorage.setItem('questlife-navigation', JSON.stringify({
          activeTab: state.activeTab,
          previousTab: state.previousTab,
          history: state.history.slice(-10), // Keep last 10 entries
          scrollPositions: state.scrollPositions,
          pageStates: state.pageStates
        }));
      },

      // Restore navigation state from localStorage
      restoreNavigationState: () => {
        try {
          const saved = localStorage.getItem('questlife-navigation');
          if (saved) {
            const state = JSON.parse(saved);
            set({
              activeTab: state.activeTab || 'dashboard',
              previousTab: state.previousTab || null,
              history: (state.history || []).map((item: any) => ({
                ...item,
                timestamp: new Date(item.timestamp)
              })),
              scrollPositions: state.scrollPositions || {},
              pageStates: state.pageStates || {}
            });
          }
        } catch (error) {
          console.error('Failed to restore navigation state:', error);
        }
      },

      // Add entry to navigation history
      addToHistory: (path: string, params?: Record<string, string>) => {
        const { history } = get();
        const newEntry: NavigationHistory = {
          path,
          timestamp: new Date(),
          params
        };

        // Avoid duplicate consecutive entries
        const lastEntry = history[history.length - 1];
        if (lastEntry && lastEntry.path === path) {
          return;
        }

        const updatedHistory = [...history, newEntry].slice(-20); // Keep last 20 entries
        set({ history: updatedHistory });
      },

      // Get scroll position for a tab
      getScrollPosition: (tabId: string) => {
        const { scrollPositions } = get();
        return scrollPositions[tabId] || 0;
      },

      // Save scroll position for a tab
      saveScrollPosition: (tabId: string, position: number) => {
        const { scrollPositions } = get();
        set({
          scrollPositions: {
            ...scrollPositions,
            [tabId]: position
          }
        });
      },

      // Save page state for a tab
      savePageState: (tabId: string, state: any) => {
        const { pageStates } = get();
        set({
          pageStates: {
            ...pageStates,
            [tabId]: state
          }
        });
      },

      // Get page state for a tab
      getPageState: (tabId: string) => {
        const { pageStates } = get();
        return pageStates[tabId] || {};
      },

      // Clear navigation history
      clearHistory: () => {
        set({
          history: [],
          scrollPositions: {},
          pageStates: {}
        });
        localStorage.removeItem('questlife-navigation');
      },

      // Set loading state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Set error state
      setError: (error: string | null) => {
        set({ error });
      }
    }),
    {
      name: 'questlife-navigation',
      partialize: (state) => ({
        activeTab: state.activeTab,
        previousTab: state.previousTab,
        scrollPositions: state.scrollPositions,
        pageStates: state.pageStates
      })
    }
  )
);