import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/game.store';
import { useAuthStore } from '@/stores/authStore';
import { GoalInput } from '@/components/GoalInput';
import { GoalForm } from '@/components/goals/GoalForm';
import { MilestoneTracker } from '@/components/goals/MilestoneTracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trophy, Target, Plus, Edit, Trash2, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  targetDate?: Date;
  progress: number;
  milestones: {
    id: string;
    title: string;
    completed: boolean;
    completedAt?: Date;
  }[];
  classId?: string;
  className?: string;
}

export function Goals() {
  const { user } = useAuthStore();
  const { classes } = useGameStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);

  useEffect(() => {
    // Load goals from API
    const loadGoals = async () => {
      setIsLoading(true);
      try {
        // In a real app, you'd call the API here
        // const goalsData = await api.getGoals();
        // setGoals(goalsData);

        // Mock data for now
        setGoals([
          {
            id: '1',
            title: '매일 운동하기',
            description: '건강한 생활을 위해 매일 30분 이상 운동하기',
            status: 'active',
            createdAt: new Date('2024-01-01'),
            targetDate: new Date('2024-12-31'),
            progress: 45,
            milestones: [
              { id: '1', title: '첫 주 완료', completed: true, completedAt: new Date('2024-01-07') },
              { id: '2', title: '한 달 연속', completed: true, completedAt: new Date('2024-01-31') },
              { id: '3', title: '3개월 연속', completed: false },
              { id: '4', title: '6개월 연속', completed: false },
            ],
            classId: 'class-1',
            className: '피트니스 마스터'
          },
          {
            id: '2',
            title: '책 읽기',
            description: '한 달에 최소 2권의 책 읽기',
            status: 'active',
            createdAt: new Date('2024-02-01'),
            progress: 75,
            milestones: [
              { id: '1', title: '첫 번째 책 완독', completed: true },
              { id: '2', title: '두 번째 책 완독', completed: true },
              { id: '3', title: '세 번째 책 완독', completed: false },
            ],
            classId: 'class-2',
            className: '독서가'
          }
        ]);
      } catch (error) {
        console.error('Failed to load goals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadGoals();
    }
  }, [user]);

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const pausedGoals = goals.filter(g => g.status === 'paused');

  const handleCreateGoal = async (goalData: any) => {
    // In a real app, you'd call the API here
    console.log('Creating goal:', goalData);
    setIsGoalFormOpen(false);
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...updates } : g));
  };

  const handleDeleteGoal = async (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">목표 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">목표 관리</h1>
            <p className="text-muted-foreground">
              목표를 설정하고 진행 상황을 추적하세요
            </p>
          </div>
          <Dialog open={isGoalFormOpen} onOpenChange={setIsGoalFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                새 목표 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>새 목표 설정</DialogTitle>
                <DialogDescription>
                  새로운 목표를 설정하고 클래스를 생성해보세요
                </DialogDescription>
              </DialogHeader>
              <GoalForm onSubmit={handleCreateGoal} />
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{activeGoals.length}</div>
                <div className="text-xs text-muted-foreground">활성 목표</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{completedGoals.length}</div>
                <div className="text-xs text-muted-foreground">완료된 목표</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{pausedGoals.length}</div>
                <div className="text-xs text-muted-foreground">일시정지</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{classes.length}</div>
                <div className="text-xs text-muted-foreground">생성된 클래스</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      {goals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center py-12"
        >
          <Target className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">첫 번째 목표를 설정해보세요!</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            목표를 설정하면 AI가 분석하여 맞춤형 클래스와 퀘스트를 생성해드립니다.
          </p>
          <div className="max-w-2xl mx-auto">
            <GoalInput />
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">
                활성 목표 ({activeGoals.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                완료된 목표 ({completedGoals.length})
              </TabsTrigger>
              <TabsTrigger value="paused">
                일시정지 ({pausedGoals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeGoals.map((goal, index) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              {goal.title}
                              {goal.className && (
                                <Badge variant="outline" className="text-xs">
                                  {goal.className}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {goal.description}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedGoal(goal)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGoal(goal.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>진행률</span>
                            <span>{goal.progress}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Target Date */}
                        {goal.targetDate && (
                          <div className="text-sm text-muted-foreground">
                            목표 날짜: {goal.targetDate.toLocaleDateString('ko-KR')}
                          </div>
                        )}

                        {/* Milestones Preview */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">마일스톤</div>
                          <div className="space-y-1">
                            {goal.milestones.slice(0, 3).map(milestone => (
                              <div
                                key={milestone.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <CheckCircle
                                  className={`h-4 w-4 ${
                                    milestone.completed
                                      ? 'text-green-500'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                                <span
                                  className={milestone.completed ? 'line-through' : ''}
                                >
                                  {milestone.title}
                                </span>
                              </div>
                            ))}
                            {goal.milestones.length > 3 && (
                              <div className="text-xs text-muted-foreground pl-6">
                                +{goal.milestones.length - 3}개 더
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setSelectedGoal(goal)}
                        >
                          자세히 보기
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {activeGoals.length === 0 && (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">활성 목표가 없습니다</h3>
                  <p className="text-muted-foreground mb-4">
                    새로운 목표를 추가해보세요!
                  </p>
                  <Button onClick={() => setIsGoalFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    목표 추가
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {completedGoals.map((goal, index) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="opacity-75">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          {goal.title}
                        </CardTitle>
                        <CardDescription>{goal.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Badge className="bg-green-500">완료됨</Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="paused" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pausedGoals.map((goal, index) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="opacity-75">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-yellow-500" />
                          {goal.title}
                        </CardTitle>
                        <CardDescription>{goal.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="secondary">일시정지</Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}

      {/* Goal Detail Dialog */}
      {selectedGoal && (
        <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedGoal.title}</DialogTitle>
              <DialogDescription>{selectedGoal.description}</DialogDescription>
            </DialogHeader>
            <MilestoneTracker
              goal={selectedGoal}
              onUpdateGoal={(updates) => handleUpdateGoal(selectedGoal.id, updates)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}