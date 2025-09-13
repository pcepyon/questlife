# Quickstart: Korean Localization Testing

## Prerequisites
- QuestLife application running locally
- Korean input method enabled on test machine
- Browser set to Korean locale (optional but recommended)

## Test Scenario 1: Korean UI Display

1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Verify homepage Korean display**
   - Navigate to http://localhost:3000
   - Confirm all buttons show Korean text:
     - "시작하기" (Start)
     - "로그인" (Login)
     - "회원가입" (Sign up)

3. **Check navigation menu**
   - All menu items in Korean:
     - "홈" (Home)
     - "퀘스트" (Quests)
     - "캐릭터" (Character)
     - "설정" (Settings)

## Test Scenario 2: Korean Goal Input

1. **Create a new goal in Korean**
   - Click "새 목표 만들기"
   - Enter Korean goal: "매일 한국어 공부하기"
   - Click "생성"

2. **Verify class generation**
   - Class name shows mixed format: "학자 Scholar"
   - Description in Korean with appropriate gaming terms in English
   - Skills listed with Korean names

3. **Check quest generation**
   - Daily quests have Korean titles
   - XP rewards show as "100 EXP" (English retained)
   - Quest descriptions in natural Korean

## Test Scenario 3: Mixed Language Display

1. **View character status**
   - Attributes show as:
     - "힘 (STR): 10"
     - "지혜 (INT): 15"
     - "창의력 (CRE): 12"

2. **Check level display**
   - "Level 5" (English retained)
   - Experience bar shows "500/1000 EXP"

3. **Verify streak system**
   - Streak multiplier shows as "3x 연속"
   - Streak message: "3일 연속 달성!"

## Test Scenario 4: Date and Number Formatting

1. **Check date display**
   - Quest creation date: "2025년 09월 13일"
   - Last login: "2025년 09월 13일 오후 3:30"

2. **Verify number formatting**
   - Large XP numbers: "1,234 EXP"
   - Gold/points: "10,000 골드"

## Test Scenario 5: Error Messages

1. **Test validation errors**
   - Leave goal input empty
   - Error shows: "목표를 입력해주세요"

2. **Test network error**
   - Disconnect network
   - Try to save
   - Error shows: "네트워크 연결을 확인해주세요"

## Test Scenario 6: Quest Completion Flow

1. **Complete a daily quest**
   - Click quest checkbox
   - Notification shows: "퀘스트 완료! 100 EXP 획득"
   - Level up message: "Level Up! Level 6 달성"

2. **Check XP animation**
   - XP bar animates with "+100" floating text
   - Total XP updates to "600/1,200 EXP"

## Automated Test Commands

```bash
# Run Korean locale tests
npm test -- --locale=ko

# Run visual regression tests
npm run test:visual

# Run E2E tests with Korean user flow
npm run test:e2e -- --spec=korean-user-journey

# Check translation coverage
npm run i18n:coverage
```

## Validation Checklist

- [ ] All UI elements display in Korean
- [ ] Korean text input works correctly
- [ ] Mixed Korean-English display follows gaming conventions
- [ ] Dates show in Korean format (YYYY년 MM월 DD일)
- [ ] Numbers use international format (1,234)
- [ ] Gaming terms remain in English (Level, EXP, HP)
- [ ] Error messages display in Korean
- [ ] Animations and transitions work with Korean text
- [ ] No text overflow or layout breaks
- [ ] Korean fonts render correctly

## Performance Metrics

- Page load time: < 200ms (same as English version)
- Translation lookup: < 5ms
- No noticeable lag when switching content
- Bundle size increase: < 50KB

## Common Issues to Check

1. **Text Overflow**
   - Long Korean phrases in buttons
   - Mixed text in narrow columns

2. **Font Rendering**
   - Consistent font weight
   - Proper line height for Korean characters

3. **Input Method**
   - Korean IME composition events
   - Character counting with Korean text

4. **Sorting/Filtering**
   - Korean alphabetical order (가나다 순)
   - Search with Korean text

## Success Criteria

✅ All test scenarios pass without errors
✅ No visual regressions detected
✅ Performance metrics maintained
✅ User can complete full journey in Korean
✅ No mixed language confusion
✅ Gaming experience feels natural for Korean users