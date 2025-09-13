export const QUEST_XP_VALUES = {
  daily: {
    level_1_5: 40,
    level_6_10: 50,
    level_11_15: 60,
    level_16_20: 70,
    level_21_25: 80,
    level_26_30: 100
  },
  weekly: {
    level_1_10: 300,
    level_11_20: 500,
    level_21_30: 800
  },
  special: {
    level_10: 1000,
    level_20: 2000,
    level_30: 3000
  },
  urgent: (baseXP: number) => baseXP * 2
};

export const MAX_LEVEL = 30;
export const MAX_STREAK_MULTIPLIER = 5;
export const BASE_XP_REQUIREMENT = 100;
export const XP_INCREMENT_PER_LEVEL = 50;

export const ATTRIBUTES = {
  STRENGTH: 'strength',
  WISDOM: 'wisdom',
  CREATIVITY: 'creativity',
  DISCIPLINE: 'discipline',
  CHARISMA: 'charisma'
} as const;

export const BASE_ATTRIBUTE_VALUE = 10;