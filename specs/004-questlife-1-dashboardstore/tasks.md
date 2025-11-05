# Tasks: QuestLife Data Persistence and API Integration

**Input**: Design documents from `/specs/004-questlife-1-dashboardstore/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app structure**: `client/src/`, `server/src/`, `shared/`
- Existing QuestLife repository structure will be used

## Phase 3.1: Setup & Infrastructure
- [ ] T001 Create database migration for dashboard cache table in server/src/db/migrations/
- [ ] T002 [P] Install retry-axios for exponential backoff in client
- [ ] T003 [P] Create API client base with auth headers in client/src/services/api-client.ts
- [ ] T004 [P] Create transaction wrapper utility in server/src/db/transaction.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T005 [P] Contract test GET /api/dashboard in server/tests/contract/test_dashboard_get.test.ts
- [ ] T006 [P] Contract test POST /api/dashboard/quick-complete in server/tests/contract/test_quick_complete.test.ts
- [ ] T007 [P] Contract test POST /api/goals in server/tests/contract/test_goals_create.test.ts
- [ ] T008 [P] Contract test POST /api/classes in server/tests/contract/test_classes_create.test.ts
- [ ] T009 [P] Integration test dashboard data persistence in server/tests/integration/test_dashboard_persistence.test.ts
- [ ] T010 [P] Integration test quest completion saga in server/tests/integration/test_quest_completion_saga.test.ts
- [ ] T011 [P] Integration test goal creation with class generation in server/tests/integration/test_goal_class_creation.test.ts
- [ ] T012 [P] E2E test dashboard refresh persistence in client/tests/e2e/test_dashboard_refresh.test.tsx
- [ ] T013 [P] E2E test multi-tab synchronization in client/tests/e2e/test_multi_tab_sync.test.tsx

## Phase 3.3: Backend Core Implementation (ONLY after tests are failing)
- [ ] T014 DashboardCache model in server/src/models/dashboard-cache.ts
- [ ] T015 QuestCompletion model in server/src/models/quest-completion.ts
- [ ] T016 [P] Dashboard service with caching logic in server/src/services/dashboard.service.ts
- [ ] T017 [P] Quest completion service with saga pattern in server/src/services/quest-completion.service.ts
- [ ] T018 [P] Goal service with class generation in server/src/services/goal.service.ts
- [ ] T019 GET /api/dashboard endpoint in server/src/api/dashboard/get-dashboard.ts
- [ ] T020 POST /api/dashboard/quick-complete endpoint in server/src/api/dashboard/quick-complete.ts
- [ ] T021 POST /api/goals endpoint in server/src/api/goals/create-goal.ts
- [ ] T022 POST /api/classes endpoint in server/src/api/classes/create-class.ts
- [ ] T023 Add authentication middleware to new endpoints in server/src/middleware/auth.ts
- [ ] T024 Add cache invalidation logic to mutation endpoints

## Phase 3.4: Frontend Store Updates
- [ ] T025 Replace mock data in client/src/stores/dashboardStore.ts with API calls
- [ ] T026 Add API integration to client/src/stores/questStore.ts for quest completion
- [ ] T027 Add goal creation API call to client/src/stores/goalStore.ts
- [ ] T028 Add class creation API call to client/src/stores/classStore.ts
- [ ] T029 Implement optimistic updates in client/src/stores/dashboardStore.ts
- [ ] T030 [P] Add cross-tab synchronization listener in client/src/hooks/useTabSync.ts
- [ ] T031 [P] Create retry logic with exponential backoff in client/src/utils/retry.ts
- [ ] T032 Add error recovery state management in client/src/stores/errorStore.ts

## Phase 3.5: Integration & Data Flow
- [ ] T033 Connect dashboard component to real API in client/src/pages/DashboardPage.tsx
- [ ] T034 Update quest completion UI to use persistence in client/src/components/QuestCard.tsx
- [ ] T035 Connect goal creation form to backend in client/src/components/GoalForm.tsx
- [ ] T036 Update first class creation flow in client/src/pages/QuestPage.tsx
- [ ] T037 Add loading states to all API-connected components
- [ ] T038 Implement error boundaries in client/src/components/ErrorBoundary.tsx

## Phase 3.6: Polish & Performance
- [ ] T039 [P] Add database indexes for dashboard queries in server/src/db/indexes.sql
- [ ] T040 [P] Unit test cache invalidation logic in server/tests/unit/test_cache.test.ts
- [ ] T041 [P] Unit test retry logic in client/tests/unit/test_retry.test.ts
- [ ] T042 [P] Unit test XP calculation with multipliers in server/tests/unit/test_xp_calc.test.ts
- [ ] T043 Performance test dashboard load time (<1s) in server/tests/performance/test_dashboard_load.test.ts
- [ ] T044 Performance test quest completion response (<500ms) in server/tests/performance/test_quest_complete.test.ts
- [ ] T045 Update CLAUDE.md with data persistence implementation details
- [ ] T046 Run all quickstart.md scenarios for validation

## Dependencies
- Tests (T005-T013) must complete before implementation (T014-T038)
- T014-T015 (models) before T016-T018 (services)
- T016-T018 (services) before T019-T024 (endpoints)
- T019-T024 (backend) before T025-T032 (frontend stores)
- T025-T032 (stores) before T033-T038 (UI integration)
- All implementation before polish (T039-T046)

## Parallel Execution Examples

### Parallel Group 1: Contract Tests (T005-T008)
```bash
# Can run all contract tests simultaneously
Task: "Contract test GET /api/dashboard"
Task: "Contract test POST /api/dashboard/quick-complete"
Task: "Contract test POST /api/goals"
Task: "Contract test POST /api/classes"
```

### Parallel Group 2: Integration Tests (T009-T011)
```bash
# Can run all integration tests simultaneously
Task: "Integration test dashboard data persistence"
Task: "Integration test quest completion saga"
Task: "Integration test goal creation with class generation"
```

### Parallel Group 3: Services (T016-T018)
```bash
# Can implement services in parallel after models
Task: "Dashboard service with caching logic"
Task: "Quest completion service with saga pattern"
Task: "Goal service with class generation"
```

### Parallel Group 4: Frontend Utilities (T030-T031)
```bash
# Can create utilities simultaneously
Task: "Add cross-tab synchronization listener"
Task: "Create retry logic with exponential backoff"
```

### Parallel Group 5: Performance & Unit Tests (T039-T042)
```bash
# Can run all unit/performance tests together
Task: "Add database indexes for dashboard queries"
Task: "Unit test cache invalidation logic"
Task: "Unit test retry logic"
Task: "Unit test XP calculation with multipliers"
```

## Notes
- [P] tasks = different files, no shared dependencies
- Contract tests must fail before implementation
- Commit after each task with descriptive message
- Use existing QuestLife codebase structure
- Maintain backward compatibility with existing features
- All API calls must include JWT authentication
- Cache TTL is 5 minutes for dashboard data

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (T005-T008)
- [x] All entities have model tasks (T014-T015)
- [x] All tests come before implementation (T005-T013 before T014-T038)
- [x] Parallel tasks truly independent (verified)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Dashboard endpoint covered (T005, T019)
- [x] Quick complete endpoint covered (T006, T020)
- [x] Goal creation endpoint covered (T007, T021)
- [x] Class creation endpoint covered (T008, T022)
- [x] All quickstart scenarios have corresponding tests

## Task Count Summary
- Setup: 4 tasks
- Tests: 9 tasks (all marked for TDD)
- Backend Implementation: 11 tasks
- Frontend Implementation: 8 tasks
- Integration: 6 tasks
- Polish: 8 tasks
- **Total: 46 tasks**

## Estimated Timeline
- Phase 3.1 (Setup): 1 hour
- Phase 3.2 (Tests): 3 hours
- Phase 3.3 (Backend): 4 hours
- Phase 3.4 (Frontend): 3 hours
- Phase 3.5 (Integration): 2 hours
- Phase 3.6 (Polish): 2 hours
- **Total: ~15 hours**

---
*Tasks generated from specifications in `/specs/004-questlife-1-dashboardstore/`*
*Ready for execution following TDD principles*