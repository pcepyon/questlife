// Navigation state interfaces for QuestLife 2.0

export type TabName = 'dashboard' | 'quests' | 'character' | 'goals';

export interface NavigationState {
  id: string;
  userId: string;
  currentTab: TabName;
  tabHistory: TabName[];
  lastVisitedPages: Record<TabName, string>;
  preferences: NavigationPreferences;
  updatedAt: Date;
}

export interface NavigationPreferences {
  defaultTab?: TabName;
  showTabLabels?: boolean;
  animateTransitions?: boolean;
  swipeEnabled?: boolean;
}

export interface TabConfig {
  id: TabName;
  label: string;
  icon: string;
  path: string;
  requiresAuth: boolean;
  badge?: number;
}

export interface NavigationUpdateRequest {
  currentTab?: TabName;
  addToHistory?: boolean;
  preferences?: Partial<NavigationPreferences>;
}

export interface NavigationUpdateResponse {
  success: boolean;
  navigationState: NavigationState;
  message?: string;
}

export interface BreadcrumbItem {
  label: string;
  path: string;
  active?: boolean;
}

export interface NavigationContext {
  navigationState: NavigationState | null;
  currentTab: TabName;
  tabHistory: TabName[];
  setCurrentTab: (tab: TabName) => void;
  navigateToTab: (tab: TabName) => Promise<void>;
  goBack: () => void;
  updatePreferences: (prefs: Partial<NavigationPreferences>) => Promise<void>;
  isLoading: boolean;
}