import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/index.js';
import { Quest } from '@shared/types';
import { QUEST_XP_VALUES } from '@shared/constants';

export async function generateQuests(
  classId: string,
  level: number,
  locale: string = 'ko',
  aiDailyQuests?: string[],
  aiWeeklyQuests?: string[]
): Promise<any[]> {
  const db = getDatabase();
  const quests: Quest[] = [];
  const now = new Date();
  
  // Generate daily quests
  const dailyQuestCount = level <= 5 ? 3 : level <= 15 ? 4 : 5;
  const dailyXP = getDailyXPForLevel(level);

  // Use AI-generated quests if available, otherwise fall back to defaults
  const dailyDescriptions = aiDailyQuests && aiDailyQuests.length > 0
    ? aiDailyQuests
    : (locale === 'ko' ? getDefaultDailyQuestsKo() : getDefaultDailyQuests());

  for (let i = 0; i < dailyQuestCount; i++) {
    const quest: any = {
      id: uuidv4(),
      classId,
      type: 'daily',
      title: locale === 'ko' ? `일일 퀘스트 ${i + 1}` : `Daily Quest ${i + 1}`,
      description: dailyDescriptions[i % dailyDescriptions.length],
      xp: dailyXP,
      xpReward: dailyXP,
      status: 'pending',
      difficulty: Math.min(5, Math.ceil(level / 6)) as 1 | 2 | 3 | 4 | 5,
      createdAt: now,
      attemptCount: 0
    };

    quests.push(quest);
    insertQuest(db, quest);
  }
  
  // Generate weekly quests
  const weeklyXP = getWeeklyXPForLevel(level);
  const weeklyQuestCount = 2;

  // Use AI-generated quests if available, otherwise fall back to defaults
  const weeklyDescriptions = aiWeeklyQuests && aiWeeklyQuests.length > 0
    ? aiWeeklyQuests
    : (locale === 'ko' ? getDefaultWeeklyQuestsKo() : getDefaultWeeklyQuests());

  for (let i = 0; i < weeklyQuestCount; i++) {
    const quest: any = {
      id: uuidv4(),
      classId,
      type: 'weekly',
      title: locale === 'ko' ? `주간 도전 ${i + 1}` : `Weekly Challenge ${i + 1}`,
      description: weeklyDescriptions[i % weeklyDescriptions.length],
      xp: weeklyXP,
      xpReward: weeklyXP,
      status: 'pending',
      difficulty: Math.min(5, Math.ceil(level / 5)) as 1 | 2 | 3 | 4 | 5,
      createdAt: now,
      attemptCount: 0
    };

    quests.push(quest);
    insertQuest(db, quest);
  }
  
  // Generate special quests for milestone levels
  if (level === 10 || level === 20 || level === 30) {
    const quest: Quest = {
      id: uuidv4(),
      classId,
      type: 'special',
      title: locale === 'ko' ? `레벨 ${level} 특별 퀘스트` : `Level ${level} Special Quest`,
      description: locale === 'ko' ? `레벨 ${level}에서의 마스터리를 증명하는 특별 퀘스트를 완료하세요` : `Complete this special quest to prove your mastery at level ${level}`,
      xpReward: QUEST_XP_VALUES.special[`level_${level}` as keyof typeof QUEST_XP_VALUES.special],
      status: 'pending',
      difficulty: 5,
      levelTrigger: level,
      createdAt: now,
      attemptCount: 0
    };
    
    quests.push(quest);
    insertQuest(db, quest);
  }
  
  return quests;
}

