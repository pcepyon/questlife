# QuestLife - Gamified Goal Achievement Platform

Transform your personal development goals into an epic RPG adventure!

## 🎮 Features

- **AI-Powered Class Generation**: Enter your goals and our AI creates a custom RPG character class
- **Quest System**: Daily, weekly, and special quests with XP rewards
- **Character Progression**: Level up from 1-30 with visual progress tracking
- **Streak System**: Build combos for XP multipliers (up to 5x)
- **Character Attributes**: Track strength, wisdom, creativity, discipline, and charisma
- **Class Evolution**: Combine two level-30 classes into advanced classes
- **Dark Theme**: Beautiful dark mode UI with shadcn/ui components

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Copy the environment variables:
```bash
cp .env.example .env
```

4. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=sk-your-api-key-here
```

### Running the Application

Start both frontend and backend:
```bash
npm run dev
```

Or run them separately:
```bash
# Backend (port 3000)
npm run server:dev

# Frontend (port 5173)
npm run client:dev
```

### Database

Initialize the database:
```bash
npm run db:init
```

Reset the database:
```bash
npm run db:reset
```

## 🏗️ Project Structure

```
questlife/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API client
│   │   ├── stores/       # Zustand state
│   │   └── lib/          # Utilities
├── server/          # Express backend
│   ├── src/
│   │   ├── api/          # REST endpoints
│   │   ├── services/     # Business logic
│   │   ├── db/           # Database
│   │   └── lib/          # Core libraries
└── shared/          # Shared TypeScript types
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand
- **Backend**: Node.js, Express, TypeScript, better-sqlite3
- **AI**: OpenAI GPT-4o-mini
- **Database**: SQLite (local file-based)
- **Styling**: Tailwind CSS + shadcn/ui components

## 📝 API Endpoints

- `POST /api/goals/analyze` - Analyze goal and generate RPG class
- `GET /api/classes` - Get user's character classes
- `POST /api/classes` - Create new character class
- `GET /api/quests` - Get quests for a class
- `POST /api/quests/:id/complete` - Complete a quest
- `GET /api/status` - Get character status
- `GET /api/user` - Get or create user

## 🎯 How It Works

1. **Set Your Goal**: Enter what you want to achieve (e.g., "Learn AI programming")
2. **Get Your Class**: AI generates a custom RPG class (e.g., "AI Scholar")
3. **Complete Quests**: Daily and weekly quests help you progress
4. **Gain XP**: Complete quests to earn XP and level up
5. **Build Streaks**: Complete quests daily for XP multipliers
6. **Master Your Class**: Reach level 30 to master the class
7. **Evolve**: Combine two mastered classes into an advanced class

## 🎨 UI Components

Built with shadcn/ui:
- Cards for quests and character info
- Progress bars for XP tracking
- Badges for levels and status
- Beautiful dark theme by default

## 📊 Database Schema

- `users` - User profiles
- `character_classes` - RPG classes (level 1-30)
- `quests` - All quest types
- `goals` - User goals and milestones
- `character_status` - Attributes and power level
- `progress_streaks` - Streak tracking

## 🧪 Testing

Run tests:
```bash
npm test
```

## 📄 License

MIT

---

Built with ❤️ using React, TypeScript, and shadcn/ui