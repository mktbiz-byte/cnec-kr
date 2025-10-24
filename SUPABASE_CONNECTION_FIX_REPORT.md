# CNEC Korea - Supabase 연결 문제 해결 보고서

**작업 날짜**: 2025년 10월 24일  
**작업자**: Manus AI  
**프로젝트**: CNEC Korea (한국 크리에이터 플랫폼)

---

## 📋 문제 상황

### 발견된 문제
CNEC Korea 사이트에 로그인했을 때 **일본 사용자 데이터**(howlabmkt@gmail.com)가 표시되는 문제가 발생했습니다.

### 원인 분석
- 환경변수 파일(`.env`)이 제대로 설정되지 않음
- Supabase 연결 정보가 일본 프로젝트를 가리키고 있었음
- CNEC Korea 프로젝트(vluqhvuhykncicgvkosd)의 URL과 Key가 설정되지 않음

---

## ✅ 해결 작업

### 1. Supabase 프로젝트 정보 확인
**CNEC Korea Supabase 프로젝트**:
- **프로젝트 ID**: `vluqhvuhykncicgvkosd`
- **리전**: Seoul (ap-northeast-2)
- **프로젝트 URL**: `https://vluqhvuhykncicgvkosd.supabase.co`
- **상태**: ACTIVE_HEALTHY ✅

Supabase MCP 도구를 사용하여 프로젝트 URL과 Anon Key를 성공적으로 가져왔습니다.

### 2. 환경변수 파일 생성
`/home/ubuntu/cnec-kr/.env` 파일을 다음 내용으로 생성:

```env
# CNEC Korea Supabase Configuration
VITE_SUPABASE_URL=https://vluqhvuhykncicgvkosd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Platform Configuration
VITE_PLATFORM_REGION=kr
VITE_PLATFORM_COUNTRY=KR

# Encryption Key for SSN (주민등록번호 암호화)
VITE_ENCRYPTION_KEY=63fe2c2478216229c61d642f5c90f68719f336248bc33b605159ac3d39505874
```

**암호화 키 생성**:
- `openssl rand -hex 32` 명령어로 안전한 랜덤 키 생성
- 주민등록번호 암호화에 사용

### 3. .env.example 파일 업데이트
템플릿 파일을 업데이트하여 향후 배포 시 참고할 수 있도록 정리:
- 불필요한 multi-region 변수 제거
- Stats multiplier를 선택사항으로 변경
- 암호화 키 생성 방법 추가

### 4. 프로덕션 빌드
```bash
pnpm run build
```

**빌드 결과**:
- ✅ 빌드 성공 (4.70초)
- 📦 총 크기: 약 1.1MB (gzip 압축 시)
- 📁 출력 디렉토리: `dist/`

**생성된 파일**:
- `dist/index.html` (2.78 kB)
- `dist/assets/index-C97CYWbc.css` (132.60 kB)
- `dist/assets/index-CTxo6rhc.js` (615.91 kB)
- 기타 vendor, UI, Supabase 모듈

### 5. 배포 파일 생성
```bash
zip -r cnec-kr-deploy-20251024-003837.zip dist/
```

**배포 패키지**:
- 파일명: `cnec-kr-deploy-20251024-003837.zip`
- 크기: 1.8MB
- 포함 내용: 전체 dist/ 디렉토리

### 6. GitHub 업데이트
**커밋 내용**:
```
Fix: Configure Korea Supabase connection and add deployment guide

- Update .env.example with correct environment variables
- Add NETLIFY_DEPLOYMENT_GUIDE_KOREA.md with deployment instructions
- Configure connection to CNEC Korea Supabase (vluqhvuhykncicgvkosd)
- Add deployment zip and backup files to .gitignore
```

**푸시 완료**:
- 저장소: `mktbiz-byte/cnec-kr`
- 브랜치: `main`
- 커밋 해시: `f224a2b6`

### 7. 배포 가이드 문서 작성
`NETLIFY_DEPLOYMENT_GUIDE_KOREA.md` 파일 생성:
- Netlify 수동 배포 방법
- GitHub 자동 배포 설정 방법
- 환경변수 설정 가이드
- 배포 후 확인사항
- 문제 해결 가이드

---

## 🚀 배포 방법

### Netlify 환경변수 설정 (필수)

Netlify에서 cnec-kr 사이트의 환경변수를 다음과 같이 설정해야 합니다:

1. Netlify 대시보드 → **cnec-kr** 사이트 선택
2. **Site settings** → **Environment variables**
3. 다음 변수들 추가:

