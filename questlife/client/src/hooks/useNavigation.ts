import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigationStore } from '@/stores/navigationStore';

/**
 * Hook for navigation functionality
 * Manages tab state, navigation history, and scroll positions
 */
export function useNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    activeTab,
    previousTab,
    history,
    scrollPositions,
    pageStates,
    setActiveTab,
    saveNavigationState,
    restoreNavigationState,
    addToHistory,
    getScrollPosition,
    saveScrollPosition,
    savePageState,
    getPageState,
    clearHistory
  } = useNavigationStore();

  // Initialize navigation state on mount
  useEffect(() => {
    restoreNavigationState();
  }, [restoreNavigationState]);

  // Update active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    let tab = 'dashboard'; // default

    if (path.startsWith('/quests')) tab = 'quests';
    else if (path.startsWith('/character')) tab = 'character';
    else if (path.startsWith('/goals')) tab = 'goals';
    else if (path.startsWith('/dashboard')) tab = 'dashboard';

    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.pathname, activeTab, setActiveTab]);

  // Save navigation state when tab changes
  useEffect(() => {
    if (activeTab) {
      saveNavigationState();
    }
  }, [activeTab, saveNavigationState]);

  // Navigate to a specific tab
  const navigateToTab = useCallback((tabId: string, params?: Record<string, string>) => {
    const routes = {
      dashboard: '/dashboard',
      quests: '/quests',
      character: '/character',
      goals: '/goals'
    };

    const route = routes[tabId as keyof typeof routes] || '/dashboard';
    navigate(route);
    addToHistory(route, params);
  }, [navigate, addToHistory]);

  // Go back to previous tab
  const goBackToPreviousTab = useCallback(() => {
    if (previousTab) {
      navigateToTab(previousTab);
    }
  }, [previousTab, navigateToTab]);

  // Navigate with state preservation
  const navigateWithState = useCallback((path: string, state?: any) => {
    if (state) {
      savePageState(activeTab, state);
    }
    navigate(path);
    addToHistory(path);
  }, [navigate, addToHistory, savePageState, activeTab]);

  // Get the navigation history for a specific period
  const getRecentHistory = useCallback((hours: number = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return history.filter(entry => entry.timestamp >= cutoff);
  }, [history]);

  // Get most visited tabs
  const getMostVisitedTabs = useCallback(() => {
    const tabCounts = history.reduce((counts, entry) => {
      const tab = entry.path.split('/')[1] || 'dashboard';
      counts[tab] = (counts[tab] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return Object.entries(tabCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([tab, count]) => ({ tab, count }));
  }, [history]);

  // Save scroll position for current tab
  const saveCurrentScrollPosition = useCallback(() => {
    const scrollY = window.scrollY;
    saveScrollPosition(activeTab, scrollY);
  }, [activeTab, saveScrollPosition]);

  // Restore scroll position for current tab
  const restoreScrollPosition = useCallback(() => {
    const position = getScrollPosition(activeTab);
    window.scrollTo(0, position);
  }, [activeTab, getScrollPosition]);

  // Handle scroll position saving automatically
  useEffect(() => {
    const handleScroll = () => {
      saveCurrentScrollPosition();
    };

    const handleBeforeUnload = () => {
      saveCurrentScrollPosition();
      saveNavigationState();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveCurrentScrollPosition, saveNavigationState]);

  // Breadcrumb generation
  const getBreadcrumbs = useCallback(() => {
    const breadcrumbs = [];
    const path = location.pathname;

    breadcrumbs.push({ label: '홈', path: '/dashboard' });

    if (path.startsWith('/quests')) {
      breadcrumbs.push({ label: '퀘스트', path: '/quests' });
    } else if (path.startsWith('/character')) {
      breadcrumbs.push({ label: '캐릭터', path: '/character' });
    } else if (path.startsWith('/goals')) {
      breadcrumbs.push({ label: '목표', path: '/goals' });
    }

    return breadcrumbs;
  }, [location.pathname]);

  // Tab configuration
  const tabs = [
    {
      id: 'dashboard',
      label: '대시보드',
      path: '/dashboard',
      icon: 'Home'
    },
    {
      id: 'quests',
      label: '퀘스트',
      path: '/quests',
      icon: 'Target'
    },
    {
      id: 'character',
      label: '캐릭터',
      path: '/character',
      icon: 'User'
    },
    {
      id: 'goals',
      label: '목표',
      path: '/goals',
      icon: 'Trophy'
    }
  ];

  // Check if tab has unsaved changes
  const hasUnsavedChanges = useCallback((tabId: string) => {
    const state = getPageState(tabId);
    return state?.hasUnsavedChanges || false;
  }, [getPageState]);

  // Mark tab as having unsaved changes
  const markTabAsModified = useCallback((tabId: string, modified: boolean = true) => {
    const currentState = getPageState(tabId);
    savePageState(tabId, {
      ...currentState,
      hasUnsavedChanges: modified,
      lastModified: new Date()
    });
  }, [getPageState, savePageState]);

  // Get tab by ID
  const getTab = useCallback((tabId: string) => {
    return tabs.find(tab => tab.id === tabId);
  }, []);

  // Check if we can navigate away from current tab
  const canNavigateAway = useCallback(() => {
    return !hasUnsavedChanges(activeTab);
  }, [activeTab, hasUnsavedChanges]);

  return {
    // Current state
    activeTab,
    previousTab,
    history,
    tabs,
    location,

    // Navigation actions
    navigateToTab,
    goBackToPreviousTab,
    navigateWithState,

    // History utilities
    getRecentHistory,
    getMostVisitedTabs,

    // Scroll management
    saveCurrentScrollPosition,
    restoreScrollPosition,
    getScrollPosition: (tabId: string) => getScrollPosition(tabId),
    saveScrollPosition,

    // Page state management
    savePageState,
    getPageState,
    hasUnsavedChanges,
    markTabAsModified,
    canNavigateAway,

    // Utilities
    getBreadcrumbs,
    getTab,
    clearHistory,

    // State persistence
    saveNavigationState,
    restoreNavigationState
  };
}