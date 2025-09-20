import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useNavigationStore } from '@/stores/navigationStore';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Home,
  Target,
  User,
  Trophy,
  Settings
} from 'lucide-react';

const tabs = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: '대시보드',
    icon: Home,
    description: '일일 퀘스트와 진행 상황'
  },
  {
    id: 'quests',
    path: '/quests',
    label: '퀘스트',
    icon: Target,
    description: '모든 퀘스트 관리'
  },
  {
    id: 'character',
    path: '/character',
    label: '캐릭터',
    icon: User,
    description: '캐릭터 성장과 스킬'
  },
  {
    id: 'goals',
    path: '/goals',
    label: '목표',
    icon: Trophy,
    description: '목표 설정과 추적'
  }
];

export function TabNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeTab, setActiveTab, saveNavigationState } = useNavigationStore();

  // Update active tab based on current location
  useEffect(() => {
    const currentTab = tabs.find(tab => location.pathname.startsWith(tab.path));
    if (currentTab && currentTab.id !== activeTab) {
      setActiveTab(currentTab.id);
    }
  }, [location.pathname, activeTab, setActiveTab]);

  // Save navigation state when tab changes
  useEffect(() => {
    if (activeTab) {
      saveNavigationState();
    }
  }, [activeTab, saveNavigationState]);

  const handleTabClick = (tab: typeof tabs[0]) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <div className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "flex-1 py-3 px-2 text-center transition-colors",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 mx-auto mb-1" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Side Navigation for Desktop */}
      <div className="hidden md:block fixed left-0 top-0 h-full w-64 bg-background border-r border-border">
        <div className="p-6">
          {/* App Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-primary">QuestLife</h1>
            <p className="text-sm text-muted-foreground">인생을 게임처럼</p>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <div className="flex-1">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs opacity-70">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Settings at Bottom */}
          <div className="absolute bottom-6 left-6 right-6">
            <button className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Settings className="h-5 w-5" />
              <div>
                <div className="font-medium">설정</div>
                <div className="text-xs opacity-70">앱 설정 및 환경</div>
              </div>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}