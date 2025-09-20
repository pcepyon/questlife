import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Zap, Clock, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompletedQuest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  xpReward: number;
  completedAt: Date;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  timeSpent?: number; // in minutes
}

interface QuestHistoryProps {
  completedQuests: CompletedQuest[];
}

export function QuestHistory({ completedQuests }: QuestHistoryProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [selectedType, setSelectedType] = useState<'all' | 'daily' | 'weekly' | 'special'>('all');

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filteredQuests = completedQuests.filter(quest => {
    // Period filter
    let passesTimeFilter = true;
    if (selectedPeriod === 'week') {
      passesTimeFilter = quest.completedAt >= weekAgo;
    } else if (selectedPeriod === 'month') {
      passesTimeFilter = quest.completedAt >= monthAgo;
    }

    // Type filter
    const passesTypeFilter = selectedType === 'all' || quest.type === selectedType;

    return passesTimeFilter && passesTypeFilter;
  });

  const getDifficultyColor = (difficulty: CompletedQuest['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'hard': return 'text-red-500 bg-red-500/10';
    }
  };

  const getTypeColor = (type: CompletedQuest['type']) => {
    switch (type) {
      case 'daily': return 'bg-blue-500/10 text-blue-500';
      case 'weekly': return 'bg-purple-500/10 text-purple-500';
      case 'special': return 'bg-yellow-500/10 text-yellow-600';
    }
  };

  const totalXPEarned = filteredQuests.reduce((sum, quest) => sum + quest.xpReward, 0);
  const averageTimeSpent = filteredQuests.filter(q => q.timeSpent).length > 0
    ? Math.round(filteredQuests.reduce((sum, quest) => sum + (quest.timeSpent || 0), 0) / filteredQuests.filter(q => q.timeSpent).length)
    : 0;

  // Group quests by date
  const questsByDate = filteredQuests.reduce((groups, quest) => {
    const dateKey = quest.completedAt.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(quest);
    return groups;
  }, {} as Record<string, CompletedQuest[]>);

  const sortedDates = Object.keys(questsByDate).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            필터
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">기간</div>
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('week')}
              >
                최근 1주일
              </Button>
              <Button
                variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('month')}
              >
                최근 1개월
              </Button>
              <Button
                variant={selectedPeriod === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('all')}
              >
                전체
              </Button>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">유형</div>
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
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{filteredQuests.length}</div>
                <div className="text-xs text-muted-foreground">완료한 퀘스트</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{totalXPEarned.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">획득한 경험치</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{averageTimeSpent}분</div>
                <div className="text-xs text-muted-foreground">평균 소요 시간</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quest History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            완료 기록
          </CardTitle>
          <CardDescription>
            최근 완료한 퀘스트들을 날짜별로 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredQuests.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">완료한 퀘스트가 없습니다</h3>
              <p className="text-sm text-muted-foreground">
                선택한 기간에 완료한 퀘스트가 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateKey, index) => {
                const date = new Date(dateKey);
                const questsForDate = questsByDate[dateKey];
                const dayXP = questsForDate.reduce((sum, quest) => sum + quest.xpReward, 0);

                return (
                  <motion.div
                    key={dateKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        {date.toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long'
                        })}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{questsForDate.length}개 완료</Badge>
                        <Badge className="bg-primary/10 text-primary">
                          {dayXP} XP 획득
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {questsForDate.map((quest) => (
                        <div
                          key={quest.id}
                          className="p-3 rounded-lg border bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{quest.title}</h4>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getTypeColor(quest.type)}`}
                                >
                                  {quest.type}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {quest.description}
                              </p>
                              <div className="flex items-center gap-2 text-xs">
                                <div className="flex items-center gap-1 text-primary">
                                  <Zap className="h-3 w-3" />
                                  <span>{quest.xpReward} XP</span>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={getDifficultyColor(quest.difficulty)}
                                >
                                  {quest.difficulty}
                                </Badge>
                                {quest.timeSpent && (
                                  <div className="text-muted-foreground">
                                    {quest.timeSpent}분 소요
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {quest.completedAt.toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}