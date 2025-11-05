# Implementation Plan: QuestLife Data Persistence and API Integration

**Branch**: `004-questlife-1-dashboardstore` | **Date**: 2025-09-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-questlife-1-dashboardstore/spec.md`

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
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
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
Resolve QuestLife's data persistence issues by connecting frontend Zustand stores to backend SQLite database, replacing mock data with real API calls, and ensuring all user progress (quest completions, goal creation, character classes) persists across sessions through proper authentication and data synchronization.

## Technical Context
**Language/Version**: TypeScript 5.x (both frontend and backend)
**Primary Dependencies**: React 18 + Zustand (frontend), Express.js + better-sqlite3 (backend)
**Storage**: SQLite (local file-based database)
**Testing**: Vitest (frontend), Jest (backend)
**Target Platform**: Web browser (Chrome, Firefox, Safari)
**Project Type**: web (frontend + backend)
**Performance Goals**: Dashboard load <1s, quest completion response <500ms
**Constraints**: PIN auth must be validated on all data mutations, maintain data consistency across tabs
**Scale/Scope**: Single-user local application, ~20 API endpoints, ~10 main UI components

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 3 (client, server, shared) ✓
- Using framework directly? YES - Direct React/Express usage, no wrappers ✓
- Single data model? YES - Shared types between frontend/backend ✓
- Avoiding patterns? YES - Direct SQLite queries, no Repository pattern ✓

**Architecture**:
- EVERY feature as library? NO - Direct app code (existing codebase structure) ⚠️
- Libraries listed: N/A - Working within existing structure
- CLI per library: N/A - Web application focus
- Library docs: Will document API contracts and data models

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES - Tests first ✓
- Git commits show tests before implementation? YES - Will be enforced ✓
- Order: Contract→Integration→E2E→Unit strictly followed? YES ✓
- Real dependencies used? YES - Real SQLite DB ✓
- Integration tests for: YES - API contract changes, data persistence ✓
- FORBIDDEN: Implementation before test, skipping RED phase ✓

**Observability**:
- Structured logging included? YES - Existing console logging ✓
- Frontend logs → backend? Not currently implemented ⚠️
- Error context sufficient? YES - Error messages with context ✓

**Versioning**:
- Version number assigned? Using existing 1.0.0 from package.json
- BUILD increments on every change? Not automated ⚠️
- Breaking changes handled? N/A - First persistence implementation

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 - Web application (client/server/shared structure already exists in QuestLife)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
The /tasks command will generate approximately 30-35 tasks organized as follows:

1. **Contract Tests (Tasks 1-8)** [P]:
   - Dashboard API contract test
   - Quick complete API contract test
   - Goal creation API contract test
   - Class creation API contract test
   - Each test file can be created in parallel

2. **Backend Implementation (Tasks 9-18)**:
   - Database transaction wrappers
   - Dashboard service with caching
   - Quest completion service with saga pattern
   - Goal/class creation services
   - API endpoint implementations
   - Authentication middleware updates

3. **Frontend Store Updates (Tasks 19-25)** [P]:
   - Replace mock data in dashboardStore
   - Add API calls to questStore
   - Update goalStore for persistence
   - Add cross-tab synchronization
   - Implement optimistic updates

4. **Integration Tests (Tasks 26-30)**:
   - End-to-end dashboard flow
   - Quest completion persistence
   - Goal creation with class generation
   - Multi-tab synchronization
   - Error recovery scenarios

5. **Performance & Polish (Tasks 31-35)**:
   - Add retry logic with exponential backoff
   - Implement loading states
   - Add error boundaries
   - Performance monitoring
   - Documentation updates

**Ordering Strategy**:
- RED phase first: All contract tests before implementation
- Backend before frontend: API must exist before UI calls it
- Core features before enhancements: Basic persistence before optimizations
- Parallel execution marked with [P] for independent tasks

**Validation Points**:
- After task 8: All contract tests failing (RED)
- After task 18: Backend tests passing (GREEN)
- After task 25: Frontend connected to backend
- After task 30: All integration tests passing
- After task 35: Performance targets met

**Estimated Output**: 35 numbered, ordered tasks in tasks.md with clear dependencies

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Not using library architecture | Working with existing QuestLife codebase | Complete refactor would delay feature delivery |
| No CLI per feature | Web-first application | REST API already provides programmatic access |
| No automated build increment | Small team project | Manual version updates sufficient for current scale |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS (with justified deviations)
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*