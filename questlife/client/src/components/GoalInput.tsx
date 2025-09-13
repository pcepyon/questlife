import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wand2, Target } from 'lucide-react';
import { useGameStore } from '@/stores/game.store';
import { api } from '@/services/api';

export function GoalInput() {
  const { t, i18n } = useTranslation(['common', 'errors']);
  const isKorean = i18n.language === 'ko';
  const [goalText, setGoalText] = useState('');
  const [targetLevel, setTargetLevel] = useState('20');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { user, addClass, setQuests, setActiveClass } = useGameStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !goalText.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await api.analyzeGoal(
        user.id,
        goalText,
        parseInt(targetLevel)
      );
      
      // Check if we got a valid response
      if (result && result.class) {
        // Add the new class
        addClass(result.class);
        setActiveClass(result.class.id);
        setQuests(result.quests || []);
        
        // Clear form
        setGoalText('');
        setTargetLevel('20');
      } else {
        console.error('Invalid response from goal analysis');
        alert(t('game.questNotFound', { ns: 'errors' }));
      }
    } catch (error) {
      console.error('Failed to analyze goal:', error);
      alert(t('network.connectionError', { ns: 'errors' }));
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          {isKorean ? '퀘스트 생성' : 'Create Your Quest'}
        </CardTitle>
        <CardDescription>
          {isKorean ? '목표를 서사적인 RPG 모험으로 변환합니다. AI가 당신만을 위한 캐릭터 클래스를 만들어줍니다.' : 'Transform your goal into an epic RPG adventure. Our AI will create a custom character class just for you.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal">{t('forms.goal', { ns: 'common' })}</Label>
            <Input
              id="goal"
              placeholder={t('forms.enterGoal', { ns: 'common' })}
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              disabled={isAnalyzing}
              className="h-12"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="level" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              {isKorean ? '목표 레벨 (1-30)' : 'Target Level (1-30)'}
            </Label>
            <Input
              id="level"
              type="number"
              min="1"
              max="30"
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value)}
              disabled={isAnalyzing}
            />
            <p className="text-xs text-muted-foreground">
              {isKorean ? '높은 레벨 = 큰 목표. Level 10 = 1개월, Level 20 = 2개월, Level 30 = 3개월' : 'Higher levels = bigger goals. Level 10 = 1 month, Level 20 = 2 months, Level 30 = 3 months'}
            </p>
          </div>
          
          <Button
            type="submit"
            disabled={!goalText.trim() || isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                {isKorean ? '모험을 생성하는 중...' : 'Creating Your Adventure...'}
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                {isKorean ? '퀘스트 시작' : 'Begin Your Quest'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}