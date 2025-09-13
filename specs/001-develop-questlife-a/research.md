# Research Document: QuestLife Implementation

**Date**: 2025-09-10  
**Feature**: QuestLife - Gamified Goal Achievement Platform

## Research Areas

### 1. shadcn/ui Theming for RPG Dark Theme

**Decision**: Use CSS variables with custom color palette  
**Rationale**: 
- shadcn/ui uses CSS variables for theming, making it easy to customize
- Dark theme as base aligns with RPG aesthetic
- Can define custom colors for XP (gold), success (green), danger (red)

**Implementation approach**:
```css
/* Custom RPG theme colors */
--primary: 47 100% 50%; /* Gold for XP */
--success: 142 76% 36%; /* Green for quest completion */
--mana: 217 91% 60%; /* Blue for special abilities */
--epic: 271 91% 65%; /* Purple for rare items */
```

**Alternatives considered**:
- Material-UI: More opinionated, harder to customize
- Ant Design: Not as modern, larger bundle size
- Custom components: Too time-consuming for MVP

### 2. SQLite Schema for Quest/Class Hierarchy

**Decision**: Normalized relational schema with junction tables  
**Rationale**:
- SQLite handles foreign keys and joins efficiently
- Hierarchical data (quests under classes) maps well to parent-child relationships
- Better-sqlite3 provides synchronous API, simpler than async alternatives

**Schema approach**:
```sql
-- Core tables
users (id, created_at, settings)
character_classes (id, user_id, name, level, xp, status)
quests (id, class_id, type, title, xp_reward, status)
class_evolutions (id, base_class_id, evolved_class_id)

-- Support tables
achievements (id, user_id, type, unlocked_at)
progress_streaks (id, user_id, streak_count, multiplier)
character_attributes (id, user_id, strength, wisdom, creativity)
```

**Alternatives considered**:
- NoSQL (MongoDB): Overkill for single-user MVP
- JSON in SQLite: Less efficient for queries
- PostgreSQL: Unnecessary complexity for local storage

### 3. OpenAI GPT-4o-mini Prompt Engineering

**Decision**: Structured JSON prompts with few-shot examples  
**Rationale**:
- GPT-4o-mini is cost-effective for goal analysis
- JSON output mode ensures consistent parsing
- Few-shot examples improve quality

**Prompt template**:
```javascript
const systemPrompt = `You are a game master creating RPG character classes from personal goals.
Output JSON with: className, description, targetLevel, dailyQuests, weeklyChallenge, ultimateGoal, evolutionPaths.

Example:
Goal: "I want to learn AI"
Output: {
  "className": "AI Scholar",
  "description": "Master of machine learning and neural networks",
  "targetLevel": 25,
  "dailyQuests": ["Read 1 AI paper", "Code 30 min of ML", "Practice math problems"],
  "weeklyChallenge": "Complete one Kaggle competition task",
  "ultimateGoal": "Deploy an AI model to production",
  "evolutionPaths": ["AI Scholar + Web Developer = AI Product Creator"]
}`;
```

**Alternatives considered**:
- GPT-4: More expensive, marginal quality improvement
- Claude: No structured output mode
- Local LLMs: Insufficient quality for creative generation

### 4. Framer Motion with React 18

**Decision**: Use Framer Motion for XP animations, CSS for simple transitions  
**Rationale**:
- Framer Motion excels at complex animations (XP bars, level-ups)
- CSS transitions handle hover states and simple animations
- React 18's automatic batching improves animation performance

**Animation patterns**:
```jsx
// XP gain animation
<motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: "spring", stiffness: 260, damping: 20 }}
>
  +{xpGained} XP
</motion.div>

// Progress bar animation
<motion.div
  style={{ width: `${progress}%` }}
  transition={{ duration: 0.5, ease: "easeOut" }}
/>
```

**Alternatives considered**:
- React Spring: More complex API
- CSS only: Limited for dynamic animations
- Lottie: Overkill for simple animations

### 5. Zustand State Management

**Decision**: Single store with slices for different domains  
**Rationale**:
- Zustand is lightweight (8kb) and simple
- TypeScript support is excellent
- Devtools integration for debugging

