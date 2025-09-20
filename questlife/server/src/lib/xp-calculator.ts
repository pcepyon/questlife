// XP thresholds for each level (cumulative)
const XP_PER_LEVEL = [
  0,      // Level 1
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2100,   // Level 7
  2800,   // Level 8
  3600,   // Level 9
  4500,   // Level 10
  5500,   // Level 11
  6600,   // Level 12
  7800,   // Level 13
  9100,   // Level 14
  10500,  // Level 15
  12000,  // Level 16
  13600,  // Level 17
  15300,  // Level 18
  17100,  // Level 19
  19000,  // Level 20
  21000,  // Level 21
  23100,  // Level 22
  25300,  // Level 23
  27600,  // Level 24
  30000,  // Level 25
  32500,  // Level 26
  35100,  // Level 27
  37800,  // Level 28
  40600,  // Level 29
  43500,  // Level 30
];

export function calculateLevelProgress(currentXP: number, level: number): number {
  if (level <= 0 || level > 30) return 0;
  if (level === 30) return 100; // Max level
  
  const currentLevelXP = XP_PER_LEVEL[level - 1];
  const nextLevelXP = XP_PER_LEVEL[level];
  const xpForLevel = nextLevelXP - currentLevelXP;
  
  return Math.min(100, Math.floor((currentXP / xpForLevel) * 100));
}

export function calculateXPGain(baseXP: number, difficulty: number): number {
  // Difficulty ranges from 1-5, multiply base XP accordingly
  const difficultyMultiplier = 1 + (difficulty - 1) * 0.25; // 1x, 1.25x, 1.5x, 1.75x, 2x
  return Math.floor(baseXP * difficultyMultiplier);
}

export function calculateStreakMultiplier(streakDays: number): number {
  if (streakDays <= 0) return 1.0;
  if (streakDays === 7) return 2.0; // Specific case for 7-day streak
  if (streakDays >= 30) return 5.0; // Max multiplier
  
  // Progressive multiplier: roughly 0.14 per day to reach 2.0 at 7 days, 5.0 at 30 days
  const multiplier = 1.0 + (streakDays * 0.133);
  // Round to 1 decimal place
  return Math.min(5.0, Math.round(multiplier * 10) / 10);
}

export function calculateXPForLevel(level: number): number {
  if (level <= 0 || level > 30) return 0;
  if (level === 1) return 0;
  
  return XP_PER_LEVEL[level - 1];
}

export function calculateTotalXP(baseXP: number, streakMultiplier: number, bonuses: number[] = []): number {
  const bonusXP = bonuses.reduce((sum, bonus) => sum + bonus, 0);
  return Math.floor((baseXP + bonusXP) * streakMultiplier);
}

export function calculateLevelFromTotalXP(totalXP: number): { level: number; currentXP: number } {
  let level = 1;
  let remainingXP = totalXP;
  
  for (let i = 1; i < XP_PER_LEVEL.length; i++) {
    if (totalXP < XP_PER_LEVEL[i]) {
      level = i;
      const currentLevelThreshold = XP_PER_LEVEL[i - 1];
      const xpIntoLevel = totalXP - currentLevelThreshold;
      remainingXP = xpIntoLevel;
      break;
    }
  }
  
  // Max level
  if (totalXP >= XP_PER_LEVEL[XP_PER_LEVEL.length - 1]) {
    level = 30;
    remainingXP = totalXP - XP_PER_LEVEL[29];
  }
  
  return { level, currentXP: remainingXP };
}