# Data Model: Korean Localization

## Overview
Korean localization implementation maintains existing data structures while adding translation layer. No database schema changes required.

## Translation Entities

### 1. TranslationKey
```typescript
interface TranslationKey {
  key: string;           // Unique identifier (e.g., "quest.daily.title")
  namespace: string;     // Category (common, quests, classes, errors, gaming)
  ko: string;           // Korean translation
  en?: string;          // Optional English reference
  context?: string;     // Usage context for translators
}
```

### 2. LocaleConfig
```typescript
interface LocaleConfig {
  locale: 'ko';                    // Fixed to Korean
  dateFormat: 'YYYY년 MM월 DD일';   // Korean date format
  numberFormat: 'international';    // 1,234 format
  mixedTerms: string[];             // Gaming terms to keep in English
}
```

### 3. TranslatedContent
```typescript
interface TranslatedContent {
  original: string;      // Original English content
  translated: string;    // Korean translation
  hybrid?: string;      // Mixed Korean-English for gaming terms
  timestamp: Date;      // When translated
}
```

## Existing Entity Modifications

### 1. Quest (Display Layer)
```typescript
interface QuestDisplay extends Quest {
  // Original fields remain unchanged in DB
  // Display layer adds:
  titleKo: string;
  descriptionKo: string;
  rewardTextKo: string;
}
```

### 2. CharacterClass (Display Layer)
```typescript
interface CharacterClassDisplay extends CharacterClass {
  // Original fields remain unchanged in DB
  // Display layer adds:
  nameKo: string;          // e.g., "마법사 Wizard"
  descriptionKo: string;
  skillNamesKo: string[];
}
```

### 3. CharacterStatus (Display Layer)
```typescript
interface CharacterStatusDisplay extends CharacterStatus {
  // Attribute display mapping
  attributeLabels: {
    strength: '힘 (STR)';
    wisdom: '지혜 (INT)';
    creativity: '창의력 (CRE)';
  };
}
```

## Translation Namespaces

### common.json
- UI buttons: 시작, 완료, 취소, 저장
- Navigation: 홈, 퀘스트, 캐릭터, 설정
- Forms: labels, placeholders, validation

### quests.json
- Quest types: 일일 퀘스트, 주간 퀘스트, 특별 퀘스트
- Completion messages
- Reward descriptions

### classes.json
- Class names (Korean + English hybrid)
- Class descriptions
- Evolution paths
- Skill names

### errors.json
- Validation errors
- System errors
- Network errors

### gaming.json
- Terms to keep in English
- XP/Level notifications
- Streak messages

## State Management Updates

### Zustand Store Slice
```typescript
interface I18nSlice {
  locale: 'ko';
  translations: Map<string, string>;
  loadTranslations: (namespace: string) => Promise<void>;
  t: (key: string, params?: object) => string;
  formatDate: (date: Date) => string;
  formatNumber: (num: number) => string;
}
```

## API Response Transformation

### Response Middleware
```typescript
interface LocalizedResponse<T> {
  data: T;
  locale: 'ko';
  translations?: {
    [key: string]: string;
  };
}
```

## Validation Rules

### Translation Keys
- Must follow namespace.category.item pattern
- Maximum 100 characters per translation
- No HTML in translations (use React components)

### Mixed Text Rules
- Gaming terms from approved list remain English
- Korean text first, English term in parentheses when needed
- Example: "레벨 30 달성" not "Level 30 달성"

### Character Limits
- Button text: max 10 Korean characters
- Toast messages: max 50 Korean characters  
- Descriptions: max 200 Korean characters

## Migration Strategy

No database migration required. Translation layer operates at:
1. API response level (backend)
2. Component render level (frontend)
3. User input processing (goal analysis)

## Data Flow

1. **Storage**: English in database
2. **API**: Adds locale context to responses
3. **Frontend**: Applies translations before render
4. **Display**: Mixed Korean-English per gaming conventions
5. **Input**: Korean input → English storage → Korean display

## Performance Considerations

- Translations cached in memory
- Lazy load namespaces as needed
- Single translation bundle (~50KB compressed)
- No runtime translation API calls

## Testing Data

### Test Fixtures
```typescript
const testTranslations = {
  'common.button.start': '시작',
  'quest.daily.title': '일일 퀘스트',
  'class.warrior.name': '전사 Warrior',
  'error.required': '필수 입력 항목입니다'
};
```

### Edge Cases
- Very long Korean text in buttons
- Mixed script rendering (Korean + English + numbers)
- Date formatting edge cases (year boundaries)
- Number formatting (large numbers, decimals)