# QuestLife 진행도 분석 및 밸런싱

## 🚨 현재 시스템의 문제점

### 1. XP 요구량 문제
```typescript
// 현재 공식
const xpToNextLevel = (level: number) => 100 * Math.pow(1.5, level - 1);

// 레벨별 요구 XP
Level 1→2: 100 XP
Level 10→11: 3,844 XP
Level 20→21: 32,474 XP  
Level 29→30: 127,834 XP  // 너무 높음!

// 총 누적 XP (1→30)
Total: 약 1,300,000 XP // 비현실적
```

### 2. 일일 퀘스트 XP 부족
```typescript
// 일일 가능 XP (최적 시나리오)
Daily quests: 3-5개 * 60 XP (평균) = 180-300 XP
Weekly challenge: 350 XP / 7 = 50 XP/day
Total daily: 230-350 XP

// 레벨 29→30 도달 시간
127,834 XP ÷ 350 XP/day = 365일 // 1년이 걸림!
```

## ✅ 개선된 진행 시스템

### 1. 새로운 XP 요구량 공식
```typescript
const xpToNextLevel = (level: number): number => {
  // 선형 증가 + 약간의 곡선
  const baseXP = 100;
  const increment = 50;
  return baseXP + (increment * (level - 1)) + (10 * Math.pow(level - 1, 1.2));
};

// 개선된 레벨별 요구 XP
Level 1→2: 100 XP
Level 5→6: 360 XP
Level 10→11: 720 XP
Level 15→16: 1,150 XP
Level 20→21: 1,650 XP
Level 25→26: 2,220 XP
Level 29→30: 2,700 XP

// 총 누적 XP (1→30)
Total: 약 28,000 XP // 현실적!
```

### 2. 3개월 목표 달성 계산
```typescript
// 목표: 90일 안에 레벨 30 달성
const totalDays = 90;
const totalXPNeeded = 28000;
const dailyXPRequired = totalXPNeeded / totalDays; // 311 XP/day

// 일일 퀘스트 구성
interface DailyQuestSet {
  dailyQuests: 4,        // 4개 * 50 XP = 200 XP
  bonusDaily: 1,         // 1개 * 100 XP = 100 XP (선택)
  weeklyProgress: 1/7,   // 500 XP / 7 = 71 XP
  total: 371             // 충분한 여유
}
```

### 3. 레벨별 퀘스트 배분

| 레벨 | 일일 퀘스트 | 주간 챌린지 | 특별 퀘스트 | 일일 평균 XP |
|------|------------|------------|------------|-------------|
| 1-5  | 3개 (40 XP) | 200 XP | - | 148 XP |
| 6-10 | 4개 (50 XP) | 300 XP | 레벨 10: 1000 XP | 243 XP |
| 11-15 | 4개 (60 XP) | 400 XP | - | 297 XP |
| 16-20 | 5개 (70 XP) | 500 XP | 레벨 20: 2000 XP | 421 XP |
| 21-25 | 5개 (80 XP) | 600 XP | - | 486 XP |
| 26-30 | 5개 (100 XP) | 800 XP | 레벨 30: 3000 XP | 614 XP |

### 4. 스트릭 보너스 영향
```typescript
// 스트릭 멀티플라이어 포함 계산
const calculateDailyXP = (baseXP: number, streakDays: number, level: number) => {
  const multiplier = Math.min(streakDays, 5);
  const levelBonus = 1 + (level / 100);
  return baseXP * multiplier * levelBonus;
};

// 예시: 레벨 15, 5일 스트릭
Base: 297 XP
With streak: 297 * 5 * 1.15 = 1,707 XP/day
// 스트릭 유지 시 진행도 대폭 가속
```

## 📊 진행도 시뮬레이션

