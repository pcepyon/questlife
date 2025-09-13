# Claude Code Context - QuestLife

## Project Overview
QuestLife is a gamified goal achievement platform that transforms personal development into an RPG adventure. Users enter goals in natural language, which are transformed into character classes with quests, levels, and evolution paths.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, Framer Motion
- **Backend**: Node.js, Express.js, TypeScript, better-sqlite3
- **AI**: OpenAI GPT-4o-mini for goal analysis
- **Database**: SQLite (local file-based)
- **Testing**: Vitest (frontend), Jest (backend)
- **I18n**: React-i18next (Korean localization)

## Project Structure
```
questlife/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # shadcn/ui + custom components
│   │   ├── pages/      # Route pages
│   │   ├── stores/     # Zustand state management
│   │   ├── lib/        # Utilities
│   │   └── services/   # API client
│   └── tests/
├── server/              # Express backend
│   ├── src/
│   │   ├── api/        # REST endpoints
│   │   ├── services/   # Business logic
│   │   ├── models/     # Data models
│   │   ├── db/         # Database setup
│   │   └── lib/        # Core libraries
│   └── tests/
└── shared/              # Shared TypeScript types
```

## Key Commands
```bash
# Development
npm run dev              # Start both frontend and backend
npm run client:dev       # Frontend only
npm run server:dev       # Backend only

# Database
npm run db:init          # Initialize database
npm run db:reset         # Reset database
npm run db:seed          # Add sample data

# Testing
npm test                 # Run all tests
npm run test:api        # API contract tests
npm run test:e2e        # End-to-end tests

# Code quality
npm run lint            # ESLint
npm run format          # Prettier
npm run typecheck       # TypeScript check
```

## Core Features
1. **Goal Analysis**: Natural language → RPG class generation via LLM
2. **Quest System**: Daily/weekly/special quests with XP rewards
3. **Character Progression**: Levels 1-30, skill trees, attributes
4. **Class Evolution**: Combine two level-30 classes
5. **Streak System**: XP multipliers (up to 5x) for consecutive days
6. **Character Status**: Strength, wisdom, creativity attributes

## Database Schema
- `users`: User profiles and settings
- `character_classes`: RPG classes (level 1-30)
- `quests`: All quest types with XP rewards
- `goals`: User goals and milestones
- `character_status`: Attributes and power level
- `progress_streaks`: Streak tracking and multipliers

## API Endpoints
- `POST /api/goals/analyze` - Generate class from goal
- `GET/POST /api/classes` - Manage character classes
- `POST /api/quests/:id/complete` - Complete quest, gain XP
- `GET /api/status` - Character status window
- `POST /api/classes/:id/evolve` - Evolve classes at level 30

## UI Components (shadcn/ui)
- `Card` - Quest cards, class cards
- `Progress` - XP bars, level progression
- `Toast` - Quest completion feedback
- `Dialog` - Class modification, evolution
- `Button` - All interactive elements

## State Management (Zustand)
```typescript
// Main store slices
- user: Current user and settings
- classes: Character classes
- quests: Active and completed quests
- status: Character attributes
- ui: UI state (modals, toasts)
```

## Testing Strategy
1. Contract tests first (API schemas)
2. Integration tests (user flows)
3. E2E tests (critical paths)
4. Unit tests (calculations)

## Recent Changes
- [2025-09-13] Korean localization planning (i18n setup)
- [2025-09-10] Defined data model and API contracts
- [2025-09-10] Created implementation plan with shadcn/ui focus

## Development Focus
- Use shadcn/ui components directly, no wrappers
- Animations with Framer Motion for XP/level-ups
- Local SQLite for simplicity (no cloud services)
- TDD approach: tests before implementation

## Environment Variables
```env
OPENAI_API_KEY=sk-...    # Required for goal analysis
DATABASE_PATH=./data/questlife.db
PORT=3000
NODE_ENV=development
```

---
*Context for Claude Code. Keep under 150 lines for efficiency.*