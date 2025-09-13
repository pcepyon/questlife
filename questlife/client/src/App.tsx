import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/stores/game.store';
import { api } from '@/services/api';
import { GoalInput } from '@/components/GoalInput';
import { QuestCard } from '@/components/QuestCard';
import { CharacterStatus } from '@/components/CharacterStatus';
import { XPBar } from '@/components/XPBar';
import { ClassEvolutionComponent } from '@/components/ClassEvolution';
import { LevelUpModal } from '@/components/LevelUpModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import './lib/i18n';

function App() {
  const { t } = useTranslation(['common', 'quests', 'classes']);
  const {
    user,
    setUser,
    classes,
    setClasses,
    activeClass,
    quests,
    setQuests,
    characterStatus,
    setCharacterStatus,
    isLoading,
    setLoading
  } = useGameStore();

  // Initialize user on mount
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        // Get or create user
        const userData = await api.getOrCreateUser();
        setUser(userData);
        
        // Get user's classes
        const classesData = await api.getClasses(userData.id);
        setClasses(classesData);
        
        // Get character status
        const statusData = await api.getCharacterStatus(userData.id);
        setCharacterStatus(statusData);
        
        // If user has classes, load quests for active class
        if (classesData.length > 0 && activeClass) {
          const questsData = await api.getQuests(activeClass.id);
          setQuests(questsData);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setLoading(false);
      }
    }
    
    init();
  }, []);

  // Load quests when active class changes
  useEffect(() => {
    if (activeClass) {
      api.getQuests(activeClass.id).then(setQuests);
    }
  }, [activeClass?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Sparkles className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{t('status.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Level Up Modal */}
      <LevelUpModal />
      
      {/* Header */}
      <motion.header 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
          >
            <Swords className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-bold">{t('app.name', { ns: 'common' })}</h1>
        </div>
        <p className="text-muted-foreground">{t('app.tagline', { ns: 'common' })}</p>
      </motion.header>

      {/* Main Layout */}
      {!classes || classes.length === 0 ? (
        // Initial state - center the GoalInput
        <div className="max-w-2xl mx-auto">
          <GoalInput />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Character & Status */}
          <div className="space-y-6">
            {/* Active Class Card */}
            {activeClass && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{activeClass.name}</span>
                    <Badge variant="secondary">{t('labels.level', { ns: 'classes' })} {activeClass.level}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{activeClass.description}</p>
                  <XPBar characterClass={activeClass} />
                  <div className="text-sm">
                    <span className="text-muted-foreground">{t('labels.ultimateGoal', { ns: 'classes' })}: </span>
                    <span className="font-medium">{activeClass.ultimateGoal}</span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Character Status */}
            {characterStatus && (
              <CharacterStatus 
                status={characterStatus} 
                streak={(characterStatus as any).streak}
              />
            )}
          </div>

          {/* Middle Column - Quests */}
          <div className="space-y-6">
            {!activeClass ? (
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold mb-2">No Active Class</h3>
                <p className="text-muted-foreground">Select a class from the right to view quests</p>
              </div>
            ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{t('sections.activeQuests', { ns: 'common' })}</h2>
                <Badge>{t('sections.available', { count: quests.length, ns: 'common' })}</Badge>
              </div>
              
              {/* Daily Quests */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground">{t('sections.dailyQuests', { ns: 'common' })}</h3>
                {quests
                  .filter(q => q.type === 'daily' && q.status !== 'completed')
                  .map(quest => (
                    <QuestCard 
                      key={quest.id} 
                      quest={quest} 
                      onComplete={async (questId) => {
                        try {
                          const result = await api.completeQuest(questId, user?.id || '');
                          // Refresh quests after completion
                          const updatedQuests = await api.getQuests(activeClass.id);
                          setQuests(updatedQuests);
                          // Update character status if XP was gained
                          if (result.xpGained > 0) {
                            const statusData = await api.getCharacterStatus(user?.id || '');
                            setCharacterStatus(statusData);
                          }
                        } catch (error) {
                          console.error('Failed to complete quest:', error);
                        }
                      }}
                    />
                  ))}
              </div>
              
              {/* Weekly Quests */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground">{t('sections.weeklyChallenges', { ns: 'common' })}</h3>
                {quests
                  .filter(q => q.type === 'weekly' && q.status !== 'completed')
                  .map(quest => (
                    <QuestCard 
                      key={quest.id} 
                      quest={quest} 
                      onComplete={async (questId) => {
                        try {
                          const result = await api.completeQuest(questId, user?.id || '');
                          // Refresh quests after completion
                          const updatedQuests = await api.getQuests(activeClass.id);
                          setQuests(updatedQuests);
                          // Update character status if XP was gained
                          if (result.xpGained > 0) {
                            const statusData = await api.getCharacterStatus(user?.id || '');
                            setCharacterStatus(statusData);
                          }
                        } catch (error) {
                          console.error('Failed to complete quest:', error);
                        }
                      }}
                    />
                  ))}
              </div>
              
              {/* Special Quests */}
              {quests.some(q => q.type === 'special') && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Special Quests</h3>
                  {quests
                    .filter(q => q.type === 'special')
                    .map(quest => (
                      <QuestCard 
                        key={quest.id} 
                        quest={quest} 
                        onComplete={async (questId) => {
                          try {
                            const result = await api.completeQuest(questId, user?.id || '');
                            // Refresh quests after completion
                            const updatedQuests = await api.getQuests(activeClass.id);
                            setQuests(updatedQuests);
                            // Update character status if XP was gained
                            if (result.xpGained > 0) {
                              const statusData = await api.getCharacterStatus(user?.id || '');
                              setCharacterStatus(statusData);
                            }
                          } catch (error) {
                            console.error('Failed to complete quest:', error);
                          }
                        }}
                      />
                    ))}
                </div>
              )}
            </>
            )}
          </div>

          {/* Right Column - Classes */}
          <div className="space-y-6">
          
          {/* Class Evolution - Show if user has eligible classes */}
          {classes && classes.filter(c => c && c.level === 30 && c.status === 'active').length >= 2 && (
            <ClassEvolutionComponent 
              eligibleClasses={classes.filter(c => c && c.level === 30 && c.status === 'active')}
            />
          )}
          
          {/* Class List */}
          {classes && classes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('sections.yourClasses', { ns: 'common' })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => useGameStore.getState().setActiveClass(cls.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      activeClass?.id === cls.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{cls.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t('labels.level', { ns: 'classes' })} {cls.level}</Badge>
                        {cls.status === 'evolved' && (
                          <Badge variant="secondary">Evolved</Badge>
                        )}
                        {cls.status === 'mastered' && (
                          <Badge variant="default">Mastered</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

export default App;