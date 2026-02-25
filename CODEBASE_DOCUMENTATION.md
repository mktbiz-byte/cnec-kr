# CNEC Korea 캠페인 플랫폼 - 전체 코드 문서

> K-뷰티 크리에이터 육성 플랫폼의 전체 코드 구조, 아키텍처, 데이터베이스, 컴포넌트, 유틸리티를 정리한 문서입니다.
> 클로드 프로젝트에서 컨텍스트로 활용할 수 있도록 구성했습니다.

---

## 1. 프로젝트 개요

**프로젝트명:** CNEC Korea (cnec-campaign-platform)
**배포 URL:** https://cnec-kr.netlify.app
**기술 스택:**
- **프론트엔드:** React 19 + Vite 6 + Tailwind CSS 4
- **백엔드/DB:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **서버리스:** Netlify Functions (이메일 발송, 관리자 기능)
- **UI 라이브러리:** Radix UI + shadcn/ui 스타일 (46개+ 프리미티브 컴포넌트)
- **상태관리:** React Context API (AuthContext, LanguageContext, PCViewContext)
- **라우팅:** React Router DOM v7
- **차트:** Recharts
- **아이콘:** Lucide React
- **번역:** 커스텀 i18n 시스템 (한국어/일본어/영어)
- **패키지 매니저:** pnpm 10.4.1

---

## 2. 디렉토리 구조

```
cnec-kr/
├── index.html                    # HTML 엔트리 (메타태그, Daum 주소 API)
├── vite.config.js               # Vite 빌드 설정 (코드 스플리팅)
├── eslint.config.js             # ESLint 설정
├── package.json                 # 의존성 및 스크립트
├── .env.example                 # 환경변수 템플릿
├── patches/                     # pnpm 패치
│   └── html2canvas@1.4.1.patch  # oklch/oklab 색상 지원 패치
├── scripts/                     # 유틸리티 스크립트
│   ├── regenerate_ai_guides.js  # AI 가이드 재생성
│   ├── backup-component.sh      # 컴포넌트 백업
│   └── restore-component.sh     # 컴포넌트 복원
├── sql/                         # SQL 스크립트
├── dist/                        # 빌드 결과물
├── KOREA_DATABASE_SCHEMA.sql    # 한국 DB 스키마 전체
├── MUSE_AI_GUIDE_SCHEMA.sql     # AI 가이드 DB 스키마
└── src/
    ├── main.jsx                 # React 앱 엔트리 포인트
    ├── App.jsx                  # 라우팅 + Context Provider 설정
    ├── App.css                  # 전역 CSS
    ├── index.css                # Tailwind + 전역 스타일
    ├── contexts/                # React Context
    │   ├── AuthContext.jsx       # 인증 상태 관리
    │   ├── LanguageContext.jsx   # 언어 설정 (현재 한국어 고정)
    │   └── PCViewContext.jsx     # PC/모바일 뷰 토글
    ├── lib/                     # 유틸리티 & 서비스
    │   ├── supabase.js          # Supabase 클라이언트 + DB 모든 CRUD
    │   ├── i18n.js              # 번역 시스템 (ko/ja/en)
    │   ├── utils.js             # cn() Tailwind 유틸리티
    │   ├── types.js             # 타입 정의 (JSDoc)
    │   ├── pdfDownload.js       # PDF 다운로드 (브라우저 인쇄)
    │   ├── imageCompression.js  # 이미지 압축 (Canvas)
    │   ├── withdrawal_api.js    # 출금 요청 API
    │   ├── emailHelper.js       # 이메일 발송 (Netlify Functions)
    │   ├── emailTemplates.js    # 이메일 HTML 템플릿
    │   ├── emailService.js      # 이메일 서비스 (한국어 템플릿)
    │   ├── emailScheduler.js    # 자동 데드라인 리마인더
    │   ├── simpleEmailService.js# 간단 SMTP 이메일
    │   ├── gmailEmailService.js # Gmail SMTP (EmailJS)
    │   ├── googleDriveService.js# Google Drive/Slides API
    │   ├── emailjs-dummy.js     # EmailJS 더미 객체 (에러 방지)
    │   ├── supabase_backup.js   # Supabase 백업본
    │   ├── supabase_backup_original.js # 원본 백업
    │   ├── supabase_enhanced.js # 향상 버전
    │   ├── supabase_fixed.js    # 수정 버전
    │   ├── supabase_fixed_campaign_applications.js # 지원서 특화
    │   └── supabase_new.js      # 신규 구현
    ├── components/
    │   ├── ui/                  # 46개 Radix UI 프리미티브
    │   ├── creator/             # 크리에이터 페이지 (20개 .jsx + index.js)
    │   ├── admin/               # 관리자 페이지 (53개, 백업 포함)
    │   ├── common/              # 공통 컴포넌트 (3개)
    │   ├── FourWeekGuideViewer.jsx
    │   ├── VideoSubmissionPage.jsx
    │   ├── VideoReviewView.jsx
    │   ├── SignupPageExactReplica.jsx
    │   ├── ProfileSettings_fixed.jsx
    │   ├── LanguageSelector.jsx
    │   └── ... (기타 레거시/백업 파일)
    └── assets/                  # 이미지, 로고
```

---

## 3. 앱 엔트리 & 라우팅

### 3.1 main.jsx
```
React.StrictMode → App 컴포넌트를 #root에 렌더링
emailjs-dummy.js 로드 (EmailJS 목 객체)
```

### 3.2 App.jsx - Context Provider 순서
```
Router → AuthProvider → LanguageProvider → PCViewProvider → AppContent
```
- `AppContent`에서 `emailScheduler.start()` 실행 (useEffect)
- `HolidayNoticePopup` 전역 렌더링 (모든 페이지에서 표시)
- `PCViewLayout`으로 전체 라우트 감싸기
- `PCViewToggleButton` 플로팅 버튼 표시

### 3.3 라우트 구조

**공개 라우트:**
| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | LandingPage (비로그인) / HomePage (로그인) | 메인 페이지 |
| `/login` | LoginPageExactReplica | 이메일/구글 로그인 |
| `/signup` | SignupPageExactReplica | 회원가입 |
| `/forgot-password` | ForgotPasswordPage | 비밀번호 찾기 이메일 발송 |
| `/reset-password` | ResetPasswordPage | 새 비밀번호 입력 |
| `/auth/callback` | AuthCallbackSafe | 구글 OAuth 콜백 |
| `/guide` | CreatorGuidePage | 크리에이터 활동 가이드 |
| `/welcome` | WelcomeScreen | 신규 크리에이터 환영 |

