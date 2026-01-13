# CNEC Korea 프로젝트 가이드

## 프로젝트 개요
- **플랫폼**: 크리에이터-기업 캠페인 매칭 플랫폼
- **스택**: React + Vite + Supabase + Netlify Functions + Tailwind CSS
- **배포**: Netlify

---

## 디렉토리 구조

```
cnec-kr/
├── src/
│   ├── components/
│   │   ├── admin/          # 관리자 페이지 (48개)
│   │   ├── creator/        # 크리에이터 앱 (17개)
│   │   ├── common/         # 공통 컴포넌트
│   │   ├── ui/             # Radix UI 컴포넌트 (46개)
│   │   └── *.jsx           # 메인 컴포넌트 (69개)
│   ├── contexts/           # AuthContext, LanguageContext
│   ├── lib/                # 유틸리티 (supabase, email 등)
│   └── assets/
├── netlify/functions/      # 서버리스 함수 (13개)
└── public/
```

---

## 데이터베이스 스키마 (중요!)

### user_profiles 테이블
```sql
-- 주요 컬럼 (실제 존재하는 것만!)
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
email TEXT
name TEXT
phone TEXT
bio TEXT
bank_name TEXT
bank_account_number TEXT      -- ❌ bank_account 아님!
bank_account_holder TEXT      -- ❌ bank_holder 아님!
resident_number_encrypted TEXT
instagram_url TEXT
tiktok_url TEXT
youtube_url TEXT
other_sns_url TEXT
points INTEGER DEFAULT 0

-- ⚠️ 존재하지 않는 컬럼들 (사용 금지!)
-- profile_image_url, address, detailed_address, zip_code
-- is_deleted, deleted_at, bank_account, bank_holder
```

### campaigns 테이블 - 캠페인 타입별 필드

#### 공통 필드
```sql
id, title, brand, company_name, description, image_url
campaign_type TEXT  -- 'oliveyoung' | '4week_challenge' | 'planned' | 일반
reward_points, creator_points_override
recruitment_deadline, application_deadline, content_submission_deadline
product_link TEXT   -- 올영 스토리 링크용 제품 URL
```

#### 올리브영(oliveyoung) 캠페인
```sql
-- 스텝별 마감일
step1_deadline, step2_deadline, step3_deadline

-- AI 가이드 (JSON)
oliveyoung_step1_guide_ai, oliveyoung_step2_guide_ai, oliveyoung_step3_guide_ai

-- 외부 가이드 모드 (각 스텝별)
step1_guide_mode TEXT  -- 'external' | null
step1_external_type, step1_external_url, step1_external_file_url
step1_external_title, step1_external_file_name
-- step2_, step3_ 동일 구조
```

#### 4주 챌린지(4week_challenge) 캠페인
```sql
-- 주차별 마감일
week1_deadline, week2_deadline, week3_deadline, week4_deadline

-- AI 가이드 (JSON)
challenge_weekly_guides_ai, challenge_weekly_guides

-- 외부 가이드 모드 (각 주차별)
week1_guide_mode TEXT  -- 'external' | null
week1_external_type, week1_external_url, week1_external_file_url
week1_external_title, week1_external_file_name
-- week2_, week3_, week4_ 동일 구조
```

#### 기획형(planned) 캠페인
```sql
guide_delivery_mode TEXT  -- 'external' | null
personalized_guide JSONB  -- AI 생성 가이드
```

### FK 제약조건 (매우 중요!)
```sql
-- 모든 테이블이 ON DELETE CASCADE로 설정됨!
-- auth.users 삭제 시 모든 관련 데이터가 자동 삭제됨
applications.user_id REFERENCES auth.users(id) ON DELETE CASCADE
video_submissions.user_id REFERENCES auth.users(id) ON DELETE CASCADE
withdrawals.user_id REFERENCES auth.users(id) ON DELETE CASCADE
```

---

## 회원 탈퇴 처리 (중요!)

### 소프트 삭제 방식 사용 이유
- DB가 `ON DELETE CASCADE`로 설정되어 있음
- Auth 사용자를 완전 삭제하면 **모든 비즈니스 데이터(영상, 지원서 등)가 삭제됨**
- 기업이 구매한 영상 데이터를 보존해야 함

### 탈퇴 처리 방법
1. user_profiles 개인정보 익명화 (이름→"탈퇴한 사용자", 연락처→null)
2. Auth 사용자 ban (100년 = 876000h)
3. 이메일을 `deleted_{uuid}_{timestamp}@deleted.local`로 변경
4. 비밀번호를 랜덤 값으로 변경
5. 탈퇴 확인 이메일 발송

### 코드 위치
- `netlify/functions/delete-account.js`

---

## 캠페인 가이드 UI 구조

### 가이드 뷰어 컴포넌트
| 컴포넌트 | 용도 |
|---------|------|
| `OliveYoungGuideViewer.jsx` | 올영 AI 가이드 표시 |
| `FourWeekGuideViewer.jsx` | 4주 챌린지 주차별 가이드 |
| `ExternalGuideViewer.jsx` | 외부 가이드 (구글 문서/시트/슬라이드, PDF) |
| `AIGuideViewer.jsx` | 일반 AI 생성 가이드 |

