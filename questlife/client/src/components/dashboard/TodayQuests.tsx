import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Zap, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  xpReward: number;
  status: 'available' | 'in_progress' | 'completed';
  progress?: number;
  maxProgress?: number;
  timeLeft?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface TodayQuestsProps {
  quests: Quest[];
  onQuickComplete: (questId: string) => Promise<void>;
}

export function TodayQuests({ quests, onQuickComplete }: TodayQuestsProps) {
  const [completingQuests, setCompletingQuests] = useState<Set<string>>(new Set());

  const todayQuests = quests.filter(q => q.type === 'daily');
  const completedToday = todayQuests.filter(q => q.status === 'completed').length;
  const totalToday = todayQuests.length;

  const handleQuickComplete = async (questId: string) => {
    setCompletingQuests(prev => new Set(prev).add(questId));
    try {
      await onQuickComplete(questId);
    } catch (error) {
      console.error('Failed to complete quest:', error);
    } finally {
      setCompletingQuests(prev => {
        const updated = new Set(prev);
        updated.delete(questId);
        return updated;
      });
    }
  };

  const getDifficultyColor = (difficulty: Quest['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'hard': return 'text-red-500 bg-red-500/10';
    }
  };

  const getDifficultyLabel = (difficulty: Quest['difficulty']) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              오늘의 퀘스트
            </CardTitle>
            <CardDescription>
              일일 목표를 완료하여 경험치를 획득하세요
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{completedToday}/{totalToday}</div>
            <div className="text-xs text-muted-foreground">완료</div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>일일 진행률</span>
            <span>{totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0}%</span>
          </div>
          <Progress
            value={totalToday > 0 ? (completedToday / totalToday) * 100 : 0}
            className="h-2"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {todayQuests.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">오늘의 퀘스트가 없습니다</h3>
            <p className="text-sm text-muted-foreground">
              새로운 퀘스트가 곧 생성될 예정입니다!
            </p>
          </div>
        ) : (
          todayQuests.map((quest, index) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`p-4 rounded-lg border transition-all ${
                quest.status === 'completed'
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                  : 'bg-card hover:bg-accent/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={`font-medium ${
                      quest.status === 'completed' ? 'line-through text-muted-foreground' : ''
                    }`}>
                      {quest.title}
                    </h4>
                    <Badge
                      variant="outline"
                      className={getDifficultyColor(quest.difficulty)}
                    >
                      {getDifficultyLabel(quest.difficulty)}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {quest.description}
                  </p>

                  {/* Quest Progress */}
                  {quest.progress !== undefined && quest.maxProgress && (
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-xs">
                        <span>진행률</span>
                        <span>{quest.progress}/{quest.maxProgress}</span>
                      </div>
                      <Progress
                        value={(quest.progress / quest.maxProgress) * 100}
                        className="h-1"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 text-primary">
                      <Zap className="h-3 w-3" />
                      <span>{quest.xpReward} XP</span>
                    </div>
                    {quest.timeLeft && (
                      <div className="text-muted-foreground">
                        • {quest.timeLeft} 남음
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {quest.status === 'completed' ? (
                    <div className="flex items-center gap-1 text-green-500">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">완료</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleQuickComplete(quest.id)}
                      disabled={completingQuests.has(quest.id)}
                      className="min-w-[60px]"
                    >
                      {completingQuests.has(quest.id) ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        '완료'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}

        {/* Daily Summary */}
        {totalToday > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">오늘 획득 가능한 총 XP</span>
              <span className="font-bold text-primary">
                {todayQuests.reduce((sum, quest) =>
                  quest.status === 'completed' ? sum + quest.xpReward : sum, 0
                )} / {todayQuests.reduce((sum, quest) => sum + quest.xpReward, 0)} XP
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}