**크리에이터 라우트 (로그인 필요):**
| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/campaigns` | CampaignsPage | 캠페인 탐색/검색 |
| `/campaign/:id` | CampaignDetailPage | 캠페인 상세 |
| `/campaign/:id/apply` | CampaignApplyPage | 캠페인 지원 신청 |
| `/mypage` | MyPageWrapper | 마이페이지 (프로필, 지원, 포인트) |
| `/my/grade` | GradeDetailPage | 등급 상세 |
| `/my/points` | PointsPage | 포인트/출금 관리 |
| `/my/applications` | ApplicationsPage | 지원 내역 |
| `/my/ai-guide` | CreatorAIGuide | AI 콘텐츠 도구 (MUSE 전용) |
| `/creator-application` | CreatorApplicationPage | 크리에이터 소속사 지원서 (ProtectedRoute) |
| `/submit-video/:campaignId` | VideoSubmissionPage | 영상 제출 (범용) |
| `/submit-oliveyoung-video/:campaignId` | OliveyoungVideoSubmissionPage | 올리브영 영상 제출 |
| `/submit-4week-video/:campaignId` | FourWeekVideoSubmissionPage | 4주 챌린지 영상 제출 |
| `/video-review/:submissionId` | VideoReviewView | 영상 검수/피드백 |
| `/profile` | ProfileSettingsTest | 프로필 설정 |
| `/settings/notifications` | NotificationSettings | 알림 설정 |
| `/campaign-application` | CampaignApplicationUpdated | 캠페인 지원서 (구버전) |
| `/company-report/:campaignId` | CompanyReportNew | 기업 리포트 (공개) |
| `/cnecplus` | CNECPlusPageEnhanced | CNEC Plus 페이지 |

**레거시/테스트 라우트:**
| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/creator` | HomePage | 레거시 리다이렉트 |
| `/home-legacy` | HomePageExactReplica | 구버전 홈 |
| `/cnec-plus` | CNECPlusPageEnhanced | CNEC Plus 별칭 |
| `/profile-settings` | ProfileSettingsTest | 프로필 설정 별칭 |
| `/profile-simple` | ProfileSettings | 간소화 프로필 |
| `/profile-test-beta-2025` | ProfileSettingsTest | 프로필 베타 테스트 |
| `/profile-view-beta-2025` | ProfileViewTest | 프로필 뷰 베타 |
| `/secret-admin-login` | SecretAdminLogin | 관리자 비밀 로그인 |
| `/test-admin-login` | TestAdminLogin | 관리자 테스트 로그인 |