### 외부 가이드 타입
- `google_docs` - Google 문서
- `google_sheets` - Google 스프레드시트
- `google_slides` - Google 슬라이드
- `pdf` - PDF 파일 (Supabase Storage)
- `external_url` - 일반 외부 URL

### 올영 캠페인 Step3 특이사항
- Step 1, 2: 영상 촬영 가이드
- **Step 3: 스토리 링크 업로드 안내** (영상 아님!)
  - 인스타그램 스토리에 product_link URL 삽입
  - 24시간 유지 필수

---

## 환경변수

### Supabase
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY  # Netlify Functions용
```

### 이메일 (Gmail SMTP)
```
GMAIL_APP_PASSWORD  # mkt_biz@cnec.co.kr 앱 비밀번호
```

---

## Supabase Storage 버킷 (중요!)

### 필수 버킷 목록
| 버킷명 | 용도 | 공개 |
|--------|------|------|
| `campaign-images` | 캠페인 이미지 | ✅ |
| `campaign-videos` | 크리에이터 영상 업로드 | ✅ |
| `creator-videos` | 크리에이터 영상 (대체) | ✅ |
| `creator-materials` | 크리에이터 자료 | ❌ |

### 버킷 생성 SQL (Supabase SQL Editor에서 실행)
```sql
-- 버킷이 없으면 "Bucket not found" 오류 발생!
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-videos', 'campaign-videos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-videos', 'creator-videos', true)
ON CONFLICT (id) DO NOTHING;
```

### 코드에서 사용하는 버킷
```javascript
// VideoSubmissionPage.jsx, OliveyoungVideoSubmissionPage.jsx 등
supabase.storage.from('campaign-videos').upload(...)

// ApplicationsPage.jsx
supabase.storage.from('creator-videos').upload(...)
```

---

## 주요 페이지 경로

### 크리에이터
- `/creator` - 크리에이터 앱 메인
- `/creator/campaigns` - 캠페인 목록
- `/creator/applications` - 내 지원 현황
- `/creator/mypage` - 마이페이지
- `/creator/points` - 포인트/출금

### 관리자
- `/admin` - 관리자 대시보드
- `/admin/campaigns` - 캠페인 관리
- `/admin/applications` - 지원자 관리
- `/admin/withdrawals` - 출금 관리

---

## 자주 발생하는 오류

### 1. 스키마에 없는 컬럼 사용
```javascript
// ❌ 잘못된 예
bank_account, bank_holder, address, profile_image_url

// ✅ 올바른 예
bank_account_number, bank_account_holder
```

### 2. Auth 사용자 삭제 시 CASCADE 삭제
```javascript
// ❌ 하드 삭제 - 모든 데이터 삭제됨
await supabaseAdmin.auth.admin.deleteUser(userId)

// ✅ 소프트 삭제 - 데이터 보존
await supabaseAdmin.auth.admin.updateUserById(userId, {
  email: `deleted_${userId}@deleted.local`,
  ban_duration: '876000h'
})
```

### 3. 존재하지 않는 테이블 접근
```javascript
// 스키마에 없을 수 있는 테이블들 (환경에 따라 다름)
notifications, ai_guide_requests, guide_feedbacks, account_deletions
```

### 4. Storage 버킷 오류 (Bucket not found)
```javascript
// ❌ 버킷이 Supabase에 생성되지 않은 경우
// "Bucket not found" 오류 발생

// ✅ 해결: Supabase SQL Editor에서 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-videos', 'campaign-videos', true)
ON CONFLICT (id) DO NOTHING;
```

---

## 코딩 컨벤션

### 컴포넌트
- React 함수형 컴포넌트 사용
- Tailwind CSS 클래스 사용
- lucide-react 아이콘 사용

### Netlify Functions
- CommonJS 모듈 (`require`, `exports.handler`)
- CORS 헤더 필수 설정
- 에러 처리 시 상세 로그 출력

### 데이터베이스
- Supabase 클라이언트 사용
- Service Role Key는 서버사이드에서만 사용
- FK 관계 주의 (CASCADE 동작 확인)

---

## 배포

### Netlify 설정 (netlify.toml)
```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 빌드 명령어
```bash
npm run build   # 프로덕션 빌드
npm run dev     # 개발 서버
```

---

## 📌 Claude 작업 규칙

### 이 파일 업데이트 시점
다음 상황에서 CLAUDE.md를 업데이트해주세요:
1. **새로운 오류 패턴 발견** - "자주 발생하는 오류" 섹션에 추가
2. **DB 스키마 변경** - 컬럼/테이블 추가/삭제 시 반영
3. **새 Storage 버킷 추가** - 버킷 목록 업데이트
4. **중요한 비즈니스 로직 변경** - 회원 탈퇴, 결제 등

### 작업 전 확인사항
- [ ] user_profiles 컬럼명 확인 (bank_account_number, NOT bank_account)
- [ ] FK CASCADE 동작 확인 (Auth 삭제 시 데이터 삭제됨)
- [ ] Storage 버킷 존재 여부 확인
- [ ] 환경변수 확인 (GMAIL_APP_PASSWORD 등)
