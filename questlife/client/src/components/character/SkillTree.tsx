import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Lock, CheckCircle, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Skill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  xpCost: number;
  xpInvested: number;
  unlocked: boolean;
  category: 'core' | 'advanced' | 'mastery';
  prerequisites: string[];
  effects: {
    type: 'xp_bonus' | 'streak_bonus' | 'quest_efficiency' | 'special';
    value: number;
    description: string;
  }[];
}

interface CharacterClass {
  id: string;
  name: string;
  level: number;
  currentXP: number;
  availableSkillPoints: number;
}

interface SkillTreeProps {
  characterClass: CharacterClass;
}

export function SkillTree({ characterClass }: SkillTreeProps) {
  // Mock skill data - in a real app, this would come from the API
  const [skills, setSkills] = useState<Skill[]>([
    {
      id: 'core-foundation',
      name: '기초 체력',
      description: '기본적인 운동 능력을 향상시킵니다',
      level: 3,
      maxLevel: 5,
      xpCost: 100,
      xpInvested: 300,
      unlocked: true,
      category: 'core',
      prerequisites: [],
      effects: [
        { type: 'xp_bonus', value: 10, description: '운동 퀘스트 완료 시 10% 추가 XP' }
      ]
    },
    {
      id: 'core-endurance',
      name: '지구력 강화',
      description: '더 오랜 시간 운동할 수 있는 능력을 기릅니다',
      level: 2,
      maxLevel: 5,
      xpCost: 150,
      xpInvested: 300,
      unlocked: true,
      category: 'core',
      prerequisites: ['core-foundation'],
      effects: [
        { type: 'streak_bonus', value: 5, description: '연속 달성 시 5% 추가 보너스' }
      ]
    },
    {
      id: 'advanced-efficiency',
      name: '효율성 마스터',
      description: '퀘스트를 더 빠르고 효율적으로 완료합니다',
      level: 0,
      maxLevel: 3,
      xpCost: 200,
      xpInvested: 0,
      unlocked: true,
      category: 'advanced',
      prerequisites: ['core-endurance'],
      effects: [
        { type: 'quest_efficiency', value: 15, description: '퀘스트 완료 시간 15% 단축' }
      ]
    },
    {
      id: 'mastery-flow-state',
      name: '플로우 상태',
      description: '완전한 집중 상태에 도달하여 최고의 성과를 냅니다',
      level: 0,
      maxLevel: 1,
      xpCost: 500,
      xpInvested: 0,
      unlocked: false,
      category: 'mastery',
      prerequisites: ['advanced-efficiency'],
      effects: [
        { type: 'special', value: 50, description: '완벽한 하루 달성 시 50% 보너스 XP' }
      ]
    }
  ]);

  const handleSkillUpgrade = (skillId: string) => {
    setSkills(prev => prev.map(skill => {
      if (skill.id === skillId && skill.level < skill.maxLevel && characterClass.availableSkillPoints > 0) {
        return {
          ...skill,
          level: skill.level + 1,
          xpInvested: skill.xpInvested + skill.xpCost
        };
      }
      return skill;
    }));
  };

  const getCategoryColor = (category: Skill['category']) => {
    switch (category) {
      case 'core': return 'text-blue-500 bg-blue-500/10';
      case 'advanced': return 'text-purple-500 bg-purple-500/10';
      case 'mastery': return 'text-yellow-500 bg-yellow-500/10';
    }
  };

  const getCategoryLabel = (category: Skill['category']) => {
    switch (category) {
      case 'core': return '기초';
      case 'advanced': return '고급';
      case 'mastery': return '마스터리';
    }
  };

  const getEffectIcon = (type: Skill['effects'][0]['type']) => {
    switch (type) {
      case 'xp_bonus': return '⚡';
      case 'streak_bonus': return '🔥';
      case 'quest_efficiency': return '⚡';
      case 'special': return '⭐';
    }
  };

  const coreSkills = skills.filter(s => s.category === 'core');
  const advancedSkills = skills.filter(s => s.category === 'advanced');
  const masterySkills = skills.filter(s => s.category === 'mastery');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>{characterClass.name} 스킬 트리</CardTitle>
          <CardDescription>
            스킬 포인트를 투자하여 캐릭터의 능력을 향상시키세요
          </CardDescription>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">사용 가능한 스킬 포인트: {characterClass.availableSkillPoints}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              레벨 {characterClass.level} • {characterClass.currentXP} XP
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Core Skills */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">기초 스킬</h3>
          <Badge className="bg-blue-500/10 text-blue-500">Core</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coreSkills.map((skill, index) => (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className={`transition-all hover:shadow-md ${
                !skill.unlocked ? 'opacity-50' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {skill.unlocked ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                        {skill.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {skill.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={getCategoryColor(skill.category)}>
                      {getCategoryLabel(skill.category)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Level Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>레벨 {skill.level}/{skill.maxLevel}</span>
                      <span>{skill.xpInvested} XP 투자</span>
                    </div>
                    <Progress value={(skill.level / skill.maxLevel) * 100} className="h-2" />
                  </div>

                  {/* Effects */}
                  <div className="space-y-1">
                    {skill.effects.map((effect, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-base">{getEffectIcon(effect.type)}</span>
                        <span className="text-muted-foreground">{effect.description}</span>
                      </div>
                    ))}
                  </div>

                  {/* Upgrade Button */}
                  {skill.unlocked && skill.level < skill.maxLevel && (
                    <Button
                      size="sm"
                      onClick={() => handleSkillUpgrade(skill.id)}
                      disabled={characterClass.availableSkillPoints === 0}
                      className="w-full"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      업그레이드 ({skill.xpCost} XP)
                    </Button>
                  )}

                  {skill.level === skill.maxLevel && (
                    <Badge className="w-full justify-center bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      마스터 완료
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Advanced Skills */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">고급 스킬</h3>
          <Badge className="bg-purple-500/10 text-purple-500">Advanced</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {advancedSkills.map((skill, index) => (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: (coreSkills.length + index) * 0.1 }}
            >
              <Card className={`transition-all hover:shadow-md ${
                !skill.unlocked ? 'opacity-50' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {skill.unlocked ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                        {skill.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {skill.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={getCategoryColor(skill.category)}>
                      {getCategoryLabel(skill.category)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Prerequisites */}
                  {skill.prerequisites.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      필요: {skill.prerequisites.map(prereq => {
                        const prereqSkill = skills.find(s => s.id === prereq);
                        return prereqSkill?.name;
                      }).join(', ')}
                    </div>
                  )}

                  {/* Level Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>레벨 {skill.level}/{skill.maxLevel}</span>
                      <span>{skill.xpInvested} XP 투자</span>
                    </div>
                    <Progress value={(skill.level / skill.maxLevel) * 100} className="h-2" />
                  </div>

                  {/* Effects */}
                  <div className="space-y-1">
                    {skill.effects.map((effect, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-base">{getEffectIcon(effect.type)}</span>
                        <span className="text-muted-foreground">{effect.description}</span>
                      </div>
                    ))}
                  </div>

                  {/* Upgrade Button */}
                  {skill.unlocked && skill.level < skill.maxLevel && (
                    <Button
                      size="sm"
                      onClick={() => handleSkillUpgrade(skill.id)}
                      disabled={characterClass.availableSkillPoints === 0}
                      className="w-full"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      업그레이드 ({skill.xpCost} XP)
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mastery Skills */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">마스터리 스킬</h3>
          <Badge className="bg-yellow-500/10 text-yellow-500">Mastery</Badge>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {masterySkills.map((skill, index) => (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: (coreSkills.length + advancedSkills.length + index) * 0.1 }}
            >
              <Card className={`transition-all hover:shadow-md border-2 ${
                skill.unlocked ? 'border-yellow-500/20' : 'border-dashed opacity-50'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {skill.unlocked ? (
                          skill.level > 0 ? (
                            <Star className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                        {skill.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {skill.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={getCategoryColor(skill.category)}>
                      {getCategoryLabel(skill.category)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Prerequisites */}
                  {skill.prerequisites.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      필요: {skill.prerequisites.map(prereq => {
                        const prereqSkill = skills.find(s => s.id === prereq);
                        return prereqSkill?.name;
                      }).join(', ')}
                    </div>
                  )}

                  {/* Effects */}
                  <div className="space-y-1">
                    {skill.effects.map((effect, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-base">{getEffectIcon(effect.type)}</span>
                        <span className="text-muted-foreground">{effect.description}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mastery Upgrade */}
                  {skill.unlocked && skill.level === 0 && (
                    <Button
                      size="sm"
                      onClick={() => handleSkillUpgrade(skill.id)}
                      disabled={characterClass.availableSkillPoints === 0}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      마스터리 달성 ({skill.xpCost} XP)
                    </Button>
                  )}

                  {skill.level > 0 && (
                    <Badge className="w-full justify-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      마스터리 달성
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}