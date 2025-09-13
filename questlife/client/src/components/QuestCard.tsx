import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, Trophy } from 'lucide-react';
import type { Quest } from '@shared/types';

interface QuestCardProps {
  quest: Quest;
  onComplete: (questId: string) => void;
  isCompleting?: boolean;
}

export function QuestCard({ quest, onComplete, isCompleting }: QuestCardProps) {
  const { t, i18n } = useTranslation(['quests', 'common']);
  const isCompleted = quest.status === 'completed';
  const isExpired = quest.status === 'expired';
  const isKorean = i18n.language === 'ko';
  
  const getTypeColor = (type: Quest['type']) => {
    switch (type) {
      case 'daily': return 'bg-blue-100 text-blue-700';
      case 'weekly': return 'bg-purple-100 text-purple-700';
      case 'monthly': return 'bg-green-100 text-green-700';
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'special': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeBadgeText = (type: Quest['type']) => {
    if (isKorean) {
      const typeTranslations: Record<string, string> = {
        'daily': '일일',
        'weekly': '주간',
        'monthly': '월간',
        'urgent': '긴급',
        'special': '특별'
      };
      return typeTranslations[type] || type;
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  const handleComplete = () => {
    if (!isCompleted && !isExpired) {
      onComplete(quest.id);
    }
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return isKorean ? `${hours}시간 ${minutes}분` : `${hours}h ${minutes}m`;
    }
    return isKorean ? `${minutes}분` : `${minutes}m`;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: isCompleted ? 1 : 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className={`transition-all ${isCompleted ? 'opacity-60' : ''} ${isExpired ? 'opacity-40' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{quest.title}</CardTitle>
              <div className="flex gap-2">
                <Badge className={getTypeColor(quest.type)}>
                  {getTypeBadgeText(quest.type)}
                </Badge>
                <Badge variant="default">
                  {t('labels.difficulty', { ns: 'quests' })} {quest.difficulty}
                </Badge>
              </div>
              {/* Difficulty stars */}
              <div className="flex gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    data-testid="difficulty-star"
                    className={`${
                      star <= quest.difficulty
                        ? 'text-yellow-500'
                        : 'text-gray-300'
                    }`}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        star <= quest.difficulty
                          ? 'fill-yellow-500'
                          : ''
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <Trophy className="h-4 w-4" />
              <span className="font-bold">{quest.xpReward} XP</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <CardDescription>{quest.description}</CardDescription>
          
          {quest.expiresAt && (
            <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{t('labels.timeRemaining', { ns: 'quests' })}: {formatTimeRemaining(quest.expiresAt)}</span>
            </div>
          )}
          
          {quest.timeLimit && (
            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{t('labels.timeLimit', { ns: 'quests' })}: {quest.timeLimit / 60} {t('time.minutes', { ns: 'common' })}</span>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button
            onClick={handleComplete}
            disabled={isCompleted || isExpired || isCompleting}
            className="w-full"
            variant={isCompleted ? 'secondary' : 'default'}
          >
            {isCompleted ? (
              t('status.completed', { ns: 'quests' })
            ) : isExpired ? (
              t('status.expired', { ns: 'quests' })
            ) : isCompleting ? (
              t('status.processing', { ns: 'common' })
            ) : (
              t('actions.complete', { ns: 'quests' })
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}