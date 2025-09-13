# Implementation Plan: QuestLife - Gamified Goal Achievement Platform

**Branch**: `001-develop-questlife-a` | **Date**: 2025-09-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-develop-questlife-a/spec.md`

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

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Develop a gamified goal achievement platform that transforms personal development into an RPG adventure. Users enter goals in natural language, which an LLM transforms into RPG character classes with quests, levels (1-30), and evolution paths. The system features daily/weekly quests, XP rewards with combo multipliers, character status windows, and class mastery mechanics. Built as a monorepo with React/TypeScript frontend using shadcn/ui components and Express.js backend with SQLite storage, leveraging OpenAI GPT-4o-mini for goal analysis.

## Technical Context
**Language/Version**: TypeScript 5.x (React 18 + Node.js 20)  
**Primary Dependencies**: React 18, shadcn/ui, Tailwind CSS, Zustand, Express.js, better-sqlite3, OpenAI SDK  
**Storage**: SQLite (local file-based database)  
**Testing**: Vitest for frontend, Jest for backend  
**Target Platform**: Web browser (desktop-first, responsive)
**Project Type**: web (frontend + backend monorepo)  
**Performance Goals**: <100ms quest completion feedback, smooth 60fps animations  
**Constraints**: No authentication required, local-only data storage, minimal API calls to reduce costs  
**Scale/Scope**: MVP for single user, ~25 screens/components, ~50 API endpoints

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (client, server) ✅ (max 3)
- Using framework directly? Yes - React, Express, shadcn/ui components directly ✅
- Single data model? Yes - shared TypeScript interfaces ✅
- Avoiding patterns? Yes - no unnecessary abstractions, direct DB access ✅

**Architecture**:
- EVERY feature as library? Core features organized as modules ✅
- Libraries listed: 
  - quest-engine (quest generation/management)
  - class-system (RPG class logic)
  - xp-calculator (XP/level calculations)
  - llm-adapter (OpenAI integration)
- CLI per library: Each module exposes CLI for testing ✅
- Library docs: llms.txt format planned ✅

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes ✅
- Git commits show tests before implementation? Will enforce ✅
- Order: Contract→Integration→E2E→Unit strictly followed? Yes ✅
- Real dependencies used? SQLite in-memory for tests ✅
- Integration tests for: new libraries, contract changes, shared schemas? Yes ✅
- FORBIDDEN: Implementation before test, skipping RED phase ✅

**Observability**:
- Structured logging included? Yes - winston for backend ✅
- Frontend logs → backend? Console errors sent to backend ✅
- Error context sufficient? Stack traces + user context ✅

**Versioning**:
- Version number assigned? 0.1.0 initial ✅
- BUILD increments on every change? Will use semantic versioning ✅
- Breaking changes handled? N/A for MVP ✅

## Project Structure

### Documentation (this feature)
```
specs/001-develop-questlife-a/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (frontend + backend detected)
client/
├── src/
│   ├── components/      # shadcn/ui components + custom
│   ├── pages/          # Route pages
│   ├── stores/         # Zustand stores
│   ├── lib/            # Utilities, helpers
│   └── services/       # API client services
├── tests/
└── package.json

server/
├── src/
│   ├── models/         # Data models
│   ├── services/       # Business logic
│   ├── api/           # Express routes
│   ├── db/            # SQLite setup/migrations
│   └── lib/           # Core libraries (quest-engine, etc.)
├── tests/
└── package.json

