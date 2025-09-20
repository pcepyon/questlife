import { useGameStore } from '@/stores/game.store';
import { CharacterStatus } from '@/components/CharacterStatus';
import { XPBar } from '@/components/XPBar';
import { SkillTree } from '@/components/character/SkillTree';
import { ClassEvolutionComponent } from '@/components/ClassEvolution';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Sparkles, Trophy, Target, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export function Character() {
  const {
    classes,
    activeClass,
    setActiveClass,
    characterStatus,
    isLoading
  } = useGameStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">캐릭터 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <User className="h-16 w-16 text-muted-foreground mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-2">클래스가 없습니다</h2>
            <p className="text-muted-foreground">
              목표를 설정하여 첫 번째 클래스를 만들어보세요!
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            목표 설정하기
          </Button>
        </div>
      </div>
    );
  }

  const eligibleForEvolution = classes.filter(c => c.level === 30 && c.status === 'active');

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
            <h1 className="text-3xl font-bold">캐릭터</h1>
            <p className="text-muted-foreground">
              캐릭터 성장과 능력을 확인하세요
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              총 {classes.length}개 클래스
            </Badge>
            {eligibleForEvolution.length >= 2 && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                진화 가능!
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Character Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6"
        >
          {/* Character Status Card */}
          {characterStatus && (
            <CharacterStatus
              status={characterStatus}
              streak={(characterStatus as any).streak}
            />
          )}

          {/* Active Class Overview */}
          {activeClass && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  활성 클래스
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{activeClass.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeClass.description}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">레벨</span>
                  <Badge variant="secondary">{activeClass.level}</Badge>
                </div>

                <XPBar characterClass={activeClass} />

                <div className="text-sm">
                  <span className="text-muted-foreground">궁극 목표: </span>
                  <span className="font-medium">{activeClass.ultimateGoal}</span>
                </div>

                {activeClass.level === 30 && (
                  <div className="border-t pt-4">
                    <Badge className="w-full justify-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                      <Trophy className="h-4 w-4 mr-1" />
                      마스터 달성!
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Power Level */}
          <Card>
            <CardHeader>
              <CardTitle>파워 레벨</CardTitle>
              <CardDescription>전체 클래스의 종합 능력치</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {characterStatus?.powerLevel || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  모든 클래스 레벨의 합계
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Middle Column - Class Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Tabs defaultValue="classes" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="classes">내 클래스</TabsTrigger>
              <TabsTrigger value="skills">스킬 트리</TabsTrigger>
              <TabsTrigger value="evolution">클래스 진화</TabsTrigger>
            </TabsList>

            <TabsContent value="classes" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map((cls, index) => (
                  <motion.div
                    key={cls.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        activeClass?.id === cls.id
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => setActiveClass(cls.id)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{cls.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">레벨 {cls.level}</Badge>
                            {cls.status === 'evolved' && (
                              <Badge className="bg-purple-500">진화</Badge>
                            )}
                            {cls.status === 'mastered' && (
                              <Badge className="bg-yellow-500">마스터</Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription>{cls.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <XPBar characterClass={cls} />
                        <div className="mt-3 text-sm text-muted-foreground">
                          목표: {cls.ultimateGoal}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {classes.length < 5 && (
                <Card className="border-dashed border-2">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">새 클래스 만들기</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      새로운 목표를 설정하여 다른 클래스를 만들어보세요
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      목표 추가
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              {activeClass ? (
                <SkillTree characterClass={activeClass} />
              ) : (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">클래스를 선택해주세요</h3>
                  <p className="text-muted-foreground">
                    스킬 트리를 보려면 클래스를 먼저 선택해야 합니다.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="evolution" className="space-y-4">
              {eligibleForEvolution.length >= 2 ? (
                <ClassEvolutionComponent eligibleClasses={eligibleForEvolution} />
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">클래스 진화</h3>
                  <p className="text-muted-foreground mb-4">
                    클래스 진화를 위해서는 레벨 30에 도달한 클래스가 2개 이상 필요합니다.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    현재 레벨 30 클래스: {eligibleForEvolution.length}개
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}