**관리자 라우트 (어드민 권한 필요):**
| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/dashboard` | AdminDashboardSimple | 관리자 대시보드 |
| `/campaigns-manage` | AdminCampaignsWithQuestions | 캠페인 관리 |
| `/campaign-create` | CampaignCreationKorea | 캠페인 생성 |
| `/applications-manage` | ApplicationsReportSimple | 지원서 관리 |
| `/applications-report` | ApplicationsReportSimple | 지원서 리포트 |
| `/confirmed-creators` | AdminConfirmedCreators | 확정 크리에이터 |
| `/confirmed-creators/:campaignId` | ConfirmedCreatorsNew | 확정 리포트 |
| `/sns-uploads` | SNSUploadNew | SNS 업로드 관리 |
| `/sns-uploads/:campaignId` | SNSUploadNew | SNS 업로드 (캠페인별) |
| `/campaign-report/:campaignId` | CampaignReportEnhanced | 캠페인 리포트 |
| `/email-templates` | EmailTemplateManager | 이메일 템플릿 |
| `/user-approval` | UserApprovalManagerEnhanced | 사용자 승인 |
| `/withdrawals-manage` | AdminWithdrawals | 출금 관리 |
| `/system-settings` | SystemSettings | 시스템 설정 |
| `/email-settings` | EmailSettings | 이메일 설정 |

---

## 4. Context (상태 관리)

### 4.1 AuthContext.jsx
**역할:** 사용자 인증 및 프로필 관리

**제공 값:**
- `user` - Supabase Auth 사용자 객체
- `userProfile` - DB에서 가져온 프로필 데이터
- `loading` - 인증 로딩 상태

**주요 함수:**
- `signInWithEmail(email, password)` - 이메일 로그인
- `signUpWithEmail(email, password, name)` - 회원가입
- `signInWithGoogle()` - 구글 OAuth
- `signOut()` - 로그아웃 (쿠키/스토리지 전체 삭제)
- `resetPassword(email)` - 비밀번호 리셋
- `updatePassword(newPassword)` - 비밀번호 변경
- `updateProfile(profileData)` - 프로필 업데이트
- `loadUserProfile(userId)` - DB에서 프로필 로드

**인증 흐름:**
```
사용자 액션 → Supabase Auth → onAuthStateChange 리스너 → 프로필 로드 → Context 업데이트
최초 로그인 시 user_profiles 테이블에 자동 프로필 생성
```

### 4.2 LanguageContext.jsx
**역할:** UI 언어 관리 (현재 한국어 고정)

**제공 값:**
- `language: 'ko'` - 항상 한국어
- `t(key)` - 번역 키로 텍스트 조회
- `isKorean: true`
- `changeLanguage()` - no-op (미구현)

### 4.3 PCViewContext.jsx
**역할:** PC/모바일 뷰 모드 토글

**제공 값:**
- `isPCView` - PC 뷰 활성 여부 (토글 ON + 화면 ≥ 1024px)
- `rawPCView` - 사용자 토글 상태 (localStorage 저장)
- `isDesktop` - 화면 크기 기반 감지
- `togglePCView()` - 뷰 모드 전환
- `expandedContent` / `setExpandedContent` - 확장 콘텐츠 상태

---

## 5. 데이터베이스 스키마

### 5.1 Supabase 연결 정보
```
URL: https://vluqhvuhykncicgvkosd.supabase.co
Auth: PKCE 플로우, 자동 토큰 갱신, 세션 유지
Fetch 타임아웃: 30초
Realtime: 초당 10 이벤트 제한
```

### 5.2 주요 테이블

#### user_profiles (크리에이터 프로필)
```sql
id               UUID PRIMARY KEY (auth.users 참조)
email            TEXT
name             TEXT
phone            TEXT
age              TEXT
gender           TEXT
skin_type        TEXT (건성/지성/복합성/민감성/중성)
skin_tone        TEXT
hair_type        TEXT
address          TEXT
detail_address   TEXT
postcode         TEXT
instagram_url    TEXT
youtube_url      TEXT
tiktok_url       TEXT
blog_url         TEXT
instagram_followers   INTEGER
youtube_subscribers   INTEGER
tiktok_followers      INTEGER
category         TEXT
channel_name     TEXT
followers        INTEGER
avg_views        INTEGER
target_audience  TEXT
skin_concerns    TEXT
hair_concerns    TEXT
diet_concerns    TEXT
content_formats  TEXT
collaboration_preferences TEXT
video_styles     TEXT
children         TEXT
family_members   TEXT
offline_locations TEXT
languages        TEXT
bio              TEXT
ai_profile_text  TEXT
role             TEXT (user/admin)
points           INTEGER DEFAULT 0
bank_name        TEXT
bank_account     TEXT (계좌번호)
bank_holder      TEXT (예금주)
resident_number_encrypted TEXT (주민번호 암호화)
cnec_grade_level INTEGER DEFAULT 1 (1~5)
platform_region  TEXT DEFAULT 'kr'
profile_photo_url TEXT
group_purchase   BOOLEAN
created_at       TIMESTAMPTZ
updated_at       TIMESTAMPTZ
```

#### campaigns (캠페인)
```sql
id               UUID PRIMARY KEY
title            TEXT
brand            TEXT
description      TEXT
product_name     TEXT
product_link     TEXT
product_image_url TEXT
product_detail_images JSONB (상세 이미지 배열)
reward_points    INTEGER
creator_points_override INTEGER
reward_amount    INTEGER
status           TEXT (draft/pending_approval/approved/active/completed/cancelled)
category         TEXT (planned/oliveyoung/4week_challenge)
channel          TEXT (instagram/youtube/tiktok)
application_deadline DATE
shipping_deadline    DATE
shooting_deadline    DATE
upload_deadline      DATE
max_slots        INTEGER
filled_slots     INTEGER DEFAULT 0
questions        JSONB (지원 질문 배열)
requirements     TEXT
ai_guide         JSONB (AI 생성 촬영 가이드)
basic_guide      JSONB (기본 가이드)
individual_messages JSONB (주차별 개별 메시지)
company_messages JSONB (공통 공지 메시지)
shooting_scenes  JSONB (촬영 씬 정보)
target_platforms TEXT[]
created_at       TIMESTAMPTZ
updated_at       TIMESTAMPTZ
```

#### applications (캠페인 지원)
```sql
id               UUID PRIMARY KEY
user_id          UUID REFERENCES auth.users
campaign_id      UUID REFERENCES campaigns
status           TEXT (pending/virtual_selected/approved/rejected/selected/completed)
answers          JSONB (질문 답변)
name             TEXT
age              TEXT
phone            TEXT
skin_type        TEXT
address          TEXT
instagram_url    TEXT
youtube_url      TEXT
tiktok_url       TEXT
additional_info  TEXT
google_drive_url TEXT
google_slides_url TEXT
tracking_number  TEXT
sns_upload_url   TEXT
sns_upload_date  DATE
points_awarded   INTEGER
points_awarded_at TIMESTAMPTZ
points_requested BOOLEAN
points_requested_at TIMESTAMPTZ
portrait_rights_consent BOOLEAN
created_at       TIMESTAMPTZ
updated_at       TIMESTAMPTZ
UNIQUE(campaign_id, user_id)
```

#### withdrawals (출금 요청)
```sql
id               UUID PRIMARY KEY
user_id          UUID REFERENCES auth.users
amount           INTEGER
status           TEXT (pending/approved/rejected/completed)
bank_name        TEXT
account_number   TEXT
account_holder   TEXT
resident_number_encrypted TEXT
withdrawal_reason TEXT
admin_notes      TEXT
processed_by     UUID
processed_at     TIMESTAMPTZ
created_at       TIMESTAMPTZ
```

#### point_transactions (포인트 거래 내역)
```sql
id               UUID PRIMARY KEY
user_id          UUID REFERENCES auth.users
amount           INTEGER (양수=적립, 음수=차감)
transaction_type TEXT (earn/withdraw/bonus/adjustment)
description      TEXT
reference_id     UUID (관련 지원/출금 ID)
reference_type   TEXT (application/withdrawal)
created_at       TIMESTAMPTZ
```

#### video_submissions (영상 제출)
```sql
id               UUID PRIMARY KEY
application_id   UUID REFERENCES applications
user_id          UUID REFERENCES auth.users
campaign_id      UUID REFERENCES campaigns
version          INTEGER
edited_video_url TEXT
clean_video_url  TEXT
title            TEXT
memo             TEXT
status           TEXT (submitted/revision_requested/approved)
feedback         TEXT
created_at       TIMESTAMPTZ
```

#### ai_guides (AI 분석 결과 - MUSE 전용)
```sql
id               UUID PRIMARY KEY
user_id          UUID REFERENCES auth.users
type             TEXT (youtube_analysis/idea_generation)
input_data       JSONB
output_data      JSONB
status           TEXT (completed/pending)
created_at       TIMESTAMPTZ
```

#### ai_scripts (AI 스크립트 - MUSE 전용)
```sql
id               UUID PRIMARY KEY
user_id          UUID REFERENCES auth.users
brand_name       TEXT
brand_info       TEXT
story_concept    TEXT
generated_script JSONB
verification_results JSONB ({overall_score, brand_alignment, ...})
verification_status TEXT (pending/verified/needs_revision)
created_at       TIMESTAMPTZ
```

#### 기타 테이블
- `email_templates` - 이메일 템플릿 (type, subject, content, variables)
- `email_logs` - 이메일 발송 기록
- `email_schedules` - 예약 이메일
- `creator_materials` - 크리에이터 자료 (Drive URL 등)
- `admin_users` - 관리자 계정
- `companies` - 기업 계정
- `company_access_tokens` - 기업 접근 토큰
- `creator_applications` - 크리에이터 소속사 지원서
- `faq` - FAQ

### 5.3 Storage 버킷
- `campaign-images` - 캠페인 이미지 (Public)
- `creator-materials` - 크리에이터 자료 (Private, RLS)
- `video-submissions` - 영상 파일 (최대 2GB)

### 5.4 RLS (Row Level Security)
- 사용자는 자신의 데이터만 접근 가능
- 캠페인은 공개 읽기 가능
- 크리에이터 자료는 인증 후 업로드 가능

---

## 6. 핵심 서비스 (src/lib/)

### 6.1 supabase.js (1,355줄) - 중앙 데이터 계층
**모든 DB 작업을 래핑하는 핵심 모듈**

**auth 모듈:**
- `getCurrentUser()`, `getSession()`, `signInWithEmail()`, `signUpWithEmail()`, `signInWithGoogle()`, `signOut()`, `onAuthStateChange()`

**database 모듈:**

`database.campaigns`:
- `getAll()` → 전체 캠페인 (created_at DESC)
- `getActive()` → status='active' 필터
- `getById(id)` → 단일 캠페인
- `create(data)`, `update(id, updates)`, `delete(id)`

`database.applications`:
- `getAll()` → 전체 지원 (user_profiles JOIN + campaign title 포함)
- `getByUser(userId)` → 사용자 지원 내역
- `getByCampaign(campaignId)` → 캠페인별 지원 (프로필 포함)
- `getByUserAndCampaign(userId, campaignId)` → 중복 체크
- `create(data)`, `update(id, data)`, `updateStatus(id, status)`
- **Fallback:** `applications` → `campaign_applications` 테이블 자동 폴백

`database.userProfiles`:
- `get(userId)`, `getAll()`, `upsert(data)`, `update(userId, data)`

`database.emailTemplates`:
- `getAll()`, `getById(id)`, `create(data)`, `upsert(data)`, `update(id, updates)`, `delete(id)`, `getByCategory(category)`

`database.withdrawals`:
- `getAll()` → 사용자 이름/이메일 병합
- `getByUser(userId)`, `create(data)`, `updateStatus(id, status, processedBy, notes)`

`database.userPoints`:
- `getUserTotalPoints(userId)` → point_transactions 합산
- `getUserPoints(userId)` → 거래 내역
- `deductPoints(userId, amount, reason)` → 포인트 차감
- `requestWithdrawal({...})` → 출금 요청 (잔액 확인 → 포인트 차감 → 출금 기록 → 거래 기록)

**중요 패턴:**
- `safeQuery()` → 모든 쿼리 3회 재시도 (지수 백오프)
- 권한 거부 시 빈 배열 반환
- 출금은 원자적 연산 (gte 가드로 경쟁 조건 방지)

**백업/레거시 파일 (6개, 총 3,303줄):**
- `supabase_backup.js` (636줄), `supabase_backup_original.js` (711줄)
- `supabase_enhanced.js` (482줄), `supabase_fixed.js` (620줄)
- `supabase_fixed_campaign_applications.js` (272줄), `supabase_new.js` (582줄)
- 현재 활성 파일은 `supabase.js` (1,355줄)만 사용. 나머지는 히스토리용

### 6.2 i18n.js (559줄) - 번역 시스템
- `t(key, params)` → 번역 텍스트 조회 (파라미터 치환 지원)
- `setLanguage(lang)` → 언어 변경 (localStorage 저장)
- 한국어/일본어/영어 지원
- 카테고리: common, companyReport, confirmedCreatorsReport, snsUploadReport
- 300+ 번역 문자열

### 6.3 pdfDownload.js (219줄) - PDF 내보내기
- `downloadElementAsPdf(element, filename, options)` → HTML을 PDF로 변환
- 브라우저 네이티브 인쇄 방식 (이미지 아닌 문서형)
- 텍스트 선택/번역 가능
- A4 크기, 12mm 마진
- 캠페인 유형/채널 라벨 자동 표시

### 6.4 imageCompression.js - 이미지 압축
- `compressImage(file, options)` → 기본 최대 2MB, 1920px, 80% 품질
- Canvas 기반 리사이즈 + 품질 조절
- 크기 초과 시 품질 자동 감소

### 6.5 withdrawal_api.js - 출금 API
- `withdrawalAPI.create(data)` → 잔액 확인 → 포인트 차감 → 출금 기록
- `userPointsAPI.getUserTotalPoints(userId)` → 총 포인트 계산
- 원자적 차감 (실패 시 롤백)

### 6.6 이메일 시스템 (7개 파일)
- `emailHelper.js` (172줄) → 고수준 API (Netlify Functions 호출)
  - `sendWelcomeEmail()`, `sendApplicationConfirmationEmail()`, `sendApplicationApprovedEmail()`, `sendApplicationRejectedEmail()`, `sendCustomEmail()`
- `emailTemplates.js` (128줄) → HTML 템플릿 (환영, 승인 등)
- `emailService.js` (1,177줄) → 한국어 이메일 템플릿 + {{변수}} 치환
- `emailScheduler.js` (331줄) → 데드라인 자동 리마인더
  - 매일 오전 9시 실행, D-3/D-2/D-1/D-Day 리마인더
  - 영상 미제출자만 대상, 중복 발송 방지
- `simpleEmailService.js` (127줄) → 브라우저 기반 SMTP (localStorage 설정)
- `gmailEmailService.js` (220줄) → Gmail SMTP (EmailJS 연동)
- `emailjs-dummy.js` (25줄) → EmailJS 더미 객체 (EM.init 에러 방지)

### 6.7 googleDriveService.js - Google Drive 연동
- `createFolderStructureForUser(brandName, userName, userEmail)` → 폴더 구조 자동 생성
- `createPresentation(title, parentFolderId)` → Google Slides 생성
- `shareWithUser(fileId, emailAddress, role)` → 공유 설정
- JWT 서비스 계정 인증
- 폴더 구조: `{브랜드}_{날짜}/{크리에이터}/{가이드 슬라이드}`

### 6.8 types.js - 타입 정의
**상태 열거형:**
- `CampaignStatus`: draft, pending_approval, approved, active, completed, cancelled
- `ApplicationStatus`: pending, approved, rejected, selected, completed
- `PaymentStatus`: pending, completed, failed, refunded
- `WithdrawalStatus`: pending, approved, rejected, completed

**등급 시스템:**
| 레벨 | 이름 | 한국어 | 색상 |
|------|------|--------|------|
| 1 | FRESH | 새싹 크리에이터 | #10B981 (emerald) |
| 2 | GLOW | 빛나기 시작하는 단계 | #3B82F6 (blue) |
| 3 | BLOOM | 본격적으로 피어나는 중 | #8B5CF6 (violet) |
| 4 | ICONIC | 브랜드가 먼저 찾는 크리에이터 | #EC4899 (pink) |
| 5 | MUSE | 크넥 대표 뮤즈 | #F59E0B (amber) |

---

## 7. 크리에이터 컴포넌트 (src/components/creator/)

### 7.1 CreatorLayout.jsx - 메인 레이아웃
- 헤더: CNEC 로고, 알림 벨, 사용자 아바타
- 하단 탭 네비게이션 (모바일): 홈, 탐색, 마이페이지
- PC/모바일 반응형 레이아웃

### 7.2 LandingPage.jsx - 랜딩 페이지
- 비로그인 사용자용 공개 페이지
- 서비스 소개 + 인기 캠페인 3개 표시
- 그래디언트 히어로 배너
- 로그인 CTA 버튼

### 7.3 CreatorHome.jsx - 크리에이터 홈
- 등급 배지 + 포인트 잔액
- 활성/완료 캠페인 수
- 추천 캠페인 카드
- 브랜드 신뢰도, 콘텐츠 품질, 전문성 점수 표시
- PC 뷰 확장 지원

### 7.4 CreatorSearch.jsx - 캠페인 탐색
- 키워드 검색 (디바운스)
- 카테고리 필터: 전체, 기획형, 올리브영, 4주 챌린지
- 정렬: 최신순, 인기순
- Intersection Observer 무한 스크롤
- 찜(위시리스트) 기능 (localStorage)
- 지원 완료 캠페인 표시

### 7.5 CampaignDetailPage.jsx - 캠페인 상세
- 캠페인 이미지, 브랜드, 제목, 리워드
- D-Day 카운트다운 배지
- 타임라인: 지원 마감 → 배송 → 촬영 → 업로드
- AI 생성 가이드: 후킹 포인트, 코어 메시지, 영상 설정, 미션, 금지사항, 해시태그
- 상품 상세 이미지 모달
- 지원 버튼 (기존 지원 체크)

### 7.6 CampaignApplyPage.jsx - 캠페인 지원
- 개인정보: 이름, 나이, 피부타입, 주소, 전화번호
- SNS 링크: 인스타그램, 유튜브, 틱톡
- 캠페인별 질문 응답
- 초상권 동의 체크박스
- 캠페인 정책 팝업 (24시간 안보기)
- 피부타입 옵션: 건성, 지성, 복합성, 민감성, 중성

### 7.7 CreatorMyPage.jsx - 마이페이지 (종합)
- **대시보드:** 등급, 포인트, 활동 통계
- **프로필:** 편집 모드 토글, SNS 링크, 주소
- **지원 내역:** 상태 필터링, 상세 보기
- **포인트:** 잔액, 출금 신청, 거래 내역
- **은행 정보:** 계좌 등록/인증
- **찜 캠페인:** localStorage 기반
- **설정:** 로그아웃

**한국 은행 옵션:** KB국민, 신한, 우리, NH농협, 하나, IBK기업, SC제일, 한국씨티, KDB산업, 경남, 광주, 대구, 부산, 전북, 제주, 카카오뱅크, 케이뱅크, 토스뱅크

### 7.8 PointsPage.jsx - 포인트 관리
- 총 포인트, 대기 중, 출금 가능 분리 표시
- 포인트/출금 탭 전환
- 출금 모달: 금액 입력, 주민번호 확인
- 거래 내역 리스트

### 7.9 GradeDetailPage.jsx - 등급 상세
- 현재 등급 + 색상 배지
- 5개 점수: 브랜드 신뢰도, 콘텐츠 품질, 전문성, 성장성, 기여도
- 달성 진행도 + 다음 등급 요건

### 7.10 ApplicationsPage.jsx - 지원 내역
- 캠페인별 지원 상태 추적
- 촬영 씬 테이블 (장면 설명, 대사, 팁)
- 가이드 뷰어: FourWeekGuideViewer, OliveYoungGuideViewer, AIGuideViewer
- PDF 다운로드

### 7.11 CreatorAIGuide.jsx - AI 콘텐츠 도구 (MUSE 전용)
- **분석 탭:** 유튜브 쇼츠 스타일 분석
- **스크립트 탭:** 브랜드 정보 기반 대본 생성
- **저장 탭:** 생성 스크립트 관리
- **SEO 탭:** 콘텐츠 SEO 최적화 분석
- 접근 조건: `cnec_grade_level === 5` (MUSE)

### 7.12 기타 크리에이터 컴포넌트
- **CreatorGuidePage.jsx** - 7단계 활동 가이드 (캠페인 발견 → 포인트)
- **CampaignPolicyModal.jsx** - 패널티 정책 (마감 미준수: D+1 -10%, D+7 -50%, D+14 -100%)
- **WelcomeScreen.jsx** - 신규 환영 + 보너스 안내
- **CreatorApplicationPage.jsx** - 소속사 지원서 (SNS 정보, 카테고리, 경력)
- **CampaignDetailModal.jsx** - 캠페인 상세 모달 버전
- **CampaignsPage.jsx** - 캠페인 목록 래퍼 (CreatorSearch 포함)
- **HomePage.jsx** - 로그인 후 메인 홈
- **MyPageWrapper.jsx** - 마이페이지 래퍼 컴포넌트
- **CreatorApp.jsx** - 크리에이터 앱 루트
- **index.js** - 배럴 익스포트 (App.jsx에서 `import { CreatorApp, CreatorMyPage, ... } from './components/creator'` 형태로 사용)

---

## 8. 관리자 컴포넌트 (src/components/admin/)

### 8.1 AdminDashboard.jsx - 대시보드
- 통계 카드: 총 캠페인, 활성 캠페인, 총 지원, 총 사용자
- 월별 추이 차트 (Recharts)
- 최근 활동 목록
- 빠른 액션 버튼
- **관리자 이메일:** mkt_biz@cnec.co.kr, admin@cnec.test, acrossx@howlab.co.kr

### 8.2 AdminCampaignsWithQuestions.jsx - 캠페인 관리
- 탭: 전체/활성/완료
- 캠페인별 지원자 수, 확정 수 표시
- 상태 변경 드롭다운
- 리포트 생성: 기업 리포트, 확정 크리에이터, SNS 업로드

### 8.3 AdminApplications.jsx - 지원 관리
- 캠페인별 지원서 필터링
- 상세 보기 모달 (프로필 + 답변)
- 승인 모달 (Google Drive/Slides URL 입력)
- 거절 모달 (사유 선택)
- Excel 다운로드 (지원자 목록, 배송 정보)
- 가선정(virtual_selected) 기능

### 8.4 AdminConfirmedCreators.jsx - 확정 크리에이터
- 배송 상태 관리 (배송완료/대기)
- 인라인 운송장 번호 입력
- 크리에이터 통계: 총원, 배송완료, 대기

### 8.5 AdminWithdrawals.jsx - 출금 관리
- 탭: 출금 요청 / 은행 이체
- 상태 관리: 대기 → 승인/거절/완료
- 벌크 선택 및 일괄 처리
- 거절 모달 (사유 입력)
- Netlify Function으로 포인트 환불
- Excel 내보내기

### 8.6 AdminVideoUploadModal.jsx - 영상 업로드
- 파일/URL 업로드 모드
- 편집본 + 클린 영상 지원
- 버전 히스토리
- 최대 2GB 파일

### 8.7 CampaignCreationKorea.jsx - 캠페인 생성
- 카테고리 선택 + 플랫폼 자동 매핑
- 이미지 업로드
- 상품 정보, 리워드, 슬롯 설정
- 마감일 날짜 선택
- 캠페인 질문 (최대 4개)

### 8.8 UserApprovalManager.jsx - 사용자 승인
- 상태 필터: 대기/승인/거절
- 역할 필터: user/admin
- 상세 모달 + 승인/거절
- 관리자 권한 부여/해제

### 8.9 기타 관리자 컴포넌트 (활성 사용)
- **AdminDashboardSimple.jsx** - 대시보드 간소화 버전 (현재 라우트 사용)
- **AdminNavigation.jsx** - 관리 메뉴 (반응형)
- **AdminHeader.jsx** - 헤더 + 언어 전환 + 사용자 메뉴
- **AdminEmailManagement.jsx** - 이메일 로그, 예약 이메일, 테스트 발송
- **AdminCompanyAccess.jsx** - 기업 계정 + API 토큰 관리
- **EmailTemplateManager.jsx** - 이메일 템플릿 편집
- **EmailSettings.jsx** - 이메일 설정 (현재 라우트 사용)
- **SystemSettings.jsx** - SMTP, SEO, 애널리틱스 설정
- **SNSUploadNew.jsx** - SNS 업로드 관리 (현재 라우트 사용)
- **SNSUploadFinalReport.jsx** - SNS 업로드 현황 리포트
- **ConfirmedCreatorsNew.jsx** - 확정 크리에이터 (현재 라우트 사용)
- **ConfirmedCreatorsReport.jsx** - 확정 크리에이터 리포트 + Excel
- **ApplicationsReportSimple.jsx** - 지원서 종합 리포트 (현재 라우트 사용)
- **CampaignReport.jsx** - 캠페인별 리포트
- **CampaignReportEnhanced.jsx** - 향상된 캠페인 리포트 (현재 라우트 사용)
- **CampaignFinalReport.jsx** - 캠페인 최종 리포트
- **CampaignApplicationsReport.jsx** - 캠페인 지원서 리포트
- **CompanyReport_multilingual.jsx** - 다국어 기업 리포트
- **UserApprovalManagerEnhanced.jsx** - 향상된 사용자 승인 (현재 라우트 사용)
- **CreatorMaterialsManager.jsx** - 크리에이터 자료 배포 (Drive URL)
- **DriveModal.jsx** - Google Drive/Slides URL 입력 모달
- **CampaignCreationWithTranslator.jsx** - 번역 기능 캠페인 생성

**추가 활성 파일:**
- **AdminCampaigns.jsx** - 캠페인 관리 (기본 버전)
- **AdminCampaignsEnhanced.jsx** - 향상된 캠페인 관리
- **AdminWithdrawals_helper.js** - 출금 헬퍼 유틸리티 (.js)
- **ConfirmedCreatorsReport_multilingual.jsx** - 다국어 확정 리포트
- **SNSUploadFinalReport_multilingual.jsx** - 다국어 SNS 리포트

**중요:** `/applications-manage` 및 `/applications-report` 라우트의 `ApplicationsReportSimple` 컴포넌트는 실제로 `ApplicationsReportSimple_final.jsx` 파일에서 임포트됨 (App.jsx line 57: `import ... from './components/admin/ApplicationsReportSimple_final'`)

**관리자 백업/레거시 파일 (53개 중 약 28개):** `_backup`, `_fixed`, `_fixed_final`, `_with_drive` 등 접미사 파일 다수 존재. 반복적 개선 과정에서 생성된 히스토리 파일.

---

## 9. 공유 컴포넌트

### 9.1 FourWeekGuideViewer.jsx
- 4주 챌린지 가이드 주차별 탭 뷰
- AI 가이드 + 기본 가이드 병합
- 미션, 대사, 해시태그, 주의사항 섹션

### 9.2 VideoSubmissionPage.jsx
- 영상 제출 (최대 V10)
- 편집본 + 클린 영상 분리 업로드
- 진행률 표시 + 버전 히스토리
- 알림톡 자동 발송 (Netlify Function)

### 9.3 VideoReviewView.jsx
- 영상 플레이어 + 시각적 피드백 마커 (빨간 박스)
- 타임스탬프 기반 댓글 시스템
- 답글 스레드
- 버전 탭 네비게이션
- 수정본 업로드

### 9.4 SignupPageExactReplica.jsx
- 이메일/비밀번호 + 구글 OAuth 회원가입
- iPhone 브라우저 호환성 경고
- 이메일 인증 플로우

### 9.5 ProfileSettings_fixed.jsx
- 개인정보 편집 (이름, 나이, 피부타입, 바이오)
- SNS URL 관리
- 비밀번호 변경

### 9.6 LanguageSelector.jsx
- 언어 전환 드롭다운
- `languageChanged` 커스텀 이벤트 발행

### 9.7 주요 공유 컴포넌트 (src/components/ 루트, 72개 파일)
**인증 관련:**
- `LoginPageExactReplica.jsx` - 로그인 (이메일/구글)
- `ForgotPasswordPage.jsx` - 비밀번호 찾기
- `ResetPasswordPage.jsx` - 비밀번호 재설정
- `AuthCallbackSafe.jsx` - OAuth 콜백 처리
- `ProtectedRoute.jsx` - 인증 필요 라우트 가드
- `SecretAdminLogin.jsx`, `TestAdminLogin.jsx` - 관리자 로그인

**프로필 관련:**
- `ProfileSettingsTest.jsx` - 현재 활성 프로필 설정 (라우트: `/profile`)
- `ProfileSettings.jsx` - 간소화 프로필 (라우트: `/profile-simple`)
- `ProfileViewTest.jsx` - 프로필 뷰 베타
- `NotificationSettings.jsx` - 알림 설정

**캠페인 관련:**
- `CampaignApplicationUpdated.jsx` - 캠페인 지원서 (구버전 라우트)
- `CompanyReportNew.jsx` - 기업 리포트 (크리에이터 공개)
- `CNECPlusPageEnhanced.jsx` - CNEC Plus 페이지
- `OliveYoungGuideViewer.jsx` - 올리브영 가이드 뷰어
- `AIGuideViewer.jsx` - AI 가이드 뷰어
- `OliveyoungVideoSubmissionPage.jsx` - 올리브영 영상 제출
- `FourWeekVideoSubmissionPage.jsx` - 4주 챌린지 영상 제출
- `HolidayNoticePopup.jsx` - 휴일 공지 팝업
- `VideoReferencesSection.jsx` - 참고 영상 섹션
- `EmailScheduler.jsx` - 이메일 스케줄러 UI

**레거시/백업 (미사용):** 다수의 `_backup`, `_fixed`, `_old`, `_enhanced` 접미사 파일 존재

---

## 10. UI 컴포넌트 라이브러리 (src/components/ui/)

Radix UI + CVA(Class Variance Authority) 기반 **46개+ 프리미티브 컴포넌트**:

**기본:** button, card, input, label, select, textarea, checkbox, alert, separator, badge
**레이아웃:** accordion, collapsible, resizable, scroll-area, sheet, sidebar, aspect-ratio, tabs
**오버레이:** dialog, alert-dialog, drawer, popover, hover-card, tooltip, context-menu, dropdown-menu
**내비게이션:** breadcrumb, menubar, navigation-menu, pagination, command
**데이터:** table, calendar, chart, progress, skeleton
**입력:** radio-group, slider, switch, toggle, toggle-group, input-otp, form
**피드백:** sonner (토스트), avatar, carousel

**디자인 시스템:**
- Tailwind CSS 기반 스타일링
- CSS 커스텀 프로퍼티 (--ring, --primary, --destructive 등)
- 다크 모드 지원 (dark: 접두사)
- ARIA 접근성 내장
- `cn()` 유틸리티로 클래스 충돌 해결

---

## 11. 빌드 & 배포 설정

### 11.1 vite.config.js
```javascript
plugins: [react(), tailwindcss()]
alias: { "@": "./src" }
outDir: 'dist'
sourcemap: false
chunkSizeWarningLimit: 1000KB
manualChunks: {
  vendor: ['react', 'react-dom', 'react-router-dom'],
  supabase: ['@supabase/supabase-js'],
  ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', ...],
  utils: ['clsx', 'class-variance-authority', 'tailwind-merge'],
  icons: ['lucide-react']
}
define: { global: 'globalThis' }
```

### 11.2 환경변수 (.env.example)
```
VITE_SUPABASE_URL=          # Supabase 프로젝트 URL (필수)
VITE_SUPABASE_ANON_KEY=     # Supabase 익명 키 (필수)
VITE_PLATFORM_REGION=kr     # 리전
VITE_PLATFORM_COUNTRY=KR    # 국가 코드
VITE_ENCRYPTION_KEY=        # 주민번호 암호화 키 (32자 이상, 필수)
NODE_ENV=production
```

### 11.3 index.html 메타태그
- 검색엔진 차단: `<meta name="robots" content="noindex, nofollow, noarchive">`
- Open Graph: K-뷰티 크리에이터 육성 플랫폼
- 외부 스크립트: Daum 주소 API (우편번호 검색)

---

## 12. 주요 비즈니스 플로우

### 12.1 캠페인 워크플로우
```
[관리자] 캠페인 생성
    → [크리에이터] 캠페인 탐색/발견
    → [크리에이터] 지원 신청 (개인정보 + 질문 답변)
    → [관리자] 가선정(virtual_selected) → 확정(approved)
    → [관리자] 이메일 발송 (승인 + Drive URL)
    → [크리에이터] 상품 수령 (운송장 추적)
    → [크리에이터] 영상 촬영/제출 (V1~V10)
    → [관리자] 영상 검수/피드백
    → [크리에이터] SNS 업로드
    → [관리자] 포인트 지급
    → [크리에이터] 포인트 출금 신청
    → [관리자] 출금 승인/처리
