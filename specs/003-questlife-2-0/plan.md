# Implementation Plan: QuestLife 2.0 - Daily Quest Management Dashboard

**Branch**: `003-questlife-2-0` | **Date**: 2025-09-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-questlife-2-0/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

## Summary
Enhance existing QuestLife RPG goal management system with dashboard-centered interface, PIN authentication, and improved quest management workflows, building upon Korean localization from branch 002.

## Technical Context
**Language/Version**: TypeScript 5.5, Node.js 20+
**Primary Dependencies**: React 18, Express.js, SQLite3, shadcn/ui, Zustand, Framer Motion, i18next
**Storage**: SQLite (local file-based at ./data/questlife.db)
**Testing**: Vitest (frontend), custom test runners (backend)
**Target Platform**: Web browser (desktop + mobile responsive)
**Project Type**: web (frontend + backend monorepo)
**Performance Goals**: <200ms dashboard load, 60fps animations, instant quest completion feedback
**Constraints**: Local-only data, single user, no cloud services, Korean-first UI
**Scale/Scope**: 1 user, ~20 screens, 10k+ quests lifetime
**User Context**: 현재 구현되어있는 프로덕트를 기준으로 추가 기능을 작성. 002에서 한국어 작업한 것을 고려해서 추가 기능도 한국어를 기반으로 작성.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 3 (client, server, shared)
- Using framework directly? YES (shadcn/ui components, no wrappers)
- Single data model? YES (shared types between client/server)
- Avoiding patterns? YES (direct database access, no repository pattern)

**Architecture**:
- EVERY feature as library? N/A (existing monorepo structure)
- Libraries listed: client, server, shared packages
- CLI per library: npm scripts for db management, dev, build
- Library docs: README.md exists, CLAUDE.md to be updated

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES
- Git commits show tests before implementation? YES
- Order: Contract→Integration→E2E→Unit strictly followed? YES
- Real dependencies used? YES (SQLite, actual API calls)
- Integration tests for: new endpoints, schema changes, auth flow
- FORBIDDEN: Implementation before test

**Observability**:
- Structured logging included? YES (server logger exists)
- Frontend logs → backend? Partial (error reporting exists)
- Error context sufficient? YES

**Versioning**:
- Version number assigned? 0.1.0 → 0.2.0
- BUILD increments on every change? Via git commits
- Breaking changes handled? No breaking changes (additive only)

## Project Structure

### Documentation (this feature)
```
specs/003-questlife-2-0/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── auth.yaml       # PIN authentication endpoints
│   ├── dashboard.yaml  # Dashboard data endpoints
│   └── navigation.yaml # Navigation state endpoints
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (SELECTED - existing structure)
questlife/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/ # shadcn/ui + custom components
│   │   ├── pages/     # NEW: Multi-page structure
│   │   ├── stores/    # Zustand state management
│   │   ├── hooks/     # NEW: Auth hooks
│   │   └── services/  # API client
│   └── tests/
├── server/              # Express backend
│   ├── src/
│   │   ├── api/       # REST endpoints
│   │   ├── services/  # Business logic
│   │   ├── models/    # Data models
│   │   ├── middleware/# NEW: Auth middleware
│   │   └── db/        # Database setup
│   └── tests/
└── shared/              # Shared TypeScript types
    └── types/          # Extended with auth types
```

**Structure Decision**: Option 2 (Web application) - matches existing monorepo

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context**:
   - PIN storage security best practices
   - Session management in localStorage
   - React Router v6 navigation patterns
   - Dashboard performance optimization
   - Mobile-first responsive design patterns

2. **Research completed**:
   - Existing codebase fully analyzed
   - Korean localization (i18n) already implemented
   - Database schema comprehensive
   - API layer complete for core features
   - Missing: PIN auth, navigation, dashboard layout

3. **Consolidate findings** in `research.md`:
   - Decision: Build on existing foundation
   - Rationale: 70% features already implemented
   - Focus: Authentication, navigation, UI reorganization

**Output**: research.md with implementation approach

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extend entities in** `data-model.md`:
   - user_sessions table (PIN hash, last_activity, device_id)
   - navigation_state (current_tab, breadcrumbs)
   - dashboard_cache (computed values for performance)

2. **Generate API contracts** for new features:
   - POST /api/auth/setup-pin - Initial PIN setup
   - POST /api/auth/verify-pin - PIN verification
   - POST /api/auth/logout - Session termination
   - GET /api/dashboard - Aggregated dashboard data
   - GET /api/navigation - Navigation state
   - PATCH /api/goals/:id - Goal updates
   - DELETE /api/goals/:id - Goal deletion

3. **Generate contract tests**:
   - auth.test.ts - PIN setup/verify/logout
   - dashboard.test.ts - Dashboard data aggregation
   - goals-crud.test.ts - Complete CRUD operations

4. **Extract test scenarios**:
   - Onboarding flow E2E test
   - Dashboard daily usage test
   - Quest completion workflow test
   - Navigation between sections test

5. **Update CLAUDE.md**:
   - Add PIN authentication context
   - Dashboard-first workflow emphasis
   - Korean UI considerations
   - Navigation patterns

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load existing implementation context
- Generate incremental tasks for missing features
- Prioritize: Auth → Navigation → Dashboard → Enhancements
- Each new endpoint → contract test + implementation
- Each UI section → component + integration test

**Ordering Strategy**:
1. PIN authentication system (foundation)
2. Navigation infrastructure (routing)
3. Dashboard aggregation (performance)
4. UI reorganization (user experience)
5. Enhancement features (skill trees, milestones)

**Estimated Output**: 30-35 numbered tasks focusing on missing features

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following TDD)
**Phase 5**: Validation (run tests, execute quickstart.md, verify Korean UI)

## Complexity Tracking
*No violations - building on existing architecture*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - approach described)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v2.1.1 - Building on QuestLife v0.1.0 with Korean localization*