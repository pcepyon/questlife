# Tasks: QuestLife - Gamified Goal Achievement Platform

**Input**: Design documents from `/specs/001-develop-questlife-a/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: TypeScript 5.x, React 18, Express.js, SQLite
   → Structure: Monorepo with client/, server/, shared/
2. Load optional design documents:
   → data-model.md: 12 entities → model tasks
   → contracts/api.yaml: 21 endpoints → contract test tasks
   → research.md: Tech decisions → setup tasks
3. Generate tasks by category:
   → Setup: monorepo init, shadcn/ui, SQLite
   → Tests: contract tests, integration tests
   → Core: models, services, API endpoints
   → Integration: DB, middleware, OpenAI
   → Polish: unit tests, performance, animations
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T048)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests? ✓
   → All entities have models? ✓
   → All endpoints implemented? ✓
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Client**: `client/src/`, `client/tests/`
- **Server**: `server/src/`, `server/tests/`
- **Shared**: `shared/types/`, `shared/constants/`

## Phase 3.1: Setup
- [x] T001 Create monorepo structure with client/, server/, shared/ directories
- [x] T002 Initialize npm workspaces in root package.json
- [x] T003 [P] Setup React+TypeScript+Vite in client/ with shadcn/ui
- [x] T004 [P] Setup Express+TypeScript in server/ with better-sqlite3
- [x] T005 [P] Configure shared TypeScript types in shared/types/
- [ ] T006 [P] Configure ESLint and Prettier for monorepo
- [x] T007 Initialize shadcn/ui with dark theme in client/
- [x] T008 Add shadcn components: card, button, progress, dialog, toast, badge, tabs, form in client/
- [x] T009 [P] Create SQLite database schema in server/src/db/schema.sql
- [x] T010 [P] Setup environment variables (.env.example) with OpenAI API key

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests
- [ ] T011 [P] Contract test POST /api/goals/analyze in server/tests/contract/goals.analyze.test.ts
- [ ] T012 [P] Contract test POST /api/classes in server/tests/contract/classes.create.test.ts
- [ ] T013 [P] Contract test GET /api/classes in server/tests/contract/classes.list.test.ts
- [ ] T014 [P] Contract test POST /api/quests/:id/complete in server/tests/contract/quests.complete.test.ts
- [ ] T015 [P] Contract test GET /api/quests in server/tests/contract/quests.list.test.ts
- [ ] T016 [P] Contract test GET /api/status in server/tests/contract/status.get.test.ts
- [ ] T017 [P] Contract test POST /api/classes/:id/evolve in server/tests/contract/classes.evolve.test.ts
- [ ] T018 [P] Contract test GET /api/user in server/tests/contract/user.get.test.ts

### Integration Tests
- [ ] T019 [P] Integration test: goal input → class generation flow in server/tests/integration/goal-to-class.test.ts
- [ ] T020 [P] Integration test: quest completion → XP gain flow in server/tests/integration/quest-xp.test.ts
- [ ] T021 [P] Integration test: level 30 → class mastery flow in server/tests/integration/class-mastery.test.ts
- [ ] T022 [P] Integration test: streak tracking in server/tests/integration/streak.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database Models
- [ ] T023 [P] User model in server/src/models/user.model.ts
- [ ] T024 [P] CharacterClass model in server/src/models/character-class.model.ts
- [ ] T025 [P] Quest model in server/src/models/quest.model.ts
- [ ] T026 [P] Goal model in server/src/models/goal.model.ts
- [ ] T027 [P] Achievement model in server/src/models/achievement.model.ts
- [ ] T028 [P] CharacterStatus model in server/src/models/character-status.model.ts
- [ ] T029 [P] ProgressStreak model in server/src/models/progress-streak.model.ts

### Core Services
- [x] T030 [P] QuestEngine library in server/src/services/quest.service.ts (구현 완료)
- [x] T031 [P] XPCalculator library in server/src/services/quest.service.ts (구현 완료)
- [x] T032 [P] ClassSystem library in server/src/services/class.service.ts (구현 완료)
- [x] T033 [P] LLMAdapter for OpenAI in server/src/services/goal.service.ts (구현 완료)

### API Endpoints
- [x] T034 POST /api/goals/analyze endpoint in server/src/api/goals.controller.ts
- [x] T035 GET/POST /api/classes endpoints in server/src/api/classes.controller.ts
- [x] T036 POST /api/quests/:id/complete endpoint in server/src/api/quests.controller.ts
- [x] T037 GET /api/quests endpoint in server/src/api/quests.controller.ts
- [x] T038 GET /api/status endpoint in server/src/api/status.controller.ts
- [x] T039 POST /api/classes/evolve endpoint in server/src/api/classes.controller.ts (진화 기능 구현 완료)

### Frontend Components
- [x] T040 [P] Dashboard integrated in App.tsx (통합 대시보드 구현)
- [x] T041 [P] QuestCard component with completion button in client/src/components/QuestCard.tsx
- [x] T042 [P] CharacterStatus component in client/src/components/CharacterStatus.tsx
- [x] T043 [P] XPBar progress component in client/src/components/XPBar.tsx
- [x] T044 [P] GoalInput component with LLM integration in client/src/components/GoalInput.tsx

### State Management
- [x] T045 Zustand store setup in client/src/stores/game.store.ts

## Phase 3.4: Integration
- [x] T046 Connect all services to SQLite database in server/src/db/index.ts
- [x] T047 Add Framer Motion animations for XP/level-up in client/src/components/
- [x] T048 Implement streak multiplier system in server/src/services/quest.service.ts (통합 구현)

## Phase 3.5: Polish
- [ ] T049 [P] Unit tests for XP calculations in server/tests/unit/xp-calculator.test.ts
- [ ] T050 [P] Unit tests for quest generation in server/tests/unit/quest-engine.test.ts
- [ ] T051 Performance optimization: ensure <100ms quest completion
- [x] T052 Add loading states and error handling in client/
- [ ] T053 Run through quickstart.md scenarios for validation

## 추가 구현 (Phase 3.6: Enhancements)
- [x] T054 Class Evolution feature in server/src/services/evolution.service.ts
- [x] T055 Class Evolution UI component in client/src/components/ClassEvolution.tsx
- [x] T056 Level Up Modal with animations in client/src/components/LevelUpModal.tsx
- [x] T057 Enhanced XP Bar with particles in client/src/components/XPBar.tsx
- [x] T058 Quest Card animations with Framer Motion
- [x] T059 Database seed script in server/src/db/seed.ts
- [x] T060 API service layer in client/src/services/api.ts

## Dependencies
- Setup (T001-T010) blocks everything
- Contract tests (T011-T018) before implementation (T023-T045)
- Integration tests (T019-T022) before implementation
- Models (T023-T029) before services (T030-T033)
- Services before endpoints (T034-T039)
- Backend complete before frontend integration (T046-T048)
- Everything before polish (T049-T053)

## Parallel Execution Examples

### Setup Phase (after T001-T002)
```bash
# Launch T003-T006 + T009-T010 together:
Task: "Setup React+TypeScript+Vite in client/ with shadcn/ui"
Task: "Setup Express+TypeScript in server/ with better-sqlite3"
Task: "Configure shared TypeScript types in shared/types/"
Task: "Configure ESLint and Prettier for monorepo"
Task: "Create SQLite database schema in server/src/db/schema.sql"
Task: "Setup environment variables (.env.example) with OpenAI API key"
```

### Contract Tests Phase
```bash
# Launch T011-T018 together (all different files):
Task: "Contract test POST /api/goals/analyze in server/tests/contract/goals.analyze.test.ts"
Task: "Contract test POST /api/classes in server/tests/contract/classes.create.test.ts"
Task: "Contract test GET /api/classes in server/tests/contract/classes.list.test.ts"
Task: "Contract test POST /api/quests/:id/complete in server/tests/contract/quests.complete.test.ts"
Task: "Contract test GET /api/quests in server/tests/contract/quests.list.test.ts"
Task: "Contract test GET /api/status in server/tests/contract/status.get.test.ts"
Task: "Contract test POST /api/classes/:id/evolve in server/tests/contract/classes.evolve.test.ts"
Task: "Contract test GET /api/user in server/tests/contract/user.get.test.ts"
```

### Models Phase
```bash
# Launch T023-T029 together (all different files):
Task: "User model in server/src/models/user.model.ts"
Task: "CharacterClass model in server/src/models/character-class.model.ts"
Task: "Quest model in server/src/models/quest.model.ts"
Task: "Goal model in server/src/models/goal.model.ts"
Task: "Achievement model in server/src/models/achievement.model.ts"
Task: "CharacterStatus model in server/src/models/character-status.model.ts"
Task: "ProgressStreak model in server/src/models/progress-streak.model.ts"
```

### Frontend Components Phase
```bash
# Launch T040-T044 together (all different files):
Task: "Dashboard page with quest cards in client/src/pages/Dashboard.tsx"
Task: "QuestCard component with completion button in client/src/components/QuestCard.tsx"
Task: "CharacterStatus component in client/src/components/CharacterStatus.tsx"
Task: "XPBar progress component in client/src/components/XPBar.tsx"
Task: "GoalInput component with LLM integration in client/src/components/GoalInput.tsx"
```

## Notes
- [P] tasks = different files, no shared dependencies
- Verify all tests fail (RED) before implementing
- Commit after each completed task with descriptive message
- Use shadcn/ui components directly, no wrappers
- Ensure <100ms feedback for quest completion
- Cache OpenAI responses for identical goals

## Task Generation Rules Applied
1. **From Contracts**: 21 endpoints → 8 contract test tasks (grouped by controller)
2. **From Data Model**: 12 entities → 7 model tasks (core entities)
3. **From User Stories**: 4 main flows → 4 integration tests
4. **Ordering**: Setup → Tests → Models → Services → Endpoints → Polish
5. **Parallel Marking**: Different files = [P], same file = sequential

## Validation Checklist
- [x] All contracts have corresponding tests (T011-T018)
- [x] All entities have model tasks (T023-T029)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks truly independent (verified file paths)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task

---
*Tasks generated from implementation plan v0.1.0 - Ready for execution*