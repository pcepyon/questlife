import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import './lib/i18n';

// Components
import { TabNavigation } from '@/components/TabNavigation';
import { PrivateRoute } from '@/components/PrivateRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/spinner';

// Pages
import { PinLogin } from '@/pages/auth/PinLogin';
import { PinSetup } from '@/pages/auth/PinSetup';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { Quests } from '@/pages/quests/Quests';
import { Character } from '@/pages/character/Character';
import { Goals } from '@/pages/goals/Goals';

// 개발 모드 - 개발 완료 후 false로 변경
const DEV_MODE = true;

function App() {
  const { isAuthenticated, user, loading, initializeAuth, setToken, setUser } = useAuthStore();

  useEffect(() => {
    if (DEV_MODE) {
      // 개발 모드: 자동 로그인
      console.log('🔧 개발 모드 활성화 - PIN 우회');
      const devUser = {
        id: 'default-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          theme: 'light' as const,
          notifications: true,
          soundEffects: true
        },
        pinAttempts: 0,
        onboardingCompleted: true,
        preferredLanguage: 'ko' as const
      };
      setUser(devUser);
      setToken('dev-token');
    } else {
      initializeAuth();
    }
  }, [initializeAuth, setToken, setUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" className="text-primary mx-auto" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Authentication Routes */}
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <PinLogin />
            } />
            <Route path="/setup" element={
              !user ? <PinSetup /> : isAuthenticated ? <Navigate to="/dashboard" replace /> : <PinLogin />
            } />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route element={<TabNavigation />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/quests" element={<Quests />} />
                <Route path="/character" element={<Character />} />
                <Route path="/goals" element={<Goals />} />
              </Route>
            </Route>

            {/* Root redirect */}
            <Route path="/" element={
              !user ? <Navigate to="/setup" replace /> :
              !isAuthenticated ? <Navigate to="/login" replace /> :
              <Navigate to="/dashboard" replace />
            } />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;