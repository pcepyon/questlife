# QuestLife 2.0 Quick Start Guide

## 🚀 첫 실행 (신규 사용자)

### 1. 환경 설정
```bash
# 프로젝트 클론 및 설치
git clone [repository-url]
cd questlife
npm install

# 환경 변수 설정
cp .env.example .env
# OPENAI_API_KEY를 .env에 추가

# 데이터베이스 초기화
npm run db:init
```

### 2. 개발 서버 시작
```bash
npm run dev
# 또는 개별 실행
npm run server:dev  # 백엔드 (포트 3001)
npm run client:dev  # 프론트엔드 (포트 5173)
```

### 3. 온보딩 플로우 테스트

#### 3.1 첫 방문
1. 브라우저에서 http://localhost:5173 접속
2. 환영 화면 확인
3. "시작하기" 버튼 클릭

#### 3.2 첫 목표 입력
```
예시 목표: "매일 1시간씩 프로그래밍 공부하고 알고리즘 문제 풀기"
```
- AI가 목표 분석
- 캐릭터 클래스 생성: "코드 마법사"
- 초기 퀘스트 3개 자동 생성

#### 3.3 PIN 설정
- 4-6자리 숫자 PIN 입력
- PIN 재입력으로 확인
- 설정 완료 → 대시보드 이동

## 📱 일상 사용 플로우 (기존 사용자)

### 1. PIN 로그인
```
테스트 PIN: 1234
```
- PIN 입력 화면
- 5회 실패 시 15분 잠금

### 2. 대시보드 확인
- **오늘의 퀘스트**: 일일/긴급 퀘스트 목록
- **캐릭터 상태**: 레벨, XP, 속성치
- **스트릭 정보**: 연속 일수, 배수
- **빠른 통계**: 오늘 완료, 획득 XP

### 3. 퀘스트 완료
1. 퀘스트 카드의 "완료" 버튼 클릭
2. XP 획득 애니메이션
3. 레벨업 시 축하 효과
4. 스트릭 카운터 업데이트

### 4. 탭 네비게이션
- **대시보드**: 메인 화면
- **퀘스트**: 전체 퀘스트 관리
- **캐릭터**: 상세 스탯, 스킬 트리
- **목표**: 목표 CRUD

## 🧪 주요 기능 테스트

### PIN 인증 테스트
```bash
# API 직접 테스트
curl -X POST http://localhost:3001/api/auth/setup-pin \
  -H "Content-Type: application/json" \
  -d '{"pin": "1234"}'

# PIN 확인
curl -X POST http://localhost:3001/api/auth/verify-pin \
  -H "Content-Type: application/json" \
  -d '{"pin": "1234"}'
```

### 대시보드 데이터 조회
```bash
# 토큰 필요 (PIN 인증 후 받은 토큰)
curl -X GET http://localhost:3001/api/dashboard \
  -H "Authorization: Bearer [TOKEN]"
```

### 퀘스트 빠른 완료
```bash
curl -X POST http://localhost:3001/api/dashboard/quick-complete \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"questId": 1}'
```

## 🎮 시나리오별 테스트

### 시나리오 1: 첫 사용자 온보딩
1. 앱 첫 실행
2. 목표 입력: "TOEIC 900점 달성하기"
3. AI 분석 → "언어의 마법사" 클래스 생성
4. PIN 설정: 5678
5. 대시보드 진입 확인
6. 일일 퀘스트 3개 확인

### 시나리오 2: 일일 루틴
1. PIN 입력으로 로그인
2. 대시보드에서 오늘의 퀘스트 확인
3. "영어 단어 30개 암기" 완료
4. XP +150, 스트릭 3일 → 3x 보너스
5. 레벨 15 → 16 레벨업
6. 새로운 스킬 해금 확인

### 시나리오 3: 클래스 진화
1. 캐릭터 탭으로 이동
2. 레벨 30 클래스 2개 확인
3. 진화 버튼 클릭
4. "코드 마법사" + "데이터 연금술사" → "풀스택 대마법사"
5. 새로운 스킬 트리 확인

### 시나리오 4: 목표 관리
1. 목표 탭으로 이동
2. 새 목표 추가: "블로그 매주 포스팅"
3. 기존 목표 수정: 목표 날짜 연장
4. 완료된 목표 보관
5. 마일스톤 진행 상황 확인

## 🐛 트러블슈팅

### 문제: PIN 설정이 안됨
```bash
# 데이터베이스 확인
sqlite3 data/questlife.db "SELECT * FROM users;"

# 세션 테이블 확인
sqlite3 data/questlife.db "SELECT * FROM user_sessions;"
```

### 문제: 대시보드가 비어있음
```bash
# 퀘스트 데이터 확인
npm run db:seed  # 샘플 데이터 추가

# 캐시 새로고침
curl -X GET "http://localhost:3001/api/dashboard?refresh=true" \
  -H "Authorization: Bearer [TOKEN]"
```

### 문제: 한국어가 안 나옴
```javascript
// localStorage 확인 (브라우저 콘솔)
localStorage.getItem('i18nextLng')  // 'ko' 여야 함

// 강제 설정
localStorage.setItem('i18nextLng', 'ko')
location.reload()
```

## ✅ 체크리스트

### 온보딩
- [ ] 환영 화면 표시
- [ ] 목표 입력 및 AI 분석
- [ ] PIN 설정 완료
- [ ] 초기 퀘스트 생성
- [ ] 대시보드 진입

### 인증
- [ ] PIN 로그인 성공
- [ ] 세션 유지 (새로고침 후)
- [ ] 로그아웃 동작
- [ ] PIN 변경 가능
- [ ] 실패 시 잠금

### 대시보드
- [ ] 오늘의 퀘스트 표시
- [ ] 캐릭터 정보 표시
- [ ] 스트릭 카운터 동작
- [ ] 빠른 완료 기능
- [ ] 실시간 업데이트

### 네비게이션
- [ ] 4개 탭 전환
- [ ] 현재 위치 표시
- [ ] 뒤로가기 동작
- [ ] 경로 유지

### 한국어
- [ ] 모든 UI 한국어
- [ ] 퀘스트 제목 한국어
- [ ] 에러 메시지 한국어
- [ ] 날짜 형식 한국식

## 📊 성능 목표
- 대시보드 로드: < 200ms
- 퀘스트 완료: 즉시 반응
- 애니메이션: 60fps
- 세션 유지: 7일 (기본)

## 🚢 프로덕션 배포
```bash
# 빌드
npm run build

# 테스트
npm test

# 린트
npm run lint

# 타입 체크
npm run typecheck

# 배포 (예: PM2)
pm2 start npm --name questlife -- start
```

---

성공적인 QuestLife 2.0 여정을 시작하세요! 🎮✨