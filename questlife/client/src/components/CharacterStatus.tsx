import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sword, Brain, Sparkles, Target, Users } from 'lucide-react';
import type { CharacterStatus as CharacterStatusType } from '@shared/types';

interface CharacterStatusProps {
  status: CharacterStatusType;
  streak?: {
    current: number;
    longest: number;
    multiplier: number;
  };
}

const attributeIcons = {
  strength: Sword,
  wisdom: Brain,
  creativity: Sparkles,
  discipline: Target,
  charisma: Users
};

export function CharacterStatus({ status, streak }: CharacterStatusProps) {
  const { t, i18n } = useTranslation(['common', 'classes']);
  const isKorean = i18n.language === 'ko';

  const attributes = [
    { name: t('stats.strength', { ns: 'common' }), value: status.strength, key: 'strength' },
    { name: t('stats.wisdom', { ns: 'common' }), value: status.wisdom, key: 'wisdom' },
    { name: t('stats.creativity', { ns: 'common' }), value: status.creativity, key: 'creativity' },
    { name: t('attributes.discipline', { ns: 'classes' }), value: status.discipline, key: 'discipline' },
    { name: t('stats.charm', { ns: 'common' }), value: status.charisma, key: 'charisma' }
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('sections.characterStatus', { ns: 'common' })}</span>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {t('stats.combatPower', { ns: 'common' })}: {status.totalPowerLevel}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Attributes */}
        <div className="space-y-3">
          {attributes.map(attr => {
            const Icon = attributeIcons[attr.key as keyof typeof attributeIcons];
            const percentage = (attr.value / 100) * 100; // Assuming max 100
            
            return (
              <div key={attr.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{attr.name}</span>
                  </div>
                  <span className="font-bold">{attr.value}</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
        
        {/* Streak Info */}
        {streak && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{streak.current}</div>
                <div className="text-xs text-muted-foreground">{t('stats.currentStreak', { ns: 'common' })}</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{streak.longest}</div>
                <div className="text-xs text-muted-foreground">{t('stats.bestStreak', { ns: 'common' })}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">{streak.multiplier}x</div>
                <div className="text-xs text-muted-foreground">{t('stats.xpMultiplier', { ns: 'common' })}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats */}
        <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{t('labels.mainClass', { ns: 'classes' })}:</span>
            <span className="ml-2 font-bold">{status.masteredClassCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('messages.allQuestsCompleted', { ns: 'quests' })}:</span>
            <span className="ml-2 font-bold">{status.totalQuestsCompleted}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}