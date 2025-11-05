# QuestLife 2.0 - 일일 퀘스트 관리 대시보드

개인 개발 목표를 대시보드 중심 경험의 장대한 RPG 모험으로 변환하세요!

## 🆕 버전 2.0 기능

### 대시보드 우선 디자인
- **중앙 대시보드 허브**: 모든 일일 활동을 한 곳에서
- **빠른 퀘스트 완료**: 클릭 한 번으로 퀘스트 완료
- **실시간 통계**: XP, 레벨, 연속 기록을 한눈에 추적
- **오늘의 집중**: 일일 퀘스트를 눈에 띄게 표시

### 강화된 보안 및 인증
- **PIN 인증**: 안전한 4-6자리 PIN 로그인 시스템
- **세션 관리**: 자동 갱신되는 JWT 기반 세션
- **속도 제한**: 무차별 대입 공격 방지
- **세션 지속성**: 7일 동안 로그인 유지

### 개선된 UX
- **한국어 현지화**: 완전한 한국어 UI 번역
- **모바일 반응형**: 모든 화면 크기에 최적화
- **로딩 상태**: 부드러운 스켈레톤 로더와 스피너
- **에러 바운더리**: 재시도 옵션이 있는 우아한 오류 처리
- **접근성**: 완전한 ARIA 지원 및 키보드 탐색

## 🎮 핵심 기능

- **AI 기반 클래스 생성**: 목표를 입력하면 AI가 맞춤형 RPG 캐릭터 클래스 생성
- **퀘스트 시스템**: XP 보상이 있는 일일, 주간, 특별 퀘스트
- **캐릭터 진행**: 시각적 진행 추적과 함께 1-30레벨까지 성장
- **연속 기록 시스템**: XP 배율을 위한 콤보 구축 (최대 3배)
- **캐릭터 속성**: 힘, 지혜, 창의성, 규율, 카리스마 추적
- **클래스 진화**: 두 개의 30레벨 클래스를 고급 클래스로 결합
- **목표 관리**: 마일스톤 추적이 있는 완전한 CRUD 작업
- **성능 최적화**: 캐싱으로 200ms 미만의 대시보드 로딩

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 20+
- npm 10+
- OpenAI API 키

### 설치

1. 저장소 클론
2. 의존성 설치:
```bash
npm install --legacy-peer-deps
```

3. 환경 변수 복사:
```bash
cp .env.example .env
```

4. `.env`에 OpenAI API 키 추가:
```
OPENAI_API_KEY=sk-your-api-key-here
```

### 애플리케이션 실행

프론트엔드와 백엔드 모두 시작:
```bash
npm run dev
```

또는 개별 실행:
```bash
# 백엔드 (포트 3000)
npm run server:dev

# 프론트엔드 (포트 5173)
npm run client:dev
```

### 데이터베이스

데이터베이스 초기화:
```bash
npm run db:init
```

데이터베이스 리셋:
```bash
npm run db:reset
```

## 🏗️ 프로젝트 구조

```
questlife/
├── client/          # React 프론트엔드
│   ├── src/
│   │   ├── components/   # React 컴포넌트
│   │   ├── services/     # API 클라이언트
│   │   ├── stores/       # Zustand 상태
│   │   └── lib/          # 유틸리티
├── server/          # Express 백엔드
│   ├── src/
│   │   ├── api/          # REST 엔드포인트
│   │   ├── services/     # 비즈니스 로직
│   │   ├── db/           # 데이터베이스
│   │   └── lib/          # 핵심 라이브러리
└── shared/          # 공유 TypeScript 타입
```

## 🛠️ 기술 스택

- **프론트엔드**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand
- **백엔드**: Node.js, Express, TypeScript, better-sqlite3
- **AI**: OpenAI GPT-4o-mini
- **데이터베이스**: SQLite (로컬 파일 기반)
- **스타일링**: Tailwind CSS + shadcn/ui 컴포넌트

## 📝 API 엔드포인트

- `POST /api/goals/analyze` - 목표 분석 및 RPG 클래스 생성
- `GET /api/classes` - 사용자의 캐릭터 클래스 가져오기
- `POST /api/classes` - 새 캐릭터 클래스 생성
- `GET /api/quests` - 클래스의 퀘스트 가져오기
- `POST /api/quests/:id/complete` - 퀘스트 완료
- `GET /api/status` - 캐릭터 상태 가져오기
- `GET /api/user` - 사용자 가져오기 또는 생성

## 🎯 작동 방식

1. **목표 설정**: 달성하고 싶은 것을 입력 (예: "AI 프로그래밍 배우기")
2. **클래스 획득**: AI가 맞춤형 RPG 클래스 생성 (예: "AI 학자")
3. **퀘스트 완료**: 일일 및 주간 퀘스트로 진행
4. **XP 획득**: 퀘스트를 완료하여 XP를 얻고 레벨 업
5. **연속 기록 구축**: 매일 퀘스트를 완료하여 XP 배율 획득
6. **클래스 마스터**: 30레벨에 도달하여 클래스 마스터
7. **진화**: 두 개의 마스터 클래스를 고급 클래스로 결합

## 🎨 UI 컴포넌트

shadcn/ui로 구축:
- 퀘스트 및 캐릭터 정보용 카드
- XP 추적용 진행률 표시줄
- 레벨 및 상태용 배지
- 기본 다크 테마

## 📊 데이터베이스 스키마

- `users` - 사용자 프로필
- `character_classes` - RPG 클래스 (레벨 1-30)
- `quests` - 모든 퀘스트 유형
- `goals` - 사용자 목표 및 마일스톤
- `character_status` - 속성 및 파워 레벨
- `progress_streaks` - 연속 기록 추적

## 🧪 테스트

테스트 실행:
```bash
npm test
```

## 📄 라이선스

MIT

---

React, TypeScript, shadcn/ui로 ❤️를 담아 제작