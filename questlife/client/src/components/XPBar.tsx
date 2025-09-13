import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { CharacterClass } from '@shared/types';

interface XPBarProps {
  characterClass: CharacterClass;
}

export function XPBar({ characterClass }: XPBarProps) {
  const [displayXP, setDisplayXP] = useState(characterClass.currentXP);
  const percentage = (displayXP / characterClass.xpToNextLevel) * 100;
  
  // Animate XP changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayXP(characterClass.currentXP);
    }, 100);
    return () => clearTimeout(timer);
  }, [characterClass.currentXP]);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <motion.span 
          className="text-muted-foreground"
          key={characterClass.level}
          initial={{ scale: 1.2, color: '#fbbf24' }}
          animate={{ scale: 1, color: 'inherit' }}
          transition={{ duration: 0.5 }}
        >
          Level {characterClass.level}
        </motion.span>
        <motion.span 
          className="text-muted-foreground"
          key={`${characterClass.currentXP}-${characterClass.xpToNextLevel}`}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
        >
          {displayXP} / {characterClass.xpToNextLevel} XP
        </motion.span>
      </div>
      
      <div className="relative">
        <Progress value={0} className="h-3 absolute" />
        <motion.div
          className="relative"
          initial={{ scale: 1 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full bg-primary transition-all"
              initial={{ width: '0%' }}
              animate={{ width: `${percentage}%` }}
              transition={{ 
                duration: 0.8,
                ease: "easeOut"
              }}
            />
            {/* XP gain particles effect */}
            <AnimatePresence>
              {characterClass.currentXP > 0 && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-end pr-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute h-1 w-1 bg-yellow-400 rounded-full"
                      initial={{ x: 0, opacity: 1 }}
                      animate={{ 
                        x: -50 - (i * 20),
                        opacity: 0,
                        scale: [1, 1.5, 0]
                      }}
                      transition={{ 
                        duration: 1,
                        delay: i * 0.1,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      
      {characterClass.level < 30 && (
        <div className="text-center text-xs text-muted-foreground">
          {characterClass.xpToNextLevel - characterClass.currentXP} XP to level {characterClass.level + 1}
        </div>
      )}
      
      {characterClass.level === 30 && (
        <div className="text-center text-xs text-primary font-bold">
          MAX LEVEL - Class Mastered!
        </div>
      )}
    </div>
  );
}