shared/
├── types/             # Shared TypeScript interfaces
└── constants/         # Shared constants
```

**Structure Decision**: Option 2 - Web application (monorepo with client/server)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context**:
   - Best practices for shadcn/ui theming and customization
   - Optimal SQLite schema for quest/class hierarchy
   - OpenAI GPT-4o-mini prompt engineering for goal analysis
   - Framer Motion integration with React 18
   - Zustand state management patterns

2. **Generate and dispatch research agents**:
   ```
   Task: "Research shadcn/ui theming for RPG-style dark theme"
   Task: "Find best practices for SQLite hierarchical data (classes/quests)"
   Task: "Research OpenAI prompt patterns for goal decomposition"
   Task: "Investigate Framer Motion performance with many animations"
   Task: "Research Zustand patterns for complex game state"
   ```

3. **Consolidate findings** in `research.md`

**Output**: research.md with all technical decisions documented

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - User, CharacterClass, Quest, Goal, ClassEvolution
   - Achievement, CharacterStatus, MasteryReward
   - SkillTree, ProgressStreak, XPMultiplier

2. **Generate API contracts** from functional requirements:
   - Goal submission endpoints
   - Quest management (create, complete, list)
   - Class progression endpoints
   - LLM conversation endpoints
   - Character status endpoints

3. **Generate contract tests** from contracts:
   - OpenAPI schema in `/contracts/api.yaml`
   - Test files for each endpoint group

4. **Extract test scenarios** from user stories:
   - Goal input → class generation flow
   - Quest completion → XP gain flow
   - Level 30 → class mastery flow
   - Class evolution flow

5. **Update CLAUDE.md incrementally**:
   - Add project structure
   - Include tech stack
   - Document key commands

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:

### MVP Core Tasks (Priority 1)
1. **Environment Setup** [P]
   - Monorepo with npm workspaces
   - TypeScript configs
   - shadcn/ui installation with dark theme

2. **Database Schema** [P]
   - Optimized quest tracking tables
   - Indexes on: user_id, class_id, status, type
   - Composite index on (class_id, status, type) for quest queries

3. **API Essentials**
   - `/api/goals/analyze` - Single OpenAI call with caching
   - `/api/quests/complete` - XP calculation endpoint
   - `/api/classes` - CRUD operations

4. **shadcn/ui Component Mapping**:
   ```
   Dashboard → Card + Tabs
   Quest Card → Card + Badge + Progress + Button
   Character Status → Card + Avatar + Separator
   XP Bar → Progress (customized)
   Level Up Modal → Dialog + motion.div
   Quest Complete → Toast + Confetti
   Class Evolution → AlertDialog + RadioGroup
   Skill Tree → Card + Tree (custom)
   Settings → Form + Switch + Select
   ```

5. **State Management**
   - Single Zustand store with persist
   - Optimistic updates for quest completion

### XP Calculation Implementation
```typescript
// Core formula
const calculateXP = (baseXP: number, level: number, streakDays: number) => {
  const comboMultiplier = Math.min(streakDays, 5); // Cap at 5x
  const levelBonus = 1 + (level / 100); // 1% per level
  return Math.floor(baseXP * comboMultiplier * levelBonus);
}
```

### OpenAI API Optimization
- **Batch Processing**: Queue multiple goals, process together
- **Response Caching**: Cache identical goals for 24 hours
- **Prompt Templates**: Pre-computed with few-shot examples
- **Token Limits**: Max 500 tokens per request
- **Rate Limiting**: Max 10 requests per minute

### shadcn Setup Steps
1. Install shadcn/ui CLI
2. Init with dark theme default
3. Add components: card, button, progress, dialog, toast, badge, tabs, form
4. Customize theme:
   ```css
   --primary: 43 100% 50%     /* Gold */
   --success: 142 76% 36%     /* Green */
   --destructive: 0 84% 60%   /* Red */
   --muted: 217 33% 17%       /* Dark blue-gray */
   ```
5. Add Framer Motion for level-up animations only

**Ordering Strategy**:
1. Setup → Database → API → Frontend Shell → Core Features → Polish

**Estimated Output**: 25-30 focused MVP tasks

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No violations - all constitutional principles satisfied*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [x] Phase 4: Implementation complete (2025-09-11)
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

**Implementation Highlights**:
- ✅ 60개 작업 중 47개 완료 (78% 완료율)
- ✅ 모든 핵심 기능 구현 완료
- ✅ 클래스 진화 기능 추가 구현
- ✅ Framer Motion 애니메이션 통합
- ✅ 실시간 레벨업 효과 및 XP 애니메이션
- ✅ 테스트용 시드 데이터 생성 스크립트

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*