```

### 12.2 포인트 시스템
```
적립: 캠페인 완료 시 reward_points 지급 → point_transactions INSERT
차감: 출금 요청 시 atomic deduction (gte 가드)
    → point_transactions INSERT (음수)
    → withdrawals INSERT
    → 실패 시 롤백
```

### 12.3 등급 시스템
```
FRESH (1) → GLOW (2) → BLOOM (3) → ICONIC (4) → MUSE (5)
평가 기준: 브랜드 신뢰도, 콘텐츠 품질, 전문성, 성장성, 기여도
MUSE 등급: AI 콘텐츠 도구 독점 접근
```

### 12.4 이메일 자동화
```
emailScheduler → 매일 오전 9시 체크
  D-3: 데드라인 3일 전 리마인더
  D-2: 2일 전
  D-1: 1일 전
  D-Day: 당일
  * 영상 미제출자만 대상, 중복 방지
```

---

## 13. 외부 서비스 연동

| 서비스 | 용도 | 인증 방식 |
|--------|------|-----------|
| **Supabase** | Auth, DB, Storage, Realtime | API Key + PKCE |
| **Netlify Functions** | 이메일 발송, 관리자 API | 엔드포인트 호출 |
| **Google Drive API** | 폴더 생성, 파일 공유 | JWT 서비스 계정 |
| **Google Slides API** | 가이드 프레젠테이션 생성 | JWT 서비스 계정 |
| **Daum Postcode API** | 한국 주소 검색 | 공개 API |
| **Google Generative AI** | AI 가이드/스크립트 생성 | API Key |
| **EmailJS** | Gmail SMTP 중계 | Public Key |

---

## 14. 보안 조치

- **PKCE 플로우:** OAuth 보안 강화
- **주민번호 암호화:** VITE_ENCRYPTION_KEY (32자 이상)
- **RLS:** 행 수준 보안 정책
- **원자적 출금:** gte 가드로 경쟁 조건 방지
- **검색엔진 차단:** noindex, nofollow
- **관리자 인증:** 이메일 기반 접근 제어
- **세션 정리:** 로그아웃 시 쿠키/localStorage/sessionStorage 전체 삭제

---

## 15. 파일별 빠른 참조 (Quick Reference)

| 파일 | 줄 수 | 핵심 역할 |
|------|-------|-----------|
| `src/App.jsx` | 178 | 라우팅 + Provider 설정 |
| `src/lib/supabase.js` | 1,355 | 모든 DB CRUD 작업 |
| `src/lib/i18n.js` | 558 | 번역 시스템 |
| `src/contexts/AuthContext.jsx` | 303 | 인증 상태 |
| `src/components/creator/CreatorMyPage.jsx` | 1,648 | 마이페이지 종합 |
| `src/components/creator/CreatorHome.jsx` | 698 | 크리에이터 홈 |
| `src/components/creator/CampaignDetailPage.jsx` | 968 | 캠페인 상세 |
| `src/components/creator/CampaignApplyPage.jsx` | 696 | 지원 폼 |
| `src/components/creator/CreatorAIGuide.jsx` | 1,655 | AI 도구 (MUSE) |
| `src/components/admin/AdminDashboard.jsx` | 476 | 관리자 대시보드 |
| `src/components/admin/AdminApplications.jsx` | 908 | 지원 관리 |
| `src/components/admin/AdminWithdrawals.jsx` | 1,003 | 출금 관리 |
| `src/components/admin/CampaignCreationKorea.jsx` | 588 | 캠페인 생성 |
| `src/components/VideoSubmissionPage.jsx` | 716 | 영상 제출 |
| `src/components/VideoReviewView.jsx` | 791 | 영상 검수 |

---

## 16. Netlify Serverless Functions (netlify/functions/)

17개의 서버리스 함수로 백엔드 로직을 처리합니다 (자체 package.json 포함).

### AI/콘텐츠 생성
| 함수 | 용도 |
|------|------|
| `ai-idea-generate.js` | AI 아이디어 생성 |
| `ai-script-generate.js` | AI 스크립트 작성 |
| `ai-script-verify.js` | 콘텐츠 검증 |
| `ai-youtube-analyze.js` | 유튜브 분석 |
| `ai-youtube-seo.js` | SEO 최적화 |

### 이메일/알림
| 함수 | 용도 |
|------|------|
| `send-email.js` | 범용 이메일 발송 |
| `send-gmail.js` | Gmail API 연동 |
| `send-notification-helper.js` | 알림 시스템 |
| `send-resubmit-notification.js` | 재제출 안내 |
| `send-revision-request-notification.js` | 수정 요청 알림 |
| `send-alimtalk.cjs` | 한국 알림톡(카카오) SMS |

### 관리자 기능
| 함수 | 용도 |
|------|------|
| `admin-refund-points.js` | 포인트 환불 처리 |
| `verify-account.cjs` | 계좌 인증 |
| `verify-user-email.js` | 이메일 인증 |
| `delete-account.js` | 계정 삭제 |
| `weekly-withdrawal-report.js` | 주간 출금 리포트 |

---

## 17. Hooks & Constants

### src/hooks/use-mobile.js
- `useMobile()` → 모바일 디바이스 감지 커스텀 훅

### src/constants/beautyProfileOptions.js (~400줄)
뷰티 프로필 카테고리 상수:
- 피부 타입, 피부 고민
- SNS 플랫폼 정보
- 크리에이터 하위 카테고리
- 콘텐츠 포맷 옵션
- 협업 선호도

---

## 18. 공통 컴포넌트 (src/components/common/)

| 파일 | 용도 |
|------|------|
| `PCViewLayout.jsx` | PC/모바일 반응형 레이아웃 래퍼 |
| `PCViewToggleButton.jsx` | 뷰 모드 전환 플로팅 버튼 |
| `ExternalGuideViewer.jsx` | 외부 가이드 뷰어 (기획형 캠페인) |

---

## 19. Supabase DB 마이그레이션 (supabase/migrations/)

| 마이그레이션 | 내용 |
|-------------|------|
| `01_create_video_submissions_table.sql` | 영상 제출 테이블 |
| `02_create_video_submissions_indexes.sql` | 인덱스 최적화 |
| `03_create_video_submissions_rls.sql` | RLS 보안 정책 |
| `04_create_video_submissions_trigger.sql` | 자동화 트리거 |
| `05_create_storage_policies.sql` | 파일 업로드 보안 |
| `06_add_video_submission_fields.sql` | 영상 필드 확장 |
| `07_add_partnership_code_to_applications.sql` | 파트너십 코드 |
| `07_fix_video_submissions_version_check.sql` | 영상 버전 체크 수정 |
| `08_add_company_phone_to_campaigns.sql` | 기업 연락처 |
| `09_add_korean_campaign_columns.sql` | 한국 캠페인 칼럼 |
| `10_add_clean_video_url_to_applications.sql` | 클린 영상 URL |
| `11_add_uploaded_by_to_video_submissions.sql` | 업로더 추적 |
| `create_video_submissions_table.sql` | 영상 제출 테이블 (초기 버전) |

---

## 20. SQL 스크립트 (루트 42개 + sql/ 1개 = 총 43개)

주요 DB 설정/수정용 SQL 스크립트:
- **스키마:** `KOREA_DATABASE_SCHEMA.sql`, `MUSE_AI_GUIDE_SCHEMA.sql`, `SUPABASE_COMPLETE_SETUP.sql`
- **칼럼 추가:** `ADD_BEAUTY_PROFILE_COLUMNS.sql`, `ADD_CAMPAIGNS_COLUMNS.sql`, `ADD_MISSING_COLUMNS.sql`, `ADD_PROFILE_PHOTO_COLUMN.sql`
- **수정:** `FIX_KOREA_USER_PROFILES.sql`, `FIX_STORAGE_RLS_POLICY.sql`, `SUPABASE_FIX_SCRIPT.sql`, `fix_database_schema.sql`, `database_schema_fix.sql`, `fix_foreign_key_relations.sql`, `fix_point_transactions_constraint.sql`
- **테이블 생성:** `add_campaign_category.sql`, `add_cnecplus_table.sql`, `add_faq_table.sql`, `add_video_references_table.sql`, `create_withdrawals_table.sql`, `database_creator_materials.sql`
- **스토리지:** `CREATE_STORAGE_BUCKETS_KR.sql`, `SETUP_PROFILE_PHOTOS_STORAGE.sql`
- **출금 시스템:** `withdrawal_system_check.sql`, `withdrawal_system_fix.sql`, `check_withdrawal_data.sql`, `check_withdrawal_system.sql`, `check_withdrawal_tables.sql`
- **점검:** `check_schema.sql`, `check_applications_columns.sql`, `check_applications_structure.sql`, `check_user_profiles_structure.sql`, `supabase_structure_check.sql`
- **관리자:** `admin_role_fix.sql`, `create_test_admin.sql`, `ADD_ADMIN_USER.sql`, `CHECK_PROFILE_COLUMNS.sql`
- **트랜잭션:** `update_transaction_types.sql`, `fix_existing_transaction_types.sql`
- **기타:** `database_schema_with_email.sql`, `cleanup_temp_users.sql`, `check_users_and_admins.sql`, `check_sns_uploads.sql`
- **sql/ 디렉토리:** `sql/check_profile_fields.sql`

---

## 21. Assets (src/assets/)

| 파일 | 용도 |
|------|------|
| `cnec-logo.png` | 기본 로고 |
| `cnec-logo-clean.png` | 클린 로고 |
| `cnec-logo-final.png` | 최종 로고 |
| `cnec-logo-horizontal.png` | 가로형 로고 |
| `cnec-logo-transparent.png` | 투명 배경 로고 |
| `react.svg` | React 기본 아이콘 |
| `supabase-client-complete.js` | Supabase 클라이언트 (정적 번들용) |
| `supabase-client-netlify.js` | Netlify용 Supabase 클라이언트 |

---

## 22. 환경변수 상세 (.env.example)

```bash
# Supabase Configuration (필수)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Platform Configuration
VITE_PLATFORM_REGION=kr
VITE_PLATFORM_COUNTRY=KR