| 변수명 | 값 |
|--------|-----|
| `VITE_SUPABASE_URL` | `https://vluqhvuhykncicgvkosd.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (전체 키) |
| `VITE_PLATFORM_REGION` | `kr` |
| `VITE_PLATFORM_COUNTRY` | `KR` |
| `VITE_ENCRYPTION_KEY` | `63fe2c2478216229c61d642f5c90f68719f336248bc33b605159ac3d39505874` |
| `NODE_ENV` | `production` |

### 배포 옵션

**옵션 1: GitHub 자동 배포** (권장)
- 환경변수 설정 후 Netlify에서 자동으로 배포됨
- 코드 푸시 시마다 자동 재배포

**옵션 2: 수동 배포**
- `cnec-kr-deploy-20251024-003837.zip` 파일을 Netlify에 드래그 앤 드롭
- 환경변수 설정 필요

---

## 🔍 배포 후 확인사항

### 1. 데이터베이스 연결 확인
- [ ] 새로운 계정으로 회원가입 테스트
- [ ] Supabase Korea 프로젝트에서 `user_profiles` 테이블 확인
- [ ] 일본 사용자 데이터가 보이지 않는지 확인

### 2. 기능 테스트
- [ ] Google OAuth 로그인
- [ ] 마이페이지 접속 및 프로필 수정
- [ ] 캠페인 목록 조회
- [ ] 캠페인 지원
- [ ] 관리자 페이지 접속 (mkt-biz@gmail.com)

### 3. UI 확인
- [ ] 파란색 그라데이션 로고 표시
- [ ] 섹션 순서: Hero → CNEC Benefits → Campaigns → Growth Programs
- [ ] CNEC Plus 페이지의 YouTube/Short-form 프로그램 탭
- [ ] 모바일 반응형 디자인

---

## 📊 데이터베이스 분리 확인

### 각 리전별 Supabase 프로젝트

| 리전 | 프로젝트 ID | URL | 상태 |
|------|-------------|-----|------|
| 🇰🇷 Korea | vluqhvuhykncicgvkosd | https://vluqhvuhykncicgvkosd.supabase.co | ✅ 설정 완료 |
| 🇯🇵 Japan | psfwmzlnaboattocyupu | https://psfwmzlnaboattocyupu.supabase.co | ✅ 별도 운영 |
| 🇺🇸 US | ybsibqlaipsbvbyqlcny | https://ybsibqlaipsbvbyqlcny.supabase.co | ✅ 별도 운영 |

**데이터 분리 보장**:
- 각 리전은 완전히 독립된 Supabase 프로젝트 사용
- 사용자 데이터, 캠페인, 지원서 등 모든 데이터가 리전별로 분리
- Cross-region 데이터 접근 불가

---

## 🔧 문제 해결

### 문제: "여전히 일본 사용자 데이터가 보입니다"

**원인**: Netlify 환경변수가 설정되지 않았거나 잘못 설정됨

**해결 방법**:
1. Netlify 환경변수 확인
2. `VITE_SUPABASE_URL`이 `https://vluqhvuhykncicgvkosd.supabase.co`인지 확인
3. 환경변수 수정 후 재배포:
   - **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

### 문제: "로그인이 안 됩니다"

**원인**: OAuth 리다이렉트 URL 미설정

**해결 방법**:
1. Supabase 프로젝트 (vluqhvuhykncicgvkosd) 설정
2. **Authentication** → **URL Configuration**
3. **Site URL**: 실제 Netlify URL 입력
4. **Redirect URLs**에 추가:
   - `https://your-site.netlify.app/auth/callback`
   - `http://localhost:5173/auth/callback`

### 문제: "빌드가 실패합니다"

**원인**: 필수 환경변수 누락

**해결 방법**:
- 모든 `VITE_*` 환경변수가 Netlify에 설정되어 있는지 확인
- 특히 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`는 필수

---

## 📝 추가 작업 필요 사항

### 1. Supabase OAuth 설정
Google OAuth를 사용하려면 Supabase 프로젝트에서 설정 필요:
1. Supabase → **Authentication** → **Providers**
2. **Google** 활성화
3. Google Cloud Console에서 OAuth 클라이언트 생성
4. Client ID와 Client Secret 입력
5. Authorized redirect URIs에 Supabase callback URL 추가

### 2. 관리자 계정 확인
- **이메일**: mkt-biz@gmail.com
- **역할**: Admin
- Supabase에서 `user_profiles` 테이블의 `role` 컬럼 확인

### 3. 도메인 연결 (선택사항)
커스텀 도메인을 사용하려면:
1. Netlify → **Domain settings**
2. **Add custom domain**
3. DNS 설정 (A 레코드 또는 CNAME)
4. SSL 인증서 자동 발급 (Let's Encrypt)

---

## 📂 생성된 파일

1. **/.env** - 환경변수 파일 (로컬 개발용, Git에 커밋 안 됨)
2. **/.env.example** - 환경변수 템플릿 (업데이트됨)
3. **/NETLIFY_DEPLOYMENT_GUIDE_KOREA.md** - 배포 가이드
4. **/SUPABASE_CONNECTION_FIX_REPORT.md** - 이 보고서
5. **/cnec-kr-deploy-20251024-003837.zip** - 배포 패키지
6. **/.gitignore** - 배포 파일 제외 규칙 추가

---

## ✅ 작업 완료 체크리스트

- [x] CNEC Korea Supabase 프로젝트 정보 확인
- [x] 환경변수 파일 생성 (.env)
- [x] 암호화 키 생성
- [x] .env.example 업데이트
- [x] 프로덕션 빌드 성공
- [x] 배포 패키지 생성
- [x] GitHub에 코드 푸시 (cnec-kr 저장소만)
- [x] 배포 가이드 문서 작성
- [x] .gitignore 업데이트
- [ ] Netlify 환경변수 설정 (사용자 작업 필요)
- [ ] Netlify 배포 실행 (사용자 작업 필요)
- [ ] 배포 후 기능 테스트 (사용자 작업 필요)

---

## 🎯 다음 단계

1. **Netlify 환경변수 설정** (필수)
   - 위의 표를 참고하여 모든 환경변수 입력

2. **배포 실행**
   - GitHub 자동 배포: Trigger deploy 클릭
   - 또는 수동 배포: zip 파일 업로드

3. **테스트**
   - 새 계정으로 회원가입
   - 한국 데이터만 표시되는지 확인
   - 일본 사용자 데이터가 안 보이는지 확인

4. **OAuth 설정** (로그인 기능 활성화)
   - Supabase에서 Google OAuth 설정
   - Redirect URL 등록

---

**작업 완료 시간**: 2025-10-24 00:38 (KST)  
**예상 배포 시간**: 환경변수 설정 후 5-10분  
**문서 버전**: 1.0