function insertQuest(db: any, quest: Quest) {
  db.prepare(`
    INSERT OR REPLACE INTO quests (
      id, class_id, type, title, description, xp_reward,
      status, difficulty, level_trigger, created_at, attempt_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    quest.id,
    quest.classId,
    quest.type,
    quest.title,
    quest.description,
    quest.xpReward,
    quest.status,
    quest.difficulty,
    quest.levelTrigger || null,
    quest.createdAt.toISOString(),
    quest.attemptCount
  );
}

function getDailyXPForLevel(level: number): number {
  if (level <= 5) return QUEST_XP_VALUES.daily.level_1_5;
  if (level <= 10) return QUEST_XP_VALUES.daily.level_6_10;
  if (level <= 15) return QUEST_XP_VALUES.daily.level_11_15;
  if (level <= 20) return QUEST_XP_VALUES.daily.level_16_20;
  if (level <= 25) return QUEST_XP_VALUES.daily.level_21_25;
  return QUEST_XP_VALUES.daily.level_26_30;
}

function getWeeklyXPForLevel(level: number): number {
  if (level <= 10) return QUEST_XP_VALUES.weekly.level_1_10;
  if (level <= 20) return QUEST_XP_VALUES.weekly.level_11_20;
  return QUEST_XP_VALUES.weekly.level_21_30;
}

function getDefaultDailyQuestsKo(): string[] {
  return [
    "핵심 기술을 30분간 연습하기",
    "학습 모듈이나 튜토리얼 완료하기",
    "배운 내용을 실제로 적용해보기",
    "진행 상황을 누군가와 공유하기",
    "작업 내용을 검토하고 개선하기"
  ];
}

function getDefaultWeeklyQuestsKo(): string[] {
  return [
    "중요한 프로젝트 마일스톤 완료하기",
    "새로운 기술이나 개념 마스터하기",
    "주간 목표 달성하기"
  ];
}

function getDefaultDailyQuests(): string[] {
  return [
    "Practice your core skill for 30 minutes",
    "Complete a learning module or tutorial",
    "Apply what you've learned in a practical way",
    "Share your progress with someone",
    "Review and refine your work"
  ];
}

function getDefaultWeeklyQuests(): string[] {
  return [
    "Complete a significant project milestone",
    "Master a new technique or concept",
    "Collaborate with others on your goal"
  ];
}

export async function completeQuest(questId: string, userId: string): Promise<{ xpGained: number; levelUp: boolean; streak?: { current: number; multiplier: number } }> {
  const db = getDatabase();
  
  // Get quest details
  const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(questId) as any;
  if (!quest) {
    throw new Error(`Quest not found with ID: ${questId}`);
  }
  
  if (quest.status === 'completed') {
    return { xpGained: 0, levelUp: false };
  }
  
  // Get or create user's streak
  let streak = db.prepare('SELECT * FROM progress_streaks WHERE user_id = ?').get(userId) as any;
  
  if (!streak) {
    // Create new streak
    db.prepare(`
      INSERT INTO progress_streaks (id, user_id, current_streak, longest_streak, multiplier, last_completion_date, last_activity)
      VALUES (?, ?, 1, 1, 1, ?, CURRENT_TIMESTAMP)
    `).run(uuidv4(), userId, new Date().toISOString().split('T')[0]);
    streak = { current_streak: 1, multiplier: 1 };
  } else {
    // Update streak
    updateStreak(db, userId);
    // Fetch updated streak
    streak = db.prepare('SELECT * FROM progress_streaks WHERE user_id = ?').get(userId) as any;
  }
  
  // Calculate XP with multiplier
  const baseXP = quest.xp_reward || 50;
  const xpGained = Math.floor(baseXP * (streak?.multiplier || 1));
  
  // Update quest status
  db.prepare('UPDATE quests SET status = ?, completed_at = ? WHERE id = ?')
    .run('completed', new Date().toISOString(), questId);
  
  // Get or create character class
  let classData = db.prepare('SELECT * FROM character_classes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(userId) as any;
  
  if (!classData) {
    // Create default class
    const classId = `class-${Date.now()}`;
    db.prepare(`
      INSERT INTO character_classes (id, user_id, name, description, level, current_xp, xp_to_next_level, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(classId, userId, 'Novice Adventurer', 'Just starting the journey', 1, 0, 100);
    classData = { id: classId, level: 1, current_xp: 0, xp_to_next_level: 100 };
  }
  
  // Update character XP
  const newXP = classData.current_xp + xpGained;
  let levelUp = false;
  
  if (newXP >= classData.xp_to_next_level && classData.level < 30) {
    // Level up!
    levelUp = true;
    const newLevel = classData.level + 1;
    const remainingXP = newXP - classData.xp_to_next_level;
    const nextLevelXP = calculateXPForLevel(newLevel);
    
    db.prepare(`
      UPDATE character_classes 
      SET level = ?, current_xp = ?, xp_to_next_level = ?
      WHERE id = ?
    `).run(newLevel, remainingXP, nextLevelXP, classData.id);
  } else {
    db.prepare('UPDATE character_classes SET current_xp = ? WHERE id = ?')
      .run(newXP, classData.id);
  }
  
  // Log XP multiplier if exists
  if (streak?.multiplier > 1) {
    db.prepare(`
      INSERT INTO xp_multipliers (id, user_id, quest_id, base_xp, multiplier_value, reason, final_xp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, questId, baseXP, streak.multiplier, 'streak', xpGained);
  }
  
  return { 
    xpGained, 
    levelUp,
    streak: {
      current: streak.current_streak,
      multiplier: streak.multiplier
    }
  };
}

function calculateXPForLevel(level: number): number {
  const baseXP = 100;
  const increment = 50;
  return baseXP + (increment * (level - 1)) + (10 * Math.pow(level - 1, 1.2));
}

function updateStreak(db: any, userId: string) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  let streak = db.prepare('SELECT * FROM progress_streaks WHERE user_id = ?').get(userId) as any;
  
  if (!streak) {
    // Create new streak
    db.prepare(`
      INSERT INTO progress_streaks (id, user_id, current_streak, longest_streak, multiplier, last_completion_date)
      VALUES (?, ?, 1, 1, 1, ?)
    `).run(uuidv4(), userId, today);
  } else {
    const lastDate = new Date(streak.last_completion_date);
    const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Continue streak
      const newStreak = streak.current_streak + 1;
      const newMultiplier = Math.min(newStreak, 5);
      const longestStreak = Math.max(newStreak, streak.longest_streak);
      
      db.prepare(`
        UPDATE progress_streaks 
        SET current_streak = ?, longest_streak = ?, multiplier = ?, last_completion_date = ?
        WHERE user_id = ?
      `).run(newStreak, longestStreak, newMultiplier, today, userId);
    } else if (daysDiff > 1) {
      // Reset streak
      db.prepare(`
        UPDATE progress_streaks 
        SET current_streak = 1, multiplier = 1, last_completion_date = ?
        WHERE user_id = ?
      `).run(today, userId);
    }
    // If same day, don't update streak
  }
}