### 시나리오 1: 성실한 플레이어 (90일 목표)
```
Day 1-30: 레벨 1→12 (일일 퀘스트 80% 완료)
Day 31-60: 레벨 12→22 (스트릭 보너스 활용)
Day 61-90: 레벨 22→30 (특별 퀘스트 포함)
```

### 시나리오 2: 캐주얼 플레이어 (180일 목표)
```
Day 1-60: 레벨 1→10 (일일 퀘스트 50% 완료)
Day 61-120: 레벨 10→20 (주간 챌린지 중심)
Day 121-180: 레벨 20→30 (동기부여로 완료율 상승)
```

### 시나리오 3: 하드코어 플레이어 (60일 목표)
```
Day 1-20: 레벨 1→15 (100% 완료 + 스트릭)
Day 21-40: 레벨 15→25 (긴급 퀘스트 활용)
Day 41-60: 레벨 25→30 (5x 멀티플라이어 유지)
```

## 🎮 밸런싱 권장사항

### 1. XP 보상 조정
```typescript
const QUEST_XP = {
  daily: {
    easy: 30,      // 15분 작업
    medium: 50,    // 30분 작업
    hard: 80,      // 1시간 작업
  },
  weekly: {
    standard: 500, // 주 3-4시간 투자
    challenge: 800 // 주 5-6시간 투자
  },
  special: {
    level10: 1000,  // 중간 마일스톤
    level20: 2000,  // 주요 성과
    level30: 3000   // 최종 목표 달성
  },
  urgent: (base: number) => base * 2  // 시간 제한 보상
};
```

### 2. 일일 퀘스트 생성 규칙
```typescript
const generateDailyQuests = (level: number): Quest[] => {
  const questCount = level < 10 ? 3 : level < 20 ? 4 : 5;
  const difficulty = level < 10 ? 'easy' : level < 20 ? 'medium' : 'hard';
  
  return Array(questCount).fill(null).map(() => ({
    type: 'daily',
    xpReward: QUEST_XP.daily[difficulty],
    estimatedTime: difficulty === 'easy' ? 15 : difficulty === 'medium' ? 30 : 60
  }));
};
```

### 3. 진행도 체크포인트
```typescript
const PROGRESSION_MILESTONES = {
  week1: { targetLevel: 5, totalXP: 1000 },
  week2: { targetLevel: 8, totalXP: 2500 },
  month1: { targetLevel: 12, totalXP: 5000 },
  month2: { targetLevel: 20, totalXP: 14000 },
  month3: { targetLevel: 30, totalXP: 28000 }
};

// 진행도 부족 시 자동 조정
const adjustDifficulty = (currentLevel: number, daysPassed: number) => {
  const expectedLevel = getExpectedLevel(daysPassed);
  if (currentLevel < expectedLevel - 2) {
    // 더 쉬운 퀘스트 제공
    // 보너스 XP 이벤트 제공
  }
};
```

## 💡 핵심 변경사항

1. **XP 공식 변경**: 지수 증가 → 선형 증가 (총 28,000 XP)
2. **일일 목표**: 300-400 XP (스트릭 없이도 달성 가능)
3. **특별 퀘스트**: 레벨 10, 20, 30에 큰 보상
4. **스트릭 보너스**: 선택적 가속 요소 (필수 아님)
5. **난이도 자동 조정**: 진행도에 따라 퀘스트 난이도 조절

## 검증 결과

✅ **3개월(90일) 목표 달성 가능**
- 일일 300 XP 완료 시: 27,000 XP
- 특별 퀘스트 3개: 6,000 XP
- 총합: 33,000 XP (충분한 여유)

✅ **캐주얼 플레이어도 6개월 내 달성 가능**
- 일일 150 XP (50% 완료율)
- 180일 * 150 = 27,000 XP

✅ **하드코어 플레이어는 2개월 내 가능**
- 스트릭 보너스 활용
- 일일 1,500+ XP 가능

---
*이 밸런싱으로 현실적이고 동기부여가 되는 진행 시스템 구현 가능*