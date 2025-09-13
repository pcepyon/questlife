import OpenAI from 'openai';
import crypto from 'crypto';
import { getDatabase } from '../db/index.js';
import { requireEnv } from '../load-env.js';

const apiKey = requireEnv('OPENAI_API_KEY');
const openai = new OpenAI({ apiKey });

interface AnalyzedGoal {
  className: string;
  classNameKo?: string;
  description: string;
  descriptionKo?: string;
  suggestedLevel: number;
  ultimateGoal: string;
  dailyQuests: string[];
  weeklyQuests: string[];
  milestones: { month: number; description: string }[];
}

export async function analyzeGoal(goalText: string, locale: string = 'ko'): Promise<AnalyzedGoal> {
  const db = getDatabase();
  
  // Check cache first
  const goalHash = crypto.createHash('sha256').update(goalText).digest('hex');
  const cached = db.prepare('SELECT * FROM goal_cache WHERE goal_hash = ?').get(goalHash) as any;
  
  if (cached && new Date(cached.expires_at) > new Date()) {
    db.prepare('UPDATE goal_cache SET hit_count = hit_count + 1 WHERE goal_hash = ?').run(goalHash);
    return JSON.parse(cached.generated_class);
  }
  
  // Call OpenAI if not cached
  const isKorean = locale === 'ko';
  const systemPrompt = isKorean
    ? `당신은 개인 목표를 RPG 캐릭터 클래스로 변환하는 게임 마스터입니다.
    목표 달성에 도움이 되는 창의적이고 동기부여가 되는 RPG 클래스를 생성하세요.
    구체적이고 격려하는 톤으로 작성하세요. 모든 설명은 한국어로 작성하되, 클래스명은 영어와 한국어 모두 제공하세요.
    예시: "AI Scholar(AI 학자)", "Code Warrior(코드 전사)", "Fitness Paladin(피트니스 성기사)"`
    : `You are a game master creating RPG character classes from personal goals.
    Generate a creative, motivating RPG class that will help someone achieve their goal.
    Be specific and encouraging. Think of classes like "AI Scholar", "Code Warrior", "Fitness Paladin".`;

  const userPrompt = isKorean
    ? `이 목표를 RPG 캐릭터 클래스로 변환하세요: "${goalText}"

    다음 형식의 JSON 객체를 반환하세요:
    - className: 창의적인 RPG 클래스명 (영어)
    - classNameKo: 클래스명 (한국어)
    - description: 2-3문장의 클래스 설명 (한국어로 작성)
    - descriptionKo: description과 동일 (한국어)
    - suggestedLevel: 목표 레벨 (1-30)
    - ultimateGoal: 최종 목표 (한국어로 작성)
    - dailyQuests: 일일 퀘스트 3-5개 배열 (한국어로 작성)
    - weeklyQuests: 주간 도전 과제 2-3개 배열 (한국어로 작성)
    - milestones: 월별 마일스톤 배열, month 번호와 description (한국어) 포함`
    : `Transform this goal into an RPG character class: "${goalText}"

    Return a JSON object with:
    - className: Creative RPG class name
    - description: 2-3 sentence description
    - suggestedLevel: Target level (1-30)
    - ultimateGoal: The final achievement
    - dailyQuests: Array of 3-5 daily quest ideas
    - weeklyQuests: Array of 2-3 weekly challenge ideas
    - milestones: Array of monthly milestones with month number and description`;
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.8
    });
    
    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Cache the result
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    db.prepare(`
      INSERT OR REPLACE INTO goal_cache (goal_hash, generated_class, expires_at, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(goalHash, JSON.stringify(result), expiresAt.toISOString());
    
    return result;
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Return a fallback response
    return {
      className: "Aspiring Hero",
      description: "A determined individual on a quest for self-improvement and achievement.",
      suggestedLevel: 20,
      ultimateGoal: goalText,
      dailyQuests: [
        "Spend 30 minutes on your goal",
        "Learn one new thing related to your goal",
        "Practice a key skill"
      ],
      weeklyQuests: [
        "Complete a significant milestone",
        "Review and adjust your approach"
      ],
      milestones: [
        { month: 1, description: "Establish consistent habits" },
        { month: 2, description: "See measurable progress" },
        { month: 3, description: "Achieve your first major milestone" }
      ]
    };
  }
}