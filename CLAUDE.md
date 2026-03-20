# CLAUDE.md - cnec-kr (한국 크리에이터 사이트)

## 프로젝트 개요
- **도메인**: https://cnec-kr.netlify.app
- **레포**: mktbiz-byte/cnec-kr
- **용도**: 한국 크리에이터 플랫폼 (캠페인 지원, 마이페이지, 포인트, 출금)

## 기술 스택
React 19 + Vite 6 + Tailwind CSS 4 + shadcn/ui + Supabase + Netlify

## 데이터베이스
- **자체 DB**: Korea Supabase (vluqhvuhykncicgvkosd)
- **BIZ DB**: 일부 함수에서 BIZ Supabase에 접근 (미팅, 스토리 등)

## 환경변수 표준명

| DB | URL | KEY |
|----|-----|-----|
| 자체 (Korea) | `VITE_SUPABASE_URL` | `SUPABASE_SERVICE_ROLE_KEY` |
| BIZ 접근 시 | `VITE_SUPABASE_BIZ_URL` | `SUPABASE_BIZ_SERVICE_ROLE_KEY` |

**절대 사용 금지:**
- `SUPABASE_BIZ_SERVICE_KEY` → `SUPABASE_BIZ_SERVICE_ROLE_KEY` 사용
- `SUPABASE_BIZ_ANON_KEY` → 서버에서 anon key 사용 금지
- `SUPABASE_URL` (VITE_ prefix 없는 레거시)
- 폴백 체인 (`A || B`) 금지 — 표준 변수 하나만 사용

## Supabase 클라이언트
- **프론트엔드**: `src/lib/supabase.js` (이것만 사용)
- `supabase_backup.js`, `supabase_fixed.js`, `supabase_new.js` 등 변형 파일 사용 금지 (삭제됨)

## 파일 네이밍 금지 패턴
- `*_backup.jsx`, `*_old.jsx`, `*_fixed.jsx`, `*_complete.jsx` 만들지 말 것
- `*Enhanced.jsx`, `*ExactReplica.jsx` 새로 만들지 말 것
- 기존 파일 수정 시 백업 파일 만들지 말고 git으로 관리

## 삭제 금지 컴포넌트 (App.jsx 라우트에서 사용 중)
- LoginPageExactReplica.jsx → /login
- SignupPageExactReplica.jsx → /signup
- HomePageExactReplica.jsx → /home-legacy
- CNECPlusPageEnhanced.jsx → /cnecplus
- CampaignReportEnhanced.jsx → /campaign-report
- UserApprovalManagerEnhanced.jsx → /user-approval
- MyPageKoreaEnhanced.jsx → MyPageWrapper 내부
- ProfileSettingsTest.jsx → /profile, /profile-settings
- ProfileViewTest.jsx → /profile-view-beta-2025
- ApplicationsReportSimple_final.jsx → import as ApplicationsReportSimple
- CompanyReportNew.jsx → /company-report/:campaignId
- ConfirmedCreatorsNew.jsx → /confirmed-creators/:campaignId
- SNSUploadNew.jsx → /sns-uploads

## Netlify Functions (22개)

서버 함수에서 자체 DB 접근 시:
```javascript
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
```

서버 함수에서 BIZ DB 접근 시:
```javascript
const supabaseUrl = process.env.VITE_SUPABASE_BIZ_URL
const supabaseKey = process.env.SUPABASE_BIZ_SERVICE_ROLE_KEY
```

폴백 체인 사용 금지.

## applications 테이블
- `applications` 테이블만 사용
- `campaign_applications` 폴백 코드 작성 금지 (데이터 분산 방지)

## 삭제된 파일 (Phase 0에서 정리 완료)

2026-03-20 코드베이스 정리로 아래 파일들이 삭제되었습니다:
- supabase 변형 클라이언트 6개 (supabase_backup, _fixed, _new 등)
- 백업 컴포넌트 29개 (*_backup, *_fixed, *_old 등)
- 미사용 변형 컴포넌트 11개 (HomePageImproved, MyPageComplete, EmailScheduler 등)
- backups/ 디렉토리, _headers_backup
- src/assets/supabase-client-{complete,netlify}.js

새로운 백업 파일을 만들지 마세요. git으로 버전 관리하세요.
