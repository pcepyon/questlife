# Implementation Tasks: Korean Localization

**Feature**: Korean Localization for QuestLife
**Branch**: `002-`
**Estimated Hours**: 40-50

## Task Organization
- Tasks marked [P] can be executed in parallel
- Tasks are numbered T001-T038
- Each task includes specific file paths
- Follow TDD: tests before implementation

## Setup & Infrastructure (T001-T005)

### T001: Install i18n dependencies
**File**: `questlife/package.json`
- Install react-i18next, i18next, i18next-browser-languagedetector
- Install date-fns and @types/date-fns
- Update both client and server package.json files

### T002: Create i18n configuration
**File**: `questlife/client/src/lib/i18n.ts`
- Initialize react-i18next with Korean locale
- Configure namespaces: common, quests, classes, errors, gaming
- Set fallback language and detection options

### T003: Setup translation file structure [P]
**File**: `questlife/client/public/locales/ko/`
- Create directory structure for Korean translations
- Create empty JSON files for each namespace
- Add basic structure to each file

### T004: Configure date-fns Korean locale [P]
**File**: `questlife/client/src/lib/dateFormatter.ts`
- Setup date-fns with Korean locale
- Create formatting functions for Korean dates
- Export format utilities

### T005: Setup backend locale middleware [P]
**File**: `questlife/server/src/middleware/locale.ts`
- Create Express middleware for locale detection
- Add locale to request context
- Configure response headers

## Contract Tests (T006-T010)

### T006: Test GET /api/locale endpoint [P]
**File**: `questlife/server/tests/contract/locale.test.ts`
- Test returns LocaleConfig schema
- Verify Korean locale configuration
- Test must fail initially (TDD)

### T007: Test GET /api/translations/:namespace [P]
**File**: `questlife/server/tests/contract/translations.test.ts`
- Test each namespace returns correct structure
- Verify translation key format
- Test must fail initially

### T008: Test POST /api/goals/analyze with Korean [P]
**File**: `questlife/server/tests/contract/goals-korean.test.ts`
- Test Korean goal input acceptance
- Verify localized response structure
- Test must fail initially

### T009: Test GET /api/quests with locale [P]
**File**: `questlife/server/tests/contract/quests-locale.test.ts`
- Test locale query parameter
- Verify Korean fields in response
- Test must fail initially

### T010: Test GET /api/classes with locale [P]
**File**: `questlife/server/tests/contract/classes-locale.test.ts`
- Test locale query parameter
- Verify Korean class names format
- Test must fail initially

## Translation Files (T011-T015)

### T011: Create common.json translations [P]
**File**: `questlife/client/public/locales/ko/common.json`
- UI buttons: 시작하기, 로그인, 회원가입, 저장, 취소
- Navigation: 홈, 퀘스트, 캐릭터, 설정
- Form labels and placeholders

### T012: Create quests.json translations [P]
**File**: `questlife/client/public/locales/ko/quests.json`
- Quest types: 일일 퀘스트, 주간 퀘스트, 특별 퀘스트
- Quest status messages
- Completion notifications

### T013: Create classes.json translations [P]
**File**: `questlife/client/public/locales/ko/classes.json`
- Class name templates
- Skill descriptions
- Level up messages

### T014: Create errors.json translations [P]
**File**: `questlife/client/public/locales/ko/errors.json`
- Validation errors
- Network errors
- System errors

### T015: Create gaming.json English terms [P]
**File**: `questlife/client/public/locales/ko/gaming.json`
- Terms to keep in English: Level, EXP, HP, MP
- Mixed format templates
- Gaming-specific vocabulary

## Backend Implementation (T016-T023)

### T016: Implement GET /api/locale
**File**: `questlife/server/src/api/locale.ts`
- Return LocaleConfig for Korean
- Include date/number formats
- Pass contract test T006

### T017: Implement GET /api/translations/:namespace
**File**: `questlife/server/src/api/translations.ts`
- Load and return translation files
- Handle namespace validation
- Pass contract test T007

### T018: Create translation service
**File**: `questlife/server/src/services/translationService.ts`
- Load translation files
- Cache translations in memory
- Provide translation lookup methods

### T019: Update goal analysis for Korean
**File**: `questlife/server/src/services/goalService.ts`
- Modify prompt for Korean responses
- Handle Korean input processing
- Pass contract test T008

### T020: Add locale to quest responses
**File**: `questlife/server/src/api/quests.ts`
- Add Korean fields to quest objects
- Transform responses based on locale
- Pass contract test T009

### T021: Add locale to class responses
**File**: `questlife/server/src/api/classes.ts`
- Add Korean class names
- Mix Korean/English for gaming terms
- Pass contract test T010

### T022: Create response transformer
**File**: `questlife/server/src/middleware/responseTransformer.ts`
- Transform API responses based on locale
- Add Korean fields to entities
- Maintain backward compatibility

