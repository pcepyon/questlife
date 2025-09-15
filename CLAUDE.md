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
│   │   ├── pages/      # Multi-page structure (NEW)
│   │   ├── stores/     # Zustand state management
│   │   ├── hooks/      # Auth hooks (NEW)
│   │   ├── lib/        # Utilities
│   │   └── services/   # API client
│   └── tests/
├── server/              # Express backend
│   ├── src/
│   │   ├── api/        # REST endpoints
│   │   ├── services/   # Business logic
│   │   ├── models/     # Data models
│   │   ├── middleware/ # Auth middleware (NEW)
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
1. **PIN Authentication**: 4-6 digit PIN with JWT sessions (NEW)
2. **Dashboard-First**: Main hub for daily quest management (NEW)
3. **Goal Analysis**: Natural language → RPG class generation via LLM
4. **Quest System**: Daily/weekly/special quests with XP rewards
5. **Character Progression**: Levels 1-30, skill trees, attributes
6. **Class Evolution**: Combine two level-30 classes
7. **Streak System**: 3x XP multipliers for consecutive days
8. **Korean UI**: Complete Korean localization (i18n)

## Database Schema
- `users`: User profiles with PIN settings
- `user_sessions`: PIN auth sessions (NEW)
- `navigation_state`: Tab navigation tracking (NEW)
- `dashboard_cache`: Performance optimization (NEW)
- `character_classes`: RPG classes (level 1-30)
- `quests`: All quest types with XP rewards
- `goals`: User goals with CRUD support
- `character_status`: Attributes and power level
- `progress_streaks`: Streak tracking and multipliers

## API Endpoints
- `POST /api/auth/setup-pin` - Initial PIN setup (NEW)
- `POST /api/auth/verify-pin` - PIN verification (NEW)
- `GET /api/dashboard` - Aggregated dashboard data (NEW)
- `POST /api/dashboard/quick-complete` - Quick quest completion (NEW)
- `POST /api/goals/analyze` - Generate class from goal
- `PATCH/DELETE /api/goals/:id` - Goal CRUD operations (NEW)
- `GET/POST /api/classes` - Manage character classes
- `POST /api/quests/:id/complete` - Complete quest, gain XP
- `GET /api/quests/history` - Quest history (NEW)

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
- [2025-09-13] QuestLife 2.0 - Dashboard-centered redesign with PIN auth
- [2025-09-13] Added navigation system and onboarding flow
- [2025-09-12] Korean localization completed (branch 002)

## Development Focus
- **Current Priority**: PIN auth → Navigation → Dashboard → UI enhancements
- **UI Approach**: Dashboard-first, Korean-first interface
- **Navigation**: React Router v6 with 4 main tabs
- **Performance**: Dashboard caching, quick quest completion
- **Testing**: TDD with contract tests first
- **Components**: shadcn/ui directly, no wrappers

## Environment Variables
```env
OPENAI_API_KEY=sk-...    # Required for goal analysis
DATABASE_PATH=./data/questlife.db
PORT=3000
NODE_ENV=development
```

---
*Context for Claude Code. Keep under 150 lines for efficiency.*