**Store structure**:
```typescript
interface GameState {
  // User slice
  user: User;
  
  // Character slice
  currentClass: CharacterClass;
  classes: CharacterClass[];
  
  // Quest slice
  activeQuests: Quest[];
  completedQuests: Quest[];
  
  // Actions
  completeQuest: (questId: string) => void;
  levelUp: () => void;
  evolveClass: (baseId: string, targetId: string) => void;
}
```

**Alternatives considered**:
- Redux Toolkit: Too complex for game state
- Context API: Performance issues with frequent updates
- Valtio: Less mature ecosystem

## Technical Decisions Summary

| Area | Choice | Key Benefit |
|------|--------|-------------|
| UI Framework | shadcn/ui + Tailwind | Customizable, modern, small bundle |
| Database | SQLite + better-sqlite3 | Simple, local, synchronous |
| LLM | OpenAI GPT-4o-mini | Cost-effective, JSON mode |
| Animations | Framer Motion + CSS | Performance, flexibility |
| State | Zustand | Simple, TypeScript-friendly |
| Monorepo | npm workspaces | Native, no extra tools |
| Testing | Vitest + Jest | Fast, familiar |

## Performance Considerations

1. **Database indexing**: Index on frequently queried columns (user_id, class_id, status)
2. **API response caching**: Cache LLM responses for identical goals
3. **Animation throttling**: Limit concurrent animations to maintain 60fps
4. **Lazy loading**: Load quests and achievements on demand
5. **Bundle splitting**: Separate vendor chunks, lazy load routes

## Security Considerations

1. **Input sanitization**: Validate all user input before LLM processing
2. **API key management**: Store OpenAI key in environment variables
3. **SQL injection prevention**: Use prepared statements with better-sqlite3
4. **XSS prevention**: Sanitize LLM responses before rendering
5. **Rate limiting**: Limit LLM API calls per session

## Rapid MVP Implementation Strategy

### Week 1: Foundation (Days 1-3)
```bash
# Day 1: Setup
npx create-vite@latest client --template react-ts
npx express-generator-typescript server
npx shadcn-ui@latest init

# Day 2: Database + Core API
npm install better-sqlite3
# Create schema with optimized indexes
# Implement /api/goals/analyze with caching
# Implement /api/quests/complete with XP formula

# Day 3: Basic UI
npx shadcn-ui@latest add card button progress dialog toast
# Create Dashboard, QuestCard, CharacterStatus components
# Wire up Zustand store
```

### Week 1: Core Features (Days 4-7)
- Quest completion flow with animations
- Streak tracking and multipliers
- Level progression system
- Character status window

### Week 2: Polish & Launch
- Class evolution UI
- Skill tree visualization
- Achievement system
- Performance optimization

### shadcn/ui Component Usage

| Feature | shadcn Components | Custom Styling |
|---------|------------------|----------------|
| Dashboard | Card, Tabs, Separator | Dark theme, gold accents |
| Quest Card | Card, Badge, Progress, Button | Hover glow effect |
| XP Animation | Toast + Framer Motion | Particle effects |
| Level Up | Dialog, Progress, Button | Confetti animation |
| Character Status | Card, Avatar, Label | RPG frame borders |
| Class Evolution | AlertDialog, RadioGroup | Epic purple glow |
| Settings | Form, Switch, Select | Minimal changes |

### Critical Path for MVP

1. **Goal → Class Generation** (Day 2)
   - Single OpenAI call
   - Cache responses
   - Return in <2 seconds

2. **Quest Completion → XP** (Day 3)
   - Instant feedback (<100ms)
   - XP formula: `base * min(streak, 5) * (1 + level/100)`
   - Update progress bars

3. **Daily Active Use** (Day 4-5)
   - Morning quest generation
   - Evening completion ritual
   - Streak maintenance

### Performance Targets

- Initial load: <1 second
- Quest completion: <100ms feedback
- API calls: <2 second response
- Animations: Consistent 60fps
- Bundle size: <200KB initial

## Next Steps

1. Create data model documentation ✅
2. Design API contracts ✅
3. Set up monorepo structure
4. Initialize shadcn/ui components
5. Create database schema
6. Implement core game mechanics

---
*Research completed for Phase 0 of implementation plan*