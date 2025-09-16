import { describe, it, expect } from '@jest/globals';

// XP Calculation functions
const calculateXPToNextLevel = (level: number): number => {
  return 100 * level;
};

const calculateStreakMultiplier = (streakDays: number): number => {
  if (streakDays < 3) return 1.0;
  if (streakDays < 7) return 1.5;
  if (streakDays < 14) return 2.0;
  if (streakDays < 30) return 3.0;
  if (streakDays < 50) return 4.0;
  return 5.0; // Max multiplier
};

const calculateTotalXP = (baseXP: number, multiplier: number, bonuses: number[] = []): number => {
  const bonusXP = bonuses.reduce((sum, bonus) => sum + bonus, 0);
  return Math.floor((baseXP + bonusXP) * multiplier);
};

const calculateLevelFromTotalXP = (totalXP: number): { level: number; currentXP: number } => {
  let level = 1;
  let remainingXP = totalXP;
  
  while (remainingXP >= calculateXPToNextLevel(level)) {
    remainingXP -= calculateXPToNextLevel(level);
    level++;
    if (level >= 30) break; // Max level cap
  }
  
  return { level, currentXP: remainingXP };
};

describe('XP Calculator', () => {
  describe('calculateXPToNextLevel', () => {
    it('should calculate correct XP requirements for each level', () => {
      expect(calculateXPToNextLevel(1)).toBe(100);
      expect(calculateXPToNextLevel(5)).toBe(500);
      expect(calculateXPToNextLevel(10)).toBe(1000);
      expect(calculateXPToNextLevel(20)).toBe(2000);
      expect(calculateXPToNextLevel(30)).toBe(3000);
    });

    it('should scale linearly with level', () => {
      for (let level = 1; level <= 30; level++) {
        expect(calculateXPToNextLevel(level)).toBe(100 * level);
      }
    });
  });

  describe('calculateStreakMultiplier', () => {
    it('should return correct multipliers for streak ranges', () => {
      // No streak
      expect(calculateStreakMultiplier(0)).toBe(1.0);
      expect(calculateStreakMultiplier(1)).toBe(1.0);
      expect(calculateStreakMultiplier(2)).toBe(1.0);
      
      // 3-6 days: 1.5x
      expect(calculateStreakMultiplier(3)).toBe(1.5);
      expect(calculateStreakMultiplier(5)).toBe(1.5);
      expect(calculateStreakMultiplier(6)).toBe(1.5);
      
      // 7-13 days: 2x
      expect(calculateStreakMultiplier(7)).toBe(2.0);
      expect(calculateStreakMultiplier(10)).toBe(2.0);
      expect(calculateStreakMultiplier(13)).toBe(2.0);
      
      // 14-29 days: 3x
      expect(calculateStreakMultiplier(14)).toBe(3.0);
      expect(calculateStreakMultiplier(20)).toBe(3.0);
      expect(calculateStreakMultiplier(29)).toBe(3.0);
      
      // 30-49 days: 4x
      expect(calculateStreakMultiplier(30)).toBe(4.0);
      expect(calculateStreakMultiplier(40)).toBe(4.0);
      expect(calculateStreakMultiplier(49)).toBe(4.0);
      
      // 50+ days: 5x (max)
      expect(calculateStreakMultiplier(50)).toBe(5.0);
      expect(calculateStreakMultiplier(100)).toBe(5.0);
      expect(calculateStreakMultiplier(365)).toBe(5.0);
    });

    it('should never exceed maximum multiplier', () => {
      expect(calculateStreakMultiplier(1000)).toBe(5.0);
    });
  });

  describe('calculateTotalXP', () => {
    it('should calculate base XP without multiplier', () => {
      expect(calculateTotalXP(100, 1.0)).toBe(100);
      expect(calculateTotalXP(50, 1.0)).toBe(50);
    });

    it('should apply multiplier correctly', () => {
      expect(calculateTotalXP(100, 1.5)).toBe(150);
      expect(calculateTotalXP(100, 2.0)).toBe(200);
      expect(calculateTotalXP(100, 3.5)).toBe(350);
    });

    it('should add bonuses before applying multiplier', () => {
      expect(calculateTotalXP(100, 2.0, [20, 30])).toBe(300); // (100 + 20 + 30) * 2
      expect(calculateTotalXP(50, 1.5, [10])).toBe(90); // (50 + 10) * 1.5
    });

    it('should floor the result to avoid decimal XP', () => {
      expect(calculateTotalXP(33, 1.5)).toBe(49); // 33 * 1.5 = 49.5 -> 49
      expect(calculateTotalXP(100, 1.33)).toBe(133); // 100 * 1.33 = 133
    });

    it('should handle edge cases', () => {
      expect(calculateTotalXP(0, 2.0)).toBe(0);
      expect(calculateTotalXP(100, 0)).toBe(0);
      expect(calculateTotalXP(100, 1.0, [])).toBe(100);
    });
  });

  describe('calculateLevelFromTotalXP', () => {
    it('should calculate level 1 for XP below 100', () => {
      expect(calculateLevelFromTotalXP(0)).toEqual({ level: 1, currentXP: 0 });
      expect(calculateLevelFromTotalXP(50)).toEqual({ level: 1, currentXP: 50 });
      expect(calculateLevelFromTotalXP(99)).toEqual({ level: 1, currentXP: 99 });
    });

    it('should calculate correct level transitions', () => {
      expect(calculateLevelFromTotalXP(100)).toEqual({ level: 2, currentXP: 0 });
      expect(calculateLevelFromTotalXP(150)).toEqual({ level: 2, currentXP: 50 });
      expect(calculateLevelFromTotalXP(300)).toEqual({ level: 3, currentXP: 0 });
    });

    it('should handle multiple level worth of XP', () => {
      // Level 1->2: 100 XP, Level 2->3: 200 XP, Level 3->4: 300 XP
      // Total for level 4: 100 + 200 + 300 = 600 XP
      expect(calculateLevelFromTotalXP(600)).toEqual({ level: 4, currentXP: 0 });
      expect(calculateLevelFromTotalXP(650)).toEqual({ level: 4, currentXP: 50 });
    });

    it('should respect level 30 cap', () => {
      const xpForLevel30 = Array.from({ length: 29 }, (_, i) => 100 * (i + 1))
        .reduce((sum, xp) => sum + xp, 0); // Sum of 100, 200, 300, ..., 2900
      
      expect(calculateLevelFromTotalXP(xpForLevel30)).toEqual({ level: 30, currentXP: 0 });
      expect(calculateLevelFromTotalXP(xpForLevel30 + 10000)).toEqual({ level: 30, currentXP: 10000 });
    });

    it('should calculate correct XP for mid-levels', () => {
      // To reach level 10: sum of 100*(1 through 9) = 100*(1+2+...+9) = 100*45 = 4500
      const xpForLevel10 = 100 * (9 * 10 / 2); // Sum formula: n*(n+1)/2
      expect(calculateLevelFromTotalXP(xpForLevel10)).toEqual({ level: 10, currentXP: 0 });
      
      // To reach level 20: sum of 100*(1 through 19) = 100*190 = 19000
      const xpForLevel20 = 100 * (19 * 20 / 2);
      expect(calculateLevelFromTotalXP(xpForLevel20)).toEqual({ level: 20, currentXP: 0 });
    });
  });

  describe('XP System Integration', () => {
    it('should handle a complete quest completion flow', () => {
      const baseQuestXP = 50;
      const streakDays = 7;
      const urgentBonus = 25;

      const multiplier = calculateStreakMultiplier(streakDays);
      expect(multiplier).toBe(2.0);

      const totalXP = calculateTotalXP(baseQuestXP, multiplier, [urgentBonus]);
      expect(totalXP).toBe(150); // (50 + 25) * 2

      // Level 5 requires: 100+200+300+400+500 = 1500 XP total
      // Current: 1500 + 450 = 1950 XP total
      // After quest: 1950 + 150 = 2100 XP total
      // Level 6 requires: 1500 + 600 = 2100 XP total
      const totalAccumulatedXP = 1950 + totalXP; // 2100

      const result = calculateLevelFromTotalXP(totalAccumulatedXP);
      expect(result.level).toBe(7); // Level 7 with 0 XP
      expect(result.currentXP).toBe(0); // Exactly at level 7
    });

    it('should handle perfect week bonus calculation', () => {
      const dailyQuests = [50, 50, 50, 50, 50, 50, 50]; // 7 days
      const perfectWeekBonus = 100;
      const streakMultiplier = 2.0; // 7-day streak

      const weeklyXP = dailyQuests.reduce((sum, xp) => sum + xp, 0);
      const totalWithBonus = calculateTotalXP(weeklyXP, streakMultiplier, [perfectWeekBonus]);

      expect(totalWithBonus).toBe(900); // (350 + 100) * 2 = 450 * 2 = 900
    });
  });
});