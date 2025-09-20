import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Trophy, Star } from 'lucide-react';
import { useGameStore } from '@/stores/game.store';

export function LevelUpModal() {
  const { showLevelUpModal, setShowLevelUpModal, activeClass } = useGameStore();

  useEffect(() => {
    if (showLevelUpModal) {
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowLevelUpModal(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showLevelUpModal, setShowLevelUpModal]);

  if (!activeClass) return null;

  return (
    <AnimatePresence>
      {showLevelUpModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowLevelUpModal(false)}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="relative overflow-hidden border-2 border-primary">
              {/* Animated background particles */}
              <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-1 w-1 bg-primary rounded-full"
                    initial={{
                      x: Math.random() * 400 - 200,
                      y: 300,
                      opacity: 0
                    }}
                    animate={{
                      y: -100,
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                      ease: "easeOut"
                    }}
                    style={{
                      left: '50%',
                    }}
                  />
                ))}
              </div>

              <CardHeader className="relative text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="mx-auto mb-4"
                >
                  <Trophy className="h-16 w-16 text-primary" />
                </motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <CardTitle className="text-3xl font-bold">
                    LEVEL UP!
                  </CardTitle>
                </motion.div>
              </CardHeader>

              <CardContent className="relative space-y-4 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <p className="text-lg font-semibold">{activeClass.name}</p>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      Level {activeClass.level - 1}
                    </Badge>
                    <motion.div
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 0.5, repeat: 3 }}
                    >
                      <Sparkles className="h-5 w-5 text-primary" />
                    </motion.div>
                    <Badge variant="default" className="text-lg px-3 py-1">
                      Level {activeClass.level}
                    </Badge>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <p className="text-sm text-muted-foreground">
                    New abilities unlocked!
                  </p>
                  <div className="flex justify-center gap-2">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                      >
                        <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button
                    onClick={() => setShowLevelUpModal(false)}
                    className="w-full"
                    size="lg"
                  >
                    Continue Adventure
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}