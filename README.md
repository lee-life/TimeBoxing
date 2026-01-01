# ⏱️ TIME FIGHTER - AI-Powered Time Boxing Planner

<div align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite" />
  <img src="https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Supabase-Cloud-3ECF8E?logo=supabase" />
</div>

## 🥊 About

TIME FIGHTER는 복싱 테마의 AI 기반 타임박싱 플래너입니다. 일일/주간 계획을 세우고, AI가 자동으로 스케줄을 생성해줍니다.

### ✨ Features

- 🤖 **AI 스케줄 생성** - Gemini AI로 Brain Dump를 자동 스케줄로 변환
- 📅 **Daily/Weekly 모드** - 일일 및 주간 계획 지원
- ☁️ **클라우드 동기화** - Supabase로 어디서든 데이터 접근
- 🎨 **인터랙티브 UI** - 3D 복싱 글러브와 패럴랙스 효과
- 📱 **반응형 디자인** - 모바일/데스크톱 지원
- 📸 **이미지 내보내기** - 플랜을 이미지로 저장

---

## 🚀 Quick Start

### 1. 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 2. 환경 변수 설정 (선택사항)

`.env.local` 파일 생성:

```env
# Supabase (클라우드 동기화용)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI (AI 스케줄 생성용)
VITE_GEMINI_API_KEY=your_gemini_api_key
```

> ⚠️ 환경 변수 없이도 localStorage 모드로 작동합니다!

---

## ☁️ Vercel + Supabase 배포 가이드

### Step 1: Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입/로그인
2. "New Project" 클릭
3. 프로젝트 이름, 비밀번호, 리전 설정 후 생성

### Step 2: 데이터베이스 설정

1. Supabase Dashboard → **SQL Editor** 이동
2. "New Query" 클릭
3. `supabase-schema.sql` 파일 내용 복사 & 붙여넣기
4. **Run** 클릭

### Step 3: Supabase 인증 설정

1. **Authentication** → **Providers** 이동
2. **Email** 활성화 (기본값)
3. (선택) "Confirm email" 비활성화 (테스트용)

### Step 4: API 키 복사

1. **Settings** → **API** 이동
2. 다음 값들을 복사:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

### Step 5: GitHub에 코드 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/timefighter.git
git push -u origin main
```

### Step 6: Vercel 배포

1. [Vercel](https://vercel.com)에 GitHub로 로그인
2. "Import Project" → GitHub 저장소 선택
3. **Environment Variables** 설정:
   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | your_supabase_url |
   | `VITE_SUPABASE_ANON_KEY` | your_supabase_anon_key |
   | `VITE_GEMINI_API_KEY` | your_gemini_key (선택) |

4. **Deploy** 클릭!

---

## 📁 Project Structure

```
TimeBoxing/
├── App.tsx                 # 메인 앱 컴포넌트
├── components/
│   ├── TimeSlot.tsx       # 타임슬롯 컴포넌트
│   └── Controls.tsx       # 컨트롤 패널
├── hooks/
│   └── useAuth.ts         # 인증 훅 (Supabase/localStorage)
├── services/
│   ├── supabase.ts        # Supabase 클라이언트
│   ├── dataService.ts     # 데이터 CRUD 서비스
│   └── geminiService.ts   # Gemini AI 서비스
├── types/
│   └── database.ts        # Supabase 타입 정의
├── types.ts               # 앱 타입 정의
├── supabase-schema.sql    # DB 스키마 (Supabase에서 실행)
└── vercel.json            # Vercel 배포 설정
```

---

## 🔧 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI**: Google Gemini API
- **Hosting**: Vercel

---

## 📝 License

MIT License

---

<div align="center">
  <p><strong>🥊 TRAIN HARD • FIGHT EASY 🥊</strong></p>
</div>
