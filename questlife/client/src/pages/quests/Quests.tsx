import { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/game.store';
import { useAuthStore } from '@/stores/authStore';
import { QuestCard } from '@/components/QuestCard';
import { QuestHistory } from '@/components/quests/QuestHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Calendar, Trophy, Plus, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export function Quests() {
  const { user } = useAuthStore();
  const {
    quests,
    activeClass,
    classes,
    setActiveClass,
    setQuests,
    isLoading,
    setLoading
  } = useGameStore();

  const [selectedType, setSelectedType] = useState<'all' | 'daily' | 'weekly' | 'special'>('all');

  useEffect(() => {
    // Load quests for active class
    if (activeClass && user) {
      setLoading(true);
      // In a real app, you'd call the API here
      // api.getQuests(activeClass.id).then(setQuests).finally(() => setLoading(false));
      setLoading(false);
    }
  }, [activeClass, user, setLoading]);

  const filteredQuests = quests.filter(quest => {
    if (selectedType === 'all') return true;
    return quest.type === selectedType;
  });

  const activeQuests = filteredQuests.filter(q => q.status !== 'completed');
  const completedTodayQuests = quests.filter(q =>
    q.status === 'completed' &&
    new Date(q.completedAt || '').toDateString() === new Date().toDateString()
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">퀘스트 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!activeClass) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <Target className="h-16 w-16 text-muted-foreground mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-2">클래스를 선택해주세요</h2>
            <p className="text-muted-foreground">퀘스트를 보려면 먼저 활성화할 클래스를 선택해야 합니다.</p>
          </div>

          {classes.length > 0 ? (
            <div className="space-y-3 max-w-md mx-auto">
              <h3 className="font-semibold">사용 가능한 클래스:</h3>
              {classes.map(cls => (
                <Button
                  key={cls.id}
                  onClick={() => setActiveClass(cls.id)}
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span>{cls.name}</span>
                  <Badge>레벨 {cls.level}</Badge>
                </Button>
              ))}
            </div>
          ) : (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              첫 번째 클래스 만들기
            </Button>
          )}
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
            <h1 className="text-3xl font-bold">퀘스트</h1>
            <p className="text-muted-foreground">
              {activeClass.name} 클래스의 퀘스트를 관리하세요
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              필터
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              퀘스트 추가
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
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
                <div className="text-2xl font-bold">{activeQuests.length}</div>
                <div className="text-xs text-muted-foreground">활성 퀘스트</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{completedTodayQuests.length}</div>
                <div className="text-xs text-muted-foreground">오늘 완료</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  {quests.filter(q => q.status === 'completed').length}
                </div>
                <div className="text-xs text-muted-foreground">총 완료</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-primary rounded-full" />
              <div>
                <div className="text-2xl font-bold">
                  {quests.filter(q => q.type === 'daily').length}
                </div>
                <div className="text-xs text-muted-foreground">데일리 퀘스트</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">활성 퀘스트</TabsTrigger>
            <TabsTrigger value="completed">완료된 퀘스트</TabsTrigger>
            <TabsTrigger value="history">히스토리</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('all')}
              >
                전체
              </Button>
              <Button
                variant={selectedType === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('daily')}
              >
                데일리
              </Button>
              <Button
                variant={selectedType === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('weekly')}
              >
                위클리
              </Button>
              <Button
                variant={selectedType === 'special' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('special')}
              >
                스페셜
              </Button>
            </div>

            {/* Active Quests */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeQuests.length > 0 ? (
                activeQuests.map(quest => (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <QuestCard
                      quest={quest}
                      onComplete={async (questId) => {
                        // Handle quest completion
                        console.log('Complete quest:', questId);
                      }}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">활성 퀘스트가 없습니다</h3>
                  <p className="text-muted-foreground mb-4">새로운 퀘스트를 추가해보세요!</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    퀘스트 추가
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quests.filter(q => q.status === 'completed').map(quest => (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <QuestCard quest={quest} onComplete={() => {}} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <QuestHistory
              completedQuests={quests.filter(q => q.status === 'completed')}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}