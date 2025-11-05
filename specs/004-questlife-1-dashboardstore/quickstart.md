# Quickstart: QuestLife Data Persistence

**Feature**: Dashboard data persistence and API integration
**Time to Test**: ~5 minutes

## Prerequisites

1. QuestLife application running locally
2. Database initialized with seed data
3. Test user account created

## Setup Commands

```bash
# From project root
cd questlife

# Install dependencies
npm install

# Initialize database
npm run db:reset
npm run db:seed

# Start application
npm run dev
```

## Test Scenario 1: Dashboard Real Data

**Goal**: Verify dashboard loads real data instead of mock data

1. **Open browser** to http://localhost:5173
2. **Complete PIN setup** (use 1234)
3. **Navigate to Dashboard** tab
4. **Observe loading state** - should show loading spinner briefly
5. **Verify real data**:
   - Username should not be "TestUser"
   - Quest titles should be varied (not "Daily Quest 1", etc.)
   - XP values should reflect actual database state

✅ **Success**: Dashboard shows real user data from database

## Test Scenario 2: Quest Completion Persistence

**Goal**: Verify quest completions persist across refresh

1. **In Dashboard**, find an active daily quest
2. **Note the quest title and XP reward**
3. **Click "Complete" button** on the quest
4. **Observe**:
   - XP animation shows gained amount
   - Quest status changes to completed
   - Streak counter updates (if applicable)
5. **Refresh the page** (F5)
6. **Re-enter PIN** if prompted
7. **Return to Dashboard**
8. **Verify**:
   - Completed quest still shows as completed
   - Total XP reflects the increase
   - Recent completions shows the quest

✅ **Success**: Quest completion persists after refresh

## Test Scenario 3: Create Goal with Class

**Goal**: Verify goal creation generates character class

1. **Navigate to Character tab**
2. **Click "목표 설정하기"** button
3. **Enter goal details**:
   - Title: "Learn Piano"
   - Description: "Practice piano 30 minutes daily"
4. **Click Submit**
5. **Observe**:
   - Loading state while AI processes
   - Success notification
   - New character class appears
6. **Navigate to Quest tab**
7. **Verify**:
   - New quests related to Piano class appear
   - Quests have appropriate XP values

✅ **Success**: Goal creates persistent character class with quests

## Test Scenario 4: Create First Class

**Goal**: Verify direct class creation from Quest tab

1. **Create new user** or use one without classes
2. **Navigate to Quest tab**
3. **Observe**: "첫번째 클래스 만들기" button appears
4. **Click the button**
5. **Enter class name**: "Fitness Master"
6. **Click Create**
7. **Verify**:
   - Class is created successfully
   - Quest tab now shows quests
   - Character tab shows the new class
8. **Refresh browser**
9. **Verify** class still exists

✅ **Success**: Class creation persists and generates quests

## Test Scenario 5: Multi-Tab Consistency

**Goal**: Verify data consistency across browser tabs

1. **Open QuestLife in two browser tabs**
2. **Login with same PIN** in both tabs
3. **In Tab 1**: Complete a quest
4. **In Tab 2**:
   - Wait 5 seconds
   - Navigate to Dashboard
5. **Verify Tab 2 shows**:
   - Updated quest status
   - Updated XP totals
   - Updated streak (if applicable)

✅ **Success**: Data syncs across multiple tabs

## Test Scenario 6: Streak Multiplier

**Goal**: Verify streak multiplier applies correctly

1. **Check current streak** in Dashboard
2. **Note the multiplier** (1x, 2x, or 3x)
3. **Complete a quest** with 100 XP base reward
4. **Verify XP gained**:
   - 1-6 day streak: 100 XP (1x)
   - 7-13 day streak: 200 XP (2x)
   - 14+ day streak: 300 XP (3x)
5. **Check stats** to confirm total XP increased correctly

✅ **Success**: Multiplier applies based on streak rules

## Test Scenario 7: Error Recovery

**Goal**: Verify system handles errors gracefully

1. **Stop the backend server** (Ctrl+C in server terminal)
2. **Try to complete a quest** in frontend
3. **Observe**:
   - Error notification appears
   - Quest remains incomplete
   - No data corruption
4. **Restart backend server** (`npm run server:dev`)
5. **Retry quest completion**
6. **Verify** it completes successfully

✅ **Success**: System recovers from temporary failures

## Validation Checklist

- [ ] Dashboard loads real data (not mock)
- [ ] Quest completions persist after refresh
- [ ] Goal creation works and generates class
- [ ] First class creation works from Quest tab
- [ ] Data syncs across multiple tabs
- [ ] Streak multipliers apply correctly
- [ ] Error recovery works without data loss
- [ ] All changes persist after logout/login

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Dashboard shows mock data | Check API endpoint is correct and backend is running |
| Quest completion doesn't persist | Verify database write permissions and transactions |
| "첫번째 클래스 만들기" doesn't appear | Check if user already has classes |
| Multi-tab sync delayed | Normal - sync happens every 5 seconds |
| Authentication errors | Clear localStorage and re-authenticate |

## Performance Metrics

- Dashboard load: Should be <1 second
- Quest completion: Should be <500ms
- Cache hit rate: >80% for repeated dashboard loads
- Database queries: <100ms for all operations

---
*If all scenarios pass, the data persistence feature is working correctly.*