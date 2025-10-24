# CNEC Korea - Netlify 배포 가이드

## 📋 배포 준비 완료

CNEC Korea 사이트가 한국 Supabase 데이터베이스에 올바르게 연결되도록 환경변수가 설정되었으며, 프로덕션 빌드가 완료되었습니다.

### ✅ 완료된 작업

1. **Supabase 연결 설정**
   - CNEC Korea 프로젝트 ID: `vluqhvuhykncicgvkosd`
   - 리전: Seoul (ap-northeast-2)
   - 프로젝트 URL: `https://vluqhvuhykncicgvkosd.supabase.co`
   - Anon Key: 설정 완료

2. **환경변수 파일 생성**
   - `.env` 파일 생성 완료
   - 플랫폼 리전: `kr` (한국)
   - 암호화 키: 생성 완료 (주민등록번호 암호화용)

3. **프로덕션 빌드**
   - 빌드 파일: `cnec-kr-deploy-20251024-003837.zip`
   - 크기: 1.8MB
   - 빌드 성공 확인

---

## 🚀 Netlify 배포 방법

### 방법 1: Netlify UI를 통한 수동 배포 (권장)

#### 1단계: Netlify 사이트 접속
1. [Netlify](https://app.netlify.com/) 로그인
2. 기존 CNEC Korea 사이트 선택 또는 "Add new site" 클릭

#### 2단계: 환경변수 설정
**중요**: 배포 전에 반드시 환경변수를 설정해야 합니다!

1. 사이트 설정 → "Environment variables" 메뉴로 이동
2. 다음 환경변수들을 추가:

```
VITE_SUPABASE_URL=https://vluqhvuhykncicgvkosd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdXFodnVoeWtuY2ljZ3Zrb3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjg2MzAsImV4cCI6MjA3Njg0NDYzMH0.ikEqdx6Le54YJUP-NROKg6EmeHJ4TbKkQ76pw29OQG8
VITE_PLATFORM_REGION=kr
VITE_PLATFORM_COUNTRY=KR
VITE_ENCRYPTION_KEY=63fe2c2478216229c61d642f5c90f68719f336248bc33b605159ac3d39505874
NODE_ENV=production
```

#### 3단계: 배포 파일 업로드
1. "Deploys" 탭으로 이동
2. 페이지 하단의 "Deploy manually" 영역으로 `cnec-kr-deploy-20251024-003837.zip` 파일 드래그 앤 드롭
3. 또는 "Browse to upload" 클릭하여 파일 선택

#### 4단계: 배포 완료 확인
- 배포 진행 상황 모니터링
- 배포 완료 후 사이트 URL 확인
- 사이트 접속하여 정상 작동 확인

---

### 방법 2: GitHub 연동 자동 배포

#### 1단계: GitHub 저장소 연동
1. Netlify에서 "Import from Git" 선택
2. GitHub 저장소 `mktbiz-byte/cnec-kr` 선택
3. 브랜치: `main` 선택

#### 2단계: 빌드 설정
```
Build command: pnpm run build
Publish directory: dist
```

#### 3단계: 환경변수 설정
위의 "방법 1 - 2단계"와 동일하게 환경변수 설정

#### 4단계: 배포 트리거
- "Deploy site" 클릭
- 또는 GitHub에 코드 푸시 시 자동 배포

---

## 🔍 배포 후 확인사항

### 1. 데이터베이스 연결 확인
- [ ] 회원가입 테스트 (새 사용자 생성)
- [ ] Supabase Korea 프로젝트에서 `user_profiles` 테이블 확인
- [ ] 일본 사용자 데이터가 보이지 않는지 확인

### 2. 기능 테스트
- [ ] 로그인/로그아웃
- [ ] 마이페이지 접속
- [ ] 캠페인 목록 조회
- [ ] 관리자 페이지 접속 (mkt-biz@gmail.com)

### 3. UI/UX 확인
- [ ] 메인 페이지 섹션 순서: Hero → CNEC Benefits → Campaigns → Growth Programs
- [ ] 파란색 그라데이션 로고 표시
- [ ] CNEC Plus 페이지의 YouTube/Short-form 프로그램 탭
- [ ] 모바일 반응형 디자인

---

## 🔧 문제 해결

### 문제 1: "일본 사용자 데이터가 보입니다"
**원인**: 환경변수가 올바르게 설정되지 않음
**해결**:
1. Netlify 환경변수 확인
2. `VITE_SUPABASE_URL`이 `https://vluqhvuhykncicgvkosd.supabase.co`인지 확인
3. 환경변수 수정 후 재배포 ("Trigger deploy" → "Clear cache and deploy site")

### 문제 2: "로그인이 안 됩니다"
**원인**: OAuth 리다이렉트 URL 미설정
**해결**:
1. Supabase 프로젝트 설정 → Authentication → URL Configuration
2. Site URL: `https://your-site.netlify.app` (실제 배포 URL)
3. Redirect URLs에 추가:
   - `https://your-site.netlify.app/auth/callback`
   - `http://localhost:5173/auth/callback` (로컬 테스트용)

### 문제 3: "빌드가 실패합니다"
**원인**: 환경변수 누락
**해결**:
1. Netlify 환경변수에 모든 `VITE_*` 변수가 설정되어 있는지 확인
2. 특히 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY` 필수

---

## 📊 관리자 계정

- **이메일**: mkt-biz@gmail.com
- **권한**: 관리자 (Admin)
- **접속 경로**: `/admin`

관리자 페이지에서 다음 기능 사용 가능:
- 캠페인 관리 (생성, 수정, 삭제)
- 크리에이터 관리
- 지원서 관리
- 출금 요청 관리
- 통계 확인

---

## 📝 추가 설정 (선택사항)

### 커스텀 도메인 연결
1. Netlify → Domain settings
2. "Add custom domain" 클릭
3. 도메인 입력 (예: cnec.co.kr)
4. DNS 설정 안내에 따라 도메인 제공업체에서 설정

### SSL 인증서
- Netlify에서 자동으로 Let's Encrypt SSL 인증서 발급
- 별도 설정 불필요

### Google OAuth 설정
Supabase 프로젝트에서 Google OAuth 활성화:
1. Supabase → Authentication → Providers
2. Google 활성화
3. Client ID와 Client Secret 입력
4. Authorized redirect URIs에 Netlify URL 추가

---

## 📞 지원

배포 중 문제가 발생하면:
1. Netlify 배포 로그 확인
2. 브라우저 개발자 도구 콘솔 확인
3. Supabase 프로젝트 로그 확인

---

**배포 파일**: `cnec-kr-deploy-20251024-003837.zip`  
**빌드 날짜**: 2025년 10월 24일  
**프로젝트**: CNEC Korea (한국 크리에이터 플랫폼)