### T023: Update logging with locale context
**File**: `questlife/server/src/lib/logger.ts`
- Add locale to log context
- Log missing translation keys
- Track locale usage metrics

## Frontend Implementation (T024-T033)

### T024: Add i18n provider to App
**File**: `questlife/client/src/App.tsx`
- Wrap app with I18nextProvider
- Initialize i18n configuration
- Set default locale to Korean

### T025: Localize navigation component
**File**: `questlife/client/src/components/Navigation.tsx`
- Add useTranslation hook
- Replace hardcoded text with t() calls
- Use common namespace

### T026: Localize quest cards
**File**: `questlife/client/src/components/QuestCard.tsx`
- Display Korean quest titles
- Format XP with mixed language
- Show Korean completion messages

### T027: Localize character status
**File**: `questlife/client/src/components/CharacterStatus.tsx`
- Display attributes in Korean format
- Mix Korean labels with English abbreviations
- Format numbers internationally

### T028: Localize goal input form
**File**: `questlife/client/src/components/GoalForm.tsx`
- Korean placeholders and labels
- Korean validation messages
- Support Korean text input

### T029: Create date display component
**File**: `questlife/client/src/components/KoreanDate.tsx`
- Format dates in Korean style
- Use date-fns with Korean locale
- Handle various date formats

### T030: Update button components
**File**: `questlife/client/src/components/ui/button.tsx`
- Add translation support
- Handle longer Korean text
- Maintain design consistency

### T031: Localize toast notifications
**File**: `questlife/client/src/components/ui/toast.tsx`
- Korean success/error messages
- Mixed language for gaming notifications
- Proper text overflow handling

### T032: Add locale to API service
**File**: `questlife/client/src/services/api.ts`
- Include locale in API requests
- Handle localized responses
- Update TypeScript types

### T033: Update Zustand store for i18n
**File**: `questlife/client/src/stores/i18nStore.ts`
- Store current locale
- Provide translation helpers
- Cache loaded namespaces

## Integration Tests (T034-T038)

### T034: Test Korean UI display flow
**File**: `questlife/tests/integration/korean-ui.test.ts`
- Test homepage Korean display
- Verify navigation in Korean
- Check all UI elements translated

### T035: Test Korean goal creation flow
**File**: `questlife/tests/integration/korean-goal.test.ts`
- Input Korean goal text
- Verify Korean class generation
- Check quest descriptions in Korean

### T036: Test mixed language display
**File**: `questlife/tests/integration/mixed-language.test.ts`
- Verify gaming terms in English
- Check Korean/English formatting
- Test attribute display format

### T037: Test date/number formatting
**File**: `questlife/tests/integration/formatting.test.ts`
- Verify Korean date format
- Check international number format
- Test edge cases

### T038: Run E2E Korean user journey
**File**: `questlife/tests/e2e/korean-journey.test.ts`
- Complete full user flow in Korean
- From signup to quest completion
- Verify all touchpoints localized

## Parallel Execution Examples

### Group 1: Setup Tasks (can run together)
```bash
# Run these in parallel using Task tool
Task T003 "Setup translation file structure"
Task T004 "Configure date-fns Korean locale"
Task T005 "Setup backend locale middleware"
```

### Group 2: Contract Tests (all parallel)
```bash
# All contract tests can run simultaneously
Task T006 "Test GET /api/locale endpoint"
Task T007 "Test GET /api/translations/:namespace"
Task T008 "Test POST /api/goals/analyze with Korean"
Task T009 "Test GET /api/quests with locale"
Task T010 "Test GET /api/classes with locale"
```

### Group 3: Translation Files (all parallel)
```bash
# All translation files can be created simultaneously
Task T011 "Create common.json translations"
Task T012 "Create quests.json translations"
Task T013 "Create classes.json translations"
Task T014 "Create errors.json translations"
Task T015 "Create gaming.json English terms"
```

## Dependencies & Order

1. **Setup first** (T001-T005) - Required for all other tasks
2. **Contract tests** (T006-T010) - Can start after setup, before implementation
3. **Translation files** (T011-T015) - Can be done anytime after setup
4. **Backend implementation** (T016-T023) - After contract tests, needs translations
5. **Frontend implementation** (T024-T033) - After backend APIs ready
6. **Integration tests** (T034-T038) - After all implementation complete

## Success Criteria

- [ ] All contract tests passing
- [ ] Korean UI fully functional
- [ ] Mixed Korean/English display correct
- [ ] Date/number formatting proper
- [ ] No text overflow or layout breaks
- [ ] E2E test completes successfully
- [ ] Performance metrics maintained

## Notes

- Maintain existing functionality while adding Korean
- No database schema changes needed
- Translation at application layer only
- Follow gaming industry conventions for mixed language
- Test with actual Korean input methods