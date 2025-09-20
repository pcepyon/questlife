# QuestLife Quickstart Guide

**Date**: 2025-09-10  
**Version**: 0.1.0

## Prerequisites

- Node.js 20+ and npm 10+
- Git
- A code editor (VS Code recommended)
- OpenAI API key (for goal analysis)

## Quick Setup (5 minutes)

```bash
# Clone the repository
git clone [repository-url]
cd questlife

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key

# Initialize the database
npm run db:init

# Start development servers
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## First Run Experience

### 1. Create Your First Character Class (2 minutes)

1. Open http://localhost:5173 in your browser
2. You'll see the welcome screen with "Begin Your Quest"
3. Enter a personal goal, for example:
   - "I want to learn AI and machine learning"
   - "I want to get fit and run a marathon"
   - "I want to build a successful business"
4. Click "Generate My Class"
5. Watch as the AI creates your personalized RPG class:
   - Class name (e.g., "AI Scholar")
   - Starting quests
   - Ultimate goal
   - Evolution paths

### 2. Complete Your First Quest (1 minute)

1. View your dashboard with generated quests
2. Click on a daily quest (e.g., "Read 1 AI paper for 30 minutes")
3. Mark it as complete
4. Experience the reward system:
   - XP animation (+50 XP!)
   - Progress bar filling
   - Motivational message
   - Level progression

### 3. Check Your Character Status (30 seconds)

1. Click the character icon in the top-right
2. View your status window:
   - Current attributes (Strength, Wisdom, Creativity)
   - Total power level
   - Active classes
   - Current streak

### 4. Explore Advanced Features

#### Modify Your Class (1 minute)
1. Click "Modify Class" on your class card
2. Type a natural language request:
   - "Make the quests easier"
   - "Change my ultimate goal to launching a product"
   - "Add web development to my learning path"
3. See your class update in real-time

#### Check Skill Tree (30 seconds)
1. Click "Skills" on your class card
2. View available skills to unlock
3. Spend skill points earned from leveling up

#### View Achievements (30 seconds)
1. Click the trophy icon in navigation
2. See unlocked and locked achievements
3. Check progress toward rare achievements

## Testing Scenarios

### Scenario 1: Quest Completion Flow
```bash
# Terminal 1 - Watch backend logs
npm run server:dev

# Terminal 2 - Watch frontend
npm run client:dev
```

1. Complete a daily quest
2. Verify in logs:
   - XP calculation
   - Streak update
   - Level check
3. Complete 3 quests in a row
4. Verify 3x multiplier applied

### Scenario 2: Level Progression
1. Use dev tools to add XP:
   ```javascript
   // In browser console
   window.__DEV__.addXP(500)
   ```
2. Watch level-up animation
3. Check for special quest at level 10

### Scenario 3: Class Evolution
1. Use dev tools to set two classes to level 30:
   ```javascript
   window.__DEV__.setClassLevel('class1', 30)
   window.__DEV__.setClassLevel('class2', 30)
   ```
2. Navigate to Evolution screen
3. Combine classes into evolved form

## Development Commands

```bash
# Database
npm run db:reset          # Reset database
npm run db:seed           # Add sample data
npm run db:migrate        # Run migrations

# Testing
npm test                  # Run all tests
npm run test:api         # API contract tests
npm run test:integration # Integration tests
npm run test:e2e         # End-to-end tests

# Code Quality
npm run lint             # Lint code
npm run format           # Format code
npm run typecheck        # Type checking

# Production
npm run build            # Build for production
npm run preview          # Preview production build
```

## Project Structure

```
questlife/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/      # Route pages
│   │   ├── stores/     # Zustand stores
│   │   └── lib/        # Utilities
│   └── tests/
├── server/              # Express backend
│   ├── src/
│   │   ├── api/        # API routes
│   │   ├── services/   # Business logic
│   │   ├── models/     # Data models
│   │   └── lib/        # Core libraries
│   └── tests/
└── shared/              # Shared types
```

## Key Features to Test

1. **Goal Input → Class Generation**
   - Natural language processing
   - Creative class naming
   - Quest generation

2. **Quest Completion → XP Gain**
   - Instant feedback (<100ms)
   - Animations
   - Streak tracking

3. **Level 30 → Class Mastery**
   - Special quest unlock
   - Mastery rewards
   - Permanent stat bonuses

4. **Class Evolution**
   - Level 30 requirement
   - Evolution selection
   - New class creation

## Troubleshooting

### OpenAI API Issues
```bash
# Test API key
npm run test:openai

# Check rate limits
npm run check:limits
```

### Database Issues
```bash
# View database
npm run db:studio

# Reset if corrupted
npm run db:reset
npm run db:init
```

### Frontend Not Loading
```bash
# Clear cache
rm -rf client/.vite
npm run client:dev
```

### Backend Errors
```bash
# Check logs
npm run server:logs

# Restart with debug
DEBUG=* npm run server:dev
```

## Environment Variables

```env
# Required
OPENAI_API_KEY=sk-...

# Optional
NODE_ENV=development
PORT=3000
DATABASE_PATH=./data/questlife.db
LOG_LEVEL=info
```

## Support

- Documentation: `/docs`
- API Reference: http://localhost:3000/api-docs
- Dev Tools: Press `Ctrl+Shift+D` in app

---
*Ready to begin your quest? Start with a simple goal and watch it transform into an epic adventure!*