import { useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useAuthStore } from '@/stores/authStore';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { TodayQuests } from '@/components/dashboard/TodayQuests';
import { QuickComplete } from '@/components/dashboard/QuickComplete';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingOverlay, SkeletonCard } from '@/components/ui/spinner';
import { Plus, Target, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function Dashboard() {
  const { user } = useAuthStore();
  const {
    dashboardData,
    isLoading,
    error,
    loadDashboard,
    quickCompleteQuest
  } = useDashboardStore();

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user, loadDashboard]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <SkeletonCard className="h-20" />
        </div>
        <div className="mb-8">
          <SkeletonCard className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard className="h-64" />
            <SkeletonCard className="h-48" />
          </div>
          <div className="space-y-6">
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-48" />
            <SkeletonCard className="h-32" />
          </div>
        </div>
        <LoadingOverlay
          isLoading={true}
          text="대시보드 로딩 중..."
          className="absolute inset-0 bg-background/80"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => loadDashboard()}>다시 시도</Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Target className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">목표를 설정해주세요</h2>
          <p className="text-muted-foreground">첫 번째 목표를 설정하여 QuestLife를 시작해보세요!</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            목표 추가
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-3 sm:p-4 md:p-6 max-w-7xl mx-auto"
      role="main"
      aria-label="대시보드 페이지"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 md:mb-8"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold"
              tabIndex={0}
              aria-label="대시보드 메인 페이지"
            >
              대시보드
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              오늘의 진행 상황을 확인하고 퀘스트를 완료해보세요!
            </p>
          </div>
          <div
            className="text-left sm:text-right"
            role="status"
            aria-label={`현재 연속 달성 기록: ${dashboardData.streakCount}일`}
          >
            <div className="text-sm text-muted-foreground">연속 달성</div>
            <div className="flex items-center gap-1">
              <Zap
                className="h-4 w-4 text-orange-500"
                aria-hidden="true"
              />
              <span
                className="text-xl sm:text-2xl font-bold"
                aria-label={`${dashboardData.streakCount}일 연속 달성`}
              >
                {dashboardData.streakCount}일
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6 md:mb-8"
      >
        <DashboardStats stats={dashboardData.stats} />
      </motion.div>

      {/* Main Content Grid */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6"
        role="region"
        aria-label="대시보드 주요 콘텐츠"
      >
        {/* Left Column - Today's Quests */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 space-y-4 md:space-y-6"
          role="region"
          aria-label="오늘의 퀘스트 및 주간 진행률"
        >
          <TodayQuests
            quests={dashboardData.todayQuests}
            onQuickComplete={quickCompleteQuest}
          />

          {/* Weekly Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                주간 진행률
              </CardTitle>
              <CardDescription>
                이번 주 목표 달성률을 확인해보세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.weeklyProgress.map((progress, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{progress.name}</span>
                      <Badge variant="outline">
                        {progress.completed}/{progress.total}
                      </Badge>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(progress.completed / progress.total) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column - Quick Actions & Character */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-4 md:space-y-6"
        >
          <QuickComplete
            availableQuests={dashboardData.availableQuests}
            onQuickComplete={quickCompleteQuest}
          />

          {/* Active Character */}
          {dashboardData.activeCharacter && (
            <Card role="region" aria-label="활성 캐릭터 정보">
              <CardHeader>
                <CardTitle tabIndex={0}>
                  {dashboardData.activeCharacter.name}
                </CardTitle>
                <CardDescription>
                  레벨 {dashboardData.activeCharacter.level} • {dashboardData.activeCharacter.className}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {dashboardData.activeCharacter.description}
                </div>

                {/* XP Progress */}
                <div className="space-y-2" role="group" aria-label="경험치 진행도">
                  <div className="flex justify-between text-sm">
                    <span>경험치</span>
                    <span
                      aria-label={`현재 경험치 ${dashboardData.activeCharacter.currentXP}, 목표 경험치 ${dashboardData.activeCharacter.requiredXP}`}
                    >
                      {dashboardData.activeCharacter.currentXP} / {dashboardData.activeCharacter.requiredXP}
                    </span>
                  </div>
                  <div
                    className="w-full bg-secondary rounded-full h-2"
                    role="progressbar"
                    aria-valuenow={dashboardData.activeCharacter.currentXP}
                    aria-valuemin={0}
                    aria-valuemax={dashboardData.activeCharacter.requiredXP}
                    aria-label={`경험치 진행도: ${Math.round((dashboardData.activeCharacter.currentXP / dashboardData.activeCharacter.requiredXP) * 100)}%`}
                  >
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(dashboardData.activeCharacter.currentXP / dashboardData.activeCharacter.requiredXP) * 100}%`
                      }}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {/* Next Level Preview */}
                {dashboardData.activeCharacter.level < 30 && (
                  <div
                    className="text-xs text-muted-foreground border-t pt-3"
                    role="status"
                    aria-label={`다음 레벨까지 ${dashboardData.activeCharacter.requiredXP - dashboardData.activeCharacter.currentXP} 경험치 필요`}
                  >
                    레벨 {dashboardData.activeCharacter.level + 1}까지 {' '}
                    {dashboardData.activeCharacter.requiredXP - dashboardData.activeCharacter.currentXP} XP 남음
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card role="region" aria-label="빠른 통계 정보">
            <CardHeader>
              <CardTitle tabIndex={0}>빠른 통계</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between" role="group">
                <span className="text-sm text-muted-foreground">총 클래스</span>
                <span
                  className="font-medium"
                  aria-label={`총 ${dashboardData.stats.totalClasses}개의 클래스`}
                >
                  {dashboardData.stats.totalClasses}
                </span>
              </div>
              <div className="flex justify-between" role="group">
                <span className="text-sm text-muted-foreground">완료된 퀘스트</span>
                <span
                  className="font-medium"
                  aria-label={`총 ${dashboardData.stats.completedQuests}개의 퀘스트 완료`}
                >
                  {dashboardData.stats.completedQuests}
                </span>
              </div>
              <div className="flex justify-between" role="group">
                <span className="text-sm text-muted-foreground">총 경험치</span>
                <span
                  className="font-medium"
                  aria-label={`총 ${dashboardData.stats.totalXP} 경험치 획득`}
                >
                  {dashboardData.stats.totalXP}
                </span>
              </div>
              <div className="flex justify-between" role="group">
                <span className="text-sm text-muted-foreground">최고 연속</span>
                <span
                  className="font-medium"
                  aria-label={`최고 연속 달성 기록 ${dashboardData.stats.maxStreak}일`}
                >
                  {dashboardData.stats.maxStreak}일
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}