import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Target, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickQuest {
  id: string;
  title: string;
  xpReward: number;
  type: 'daily' | 'weekly' | 'special';
  estimatedTime: string;
  category: string;
}

interface QuickCompleteProps {
  availableQuests: QuickQuest[];
  onQuickComplete: (questId: string) => Promise<void>;
}

export function QuickComplete({ availableQuests, onQuickComplete }: QuickCompleteProps) {
  const [completingQuests, setCompletingQuests] = useState<Set<string>>(new Set());
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(new Set());

  const handleQuickComplete = async (questId: string) => {
    setCompletingQuests(prev => new Set(prev).add(questId));
    try {
      await onQuickComplete(questId);
      setCompletedQuests(prev => new Set(prev).add(questId));
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

  const getTypeColor = (type: QuickQuest['type']) => {
    switch (type) {
      case 'daily': return 'bg-blue-500/10 text-blue-500';
      case 'weekly': return 'bg-purple-500/10 text-purple-500';
      case 'special': return 'bg-yellow-500/10 text-yellow-500';
    }
  };

  const getTypeLabel = (type: QuickQuest['type']) => {
    switch (type) {
      case 'daily': return '데일리';
      case 'weekly': return '위클리';
      case 'special': return '스페셜';
    }
  };

  const activeQuests = availableQuests.filter(q => !completedQuests.has(q.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          빠른 완료
        </CardTitle>
        <CardDescription>
          간단한 퀘스트를 빠르게 완료하여 XP를 획득하세요
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {activeQuests.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">모든 퀘스트 완료!</h3>
            <p className="text-sm text-muted-foreground">
              새로운 퀘스트가 곧 추가될 예정입니다.
            </p>
          </div>
        ) : (
          activeQuests.slice(0, 5).map((quest, index) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-sm truncate">{quest.title}</h4>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getTypeColor(quest.type)}`}
                    >
                      {getTypeLabel(quest.type)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-primary" />
                      <span>{quest.xpReward} XP</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{quest.estimatedTime}</span>
                    </div>
                  </div>

                  <div className="mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {quest.category}
                    </Badge>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleQuickComplete(quest.id)}
                  disabled={completingQuests.has(quest.id)}
                  className="shrink-0"
                >
                  {completingQuests.has(quest.id) ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    '완료'
                  )}
                </Button>
              </div>
            </motion.div>
          ))
        )}

        {/* Quick Stats */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">
                {availableQuests.reduce((sum, quest) => sum + quest.xpReward, 0)}
              </div>
              <div className="text-xs text-muted-foreground">총 획득 가능 XP</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-500">
                {completedQuests.size}
              </div>
              <div className="text-xs text-muted-foreground">완료한 퀘스트</div>
            </div>
          </div>
        </div>

        {/* Show more quests button */}
        {availableQuests.length > 5 && (
          <Button variant="outline" className="w-full" size="sm">
            더 많은 퀘스트 보기 (+{availableQuests.length - 5}개)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}