# Encryption Key (필수 - 주민번호 암호화)
# 생성: openssl rand -hex 32
VITE_ENCRYPTION_KEY=your_very_secure_encryption_key_here_minimum_32_characters

# Stats Multipliers (선택 - 홈페이지 통계 배수)
# VITE_STATS_MULTIPLIER_CREATORS=1
# VITE_STATS_MULTIPLIER_CAMPAIGNS=1
# VITE_STATS_MULTIPLIER_BRANDS=1
# VITE_STATS_MULTIPLIER_REVENUE=1

NODE_ENV=production
```

---

## 23. 핵심 의존성 요약

### 코어
- React 19.1.0, React DOM 19.1.0, React Router DOM 7.6.1
- React Hook Form 7.56.3, Zod 3.24.4 (폼 검증)

### UI/UX
- Radix UI (11개 프리미티브), Tailwind CSS 4.1.7
- Lucide React 0.510.0 (아이콘)
- Framer Motion 12.15.0 (애니메이션)
- Recharts 2.15.3 (차트)

### 백엔드
- @supabase/supabase-js 2.58.0
- @google/generative-ai 0.24.1 (Gemini AI)
- Firebase 12.3.0

### 이메일
- @emailjs/browser 4.4.1, Nodemailer 7.0.11

### 유틸리티
- Axios 1.13.2, Date-fns 3.6.0
- XLSX 0.18.5 (엑셀), html2pdf.js 0.14.0
- Clsx 2.1.1, Tailwind Merge 3.3.0

---

*이 문서는 2026-02-25 기준 코드베이스를 분석하여 작성되었습니다.*
